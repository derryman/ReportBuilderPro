// Builds a PDF from a captured report and triggers download in the browser
import jsPDF from 'jspdf';

// Load image into a canvas so the browser auto-corrects EXIF rotation
async function fixImageOrientation(imageSrc: string): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Use natural dimensions (respects EXIF orientation)
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        // Draw image - browser handles EXIF orientation automatically
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = imageSrc;
  });
}

type CapturedComponent = {
  type: 'image' | 'text' | 'progress' | 'issues';
  title: string;
  image?: string;
  text?: string;
  progress?: string;
  issues?: string;
};

type ReportData = {
  templateTitle: string;
  jobId: string | null;
  timestamp: string;
  components: CapturedComponent[];
};

export async function generateReportPdf(reportData: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  const checkPageBreak = (requiredHeight: number) => {
    if (yPosition + requiredHeight > pageHeight - margin) {
      doc.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const addText = (text: string, fontSize: number, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    const lines = doc.splitTextToSize(text, maxWidth);
    lines.forEach((line: string) => {
      checkPageBreak(fontSize * 0.5);
      doc.text(line, margin, yPosition);
      yPosition += fontSize * 0.5;
    });
    
    doc.setFont('helvetica', 'normal');
  };

  addText(reportData.templateTitle, 18, true);
  yPosition += 5;

  if (reportData.jobId) {
    addText(`Job ID: ${reportData.jobId}`, 10);
    yPosition += 3;
  }
  
  const date = new Date(reportData.timestamp).toLocaleString();
  addText(`Date: ${date}`, 10);
  yPosition += 8;

  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  for (const component of reportData.components) {
    addText(component.title || 'Untitled', 14, true);
    yPosition += 5;

    if (component.type === 'image' && component.image) {
      try {
        const canvas = await fixImageOrientation(component.image);
        
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const availableWidth = maxWidth;
        const availableHeight = pageHeight - yPosition - margin;
        
        let displayWidth = imgWidth;
        let displayHeight = imgHeight;
        
        if (displayWidth > availableWidth) {
          const ratio = availableWidth / displayWidth;
          displayWidth = availableWidth;
          displayHeight = displayHeight * ratio;
        }
        
        if (displayHeight > availableHeight) {
          const ratio = availableHeight / displayHeight;
          displayHeight = availableHeight;
          displayWidth = displayWidth * ratio;
        }

        // Reduce size by 50%
        displayWidth = displayWidth * 0.5;
        displayHeight = displayHeight * 0.5;

        checkPageBreak(displayHeight + 5);
        const xPosition = (pageWidth - displayWidth) / 2;
        const correctedImageData = canvas.toDataURL('image/jpeg', 0.95);
        doc.addImage(correctedImageData, 'JPEG', xPosition, yPosition, displayWidth, displayHeight);
        yPosition += displayHeight + 10;
      } catch (error) {
        console.error('Error adding image to PDF:', error);
        // fallback if canvas orientation fix fails
        try {
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = component.image!;
          });

          const imgWidth = img.width;
          const imgHeight = img.height;
          const availableWidth = maxWidth;
          const availableHeight = pageHeight - yPosition - margin;
          
          let displayWidth = imgWidth;
          let displayHeight = imgHeight;
          
          if (displayWidth > availableWidth) {
            const ratio = availableWidth / displayWidth;
            displayWidth = availableWidth;
            displayHeight = displayHeight * ratio;
          }
          
          if (displayHeight > availableHeight) {
            const ratio = availableHeight / displayHeight;
            displayHeight = availableHeight;
            displayWidth = displayWidth * ratio;
          }

          // Reduce size by 50%
          displayWidth = displayWidth * 0.5;
          displayHeight = displayHeight * 0.5;

          checkPageBreak(displayHeight + 5);
          const xPosition = (pageWidth - displayWidth) / 2;
          doc.addImage(component.image, 'JPEG', xPosition, yPosition, displayWidth, displayHeight);
          yPosition += displayHeight + 10;
        } catch (fallbackError) {
          console.error('Fallback image add also failed:', fallbackError);
          addText('[Image could not be loaded]', 10);
          yPosition += 5;
        }
      }
    } else if (component.type === 'text' && component.text) {
      addText(component.text, 11);
      yPosition += 5;
    } else if (component.type === 'progress' && component.progress) {
      addText(component.progress, 11);
      yPosition += 5;
    } else if (component.type === 'issues' && component.issues) {
      addText(component.issues, 11);
      yPosition += 5;
    }

    yPosition += 5;
  }

  const dateStr = new Date(reportData.timestamp).toISOString().split('T')[0];
  const filename = `Report_${reportData.jobId || dateStr}_${Date.now()}.pdf`;
  doc.save(filename);
}
