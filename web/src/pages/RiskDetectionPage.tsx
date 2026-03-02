import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

type CapturedComponent = {
  type: string;
  title?: string;
  text?: string;
  [key: string]: unknown;
};

type Report = {
  id: string;
  templateId: string;
  jobId: string | null;
  capturedData: Record<string, CapturedComponent>;
  timestamp: string;
  createdAt: string;
};

type Template = {
  id: string;
  title: string;
};

type NlpFlag = {
  label: string;
  confidence: number;
  snippet: string;
  suggested_action: string;
  sentence_index?: number;
};

export default function RiskDetectionPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanDone, setScanDone] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfResult, setPdfResult] = useState<{
    reportTitle: string;
    flags: NlpFlag[];
    textPreview?: string | null;
    textLength?: number;
    nlpConfigured?: boolean;
  } | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, templatesRes] = await Promise.all([
          fetchWithAuth('/api/reports'),
          fetchWithAuth('/api/templates'),
        ]);
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setReports(data);
        }
        if (templatesRes.ok) {
          const data = await templatesRes.json();
          const map: Record<string, Template> = {};
          data.forEach((t: Template) => { map[t.id] = t; });
          setTemplates(map);
        }
      } catch (e) {
        console.error('Failed to fetch:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === reports.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(reports.map((r) => r.id)));
  };

  const handleScanSelected = async () => {
    if (selectedIds.size === 0) return;
    setScanError(null);
    setScanDone(false);
    setScanning(true);
    const ids = Array.from(selectedIds);
    setScanProgress({ current: 0, total: ids.length });

    for (let i = 0; i < ids.length; i++) {
      setScanProgress({ current: i + 1, total: ids.length });
      try {
        const res = await fetchWithAuth(`/api/reports/${ids[i]}/analyze`, {
          method: 'POST',
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: res.statusText }));
          throw new Error(err.message || err.error || 'Analyze failed');
        }
      } catch (e) {
        setScanError(e instanceof Error ? e.message : 'Scan failed');
        setScanning(false);
        return;
      }
    }

    setScanning(false);
    setSelectedIds(new Set());
    setScanDone(true);
  };

  const reportTitle = (r: Report) => {
    const t = templates[r.templateId];
    const firstTitle = r.capturedData && Object.values(r.capturedData).find((v) => v?.title);
    const title = (firstTitle && (firstTitle as CapturedComponent).title) || t?.title || 'Report';
    return `${title}${r.jobId ? ` (${r.jobId})` : ''}`;
  };

  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== 'application/pdf') {
      setPdfError('Please select a PDF file.');
      return;
    }
    setPdfError(null);
    setPdfResult(null);
    setPdfUploading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', file);
      const res = await fetchWithAuth('/api/nlp/analyze-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || data.error || `Upload failed (${res.status})`);
      }
      setPdfResult({
        reportTitle: data.reportTitle || file.name,
        flags: data.flags || [],
        textPreview: data.text_preview ?? null,
        textLength: data.metadata?.text_length ?? 0,
        nlpConfigured: data.metadata?.nlp_configured !== false,
      });
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'PDF analysis failed');
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = '';
    }
  };

  if (loading) {
    return (
      <div className="risk-detection-page">
        <div className="panel panel-default">
          <div className="panel-body">Loading reports…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="risk-detection-page">
      <section className="panel panel-default">
        <div className="panel-heading">
          <h2 className="panel-title">Risk Detection</h2>
        </div>
        <div className="panel-body">
          <p className="text-muted">
            Select reports to scan for risks, delays, and material issues. Run the model from here, then view results on the Home dashboard.
          </p>

          {/* Demo: Upload a single PDF and see NLP findings */}
          <div className="panel panel-default" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
            <div className="panel-heading">
              <h3 className="panel-title" style={{ margin: 0, fontSize: '1.1rem' }}>Demo: Upload PDF</h3>
              <p className="text-muted small" style={{ marginTop: '4px', marginBottom: 0 }}>
                Upload a single-page PDF (e.g. a site report). We extract text and run risk/delay/material-shortage detection.
              </p>
            </div>
            <div className="panel-body">
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                onChange={handlePdfUpload}
                disabled={pdfUploading}
                style={{ marginBottom: '0.75rem' }}
                aria-label="Choose PDF file"
              />
              {pdfUploading && <p className="text-muted small">Extracting text and analyzing…</p>}
              {pdfError && (
                <div className="alert alert-danger" role="alert" style={{ marginTop: '0.5rem' }}>
                  {pdfError}
                </div>
              )}
              {pdfResult && (
                <div style={{ marginTop: '1rem' }}>
                  <p><strong>{pdfResult.reportTitle}</strong></p>
                  {pdfResult.flags.length === 0 ? (
                    <div>
                      {pdfResult.nlpConfigured === false ? (
                        <div className="alert alert-warning" role="alert">
                          <strong>NLP service not configured.</strong> The server did not call the risk-detection model. In the <strong>server</strong> folder, add <code>NLP_SERVICE_URL=http://localhost:8000</code> to <code>.env</code> or <code>.env.local</code>, then restart the Node server. Ensure the NLP service is running on port 8000.
                        </div>
                      ) : (
                        <p className="text-muted">No risks, delays, or material shortages detected.</p>
                      )}
                      {(pdfResult.textLength !== undefined && pdfResult.textLength > 0) && pdfResult.nlpConfigured !== false && (
                        <p className="text-muted small">
                          Extracted {pdfResult.textLength} characters from the PDF.
                          The model looks for sentences similar to: &quot;delivery delayed&quot;, &quot;safety risk&quot;, &quot;material shortage&quot;.
                          Try a report that contains those kinds of phrases, or add similar sentences to your PDF.
                        </p>
                      )}
                      {pdfResult.textPreview && (
                        <details style={{ marginTop: '0.75rem' }}>
                          <summary className="text-muted small">Preview of extracted text</summary>
                          <pre className="small" style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginTop: '0.25rem', maxHeight: '8rem', overflow: 'auto' }}>
                            {pdfResult.textPreview}
                            {(pdfResult.textLength ?? 0) > 500 ? '…' : ''}
                          </pre>
                        </details>
                      )}
                    </div>
                  ) : (
                    <>
                      <p className="text-muted small">{pdfResult.flags.length} issue(s) found:</p>
                      <ul className="list-group" style={{ marginTop: '0.5rem' }}>
                        {pdfResult.flags.map((flag, idx) => (
                          <li key={idx} className="list-group-item">
                            <span className="label label-warning" style={{ marginRight: '0.5rem' }}>{flag.label.replace(/_/g, ' ')}</span>
                            <span className="text-muted small">{(flag.confidence * 100).toFixed(0)}%</span>
                            <p style={{ margin: '0.5rem 0 0 0' }}><em>{flag.snippet}</em></p>
                            <p className="text-muted small" style={{ marginBottom: 0 }}>{flag.suggested_action}</p>
                          </li>
                        ))}
                      </ul>
                      <p className="text-muted small" style={{ marginTop: '0.75rem' }}>
                        <Link to="/">View on Home</Link> as latest scan.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {reports.length === 0 ? (
            <p>No reports yet. Create reports from Mobile Capture or the Reports flow, then return here to scan them.</p>
          ) : (
            <>
              <div className="risk-detection-actions" style={{ marginBottom: '1rem' }}>
                <button
                  type="button"
                  className="btn btn-default btn-sm"
                  onClick={selectAll}
                  disabled={scanning}
                >
                  {selectedIds.size === reports.length ? 'Deselect all' : 'Select all'}
                </button>
                <button
                  type="button"
                  className="btn btn-rbp"
                  onClick={handleScanSelected}
                  disabled={scanning || selectedIds.size === 0}
                >
                  {scanning ? `Scanning ${scanProgress.current}/${scanProgress.total}…` : 'Scan selected'}
                </button>
              </div>

              {scanError && (
                <div className="alert alert-danger" role="alert">
                  {scanError}
                </div>
              )}

              {scanDone && !scanning && !scanError && (
                <div className="alert alert-success" role="alert">
                  Scan complete. <Link to="/">View latest scan on Home</Link>.
                </div>
              )}

              {!scanning && selectedIds.size > 0 && !scanError && !scanDone && (
                <p className="text-muted small">
                  <Link to="/">View latest scan on Home</Link>
                </p>
              )}

              <ul className="list-group">
                {reports.map((r) => (
                  <li key={r.id} className="list-group-item" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(r.id)}
                      onChange={() => toggleSelect(r.id)}
                      disabled={scanning}
                      aria-label={`Select ${reportTitle(r)}`}
                    />
                    <div style={{ flex: 1 }}>
                      <strong>{reportTitle(r)}</strong>
                      <span className="text-muted small" style={{ marginLeft: '0.5rem' }}>
                        {new Date(r.createdAt || r.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
