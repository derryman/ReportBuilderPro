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

// Available components to add
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

  // Add component to template
  const addComponent = (type: ComponentType) => {
    setTemplateComponents([...templateComponents, { id: `comp-${Date.now()}`, type, data: {} }]);
  };

  // Reorder components when dragged
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

  // Update component data
  const updateComponent = (id: string, field: string, value: string) => {
    setTemplateComponents(
      templateComponents.map((c) =>
        c.id === id ? { ...c, data: { ...c.data, [field]: value } } : c
      )
    );
  };

  // Remove component
  const removeComponent = (id: string) => {
    setTemplateComponents(templateComponents.filter((c) => c.id !== id));
  };

  // Handle image upload
  const uploadImage = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => updateComponent(id, 'image', e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="template-page">
      <header className="template-header">
        <h1>Template creator</h1>
        <p>Drag and drop components to build your template. Perfect for building site reports.</p>
      </header>

      <div className="template-builder-grid">
        <aside className="template-library-sidebar panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title">Components</h3>
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

        <section className="template-canvas-area">
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

          <div className="template-actions">
            <button className="btn btn-link">Save draft</button>
            <button className="btn btn-rbp">Preview template</button>
          </div>
        </section>
      </div>
    </div>
  );
}

// Component item that can be dragged and edited
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

  // Render the appropriate input based on component type
  const renderInput = () => {
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
