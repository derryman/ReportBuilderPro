import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

// Template structure from MongoDB
type Template = {
  id: string;
  title: string;
  description: string;
};

export default function TemplateLibraryPage() {
  // React hooks to manage component state
  const [templates, setTemplates] = useState<Template[]>([]); // List of templates from MongoDB
  const [loading, setLoading] = useState(true); // Whether we're still loading templates
  const [viewingPdf, setViewingPdf] = useState<string | null>(null); // ID of PDF currently being viewed
  const [pdfData, setPdfData] = useState<string | null>(null); // The actual PDF data (base64)
  const [deletingId, setDeletingId] = useState<string | null>(null); // ID of template being deleted
  const containerRef = useRef<HTMLDivElement>(null); // Reference to the PDF viewer container

  // This runs once when the page loads
  // Fetches the list of templates from MongoDB via the backend API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Request template list from backend
        const response = await fetch(`${API_BASE_URL}/api/templates`);
        if (response.ok) {
          const data = await response.json();
          setTemplates(data); // Store the templates
        }
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false); // Stop showing loading state
      }
    };
    fetchTemplates();
  }, []);

  // This function opens a PDF in fullscreen mode
  // It fetches the PDF data from MongoDB via the backend
  const openPdf = async (templateId: string) => {
    try {
      // Request the PDF data for this specific template
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setPdfData(data.pdfData); // Store the PDF data (it's stored as base64 in MongoDB)
        setViewingPdf(templateId); // Remember which PDF we're viewing
        
        // Open the PDF viewer in fullscreen mode
        setTimeout(() => {
          const container = containerRef.current;
          if (container?.requestFullscreen) container.requestFullscreen();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load PDF:', error);
    }
  };

  // This function closes the PDF viewer and exits fullscreen
  const closePdf = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    setViewingPdf(null); // Clear the viewing state
    setPdfData(null); // Clear the PDF data
  };

  // This automatically closes the PDF viewer if the user exits fullscreen
  // (for example, if they press the ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement;
      // If user exited fullscreen and we were viewing a PDF, close it
      if (!isFullscreen && viewingPdf) {
        setViewingPdf(null);
        setPdfData(null);
      }
    };
    // Listen for fullscreen changes
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    // Clean up: remove the listener when component unmounts
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [viewingPdf]);

  // Delete a template
  const deleteTemplate = async (templateId: string, templateTitle: string) => {
    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(templateId);
    try {
      const response = await fetch(`${API_BASE_URL}/api/templates/${templateId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the template from the list
        setTemplates(templates.filter((t) => t.id !== templateId));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

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
                  <div style={{ display: 'flex', gap: '8px', marginTop: 12, flexWrap: 'wrap' }}>
                    <Link to={`/template-creator/${template.id}`} className="btn btn-default" style={{ flex: 1, minWidth: '80px' }}>
                      Edit
                    </Link>
                    <button className="btn btn-rbp" style={{ flex: 1, minWidth: '80px' }} onClick={() => openPdf(template.id)}>
                      View PDF
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ flex: 1, minWidth: '80px' }}
                      onClick={() => deleteTemplate(template.id, template.title)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
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
