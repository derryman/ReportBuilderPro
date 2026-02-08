import { useEffect, useState, useCallback } from 'react';
import { API_BASE_URL } from '../config';
import { useOnlineStatus } from '../utils/useOnlineStatus';
import {
  saveReportOffline,
  getUnsyncedCount,
} from '../utils/offlineStorage';

type ComponentType = 'image' | 'progress' | 'issues' | 'text';

type Component = {
  id: string;
  type: ComponentType;
  data: {
    title?: string;
    image?: string;
    progress?: string;
    issues?: string;
    text?: string;
  };
};

type Template = {
  id: string;
  title: string;
  description: string;
  components?: Component[];
};

type CaptureForm = {
  jobId: string;
  [key: string]: string; // Dynamic fields based on template components
};

// Hardcoded test template - always available for quick testing
const TEST_TEMPLATE: Template = {
  id: 'test-template',
  title: 'Test Template',
  description: 'Simple test template with title, image, and text',
  components: [
    {
      id: 'comp-title-1',
      type: 'text',
      data: {
        title: 'Title',
      },
    },
    {
      id: 'comp-image-1',
      type: 'image',
      data: {
        title: 'Photo',
      },
    },
    {
      id: 'comp-text-1',
      type: 'text',
      data: {
        title: 'Notes',
      },
    },
  ],
};

