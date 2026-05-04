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
  branding?: {
    companyName?: string;
    accentColor?: string;
    logoData?: string;
  };
};

// Convert a hex colour string to RGB values for jsPDF
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [13, 148, 136];
}

export async function generateReportPdf(reportData: ReportData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  const accentRgb = hexToRgb(reportData.branding?.accentColor || '#0d9488');

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

  // Company logo top-left if provided
  const logoData = reportData.branding?.logoData;
  if (logoData) {
    try {
      const logoHeight = 16;
      const logoWidth = 40;
      doc.addImage(logoData, 'PNG', margin, yPosition, logoWidth, logoHeight);
      yPosition += logoHeight + 4;
    } catch {
      // skip logo if it fails to render
    }
  }

  // Company name above report title if set
  if (reportData.branding?.companyName) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(reportData.branding.companyName, margin, yPosition);
    doc.setTextColor(0, 0, 0);
    yPosition += 6;
  }

  addText(reportData.templateTitle, 18, true);
  yPosition += 5;

  if (reportData.jobId) {
    addText(`Job ID: ${reportData.jobId}`, 10);
    yPosition += 3;
  }

  const date = new Date(reportData.timestamp).toLocaleString();
  addText(`Date: ${date}`, 10);
  yPosition += 8;

  // Accent colour divider line
  doc.setLineWidth(1);
  doc.setDrawColor(...accentRgb);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
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
