import { useState } from 'react';
import { DndContext, closestCenter, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Component types available in the builder
type ComponentType = 'image' | 'progress' | 'issues' | 'text';

// Template component structure
type Component = {
  id: string;
  type: ComponentType;
  data: { image?: string; progress?: string; issues?: string; text?: string };
};

// Available components to add to templates
const components = [
  { type: 'image' as ComponentType, label: 'Image', icon: '📷' },
  { type: 'progress' as ComponentType, label: 'Progress', icon: '📊' },
  { type: 'issues' as ComponentType, label: 'Issues', icon: '⚠️' },
  { type: 'text' as ComponentType, label: 'Text Box', icon: '📝' },
];

export default function TemplateCreatorPage() {
  const [templateName, setTemplateName] = useState('');
  const [templateComponents, setTemplateComponents] = useState<Component[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  // Add a new component to the template
  const addComponent = (type: ComponentType) => {
    const newComponent: Component = {
      id: `comp-${Date.now()}`,
      type,
      data: {},
    };
    setTemplateComponents([...templateComponents, newComponent]);
  };

  // Handle drag-and-drop reordering of components
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = templateComponents.findIndex((c) => c.id === active.id);
    const newIndex = templateComponents.findIndex((c) => c.id === over.id);
    const newComponents = [...templateComponents];
    const [moved] = newComponents.splice(oldIndex, 1);
    newComponents.splice(newIndex, 0, moved);
    setTemplateComponents(newComponents);
  };

  // Update the data for a specific component
  const updateComponent = (id: string, field: string, value: string) => {
    setTemplateComponents(
      templateComponents.map((c) =>
        c.id === id ? { ...c, data: { ...c.data, [field]: value } } : c
      )
    );
  };

  // Remove a component from the template
  const removeComponent = (id: string) => {
    setTemplateComponents(templateComponents.filter((c) => c.id !== id));
  };

  // Handle image file upload and convert to base64
  const uploadImage = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        updateComponent(id, 'image', imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="template-page">
      {/* Page header */}
      <header className="template-header">
        <h1>Template creator</h1>
        <p>Drag and drop components to build your template. Perfect for building site reports.</p>
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
            </div>
          </div>

          {/* Drag-and-drop canvas for template components */}
          <div className="template-canvas panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title">Template canvas</h3>
              <p className="text-muted small">Drag components to reorder</p>
            </div>
            <div className="panel-body">
              {templateComponents.length === 0 ? (
                <div className="canvas-empty">
                  <p className="text-muted">Add components from the library to start building</p>
                </div>
              ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={templateComponents.map((c) => c.id)} strategy={verticalListSortingStrategy}>
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
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="template-actions">
            <button className="btn btn-link">Save draft</button>
            <button className="btn btn-rbp">Preview template</button>
          </div>
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

// Individual draggable and editable component
function ComponentItem({ component, onUpdate, onRemove, onImageUpload }: ComponentItemProps) {
  // Drag-and-drop functionality from @dnd-kit
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: component.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Render input fields based on component type
  const renderInput = () => {
    // Image component - file upload
    if (component.type === 'image') {
      return (
        <div className="component-image">
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
