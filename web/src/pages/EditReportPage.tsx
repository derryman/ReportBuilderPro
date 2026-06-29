// Edit Report page — loads a saved report, lets the user update the fields, and saves it back
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';
import { resizeImage } from '../utils/imageResize';

type CapturedComponent = {
  type: 'image' | 'text' | 'progress' | 'issues';
  title: string;
  image?: string;
  text?: string;
  progress?: string;
  issues?: string;
};

type Component = {
  id: string;
  type: 'image' | 'progress' | 'issues' | 'text';
  data: { title?: string };
};

type Report = {
  id: string;
  templateId: string;
  jobId: string | null;
  capturedData: Record<string, CapturedComponent>;
  timestamp: string;
};

type Template = {
  id: string;
  title: string;
  components?: Component[];
};

/** Build empty form for one page from a template (all component keys, empty strings). */
function emptyPageFromTemplate(template: Template): Record<string, string> {
  const page: Record<string, string> = {};
  template.components?.forEach((comp) => {
    page[`${comp.type}_${comp.id}`] = '';
  });
  return page;
}

/**
 * Captured data keys are "${pageIndex}_${comp.id}" for multipage reports (from mobile capture),
 * or a bare "${comp.id}" for older single-page reports. Split them back out into one form per page.
 */
function pagesFromCapturedData(
  capturedData: Record<string, CapturedComponent>,
  template: Template
): Record<string, string>[] {
  const byPage = new Map<number, Record<string, string>>();
  Object.entries(capturedData).forEach(([key, data]) => {
    const match = /^(\d+)_(.+)$/.exec(key);
    const pageIndex = match ? Number(match[1]) : 0;
    const compId = match ? match[2] : key;
    const page = byPage.get(pageIndex) ?? {};
    const fieldKey = `${data.type}_${compId}`;
    page[fieldKey] = data.image ?? data.text ?? data.progress ?? data.issues ?? '';
    byPage.set(pageIndex, page);
  });

  const pageCount = byPage.size > 0 ? Math.max(...byPage.keys()) + 1 : 1;
  const pages: Record<string, string>[] = [];
  for (let i = 0; i < pageCount; i++) {
    pages.push({ ...emptyPageFromTemplate(template), ...(byPage.get(i) ?? {}) });
  }
  return pages;
}

