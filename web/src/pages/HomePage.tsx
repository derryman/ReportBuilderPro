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

// Static stats for dashboard (can later come from API)
const stats = [
  { label: 'Templates drafted', value: '18', detail: 'In the last 30 days' },
  { label: 'Reports published', value: '42', detail: 'Company wide' },
  { label: 'Pending approvals', value: '6', detail: 'Awaiting review' },
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
    let cancelled = false;
    fetchWithAuth('/api/nlp/latest')
      .then((res) => (res.ok ? res.json() : { latest: null }))
      .then((data) => {
        if (!cancelled) setLatest(data.latest ?? null);
      })
      .catch(() => {
        if (!cancelled) setLatest(null);
      });
    return () => { cancelled = true; };
  }, []);

  const counts = latest?.flags
    ? latest.flags.reduce<Record<string, number>>((acc, f) => {
        acc[f.label] = (acc[f.label] || 0) + 1;
        return acc;
      }, {})
    : {};

  return (
    <div className="home-page">
      <section className="rbp-hero panel panel-default">
        <div className="panel-body">
          <h1>Design fast, share confidently</h1>
          <p>Report Builder Pro centralizes your business data into ready-to-share dashboards.</p>
          <div className="btn-group">
            {!isMobile && (
              <NavLink to="/template-creator" className="btn btn-rbp">
                Start a template
              </NavLink>
            )}
            <NavLink to="/template-library" className="btn btn-default">
              Browse templates
            </NavLink>
            {isMobile && (
              <NavLink to="/mobile-capture" className="btn btn-rbp">
                Fill out template
              </NavLink>
            )}
          </div>
        </div>
      </section>

      <section className="row">
        {stats.map((stat) => (
          <div key={stat.label} className="col-sm-4">
            <div className="panel panel-stat">
              <div className="panel-body">
                <span className="stat-label">{stat.label}</span>
                <strong className="stat-value">{stat.value}</strong>
                <span className="stat-detail">{stat.detail}</span>
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Latest scan dashboard */}
      <section className="panel panel-default">
        <div className="panel-heading">
          <h2 className="panel-title">Latest scan</h2>
          <p className="text-muted small" style={{ marginTop: '4px', marginBottom: 0 }}>
            Issues from the most recent document scan. Run scans from Risk Detection.
          </p>
        </div>
        <div className="panel-body">
          {latest === undefined && <p>Loading latest scan…</p>}

          {latest === null && (
            <div className="latest-scan-empty">
              <p>No scan results yet.</p>
              <p className="text-muted small">
                Go to <NavLink to="/risk-detection">Risk Detection</NavLink> to select reports and run the model.
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

              {/* Counts by type */}
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

              {/* Issue cards from latest scan */}
              <h3 style={{ marginBottom: '0.75rem' }}>Detected issues</h3>
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
                        <h3 className="issue-title">Snippet</h3>
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
                Run another scan from <NavLink to="/risk-detection">Risk Detection</NavLink>.
              </p>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
