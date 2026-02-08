import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { analyzeReportText, type DetectedIssue } from '../nlpIssueDetection';
import { API_BASE_URL } from '../config';

// These are the types of components users can add to their templates
type ComponentType = 'image' | 'progress' | 'issues' | 'text';

// This defines the structure of a component in a template
// Each component has an ID, a type, and data (which varies by type)
type Component = {
  id: string;
  type: ComponentType;
  data: {
    // Generic metadata used when rendering the report / capture form
    title?: string;
    // Type-specific content / example text
    image?: string;
    progress?: string;
    issues?: string;
    text?: string;
  };
};

// List of available components users can add to their templates
const components = [
  { type: 'image' as ComponentType, label: 'Image', icon: '📷' },
  { type: 'progress' as ComponentType, label: 'Progress', icon: '📊' },
  { type: 'issues' as ComponentType, label: 'Issues', icon: '⚠️' },
  { type: 'text' as ComponentType, label: 'Text Box', icon: '📝' },
];

export default function TemplateCreatorPage() {
  const { id: templateId } = useParams<{ id: string }>();
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateComponents, setTemplateComponents] = useState<Component[]>([]);
  const [nlpIssues, setNlpIssues] = useState<DetectedIssue[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // Load template when editing (templateId in URL)
  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/templates/${templateId}`);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        setTemplateName(data.title || '');
        setTemplateDescription(data.description || '');
        setTemplateComponents(Array.isArray(data.components) ? data.components : []);
      } catch (e) {
        if (!cancelled) setSaveMessage({ type: 'error', text: 'Failed to load template' });
      }
    };
    load();
    return () => { cancelled = true; };
  }, [templateId]);

  // This function adds a new component to the template when user clicks a component button
  const addComponent = (type: ComponentType) => {
    // Create a new component with a unique ID (using current timestamp)
    const newComponent: Component = {
      id: `comp-${Date.now()}`,
      type,
      data: {},
    };
    // Add the new component to the list (using spread operator to keep existing components)
    setTemplateComponents([...templateComponents, newComponent]);
  };

  // For now, provide a single example page layout we can refine together.
  // This roughly matches how we might want a final daily site report to look.
  const loadSampleDailyReport = () => {
    const baseId = Date.now();
    setTemplateName('Daily Site Report');
    setTemplateComponents([
      {
        id: `comp-${baseId}-hero`,
        type: 'image',
        data: {
          title: 'Site photo / hero image',
        },
      },
      {
        id: `comp-${baseId}-progress`,
        type: 'progress',
        data: {
          title: 'Progress summary',
          progress: '',
        },
      },
      {
        id: `comp-${baseId}-issues`,
        type: 'issues',
        data: {
          title: 'Key issues / risks',
          issues: '',
        },
      },
      {
        id: `comp-${baseId}-notes`,
        type: 'text',
        data: {
          title: 'Additional notes',
          text: '',
        },
      },
    ]);
    setNlpIssues([]);
  };

  // This function handles when user finishes dragging a component to reorder it
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    // If nothing was dropped on, or dropped on itself, do nothing
    if (!over || active.id === over.id) return;

    // Find the positions of the dragged component and where it was dropped
    const oldIndex = templateComponents.findIndex((c) => c.id === active.id);
    const newIndex = templateComponents.findIndex((c) => c.id === over.id);
    // Create a copy of the components array
    const newComponents = [...templateComponents];
    // Remove the component from its old position
    const [moved] = newComponents.splice(oldIndex, 1);
    // Insert it at the new position
    newComponents.splice(newIndex, 0, moved);
    // Update the state with the reordered components
    setTemplateComponents(newComponents);
  };

  // This function updates the data for a specific component (e.g., when user types in a text field)
  const updateComponent = (id: string, field: string, value: string) => {
    // Map through all components, update the one that matches the ID
    setTemplateComponents(
      templateComponents.map((c) =>
        c.id === id ? { ...c, data: { ...c.data, [field]: value } } : c
      )
    );
  };

  // This function removes a component from the template
  const removeComponent = (id: string) => {
    // Filter out the component with the matching ID
    setTemplateComponents(templateComponents.filter((c) => c.id !== id));
  };

  // This function handles when user uploads an image file
  // It converts the image to base64 format so it can be stored
  const uploadImage = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Use FileReader to convert the image file to a base64 data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        // Update the component with the image data
        updateComponent(id, 'image', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveMessage({ type: 'error', text: 'Please enter a template name' });
      return;
    }
    setSaving(true);
    setSaveMessage(null);
    try {
      const body = {
        title: templateName.trim(),
        description: templateDescription.trim(),
        components: templateComponents,
      };
      const url = templateId
        ? `${API_BASE_URL}/api/templates/${templateId}`
        : `${API_BASE_URL}/api/templates`;
      const method = templateId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSaveMessage({ type: 'error', text: data.message || 'Failed to save template' });
        return;
      }
      setSaveMessage({ type: 'success', text: data.message || 'Template saved' });
      if (!templateId && data.id) {
        window.history.replaceState(null, '', `#/template-creator/${data.id}`);
      }
    } catch (e) {
      setSaveMessage({ type: 'error', text: 'Failed to save template' });
    } finally {
      setSaving(false);
    }
  };

  // Run NLP over all text-based fields in the template
  const analyzeTemplateText = () => {
    const combinedText = templateComponents
      .filter((c) => c.type === 'text' || c.type === 'issues' || c.type === 'progress')
      .map((c) => {
        if (c.type === 'text') return c.data.text || '';
        if (c.type === 'issues') return c.data.issues || '';
        if (c.type === 'progress') return c.data.progress || '';
        return '';
      })
      .join('\n')
      .trim();

    if (!combinedText) {
      setNlpIssues([]);
      return;
    }

    const issues = analyzeReportText(combinedText);
    setNlpIssues(issues);
  };

  return (
    <div className="template-page">
      {/* Page header */}
      <header className="template-header">
        <h1>Template creator</h1>
        <p>Drag and drop components to build your template. Perfect for building site reports.</p>
        <button
          type="button"
          className="btn btn-default"
          onClick={loadSampleDailyReport}
          style={{ marginTop: 8 }}
        >
          Load sample daily site report
        </button>
      </header>

      <div className="template-builder-grid">
        {/* Component library sidebar - click to add components */}
        <aside className="template-library-sidebar panel panel-default">
          <div className="panel-heading">
            <h2 className="panel-title">Components</h2>
            <p className="text-muted small">Click to add to template</p>
          </div>
          <div className="panel-body">
            {components.map((item) => (
              <button
                key={item.type}
                type="button"
                className="btn btn-default btn-block component-library-item"
                onClick={() => addComponent(item.type)}
              >
                <span className="component-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </aside>

        {/* Main template builder area */}
        <section className="template-canvas-area">
          {/* Template name input */}
          <div className="panel panel-default">
            <div className="panel-body">
              {saveMessage && (
                <div
                  className={saveMessage.type === 'success' ? 'text-success' : 'text-danger'}
                  style={{ marginBottom: 12 }}
                >
                  {saveMessage.text}
                </div>
              )}
              <div className="form-group">
                <label>Template name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g., Progress Report Template"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Short description of this template"
                  value={templateDescription}
                  onChange={(e) => setTemplateDescription(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Drag-and-drop canvas for template components */}
          <div className="template-canvas panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title">Template canvas</h3>
              <p className="text-muted small">
                Drag components to reorder. This preview roughly matches how the final PDF report will be structured.
              </p>
            </div>
            <div className="panel-body">
              {templateComponents.length === 0 ? (
                <div className="canvas-empty">
                  <p className="text-muted">Add components from the library to start building</p>
                </div>
              ) : (
                <div className="report-preview">
                  <div className="report-page">
                    <div className="report-page-header">
                      <h3 className="report-page-title">
                        {templateName || 'Untitled report template'}
                      </h3>
                      <p className="text-muted small">This is a rough preview of the final report layout.</p>
                    </div>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={templateComponents.map((c) => c.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        {templateComponents.map((component) => (
                          <ComponentItem
                            key={component.id}
                            component={component}
                            onUpdate={updateComponent}
                            onRemove={removeComponent}
                            onImageUpload={uploadImage}
                          />
                        ))}
                      </SortableContext>
                    </DndContext>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="template-actions">
            <button
              type="button"
              className="btn btn-rbp"
              onClick={handleSaveTemplate}
              disabled={saving}
            >
              {saving ? 'Saving...' : templateId ? 'Update template' : 'Save template'}
            </button>
            <button type="button" className="btn btn-default" onClick={analyzeTemplateText}>
              Analyze template text (demo)
            </button>
          </div>

          {/* NLP preview for current template text */}
          {nlpIssues.length > 0 && (
            <div className="panel panel-default" style={{ marginTop: 16 }}>
              <div className="panel-heading">
                <h3 className="panel-title">NLP preview – detected issues</h3>
                <p className="text-muted small">
                  Demo: this uses the same keyword model as the home page to flag schedule, compliance, and material risks.
                </p>
              </div>
              <div className="panel-body">
                <div className="row">
                  {nlpIssues.map((issue) => {
                    const issueCardClass = `issue-card issue-${issue.severity}`;
                    const badgeClass = `issue-badge issue-badge-${issue.severity}`;
                    return (
                      <div key={issue.id} className="col-sm-6">
                        <div className={issueCardClass}>
                          <div className="issue-header">
                            <span className={badgeClass}>{issue.severity}</span>
                            <span className="issue-job">Job #{issue.jobId}</span>
                          </div>
                          <h3 className="issue-title">{issue.title}</h3>
                          <p className="issue-description">{issue.description}</p>
                          <div className="issue-meta">
                            <span className="issue-date">{issue.date}</span>
                            <span className="issue-category">{issue.category}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

// Props for individual draggable component item
type ComponentItemProps = {
  component: Component;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void;
};

// This component represents a single draggable component in the template
function ComponentItem({ component, onUpdate, onRemove, onImageUpload }: ComponentItemProps) {
  // This hook from @dnd-kit provides drag-and-drop functionality
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
  });

  // Style for the component - makes it draggable and shows visual feedback
  const style = {
    transform: CSS.Transform.toString(transform), // Moves the component when dragging
    transition, // Smooth animation
    opacity: isDragging ? 0.5 : 1, // Makes it semi-transparent while dragging
  };

  // This function renders the appropriate input field based on component type
  const renderInput = () => {
    // Image component - file upload
    if (component.type === 'image') {
      return (
        <div className="component-image">
          <div className="form-group">
            <label>Section title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g., Site photo"
              value={component.data.title || ''}
              onChange={(e) => onUpdate(component.id, 'title', e.target.value)}
            />
          </div>
          <label>Image</label>
          <input type="file" accept="image/*" className="form-control" onChange={(e) => onImageUpload(component.id, e)} />
          {component.data.image && (
            <div className="component-image-preview">
              <img src={component.data.image} alt="Uploaded" />
            </div>
          )}
        </div>
      );
    }

    // Text-based components (progress, issues, text)
    const fields = {
      progress: { label: 'Progress', placeholder: 'Enter progress updates, milestones, or status information...' },
      issues: { label: 'Issues', placeholder: 'Enter any issues, concerns, or blockers...' },
      text: { label: 'Text', placeholder: 'Enter any additional notes or information...' },
    };

    const field = fields[component.type];
    return (
      <div className={`component-${component.type}`}>
        <div className="form-group">
          <label>Section title</label>
          <input
            type="text"
            className="form-control"
            placeholder={`e.g., ${field.label}`}
            value={component.data.title || ''}
            onChange={(e) => onUpdate(component.id, 'title', e.target.value)}
          />
        </div>
        <label>{field.label}</label>
        <textarea
          className="form-control"
          rows={4}
          placeholder={field.placeholder}
          value={component.data[component.type] || ''}
          onChange={(e) => onUpdate(component.id, component.type, e.target.value)}
        />
      </div>
    );
  };

  return (
    <div ref={setNodeRef} style={style} className="template-component-item">
      <div className="component-header">
        <div className="component-drag-handle" {...attributes} {...listeners}>
          <span className="glyphicon glyphicon-move" /> {component.type}
        </div>
        <button className="btn btn-sm btn-default" onClick={() => onRemove(component.id)}>
          Remove
        </button>
      </div>
      <div className="component-content">{renderInput()}</div>
    </div>
  );
}
