// Template Library - shows all the user's saved templates with edit, view PDF and delete options
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // load templates from the API when the page opens
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetchWithAuth('/api/templates');
        if (response.ok) setTemplates(await response.json());
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  // fetch the full template (with PDF data) and open it fullscreen
  const openPdf = async (templateId: string) => {
    try {
      const response = await fetchWithAuth(`/api/templates/${templateId}`);
      if (response.ok) {
        const data = await response.json();
        setPdfData(data.pdfData);
        setViewingPdf(templateId);
        setTimeout(() => {
          const container = containerRef.current;
          if (container?.requestFullscreen) container.requestFullscreen();
        }, 100);
      }
    } catch (error) {
      console.error('Failed to load PDF:', error);
    }
  };

  const closePdf = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    setViewingPdf(null);
    setPdfData(null);
  };

  // close the viewer automatically if the user presses ESC to exit fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && viewingPdf) {
        setViewingPdf(null);
        setPdfData(null);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [viewingPdf]);

  const deleteTemplate = async (templateId: string, templateTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`)) return;
    setDeletingId(templateId);
    try {
      const response = await fetchWithAuth(`/api/templates/${templateId}`, { method: 'DELETE' });
      if (response.ok) {
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
      <header className="template-header">
        <h1>Template Library</h1>
        <p>Browse and view your report templates.</p>
      </header>

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
