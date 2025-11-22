import { useState } from 'react';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ComponentType = 'image' | 'progress' | 'issues' | 'text';

type TemplateComponent = {
  id: string;
  type: ComponentType;
  data: {
    image?: string;
    progress?: string;
    issues?: string;
    text?: string;
  };
};

const componentLibrary: { type: ComponentType; label: string; icon: string }[] = [
  { type: 'image', label: 'Image', icon: '📷' },
  { type: 'progress', label: 'Progress', icon: '📊' },
  { type: 'issues', label: 'Issues', icon: '⚠️' },
  { type: 'text', label: 'Text Box', icon: '📝' },
];

export default function TemplateCreatorPage() {
  const [templateName, setTemplateName] = useState('');
  const [components, setComponents] = useState<TemplateComponent[]>([]);
  const sensors = useSensors(useSensor(PointerSensor));

  // Add component from library
  const handleAddComponent = (type: ComponentType) => {
    const newComponent: TemplateComponent = {
      id: `comp-${Date.now()}`,
      type,
      data: {},
    };
    setComponents([...components, newComponent]);
  };

  // Handle drag end to reorder
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setComponents((items) => {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);
      const newItems = [...items];
      const [removed] = newItems.splice(oldIndex, 1);
      newItems.splice(newIndex, 0, removed);
      return newItems;
    });
  };

  // Update component data
  const handleUpdateComponent = (id: string, field: string, value: string) => {
    setComponents(
      components.map((comp) =>
        comp.id === id ? { ...comp, data: { ...comp.data, [field]: value } } : comp
      )
    );
  };

  // Remove component
  const handleRemoveComponent = (id: string) => {
    setComponents(components.filter((comp) => comp.id !== id));
  };

  // Handle image upload
  const handleImageUpload = (id: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        handleUpdateComponent(id, 'image', imageUrl);
      };
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
            {componentLibrary.map((item) => (
              <button
                key={item.type}
                type="button"
                className="btn btn-default btn-block component-library-item"
                onClick={() => handleAddComponent(item.type)}
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
              {components.length === 0 ? (
                <div className="canvas-empty">
                  <p className="text-muted">Add components from the library to start building</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext items={components.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                    {components.map((component) => (
                      <ComponentItem
                        key={component.id}
                        component={component}
                        onUpdate={handleUpdateComponent}
                        onRemove={handleRemoveComponent}
                        onImageUpload={handleImageUpload}
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

type ComponentItemProps = {
  component: TemplateComponent;
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

  const renderComponent = () => {
    switch (component.type) {
      case 'image':
        return (
          <div className="component-image">
            <label>Image</label>
            <input
              type="file"
              accept="image/*"
              className="form-control"
              onChange={(e) => onImageUpload(component.id, e)}
            />
            {component.data.image && (
              <div className="component-image-preview">
                <img src={component.data.image} alt="Uploaded" />
              </div>
            )}
          </div>
        );

      case 'progress':
        return (
          <div className="component-progress">
            <label>Progress</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Enter progress updates, milestones, or status information..."
              value={component.data.progress || ''}
              onChange={(e) => onUpdate(component.id, 'progress', e.target.value)}
            />
          </div>
        );

      case 'issues':
        return (
          <div className="component-issues">
            <label>Issues</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Enter any issues, concerns, or blockers..."
              value={component.data.issues || ''}
              onChange={(e) => onUpdate(component.id, 'issues', e.target.value)}
            />
          </div>
        );

      case 'text':
        return (
          <div className="component-text">
            <label>Text</label>
            <textarea
              className="form-control"
              rows={4}
              placeholder="Enter any additional notes or information..."
              value={component.data.text || ''}
              onChange={(e) => onUpdate(component.id, 'text', e.target.value)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="template-component-item">
      <div className="component-header">
        <div className="component-drag-handle" {...attributes} {...listeners}>
          <span className="glyphicon glyphicon-move" /> {component.type}
        </div>
        <button
          className="btn btn-sm btn-default"
          onClick={() => onRemove(component.id)}
        >
          Remove
        </button>
      </div>
      <div className="component-content">{renderComponent()}</div>
    </div>
  );
}
