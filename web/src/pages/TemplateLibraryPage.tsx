import { useState, useRef, useEffect } from 'react';
import { API_BASE_URL } from '../config';

// Template structure from MongoDB
type Template = {
  id: string;
  title: string;
  description: string;
};

export default function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch template list from MongoDB via backend API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/templates`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // Open PDF in fullscreen - fetches PDF data from MongoDB
  const openPdf = async (templateId: string) => {
    try {
      // Fetch PDF data (base64) from backend
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setPdfData(data.pdfData); // Store base64 PDF data
        setViewingPdf(templateId);
        
        // Open in fullscreen mode
        setTimeout(() => {
          const container = containerRef.current;
          if (container?.requestFullscreen) container.requestFullscreen();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load PDF:', error);
    }
  };

  // Close PDF viewer and exit fullscreen
  const closePdf = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    setViewingPdf(null);
    setPdfData(null);
  };

  // Auto-close PDF viewer when user exits fullscreen (e.g., presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      if (!isFullscreen && viewingPdf) {
        setViewingPdf(null);
        setPdfData(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [viewingPdf]);

  // Show loading state while fetching templates
  if (loading) {
    return (
      <div className="template-library-page">
        <header className="template-header">
          <h1>Template Library</h1>
          <p>Loading templates...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="template-library-page">
      {/* Page header */}
      <header className="template-header">
        <h1>Template Library</h1>
        <p>Browse and view your report templates.</p>
      </header>

      {/* Template cards - fetched from MongoDB */}
      {templates.length === 0 ? (
        <div className="panel panel-default">
          <div className="panel-body">
            <p className="text-muted">No templates found. Add templates to your database.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {templates.map((template) => (
            <div key={template.id} className="col-sm-4">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h2>{template.title}</h2>
                  <p className="text-muted">{template.description}</p>
                  <button className="btn btn-rbp btn-block" onClick={() => openPdf(template.id)}>
                    View PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fullscreen PDF viewer - displays PDF from MongoDB base64 data */}
      {viewingPdf && pdfData && (
        <div ref={containerRef} className="pdf-viewer-container pdf-viewer-fullscreen">
          <div className="pdf-viewer-header">
            <h3>{templates.find((t) => t.id === viewingPdf)?.title}</h3>
            <button className="btn btn-default" onClick={closePdf}>Close</button>
          </div>
          <object
            data={`${pdfData}#toolbar=0`}
            type="application/pdf"
            className="pdf-viewer-iframe"
            aria-label="PDF Viewer"
          >
            <p>Unable to display PDF. <a href={pdfData || ''} download>Download instead</a></p>
          </object>
        </div>
      )}
    </div>
  );
}
