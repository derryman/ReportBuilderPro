import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

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

type FormState = {
  jobId: string;
  [key: string]: string;
};

export default function EditReportPage() {
  const { id: reportId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [report, setReport] = useState<Report | null>(null);
  const [template, setTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState<FormState>({ jobId: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const [reportRes, templatesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/reports/${reportId}`),
          fetch(`${API_BASE_URL}/api/templates`),
        ]);
        if (!reportRes.ok || !templatesRes.ok) {
          if (!cancelled) setError('Failed to load report');
          return;
        }
        const reportData = await reportRes.json();
        const templatesData = await templatesRes.json();
        if (cancelled) return;
        setReport(reportData);
        const t = templatesData.find((x: Template) => x.id === reportData.templateId) || null;
        if (t) {
          setTemplate(t);
        } else {
          // Template not in API (e.g. test-template): derive from capturedData
          const captured = reportData.capturedData || {};
          const components: Component[] = Object.entries(captured).map(([compId, data]) => ({
            id: compId,
            type: (data as CapturedComponent).type,
            data: { title: (data as CapturedComponent).title },
          }));
          setTemplate({
            id: reportData.templateId,
            title: 'Report',
            components,
          });
        }

        const initial: FormState = { jobId: reportData.jobId || '' };
        const captured = reportData.capturedData || {};
        Object.entries(captured).forEach(([compId, data]) => {
          const d = data as CapturedComponent;
          if (d.type === 'image' && d.image) initial[`image_${compId}`] = d.image;
          if (d.type === 'text' && d.text) initial[`text_${compId}`] = d.text;
          if (d.type === 'progress' && d.progress) initial[`progress_${compId}`] = d.progress;
          if (d.type === 'issues' && d.issues) initial[`issues_${compId}`] = d.issues;
        });
        setForm(initial);
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
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = (componentId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = ev.target?.result as string;
      handleFormChange(`image_${componentId}`, data);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportId || !report || !template) return;
    setSaving(true);
    setError(null);
    try {
      const capturedData: Record<string, CapturedComponent> = {};
      template.components?.forEach((comp) => {
        const key = `${comp.type}_${comp.id}`;
        const value = form[key];
        if (comp.type === 'image' && value) {
          capturedData[comp.id] = { type: 'image', title: comp.data.title || '', image: value };
        } else if (comp.type === 'text' && value) {
          capturedData[comp.id] = { type: 'text', title: comp.data.title || '', text: value };
        } else if (comp.type === 'progress' && value) {
          capturedData[comp.id] = { type: 'progress', title: comp.data.title || '', progress: value };
        } else if (comp.type === 'issues' && value) {
          capturedData[comp.id] = { type: 'issues', title: comp.data.title || '', issues: value };
        }
      });

      const res = await fetch(`${API_BASE_URL}/api/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId: form.jobId || null,
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
                  value={form.jobId || ''}
                  onChange={(e) => handleFormChange('jobId', e.target.value)}
                />
              </div>

              {template.components?.map((component) => {
                if (component.type === 'image') {
                  const fieldKey = `image_${component.id}`;
                  const imageValue = form[fieldKey] || '';
                  return (
                    <div key={component.id} className="form-group">
                      <label>{component.data.title || 'Image'}</label>
                      <input
                        type="file"
                        accept="image/*"
                        className="form-control"
                        onChange={(e) => handleImageUpload(component.id, e)}
                      />
                      {imageValue && (
                        <div className="mobile-image-preview" style={{ marginTop: 12 }}>
                          <img
                            src={imageValue}
                            alt=""
                            style={{
                              width: '100%',
                              maxHeight: 300,
                              objectFit: 'contain',
                              borderRadius: 8,
                              border: '1px solid #e0e0e0',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  );
                }
                if (component.type === 'text') {
                  const fieldKey = `text_${component.id}`;
                  return (
                    <div key={component.id} className="form-group">
                      <label>{component.data.title || 'Text'}</label>
                      <textarea
                        className="form-control"
                        rows={5}
                        value={form[fieldKey] || ''}
                        onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                      />
                    </div>
                  );
                }
                if (component.type === 'progress') {
                  const fieldKey = `progress_${component.id}`;
                  return (
                    <div key={component.id} className="form-group">
                      <label>{component.data.title || 'Progress'}</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={form[fieldKey] || ''}
                        onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                      />
                    </div>
                  );
                }
                if (component.type === 'issues') {
                  const fieldKey = `issues_${component.id}`;
                  return (
                    <div key={component.id} className="form-group">
                      <label>{component.data.title || 'Issues'}</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={form[fieldKey] || ''}
                        onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                      />
                    </div>
                  );
                }
                return null;
              })}

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
