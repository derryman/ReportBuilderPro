// Home/dashboard page — shows the latest NLP scan result and quick nav links
import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import { useMobile } from '../utils/useMobile';

type NlpFlag = {
  label: string;
  confidence: number;
  snippet: string;
  suggested_action: string;
  sentence_index?: number;
};

type LatestAnalysis = {
  reportId: string;
  reportTitle: string;
  flags: NlpFlag[];
  processed_at: string;
  model_version: string;
};

type QuickLink = {
  path: string;
  label: string;
  description: string;
};

const QUICK_LINKS_DESKTOP: QuickLink[] = [
  { path: '/template-creator', label: 'Template Creator', description: 'Design and edit report templates' },
  { path: '/template-library', label: 'Template Library', description: 'Browse and use your templates' },
  { path: '/reports', label: 'Reports', description: 'View and manage captured reports' },
  { path: '/risk-detection', label: 'Risk Detection', description: 'Scan documents for risks and issues' },
];

const QUICK_LINKS_MOBILE: QuickLink[] = [
  { path: '/mobile-capture', label: 'Mobile Capture', description: 'Fill out a report on site' },
  { path: '/template-library', label: 'Template Library', description: 'Browse your templates' },
  { path: '/reports', label: 'Reports', description: 'View your reports' },
  { path: '/risk-detection', label: 'Risk Detection', description: 'Scan for risks' },
];

function labelToSeverity(label: string): 'high' | 'medium' | 'low' {
  if (label === 'risk') return 'high';
  if (label === 'delay' || label === 'material_shortage') return 'medium';
  return 'low';
}

export default function HomePage() {
  const isMobile = useMobile();
  const [latest, setLatest] = useState<LatestAnalysis | null | undefined>(undefined);

  useEffect(() => {
    // cancelled flag stops state updates if the component unmounts before the fetch finishes
    let cancelled = false;
    fetchWithAuth('/api/nlp/latest')
      .then((res) => (res.ok ? res.json() : { latest: null }))
      .then((data) => { if (!cancelled) setLatest(data.latest ?? null); })
      .catch(() => { if (!cancelled) setLatest(null); });
    return () => { cancelled = true; };
  }, []);

  // count how many flags of each label type there are (e.g. { risk: 2, delay: 1 })
  const counts = latest?.flags
    ? latest.flags.reduce<Record<string, number>>((acc, f) => {
        acc[f.label] = (acc[f.label] || 0) + 1;
        return acc;
      }, {})
    : {};

  const quickLinks = isMobile ? QUICK_LINKS_MOBILE : QUICK_LINKS_DESKTOP;

  return (
    <div className="home-page">
      <section className="rbp-hero panel panel-default">
        <div className="panel-body">
          <h1>Report Builder Pro</h1>
          <p>
            Create templates, capture reports on site, and scan for risks. One place for your reporting workflow.
          </p>
          <div className="rbp-hero-actions">
            {isMobile ? (
              <NavLink to="/mobile-capture" className="btn btn-rbp">
                Capture a report
              </NavLink>
            ) : (
              <>
                <NavLink to="/template-creator" className="btn btn-rbp">
                  New template
                </NavLink>
                <NavLink to="/template-library" className="btn btn-default">
                  Browse templates
                </NavLink>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="home-quick-links">
        <h2 className="home-section-title">Quick links</h2>
        <div className="home-quick-links-grid">
          {quickLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `home-quick-link-card ${isActive ? 'active' : ''}`
              }
            >
              <span className="home-quick-link-label">{link.label}</span>
              <span className="home-quick-link-desc">{link.description}</span>
            </NavLink>
          ))}
        </div>
      </section>

      <section className="panel panel-default home-latest-scan">
        <div className="panel-heading">
          <h2 className="panel-title">Latest scan</h2>
          <p className="text-muted small" style={{ marginTop: '4px', marginBottom: 0 }}>
            From your most recent document or report scan. Run scans from Risk Detection.
          </p>
        </div>
        <div className="panel-body">
          {latest === undefined && <p className="text-muted">Loading…</p>}

          {latest === null && (
            <div className="latest-scan-empty">
              <p className="text-muted">No scan results yet.</p>
              <p className="text-muted small">
                Go to <NavLink to="/risk-detection">Risk Detection</NavLink> to upload a PDF or scan reports.
              </p>
            </div>
          )}

          {latest && latest.flags.length === 0 && (
            <div className="latest-scan-empty">
              <p><strong>{latest.reportTitle}</strong></p>
              <p className="text-muted small">
                Scanned {latest.processed_at ? new Date(latest.processed_at).toLocaleString() : '—'}. No issues detected.
              </p>
              <p className="text-muted small">
                Run another scan from <NavLink to="/risk-detection">Risk Detection</NavLink>.
              </p>
            </div>
          )}

          {latest && latest.flags.length > 0 && (
            <>
              <div className="latest-scan-meta" style={{ marginBottom: '1rem' }}>
                <strong>{latest.reportTitle}</strong>
                <span className="text-muted small" style={{ marginLeft: '0.5rem' }}>
                  {latest.processed_at ? new Date(latest.processed_at).toLocaleString() : ''}
                </span>
              </div>

              <div className="row" style={{ marginBottom: '1.5rem' }}>
                {Object.entries(counts).map(([label, count]) => (
                  <div key={label} className="col-sm-4">
                    <div className="panel panel-stat">
                      <div className="panel-body">
                        <span className="stat-label">{label.replace(/_/g, ' ')}</span>
                        <strong className="stat-value">{count}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <h3 style={{ marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 600 }}>
                Detected issues
              </h3>
              <div className="row">
                {latest.flags.map((flag, idx) => {
                  const severity = labelToSeverity(flag.label);
                  const issueCardClass = `issue-card issue-${severity}`;
                  const badgeClass = `issue-badge issue-badge-${severity}`;
                  return (
                    <div key={idx} className="col-sm-6">
                      <div className={issueCardClass}>
                        <div className="issue-header">
                          <span className={badgeClass}>{flag.label.replace(/_/g, ' ')}</span>
                          <span className="issue-job">{(flag.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p className="issue-description">{flag.snippet}</p>
                        <div className="issue-meta">
                          <span className="issue-category">{flag.suggested_action}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-muted small" style={{ marginTop: '1rem' }}>
                <NavLink to="/risk-detection">Risk Detection</NavLink> — upload a PDF or scan more reports.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
