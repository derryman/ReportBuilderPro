import { useState, useRef, useEffect } from 'react';

// PDF templates available in the library
const templates = [
  { id: 1, title: 'Cover Page', description: 'Report cover page template', filename: 'report1.pdf' },
  { id: 2, title: 'Meeting Minutes', description: 'Meeting minutes template', filename: 'report2.pdf' },
  { id: 3, title: 'Progress', description: 'Progress report template', filename: 'report3.pdf' },
];

export default function TemplateLibraryPage() {
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Open PDF in fullscreen
  const openPdf = (filename: string) => {
    setViewingPdf(filename);
    setTimeout(() => {
      const container = containerRef.current;
      if (container?.requestFullscreen) container.requestFullscreen();
      else if ((container as any)?.webkitRequestFullscreen) (container as any).webkitRequestFullscreen();
      else if ((container as any)?.msRequestFullscreen) (container as any).msRequestFullscreen();
    }, 100);
  };

  // Close PDF viewer
  const closePdf = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if ((document as any)?.webkitExitFullscreen) (document as any).webkitExitFullscreen();
    else if ((document as any)?.msExitFullscreen) (document as any).msExitFullscreen();
    setViewingPdf(null);
  };

  // Auto-close when exiting fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreen = !!(document.fullscreenElement || (document as any)?.webkitFullscreenElement);
      if (!isFullscreen && viewingPdf) setViewingPdf(null);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, [viewingPdf]);

  return (
    <div className="template-library-page">
      <header className="template-header">
        <h1>Template Library</h1>
        <p>Browse and view your report templates.</p>
      </header>

      <div className="row">
        {templates.map((template) => (
          <div key={template.id} className="col-sm-4">
            <div className="panel panel-default">
              <div className="panel-body">
                <h3>{template.title}</h3>
                <p className="text-muted">{template.description}</p>
                <div className="pdf-preview-thumbnail">
                  <iframe
                    src={new URL(`reports/${template.filename}#page=1`, window.location.href).href}
                    className="pdf-thumbnail-iframe"
                    title={`${template.title} preview`}
                  />
                </div>
                <button className="btn btn-rbp btn-block" onClick={() => openPdf(template.filename)}>
                  View PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingPdf && (
        <div ref={containerRef} className="pdf-viewer-container pdf-viewer-fullscreen">
          <div className="pdf-viewer-header">
            <h3>Viewing: {viewingPdf}</h3>
            <button className="btn btn-default" onClick={closePdf}>Close</button>
          </div>
          <iframe
            src={new URL(`reports/${viewingPdf}`, window.location.href).href}
            className="pdf-viewer-iframe"
            title="PDF Viewer"
          />
        </div>
      )}
    </div>
  );
}
