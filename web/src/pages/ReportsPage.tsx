/**
 * Report list, PDF export, optional writing review (LanguageTool via API), merge offline sync.
 */
import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import { generateReportPdf } from '../utils/generatePdf';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import {
  getUnsyncedReports,
  markReportSynced,
  deleteOfflineReport,
} from '../utils/offlineStorage';
import {
  type CapturedComponent,
  type WritingReviewResponse,
  getWritingIssueLabel,
  getWritingIssuePreview,
} from '../utils/reportWritingReview';

type Report = {
  id: string;
  templateId: string;
  jobId: string | null;
  capturedData?: Record<string, CapturedComponent>;
  timestamp: string;
  createdAt: string;
};

type Template = {
  id: string;
  title: string;
};

type WritingReviewModalState = {
  report: Report;
  templateTitle: string;
  response: WritingReviewResponse;
};

export default function ReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState<Report[]>([]);
  const [templates, setTemplates] = useState<Record<string, Template>>({});
  const [loading, setLoading] = useState(true);
  const [generatingPdf, setGeneratingPdf] = useState<string | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<string | null>(null);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [writingReview, setWritingReview] = useState<WritingReviewModalState | null>(null);
  const isOnline = useOnlineStatus();

  const refreshUnsyncedCount = useCallback(async () => {
    const list = await getUnsyncedReports();
    setUnsyncedCount(list.length);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch reports (list only: no capturedData – much faster)
        const reportsResponse = await fetchWithAuth('/api/reports?list=1');
        if (reportsResponse.ok) {
          const reportsData = await reportsResponse.json();
          setReports(reportsData);

          // Fetch template names for display
          const templatesResponse = await fetchWithAuth('/api/templates');
          if (templatesResponse.ok) {
            const templatesData = await templatesResponse.json();
            const templatesMap: Record<string, Template> = {};
            templatesData.forEach((t: Template) => {
              templatesMap[t.id] = t;
            });
            setTemplates(templatesMap);
          }
        }
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    refreshUnsyncedCount();
  }, [refreshUnsyncedCount]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const generatePdfForReport = async (fullReport: Report, templateTitle: string) => {
    if (!fullReport.capturedData) {
      throw new Error('Could not load report data for PDF.');
    }

    const components = Object.values(fullReport.capturedData) as CapturedComponent[];
    await generateReportPdf({
      templateTitle,
      jobId: fullReport.jobId,
      timestamp: fullReport.timestamp || fullReport.createdAt,
      components,
    });
  };

  const handleDownloadPdf = async (report: Report) => {
    setGeneratingPdf(report.id);
    try {
      // List view doesn't include capturedData; fetch full report for PDF
      const fullReport = report.capturedData
        ? report
        : await fetchWithAuth(`/api/reports/${report.id}`).then((r) => (r.ok ? r.json() : null));
      if (!fullReport?.capturedData) {
        alert('Could not load report data for PDF.');
        return;
      }
      const templateTitle = templates[report.templateId]?.title || 'Unknown Template';

      if (isOnline) {
        try {
          const reviewRes = await fetchWithAuth(`/api/reports/${report.id}/writing-review`, {
            method: 'POST',
          });
          const reviewData: WritingReviewResponse = await reviewRes.json().catch(() => ({
            reviewAvailable: false,
            configured: false,
            provider: 'none',
            issues: [],
            summary: { issueCount: 0, textLength: 0, checkedAt: null },
            message: 'Writing review failed.',
          }));

          if (!reviewRes.ok) {
            const continueAnyway = window.confirm(
              `${reviewData.message || 'Writing review is unavailable.'}\n\nContinue to PDF anyway?`
            );
            if (!continueAnyway) return;
          } else if (reviewData.reviewAvailable && reviewData.issues.length > 0) {
            setWritingReview({
              report: fullReport,
              templateTitle,
              response: reviewData,
            });
            return;
          }
        } catch (error) {
          console.error('Writing review request failed:', error);
          const continueAnyway = window.confirm(
            'Writing review failed. Continue to PDF anyway?'
          );
          if (!continueAnyway) return;
        }
      }

      await generatePdfForReport(fullReport, templateTitle);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleContinuePdfAfterReview = async () => {
    if (!writingReview) return;
    setGeneratingPdf(writingReview.report.id);
    try {
      await generatePdfForReport(writingReview.report, writingReview.templateTitle);
      setWritingReview(null);
    } catch (error) {
      console.error('Error generating PDF after review:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setGeneratingPdf(null);
    }
  };

  const handleEditAfterReview = () => {
    if (!writingReview) return;
    const reportId = writingReview.report.id;
    setWritingReview(null);
    navigate(`/reports/${reportId}/edit`);
  };

  const handleSyncPending = async () => {
    if (!isOnline) {
      alert('You are offline. Connect to the internet to sync.');
      return;
    }
    const pending = await getUnsyncedReports();
    if (pending.length === 0) {
      alert('No reports pending sync.');
      return;
    }
    setSyncing(true);
    let synced = 0;
    let failed = 0;
    for (const report of pending) {
      try {
        const res = await fetchWithAuth('/api/reports', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId: report.templateId,
            jobId: report.jobId,
            capturedData: report.capturedData,
            timestamp: report.timestamp,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.id) {
          await markReportSynced(report.localId, data.id);
          await deleteOfflineReport(report.localId);
          synced++;
        } else {
          failed++;
        }
      } catch {
        failed++;
      }
    }
    await refreshUnsyncedCount();
    setSyncing(false);
    if (synced > 0) {
      const reportsRes = await fetchWithAuth('/api/reports');
      if (reportsRes.ok) setReports(await reportsRes.json());
    }
    if (synced > 0 || failed > 0) {
      alert(`Synced ${synced} report(s).${failed > 0 ? ` ${failed} failed.` : ''}`);
    }
  };

  const handleDeleteReport = async (report: Report) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return;
    setDeletingReportId(report.id);
    try {
      const res = await fetchWithAuth(`/api/reports/${report.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message || 'Failed to delete report');
        return;
      }
      setReports((prev) => prev.filter((r) => r.id !== report.id));
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('Failed to delete report. Please try again.');
    } finally {
      setDeletingReportId(null);
    }
  };

  if (loading) {
    return (
      <div className="reports-page">
        <header className="template-header">
          <h1>Captured Reports</h1>
          <p>Loading reports...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <header className="template-header">
        <h1>Captured Reports</h1>
        <p className="text-muted small">
          View reports captured from mobile devices.
        </p>
        {unsyncedCount > 0 && (
          <div style={{ marginTop: 8 }}>
            <span className="text-muted" style={{ marginRight: 8 }}>
              {unsyncedCount} report{unsyncedCount !== 1 ? 's' : ''} saved offline
            </span>
            <button
              type="button"
              className="btn btn-rbp btn-sm"
              onClick={handleSyncPending}
              disabled={!isOnline || syncing}
            >
              {syncing ? 'Syncing...' : 'Sync now'}
            </button>
          </div>
        )}
      </header>

      {reports.length === 0 ? (
        <div className="panel panel-default">
          <div className="panel-body">
            <p className="text-muted">No reports captured yet. Use the mobile capture page to create reports.</p>
          </div>
        </div>
      ) : (
        <div className="reports-list">
          {reports.map((report) => {
            const template = templates[report.templateId];
            const components = report.capturedData ? Object.values(report.capturedData) : [];

            return (
              <div key={report.id} className="panel panel-default report-card">
                <div className="panel-heading">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <h3 className="panel-title">
                        {template?.title || 'Unknown Template'}
                        {report.jobId && <span className="text-muted"> - Job #{report.jobId}</span>}
                      </h3>
                      <p className="text-muted small" style={{ marginTop: '4px', marginBottom: 0 }}>
                        Captured: {formatDate(report.timestamp || report.createdAt)}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', flexWrap: 'wrap' }}>
                      <Link
                        to={`/reports/${report.id}/edit`}
                        className="btn btn-default"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-rbp"
                        onClick={() => handleDownloadPdf(report)}
                        disabled={generatingPdf === report.id}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {generatingPdf === report.id ? '⏳ Generating...' : '📥 Download PDF'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-default"
                        onClick={() => handleDeleteReport(report)}
                        disabled={deletingReportId === report.id}
                        style={{ whiteSpace: 'nowrap' }}
                        title="Delete report"
                      >
                        {deletingReportId === report.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="panel-body">
                  {components.length === 0 ? (
                    <p className="text-muted small">Use Edit or Download PDF to view content.</p>
                  ) : (
                  components.map((component, index) => {
                    if (component.type === 'image' && component.image) {
                      return (
                        <div key={index} className="report-component" style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            {component.title || 'Image'}
                          </h4>
                          <img
                            src={component.image}
                            alt={component.title || 'Captured image'}
                            style={{
                              width: '100%',
                              maxWidth: '600px',
                              maxHeight: '400px',
                              objectFit: 'contain',
                              borderRadius: '8px',
                              border: '1px solid #e0e0e0',
                            }}
                          />
                        </div>
                      );
                    } else if (component.type === 'text' && component.text) {
                      return (
                        <div key={index} className="report-component" style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            {component.title || 'Text'}
                          </h4>
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {component.text}
                          </p>
                        </div>
                      );
                    } else if (component.type === 'progress' && component.progress) {
                      return (
                        <div key={index} className="report-component" style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            {component.title || 'Progress'}
                          </h4>
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {component.progress}
                          </p>
                        </div>
                      );
                    } else if (component.type === 'issues' && component.issues) {
                      return (
                        <div key={index} className="report-component" style={{ marginBottom: '20px' }}>
                          <h4 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
                            {component.title || 'Issues'}
                          </h4>
                          <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {component.issues}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      {writingReview && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
            zIndex: 1100,
          }}
        >
          <div
            className="panel panel-default"
            style={{
              width: '100%',
              maxWidth: 760,
              maxHeight: '85vh',
              overflowY: 'auto',
              marginBottom: 0,
            }}
          >
            <div className="panel-heading">
              <h3 className="panel-title">Writing review before PDF</h3>
            </div>
            <div className="panel-body">
              <p className="text-muted">
                Found {writingReview.response.summary.issueCount} possible writing issue
                {writingReview.response.summary.issueCount !== 1 ? 's' : ''} in this report.
                You can continue to PDF, or edit the report first.
              </p>

              <div
                style={{
                  display: 'grid',
                  gap: 12,
                  marginTop: 16,
                }}
              >
                {writingReview.response.issues.slice(0, 8).map((issue, index) => (
                  <div
                    key={`${issue.ruleId}-${index}`}
                    style={{
                      border: '1px solid #e6e6e6',
                      borderRadius: 8,
                      padding: 12,
                      background: '#fafafa',
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      {getWritingIssueLabel(issue)}
                    </div>
                    <div style={{ marginBottom: 6 }}>{issue.message}</div>
                    <div className="text-muted small" style={{ marginBottom: 6 }}>
                      {getWritingIssuePreview(issue)}
                    </div>
                    {issue.replacements.length > 0 && (
                      <div className="small">
                        Suggestions: {issue.replacements.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {writingReview.response.issues.length > 8 && (
                <p className="text-muted small" style={{ marginTop: 12 }}>
                  Showing the first 8 suggestions to keep the review quick.
                </p>
              )}

              <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={() => setWritingReview(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn btn-default"
                  onClick={handleEditAfterReview}
                >
                  Edit report
                </button>
                <button
                  type="button"
                  className="btn btn-rbp"
                  onClick={handleContinuePdfAfterReview}
                  disabled={generatingPdf === writingReview.report.id}
                >
                  {generatingPdf === writingReview.report.id ? 'Generating...' : 'Continue to PDF'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
