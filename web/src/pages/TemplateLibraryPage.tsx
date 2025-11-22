import { useState } from 'react';

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

  const handleView = (filename: string) => {
    setViewingPdf(filename);
  };

  const handleClose = () => {
    setViewingPdf(null);
  };

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
          <div className="pdf-viewer-container" onClick={(e) => e.stopPropagation()}>
            <div className="pdf-viewer-header">
              <h3>Viewing: {viewingPdf}</h3>
              <button className="btn btn-default" onClick={handleClose}>
                Close
              </button>
            </div>
            <iframe
              src={`/reports/${viewingPdf}`}
              className="pdf-viewer-iframe"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
