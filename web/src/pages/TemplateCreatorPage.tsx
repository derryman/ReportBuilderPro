import { useState } from 'react';

// Simple block structure
const blockLibrary = [
  {
    title: 'Template meta',
    description: 'Name, description, and the audience this report serves.',
  },
  {
    title: 'Data inputs',
    description: 'Which datasets or systems we map to this design.',
  },
  {
    title: 'Layout guidance',
    description: 'Widgets, tables, or charts the consumer expects.',
  },
  {
    title: 'Stakeholders',
    description: 'Who approves, who consumes, and any reviewers.',
  },
];

export default function TemplateCreatorPage() {
  // Start with first 3 blocks
  const [blocks, setBlocks] = useState([
    { id: 0, ...blockLibrary[0] },
    { id: 1, ...blockLibrary[1] },
    { id: 2, ...blockLibrary[2] },
  ]);

  // Add a new block
  const handleAddBlock = (blockIndex: number) => {
    const newBlock = {
      id: Date.now(),
      title: blockLibrary[blockIndex].title,
      description: blockLibrary[blockIndex].description,
    };
    setBlocks([...blocks, newBlock]);
  };

  // Move block up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index - 1];
    newBlocks[index - 1] = temp;
    setBlocks(newBlocks);
  };

  // Move block down
  const handleMoveDown = (index: number) => {
    if (index === blocks.length - 1) return;
    const newBlocks = [...blocks];
    const temp = newBlocks[index];
    newBlocks[index] = newBlocks[index + 1];
    newBlocks[index + 1] = temp;
    setBlocks(newBlocks);
  };

  // Remove block
  const handleRemove = (index: number) => {
    setBlocks(blocks.filter((_, i) => i !== index));
  };

  return (
    <div className="template-page">
      <header className="template-header">
        <h1>Template creator</h1>
        <p>Add blocks from the library and reorder them to build your template.</p>
      </header>

      <div className="template-grid">
        <aside className="template-palette panel panel-default">
          <div className="panel-heading">
            <h3 className="panel-title">Component library</h3>
          </div>
          <div className="panel-body">
            {blockLibrary.map((block, index) => (
              <button
                key={index}
                type="button"
                className="btn btn-default btn-block btn-library"
                onClick={() => handleAddBlock(index)}
              >
                <span className="library-title">{block.title}</span>
                <small className="text-muted">{block.description}</small>
              </button>
            ))}
          </div>
        </aside>

        <section className="template-canvas">
          <div className="canvas-header">
            <h3>Template structure</h3>
            <p className="text-muted">Reorder blocks using the up/down buttons.</p>
          </div>
          {blocks.map((block, index) => (
            <div key={block.id} className="panel panel-default template-section">
              <div className="panel-heading">
                <h3 className="panel-title">{block.title}</h3>
                <p className="text-muted">{block.description}</p>
                <div className="template-controls">
                  <button
                    className="btn btn-sm btn-default"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    ↑ Up
                  </button>
                  <button
                    className="btn btn-sm btn-default"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === blocks.length - 1}
                  >
                    ↓ Down
                  </button>
                  <button
                    className="btn btn-sm btn-default"
                    onClick={() => handleRemove(index)}
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="panel-body">
                <div className="form-group">
                  <label>Notes</label>
                  <textarea className="form-control" placeholder="Add details here..." rows={3} />
                </div>
              </div>
            </div>
          ))}
          <div className="template-actions">
            <button className="btn btn-link">Save draft</button>
            <button className="btn btn-rbp">Preview template</button>
          </div>
        </section>
      </div>
    </div>
  );
}