export default function MobileCapturePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState<CaptureForm>({ jobId: '' });
  const [saving, setSaving] = useState(false);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const isOnline = useOnlineStatus();

  const refreshUnsyncedCount = useCallback(async () => {
    const count = await getUnsyncedCount();
    setUnsyncedCount(count);
  }, []);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/templates`);
        if (response.ok) {
          const data = await response.json();
          // Always include the test template at the beginning
          setTemplates([TEST_TEMPLATE, ...data]);
        } else {
          // If API fails, still show the test template
          setTemplates([TEST_TEMPLATE]);
        }
      } catch (error) {
        console.error('Failed to fetch templates for mobile capture:', error);
        // If API fails, still show the test template
        setTemplates([TEST_TEMPLATE]);
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  useEffect(() => {
    refreshUnsyncedCount();
  }, [refreshUnsyncedCount]);

  // Fetch full template details when selected
  useEffect(() => {
    const loadTemplate = () => {
      if (!selectedTemplateId) {
        setSelectedTemplate(null);
        return;
      }

      // If it's the test template, use it directly
      if (selectedTemplateId === 'test-template') {
        setSelectedTemplate(TEST_TEMPLATE);
        
        // Initialize form with empty values for each component
        const initialForm: CaptureForm = { jobId: '' };
        TEST_TEMPLATE.components?.forEach((comp: Component) => {
          if (comp.type === 'image') {
            initialForm[`image_${comp.id}`] = '';
          } else if (comp.type === 'text') {
            initialForm[`text_${comp.id}`] = '';
          } else if (comp.type === 'progress') {
            initialForm[`progress_${comp.id}`] = '';
          } else if (comp.type === 'issues') {
            initialForm[`issues_${comp.id}`] = '';
          }
        });
        setForm(initialForm);
        return;
      }

      // Otherwise, fetch from API
      const fetchTemplateDetails = async () => {
        try {
          const response = await fetch(`${API_BASE_URL}/api/templates/${selectedTemplateId}`);
          if (response.ok) {
            const template = await response.json();
            setSelectedTemplate(template);
            
            // Initialize form with empty values for each component
            const initialForm: CaptureForm = { jobId: '' };
            template.components?.forEach((comp: Component) => {
              if (comp.type === 'image') {
                initialForm[`image_${comp.id}`] = '';
              } else if (comp.type === 'text') {
                initialForm[`text_${comp.id}`] = '';
              } else if (comp.type === 'progress') {
                initialForm[`progress_${comp.id}`] = '';
              } else if (comp.type === 'issues') {
                initialForm[`issues_${comp.id}`] = '';
              }
            });
            setForm(initialForm);
          }
        } catch (error) {
          console.error('Failed to fetch template details:', error);
        }
      };

      fetchTemplateDetails();
    };

    loadTemplate();
  }, [selectedTemplateId]);

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
  };

  const handleFormChange = (field: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageUpload = (componentId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        handleFormChange(`image_${componentId}`, imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId || !selectedTemplate) return;

    setSaving(true);

    try {
      // Build captured data object from form
      const capturedData: Record<string, any> = {};
      
      selectedTemplate.components?.forEach((comp: Component) => {
        const fieldKey = `${comp.type}_${comp.id}`;
        const value = form[fieldKey];
        
        if (comp.type === 'image' && value) {
          capturedData[comp.id] = {
            type: 'image',
            title: comp.data.title || '',
            image: value, // base64 image data
          };
        } else if (comp.type === 'text' && value) {
          capturedData[comp.id] = {
            type: 'text',
            title: comp.data.title || '',
            text: value,
          };
        } else if (comp.type === 'progress' && value) {
          capturedData[comp.id] = {
            type: 'progress',
            title: comp.data.title || '',
            progress: value,
          };
        } else if (comp.type === 'issues' && value) {
          capturedData[comp.id] = {
            type: 'issues',
            title: comp.data.title || '',
            issues: value,
          };
        }
      });

      // Validate that we have at least some data
      if (Object.keys(capturedData).length === 0) {
        alert('Please fill in at least one field before saving.');
        setSaving(false);
        return;
      }

      const timestamp = new Date().toISOString();
      const payload = {
        templateId: selectedTemplateId,
        jobId: form.jobId || null,
        capturedData,
        timestamp,
      };

      // If offline, save to IndexedDB only
      if (!isOnline) {
        await saveReportOffline(payload);
        await refreshUnsyncedCount();
        alert('Saved offline. Report will sync when you\'re back online.');
        const initialForm: CaptureForm = { jobId: '' };
        selectedTemplate.components?.forEach((comp: Component) => {
          if (comp.type === 'image') initialForm[`image_${comp.id}`] = '';
          else if (comp.type === 'text') initialForm[`text_${comp.id}`] = '';
          else if (comp.type === 'progress') initialForm[`progress_${comp.id}`] = '';
          else if (comp.type === 'issues') initialForm[`issues_${comp.id}`] = '';
        });
        setForm(initialForm);
        setSaving(false);
        return;
      }

      // Online: try to save to backend
      try {
        const response = await fetch(`${API_BASE_URL}/api/reports`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { message: responseText || 'Unknown error' };
        }

        if (response.ok) {
          const result = responseData;
          console.log('✅ Report saved successfully!', result);
          alert(`Report saved successfully!\n\nReport ID: ${result.id || 'N/A'}\n\nYou can view it on the Reports page.`);
          const initialForm: CaptureForm = { jobId: '' };
          selectedTemplate.components?.forEach((comp: Component) => {
            if (comp.type === 'image') initialForm[`image_${comp.id}`] = '';
            else if (comp.type === 'text') initialForm[`text_${comp.id}`] = '';
            else if (comp.type === 'progress') initialForm[`progress_${comp.id}`] = '';
            else if (comp.type === 'issues') initialForm[`issues_${comp.id}`] = '';
          });
          setForm(initialForm);
        } else {
          const errorMsg = responseData.message || `Server error: ${response.status} ${response.statusText}`;
          console.error('❌ Save failed:', { status: response.status, error: errorMsg });
          alert(`Failed to save report: ${errorMsg}`);
          throw new Error(errorMsg);
        }
      } catch (networkError: unknown) {
        // Network failed: save offline so user doesn't lose data
        await saveReportOffline(payload);
        await refreshUnsyncedCount();
        alert('No connection. Report saved offline and will sync when you\'re back online.');
        const initialForm: CaptureForm = { jobId: '' };
        selectedTemplate.components?.forEach((comp: Component) => {
          if (comp.type === 'image') initialForm[`image_${comp.id}`] = '';
          else if (comp.type === 'text') initialForm[`text_${comp.id}`] = '';
          else if (comp.type === 'progress') initialForm[`progress_${comp.id}`] = '';
          else if (comp.type === 'issues') initialForm[`issues_${comp.id}`] = '';
        });
        setForm(initialForm);
      }
    } catch (error: unknown) {
      console.error('❌ Error saving report:', error);
      const message = error instanceof Error ? error.message : 'Something went wrong';
      alert(`Failed to save report: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mobile-capture-page">
      <header className="template-header">
        <h1>Mobile Capture</h1>
        <p className="text-muted small">
          Pick a template and capture a quick site report from your phone.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          {!isOnline && (
            <span className="label label-warning" style={{ padding: '4px 8px', borderRadius: 4, fontSize: 12 }}>
              Offline – reports saved locally
            </span>
          )}
          {unsyncedCount > 0 && (
            <span className="text-muted" style={{ fontSize: 12 }}>
              {unsyncedCount} report{unsyncedCount !== 1 ? 's' : ''} pending sync
            </span>
          )}
        </div>
        <p className="text-muted" style={{ fontSize: '11px', marginTop: '4px' }}>
          API: {API_BASE_URL}
        </p>
      </header>

      {loading ? (
        <div className="panel panel-default">
          <div className="panel-body">
            <p>Loading templates...</p>
          </div>
        </div>
      ) : (
        <>
          <section className="panel panel-default mobile-template-picker">
            <div className="panel-heading">
              <h2 className="panel-title">1. Choose a template</h2>
            </div>
            <div className="panel-body">
              <div className="mobile-template-list">
                {templates.map((template) => {
                  const isActive = template.id === selectedTemplateId;
                  const isTestTemplate = template.id === 'test-template';
                  return (
                    <button
                      key={template.id}
                      type="button"
                      className={
                        'mobile-template-card btn btn-default btn-block' +
                        (isActive ? ' mobile-template-card-active' : '') +
                        (isTestTemplate ? ' mobile-template-card-test' : '')
                      }
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      <div className="mobile-template-card-title">
                        {template.title}
                        {isTestTemplate && (
                          <span style={{ 
                            marginLeft: '8px', 
                            fontSize: '12px', 
                            fontWeight: 'normal',
                            color: 'var(--rbp-teal)'
                          }}>
                            (Test)
                          </span>
                        )}
                      </div>
                      <div className="mobile-template-card-description text-muted">
                        {template.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section className="panel panel-default mobile-capture-section">
            <div className="panel-heading">
              <h2 className="panel-title">2. Capture details</h2>
              <p className="text-muted small">
                This is a simple demo form. Later we can generate fields directly from the template layout.
              </p>
            </div>
            <div className="panel-body">
              {!selectedTemplate && (
                <p className="text-muted">
                  Select a template above to start capturing a report.
                </p>
              )}

              {selectedTemplate && (
                <form className="mobile-capture-form" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Template</label>
                    <input
                      type="text"
                      className="form-control"
                      value={selectedTemplate.title}
                      readOnly
                    />
                  </div>

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

                  {/* Render template components */}
                  {selectedTemplate.components?.map((component) => {
                    if (component.type === 'image') {
                      const fieldKey = `image_${component.id}`;
                      const imageValue = form[fieldKey] || '';
                      
                      return (
                        <div key={component.id} className="form-group">
                          <label>{component.data.title || 'Image'}</label>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="form-control"
                            onChange={(e) => handleImageUpload(component.id, e)}
                            required
                          />
                          {imageValue && (
                            <div className="mobile-image-preview" style={{ marginTop: '12px' }}>
                              <img 
                                src={imageValue} 
                                alt="Captured" 
                                style={{ 
                                  width: '100%', 
                                  maxHeight: '300px', 
                                  objectFit: 'contain',
                                  borderRadius: '8px',
                                  border: '1px solid #e0e0e0'
                                }} 
                              />
                            </div>
                          )}
                        </div>
                      );
                    } else if (component.type === 'text') {
                      const fieldKey = `text_${component.id}`;
                      return (
                        <div key={component.id} className="form-group">
                          <label>{component.data.title || 'Text'}</label>
                          <textarea
                            className="form-control"
                            rows={5}
                            placeholder="Enter text..."
                            value={form[fieldKey] || ''}
                            onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                            required
                          />
                        </div>
                      );
                    } else if (component.type === 'progress') {
                      const fieldKey = `progress_${component.id}`;
                      return (
                        <div key={component.id} className="form-group">
                          <label>{component.data.title || 'Progress'}</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            placeholder="Enter progress updates..."
                            value={form[fieldKey] || ''}
                            onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                            required
                          />
                        </div>
                      );
                    } else if (component.type === 'issues') {
                      const fieldKey = `issues_${component.id}`;
                      return (
                        <div key={component.id} className="form-group">
                          <label>{component.data.title || 'Issues'}</label>
                          <textarea
                            className="form-control"
                            rows={4}
                            placeholder="Enter issues or concerns..."
                            value={form[fieldKey] || ''}
                            onChange={(e) => handleFormChange(fieldKey, e.target.value)}
                            required
                          />
                        </div>
                      );
                    }
                    return null;
                  })}

                  <button 
                    type="submit" 
                    className="btn btn-rbp btn-block"
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Report'}
                  </button>
                </form>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}