export default function EditReportPage() {
  const { id: reportId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [jobId, setJobId] = useState('');
  const [pageData, setPageData] = useState<Record<string, string>[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [reportRes, templatesRes] = await Promise.all([
          fetchWithAuth(`/api/reports/${reportId}`),
          fetchWithAuth('/api/templates'),
        ]);
        if (!reportRes.ok || !templatesRes.ok) {
          if (!cancelled) setError('Failed to load report');
          return;
        }
        const reportData = await reportRes.json();
        const templatesData = await templatesRes.json();
        if (cancelled) return;
        setReport(reportData);

        const captured = reportData.capturedData || {};
        let resolvedTemplate: Template = templatesData.find((x: Template) => x.id === reportData.templateId);
        if (!resolvedTemplate) {
          // Template not in API (e.g. test-template): derive one component per distinct field
          // across all pages (dedupe by component id, since every page reuses the same ids).
          const seen = new Map<string, Component>();
          Object.entries(captured).forEach(([key, data]) => {
            const d = data as CapturedComponent;
            const match = /^\d+_(.+)$/.exec(key);
            const compId = match ? match[1] : key;
            if (!seen.has(compId)) {
              seen.set(compId, { id: compId, type: d.type, data: { title: d.title } });
            }
          });
          resolvedTemplate = { id: reportData.templateId, title: 'Report', components: [...seen.values()] };
        }
        setTemplate(resolvedTemplate);
        setJobId(reportData.jobId || '');
        setPageData(pagesFromCapturedData(captured, resolvedTemplate));
        setCurrentPageIndex(0);
      } catch (e) {
        if (!cancelled) setError('Failed to load report');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [reportId]);

  const handleFormChange = (field: string, value: string) => {
    setPageData((prev) => {
      const next = [...prev];
      next[currentPageIndex] = { ...(next[currentPageIndex] ?? {}), [field]: value };
      return next;
    });
  };

  const handleImageUpload = (componentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const data = ev.target?.result as string;
      const resized = await resizeImage(data);
      handleFormChange(`image_${componentId}`, resized);
    };
    reader.readAsDataURL(file);
  };

  const addPage = () => {
    if (!template) return;
    setPageData((prev) => [...prev, emptyPageFromTemplate(template)]);
    setCurrentPageIndex((prev) => prev + 1);
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < pageData.length) setCurrentPageIndex(index);
  };

  const currentPageForm = pageData[currentPageIndex] ?? {};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId || !report || !template) return;
    setSaving(true);
    setError(null);
    try {
      const capturedData: Record<string, CapturedComponent> = {};
      pageData.forEach((page, pageIndex) => {
        template.components?.forEach((comp) => {
          const fieldKey = `${comp.type}_${comp.id}`;
          const value = page[fieldKey];
          if (!value) return;
          const key = `${pageIndex}_${comp.id}`;
          if (comp.type === 'image') {
            capturedData[key] = { type: 'image', title: comp.data.title || '', image: value };
          } else if (comp.type === 'text') {
            capturedData[key] = { type: 'text', title: comp.data.title || '', text: value };
          } else if (comp.type === 'progress') {
            capturedData[key] = { type: 'progress', title: comp.data.title || '', progress: value };
          } else if (comp.type === 'issues') {
            capturedData[key] = { type: 'issues', title: comp.data.title || '', issues: value };
          }
        });
      });

      const res = await fetchWithAuth(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: jobId || null,
          capturedData,
          timestamp: report.timestamp,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || 'Failed to update report');
        return;
      }
      navigate('/reports');
    } catch (e) {
      setError('Failed to update report');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="reports-page">
        <header className="template-header">
          <h1>Edit Report</h1>
          <p>Loading...</p>
        </header>
      </div>
    );
  }

  if (error && !report) {
    return (
      <div className="reports-page">
        <header className="template-header">
          <h1>Edit Report</h1>
          <p className="text-danger">{error}</p>
          <button type="button" className="btn btn-default" onClick={() => navigate('/reports')}>
            Back to Reports
          </button>
        </header>
      </div>
    );
  }

  return (
    <div className="reports-page">
      <header className="template-header">
        <h1>Edit Report</h1>
        <p className="text-muted small">
          Update this report. Changes are saved to the server.
        </p>
        <button type="button" className="btn btn-link" onClick={() => navigate('/reports')}>
          ← Back to Reports
        </button>
      </header>

      {report && template && (
        <div className="panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title">{template.title}</h3>
            {report.jobId && <span className="text-muted"> Job #{report.jobId}</span>}
          </div>
          <div className="panel-body">
            <form className="mobile-capture-form" onSubmit={handleSubmit}>
              {error && <div className="text-danger" style={{ marginBottom: 12 }}>{error}</div>}
              <div className="form-group">
                <label>Job / Site ID</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 2026-001"
                  value={jobId}
                  onChange={(e) => setJobId(e.target.value)}
                />
              </div>

              {pageData.length > 1 && (
                <div className="multipage-nav panel panel-default" style={{ marginBottom: 16 }}>
                  <div className="panel-body" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                    <span className="multipage-label">
                      Page {currentPageIndex + 1} of {pageData.length}
                    </span>
                    <button type="button" className="btn btn-default btn-sm" onClick={() => goToPage(currentPageIndex - 1)} disabled={currentPageIndex === 0}>
                      Previous
                    </button>
                    <button type="button" className="btn btn-default btn-sm" onClick={() => goToPage(currentPageIndex + 1)} disabled={currentPageIndex >= pageData.length - 1}>
                      Next
                    </button>
                  </div>
                </div>
              )}

              {template.components?.map((component) => {
                // image field — file picker + preview of current photo
                if (component.type === 'image') {
                  const fieldKey = `image_${component.id}`;
                  const imageValue = currentPageForm[fieldKey] || '';
                  return (
                    <div key={component.id} className="form-group">
                      <label>{component.data.title || 'Image'}</label>
                      <input type="file" accept="image/*" className="form-control" onChange={(e) => handleImageUpload(component.id, e)} />
                      {imageValue && (
                        <div className="mobile-image-preview" style={{ marginTop: 12 }}>
                          <img src={imageValue} alt="" style={{ width: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 8, border: '1px solid #e0e0e0' }} />
                        </div>
                      )}
                    </div>
                  );
                }
                // text, progress and issues all render the same — just a labelled textarea
                if (['text', 'progress', 'issues'].includes(component.type)) {
                  const fieldKey = `${component.type}_${component.id}`;
                  return (
                    <div key={component.id} className="form-group">
                      <label>{component.data.title || component.type}</label>
                      <textarea
                        className="form-control"
                        rows={component.type === 'text' ? 5 : 4}
                        spellCheck
                        autoCorrect="on"
                        autoCapitalize="sentences"
                        value={currentPageForm[fieldKey] || ''}
                        onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                      />
                    </div>
                  );
                }
                return null;
              })}

              <button type="button" className="btn btn-default btn-block" style={{ marginBottom: 8 }} onClick={addPage}>
                + Add page
              </button>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" className="btn btn-default" onClick={() => navigate('/reports')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-rbp" disabled={saving}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
