import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { analyzeReportText, type DetectedIssue } from '../nlpIssueDetection';
import { fetchWithAuth } from '../utils/api';

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

  // This function adds a new component to the template when user clicks a component button
  const addComponent = (type: ComponentType, insertIndex?: number) => {
    // Create a new component with a unique ID (using current timestamp)
    const newComponent: Component = {
      id: `comp-${Date.now()}`,
      type,
      data: {},
    };
    // Add the new component to the list
    if (insertIndex !== undefined) {
      const newComponents = [...templateComponents];
      newComponents.splice(insertIndex, 0, newComponent);
      setTemplateComponents(newComponents);
    } else {
      setTemplateComponents([...templateComponents, newComponent]);
    }
  };

  // Handle drag start from sidebar
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const componentType = active.data.current?.type as ComponentType | undefined;
    if (componentType && components.some(c => c.type === componentType)) {
      setDraggingFromSidebar(componentType);
    } else {
      setActiveId(active.id as string);
    }
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
    setActiveId(null);
    setDraggingFromSidebar(null);

    // If dragging from sidebar, add new component
    if (draggingFromSidebar) {
      if (over && over.id === 'canvas-drop-zone') {
        // Add to end
        addComponent(draggingFromSidebar);
      } else if (over) {
        // Insert before the component we dropped on
        const insertIndex = templateComponents.findIndex((c) => c.id === over.id);
        if (insertIndex !== -1) {
          addComponent(draggingFromSidebar, insertIndex);
        } else {
          addComponent(draggingFromSidebar);
        }
      }
      return;
    }

    // If nothing was dropped on, or dropped on itself, do nothing
    if (!over || active.id === over.id) return;

    // Find the positions of the dragged component and where it was dropped
    const oldIndex = templateComponents.findIndex((c) => c.id === active.id);
    const newIndex = templateComponents.findIndex((c) => c.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;
    
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
        {/* Sidebar: drag to canvas */}
        <aside className="template-library-sidebar panel panel-default word-sidebar">
          <div className="panel-heading">
            <h2 className="panel-title">Components</h2>
            <p className="text-muted small">Drag onto document</p>
          </div>
          <div className="panel-body">
            {components.map((item) => (
              <div
                key={item.type}
                className="component-library-item-draggable"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.effectAllowed = 'copy';
                  e.dataTransfer.setData('text/plain', item.type);
                  setDraggingFromSidebar(item.type);
                }}
                onDragEnd={() => setDraggingFromSidebar(null)}
              >
                <button
                  type="button"
                  className="btn btn-default btn-block component-library-item"
                  onClick={() => addComponent(item.type)}
                  style={{ cursor: 'grab' }}
                >
                  <span className="component-icon">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="drag-hint">↔ Drag</span>
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Document area - Word-style page */}
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
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.dataTransfer.dropEffect = 'copy';
                        }}
                        onDrop={(e) => {
                          e.preventDefault();
                          const componentType = e.dataTransfer.getData('text/plain') as ComponentType;
                          if (componentType && components.some(c => c.type === componentType)) {
                            addComponent(componentType);
                          }
                        }}
                      >
                        <SortableContext
                          items={templateComponents.map((c) => c.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {templateComponents.length === 0 ? (
                            <div className="canvas-empty-document">
                              <p className="text-muted">Drag components here or click to add</p>
                              <p className="text-muted small">Start building your document template</p>
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
