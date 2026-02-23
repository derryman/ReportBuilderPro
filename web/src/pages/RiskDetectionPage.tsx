import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';

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

export default function RiskDetectionPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: 0 });
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanDone, setScanDone] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [reportsRes, templatesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/reports`),
          fetch(`${API_BASE_URL}/api/templates`),
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
        const res = await fetch(`${API_BASE_URL}/api/reports/${ids[i]}/analyze`, {
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
