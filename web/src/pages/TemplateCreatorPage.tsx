import { useState } from 'react';
import { DndContext, closestCenter } from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type TemplateField = {
  label: string;
  placeholder: string;
};

type TemplateBlock = {
  id: string;
  title: string;
  description: string;
  fields: TemplateField[];
};

const blockLibrary: Omit<TemplateBlock, 'id'>[] = [
  {
    title: 'Template meta',
    description: 'Name, description, and the audience this report serves.',
    fields: [
      { label: 'Template name', placeholder: 'Q1 Operations Overview' },
      { label: 'Summary', placeholder: 'Short blurb shown in search results' },
    ],
  },
  {
    title: 'Data inputs',
    description: 'Which datasets or systems we map to this design.',
    fields: [
      { label: 'Primary dataset', placeholder: 'Salesforce exports, Snowflake view…' },
      { label: 'Refresh cadence', placeholder: 'Weekly, monthly, quarterly…' },
    ],
  },
  {
    title: 'Layout guidance',
    description: 'Widgets, tables, or charts the consumer expects.',
    fields: [
      { label: 'Key metrics', placeholder: 'Revenue, NPS, churn…' },
      { label: 'Visual components', placeholder: 'Bar chart, KPI cards, data table…' },
    ],
  },
  {
    title: 'Stakeholders',
    description: 'Who approves, who consumes, and any reviewers.',
    fields: [
      { label: 'Primary owner', placeholder: 'Jane Smith – Ops Director' },
      { label: 'Distribution list', placeholder: 'Leadership@company.com' },
    ],
  },
];

const createInitialBlocks = (): TemplateBlock[] =>
  blockLibrary.slice(0, 3).map((block, index) => ({
    ...block,
    id: `${block.title}-${index}`,
  }));

const placeholderTokens = [
  { label: 'Project name', token: '{{project.name}}' },
  { label: 'Date', token: '{{report.date}}' },
  { label: 'Weather', token: '{{site.weather}}' },
  { label: 'Personnel', token: '{{crew.list}}' },
];

const formatPresets = [
  { label: 'Header font', value: 'Segoe UI / SemiBold' },
  { label: 'Body font', value: 'Segoe UI / Regular' },
  { label: 'Accent color', value: '#1AA3A3' },
  { label: 'Page layout', value: 'A4 portrait' },
];

export default function TemplateCreatorPage() {
  const [blocks, setBlocks] = useState<TemplateBlock[]>(createInitialBlocks());

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }

    setBlocks((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const handleAddBlock = (block: Omit<TemplateBlock, 'id'>) => {
    setBlocks((prev) => [
      ...prev,
      {
        ...block,
        id: `${block.title}-${Date.now()}`,
      },
    ]);
  };

  return (
    <div className="template-page">
      <header className="template-header">
        <h1>Template creator</h1>
        <p>
          Drag cards to reorder the build brief. Add new blocks from the library to capture more
          context before engineering work begins.
        </p>
      </header>

      <div className="template-grid">
        <aside className="template-palette panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title">Component library</h3>
            <p className="text-muted small">Drag-ready building blocks</p>
          </div>
          <div className="panel-body">
            {blockLibrary.map((block) => (
              <button
                key={block.title}
                type="button"
                className="btn btn-default btn-block btn-library"
                onClick={() => handleAddBlock(block)}
              >
                <span className="library-title">{block.title}</span>
                <small className="text-muted">{block.description}</small>
              </button>
            ))}
            <div className="palette-note">
              <strong>Placeholders</strong>
              <ul>
                {placeholderTokens.map((token) => (
                  <li key={token.token}>
                    <span>{token.label}</span>
                    <code>{token.token}</code>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <section className="template-canvas">
          <div className="canvas-header">
            <h3>Structure canvas</h3>
            <p className="text-muted">
              Reorder sections to define your report hierarchy. Subsections can be represented with
              indenting inside a block.
            </p>
          </div>
          <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              {blocks.map((block) => (
                <SortableBlock key={block.id} block={block} />
              ))}
            </SortableContext>
          </DndContext>
          <div className="template-actions">
            <button className="btn btn-link">Save draft</button>
            <button className="btn btn-rbp">Preview template</button>
          </div>
        </section>

        <aside className="template-sidebar">
          <div className="panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title">Formatting & styling</h3>
            </div>
            <div className="panel-body">
              <ul className="format-list">
                {formatPresets.map((preset) => (
                  <li key={preset.label}>
                    <span>{preset.label}</span>
                    <strong>{preset.value}</strong>
                  </li>
                ))}
              </ul>
              <button className="btn btn-default btn-sm btn-block">Open style guide</button>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title">Template metadata</h3>
            </div>
            <div className="panel-body meta-panel">
              <div className="form-group">
                <label>Category</label>
                <select className="form-control">
                  <option>Safety</option>
                  <option>Progress</option>
                  <option>QA/QC</option>
                </select>
              </div>
              <div className="form-group">
                <label>Tags</label>
                <input className="form-control" placeholder="weekly, field audit, ... " />
              </div>
              <div className="checkbox">
                <label>
                  <input type="checkbox" /> Enable collaboration mode
                </label>
              </div>
              <p className="text-muted small">
                Permissions pull from Report Builder roles. Version history will log edits and notes.
              </p>
            </div>
          </div>
          <div className="panel panel-default">
            <div className="panel-heading">
              <h3 className="panel-title">Live preview</h3>
            </div>
            <div className="panel-body preview-panel">
              <div className="preview-header">Report title</div>
              <div className="preview-body">
                <div className="preview-block" />
                <div className="preview-block wide" />
                <div className="preview-block" />
              </div>
              <button className="btn btn-default btn-sm btn-block m-t">Open full preview</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

type SortableBlockProps = {
  block: TemplateBlock;
};

function SortableBlock({ block }: SortableBlockProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };

  return (
    <section ref={setNodeRef} style={style} className="panel panel-default template-section sortable-block">
      <div className="panel-heading sortable-heading" {...attributes} {...listeners}>
        <div>
          <h3 className="panel-title">{block.title}</h3>
          <p className="text-muted">{block.description}</p>
        </div>
        <span className="drag-handle glyphicon glyphicon-move" aria-hidden="true" />
      </div>
      <div className="panel-body">
        {block.fields.map((field) => (
          <div className="form-group" key={`${block.id}-${field.label}`}>
            <label>{field.label}</label>
            <textarea className="form-control" placeholder={field.placeholder} rows={3} />
          </div>
        ))}
        <button className="btn btn-default btn-sm">Add attachment</button>
      </div>
    </section>
  );
}

