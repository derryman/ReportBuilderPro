import { useState, useRef, useEffect } from 'react';

// Sample PDF reports - store PDFs in web/public/reports/ folder
const sampleReports = [
  {
    id: 1,
    title: 'Cover Page',
    description: 'Report cover page template',
    filename: 'report1.pdf',
  },
  {
    id: 2,
    title: 'Meeting Minutes',
    description: 'Meeting minutes template',
    filename: 'report2.pdf',
  },
  {
    id: 3,
    title: 'Progress',
    description: 'Progress report template',
    filename: 'report3.pdf',
  },
];

export default function TemplateLibraryPage() {
  const [viewingPdf, setViewingPdf] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeContainerRef = useRef<HTMLDivElement>(null);

  const handleView = (filename: string) => {
    setViewingPdf(filename);
  };

  const handleClose = () => {
    if (isFullscreen) {
      exitFullscreen();
    }
    setViewingPdf(null);
  };

  const enterFullscreen = () => {
    const container = iframeContainerRef.current;
    if (!container) return;

    if (container.requestFullscreen) {
      container.requestFullscreen();
    } else if ((container as any).webkitRequestFullscreen) {
      (container as any).webkitRequestFullscreen();
    } else if ((container as any).msRequestFullscreen) {
      (container as any).msRequestFullscreen();
    }
  };

  const exitFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if ((document as any).webkitExitFullscreen) {
      (document as any).webkitExitFullscreen();
    } else if ((document as any).msExitFullscreen) {
      (document as any).msExitFullscreen();
    }
  };

  const handleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).msFullscreenElement)
      );
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="template-library-page">
      <header className="template-header">
        <h1>Template Library</h1>
        <p>Browse and view your report templates.</p>
      </header>

      <div className="row">
        {sampleReports.map((report) => (
          <div key={report.id} className="col-sm-4">
            <div className="panel panel-default">
              <div className="panel-body">
                <h3>{report.title}</h3>
                <p className="text-muted">{report.description}</p>
                <div className="pdf-preview-thumbnail">
                  <iframe
                    src={new URL(`reports/${report.filename}#page=1`, window.location.href).href}
                    className="pdf-thumbnail-iframe"
                    title={`${report.title} preview`}
                  />
                </div>
                <button
                  className="btn btn-rbp btn-block"
                  onClick={() => handleView(report.filename)}
                >
                  View PDF
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {viewingPdf && (
        <div className="pdf-viewer-overlay" onClick={handleClose}>
          <div
            ref={iframeContainerRef}
            className="pdf-viewer-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="pdf-viewer-header">
              <h3>Viewing: {viewingPdf}</h3>
              <div className="pdf-viewer-actions">
                <button className="btn btn-default" onClick={handleFullscreen}>
                  {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                </button>
                <button className="btn btn-default" onClick={handleClose}>
                  Close
                </button>
              </div>
            </div>
            <iframe
              src={new URL(`reports/${viewingPdf}`, window.location.href).href}
              className="pdf-viewer-iframe"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
