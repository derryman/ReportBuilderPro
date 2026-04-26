// Template Library - shows all the user's saved templates with edit and delete options
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../utils/api';

type Template = {
  id: string;
  title: string;
  description: string;
};

export default function TemplateLibraryPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetchWithAuth('/api/templates');
        if (response.ok) setTemplates(await response.json());
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const deleteTemplate = async (templateId: string, templateTitle: string) => {
    if (!window.confirm(`Are you sure you want to delete "${templateTitle}"? This action cannot be undone.`)) return;
    setDeletingId(templateId);
    try {
      const response = await fetchWithAuth(`/api/templates/${templateId}`, { method: 'DELETE' });
      if (response.ok) {
        setTemplates(templates.filter((t) => t.id !== templateId));
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.message || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="template-library-page">
        <header className="template-header">
          <h1>Template Library</h1>
          <p>Loading templates...</p>
        </header>
      </div>
    );
  }

  return (
    <div className="template-library-page">
      <header className="template-header">
        <h1>Template Library</h1>
        <p>Browse and manage your report templates.</p>
      </header>

      {templates.length === 0 ? (
        <div className="panel panel-default">
          <div className="panel-body">
            <p className="text-muted">No templates found. Add templates to your database.</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {templates.map((template) => (
            <div key={template.id} className="col-sm-4">
              <div className="panel panel-default">
                <div className="panel-body">
                  <h2>{template.title}</h2>
                  <p className="text-muted">{template.description}</p>
                  <div style={{ display: 'flex', gap: '8px', marginTop: 12, flexWrap: 'wrap' }}>
                    <Link to={`/template-creator/${template.id}`} className="btn btn-default" style={{ flex: 1, minWidth: '80px' }}>
                      Edit
                    </Link>
                    <button
                      className="btn btn-danger"
                      style={{ flex: 1, minWidth: '80px' }}
                      onClick={() => deleteTemplate(template.id, template.title)}
                      disabled={deletingId === template.id}
                    >
                      {deletingId === template.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
