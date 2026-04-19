// Template Creator - build a report template by adding and reordering components, then save it
import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { analyzeReportText, type DetectedIssue } from '../nlpIssueDetection';
import { fetchWithAuth } from '../utils/api';

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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draggingFromSidebar, setDraggingFromSidebar] = useState<ComponentType | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const sensors = useSensors(useSensor(PointerSensor));

  // Load template when editing (templateId in URL)
  useEffect(() => {
    if (!templateId) return;
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetchWithAuth(`/api/templates/${templateId}`);
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

  const addComponent = (type: ComponentType, insertIndex?: number) => {
    const newComponent: Component = {
      id: `comp-${Date.now()}`,
      type,
      data: {},
    };
    if (insertIndex !== undefined) {
      const newComponents = [...templateComponents];
      newComponents.splice(insertIndex, 0, newComponent);
      setTemplateComponents(newComponents);
    } else {
      setTemplateComponents([...templateComponents, newComponent]);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const componentType = active.data.current?.type as ComponentType | undefined;
    if (componentType && components.some(c => c.type === componentType)) {
      setDraggingFromSidebar(componentType);
    } else {
      setActiveId(active.id as string);
    }
  };

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggingFromSidebar(null);

    if (draggingFromSidebar) {
      if (over && over.id === 'canvas-drop-zone') {
        addComponent(draggingFromSidebar);
      } else if (over) {
        const insertIndex = templateComponents.findIndex((c) => c.id === over.id);
        addComponent(draggingFromSidebar, insertIndex !== -1 ? insertIndex : undefined);
      }
      return;
    }

    if (!over || active.id === over.id) return;

    const oldIndex = templateComponents.findIndex((c) => c.id === active.id);
    const newIndex = templateComponents.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newComponents = [...templateComponents];
    const [moved] = newComponents.splice(oldIndex, 1);
    newComponents.splice(newIndex, 0, moved);
    setTemplateComponents(newComponents);
  };

  const updateComponent = (id: string, field: string, value: string) => {
    setTemplateComponents(
      templateComponents.map((c) =>
        c.id === id ? { ...c, data: { ...c.data, [field]: value } } : c
      )
    );
  };

  const removeComponent = (id: string) => {
    setTemplateComponents(templateComponents.filter((c) => c.id !== id));
  };

  const uploadImage = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => updateComponent(id, 'image', e.target?.result as string);
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
        ? `/api/templates/${templateId}`
        : '/api/templates';
      const method = templateId ? 'PUT' : 'POST';
      const res = await fetchWithAuth(url, {
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
    <div className="template-page template-page-word">
      {/* Word-style ribbon toolbar */}
      <header className="word-toolbar">
        <div className="word-toolbar-row word-toolbar-main">
          <div className="word-toolbar-doc-title">
            <input
              type="text"
              className="word-doc-title-input"
              placeholder="Document title"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
            />
            <input
              type="text"
              className="word-doc-desc-input"
              placeholder="Description (optional)"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
            />
          </div>
          <div className="word-toolbar-actions">
            <button type="button" className="btn btn-default word-toolbar-btn" onClick={loadSampleDailyReport}>
              Load sample
            </button>
            <button
              type="button"
              className="btn btn-rbp word-toolbar-btn"
              onClick={handleSaveTemplate}
              disabled={saving}
            >
              {saving ? 'Saving…' : templateId ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
        <div className="word-toolbar-row word-toolbar-insert">
          <span className="word-toolbar-tab-label">Insert</span>
          <div className="word-toolbar-buttons">
            {components.map((item) => (
              <div key={item.type} className="word-insert-item-wrapper">
                <button
                  type="button"
                  className="btn btn-default word-insert-btn"
                  onClick={() => addComponent(item.type)}
                  title={`Add ${item.label}`}
                >
                  <span className="word-insert-icon">{item.icon}</span>
                  <span className="word-insert-label">{item.label}</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </header>

      {saveMessage && (
        <div className={`word-save-message ${saveMessage.type === 'success' ? 'text-success' : 'text-danger'}`}>
          {saveMessage.text}
        </div>
      )}

      <div className="template-builder-grid">
        <section className="template-canvas-area">
          <div className="template-canvas word-document-wrapper">
            <div className="report-preview word-document-preview">
              <div className="report-page document-editor word-document-page">
                <div className="report-page-header word-doc-header">
                  <h3 className="report-page-title word-doc-title">
                    {templateName || 'Untitled document'}
                  </h3>
                </div>
                <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                    >
                      <div
                        id="canvas-drop-zone"
                        className="document-canvas"
                        ref={canvasRef}
                      >
                        <SortableContext
                          items={templateComponents.map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {templateComponents.length === 0 ? (
                            <div className="canvas-empty-document">
                              <p className="text-muted">Use the <strong>Insert</strong> ribbon above to add components</p>
                              <p className="text-muted small">Image, Progress, Issues, Text Box</p>
                            </div>
                          ) : (
                            templateComponents.map((component) => (
                              <ComponentItem
                                key={component.id}
                                component={component}
                                onUpdate={updateComponent}
                                onRemove={removeComponent}
                                onImageUpload={uploadImage}
                              />
                            ))
                          )}
                        </SortableContext>
                      </div>
                      <DragOverlay>
                        {activeId ? (
                          <div className="template-component-item dragging">
                            {templateComponents.find(c => c.id === activeId)?.type || 'Component'}
                          </div>
                        ) : draggingFromSidebar ? (
                          <div className="template-component-item dragging">
                            {components.find(c => c.type === draggingFromSidebar)?.label || 'Component'}
                          </div>
                        ) : null}
                      </DragOverlay>
                    </DndContext>
              </div>
            </div>
          </div>

          <div className="word-doc-actions" style={{ marginTop: 12 }}>
            <button type="button" className="btn btn-default btn-sm" onClick={analyzeTemplateText}>
              Analyze template text (demo)
            </button>
          </div>

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

type ComponentItemProps = {
  component: Component;
  onUpdate: (id: string, field: string, value: string) => void;
  onRemove: (id: string) => void;
  onImageUpload: (id: string, event: React.ChangeEvent<HTMLInputElement>) => void;
};

function ComponentItem({ component, onUpdate, onRemove, onImageUpload }: ComponentItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const renderInput = () => {
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
