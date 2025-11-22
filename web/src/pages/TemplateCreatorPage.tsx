import { useState } from 'react';

type Section = {
  id: number;
  image: string | null;
  bullets: string[];
};

export default function TemplateCreatorPage() {
  const [templateName, setTemplateName] = useState('');
  const [sections, setSections] = useState<Section[]>([
    { id: 1, image: null, bullets: ['', '', ''] },
  ]);

  // Add a new section
  const handleAddSection = () => {
    const newSection: Section = {
      id: Date.now(),
      image: null,
      bullets: ['', '', ''],
    };
    setSections([...sections, newSection]);
  };

  // Remove a section
  const handleRemoveSection = (id: number) => {
    if (sections.length > 1) {
      setSections(sections.filter((section) => section.id !== id));
    }
  };

  // Update image for a section
  const handleImageChange = (id: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setSections(
          sections.map((section) =>
            section.id === id ? { ...section, image: imageUrl } : section
          )
        );
      };
      reader.readAsDataURL(file);
    }
  };

  // Update bullet point
  const handleBulletChange = (sectionId: number, bulletIndex: number, value: string) => {
    setSections(
      sections.map((section) => {
        if (section.id === sectionId) {
          const newBullets = [...section.bullets];
          newBullets[bulletIndex] = value;
          return { ...section, bullets: newBullets };
        }
        return section;
      })
    );
  };

  // Add a bullet point to a section
  const handleAddBullet = (sectionId: number) => {
    setSections(
      sections.map((section) =>
        section.id === sectionId
          ? { ...section, bullets: [...section.bullets, ''] }
          : section
      )
    );
  };

  return (
    <div className="template-page">
      <header className="template-header">
        <h1>Template creator</h1>
        <p>Create a simple template by adding images and bullet points.</p>
      </header>

      <div className="template-simple-form">
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

        {sections.map((section, sectionIndex) => (
          <div key={section.id} className="panel panel-default template-section-simple">
            <div className="panel-heading">
              <h3 className="panel-title">Section {sectionIndex + 1}</h3>
              {sections.length > 1 && (
                <button
                  className="btn btn-sm btn-default"
                  onClick={() => handleRemoveSection(section.id)}
                >
                  Remove section
                </button>
              )}
            </div>
            <div className="panel-body">
              <div className="form-group">
                <label>Image</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={(e) => handleImageChange(section.id, e)}
                />
                {section.image && (
                  <div className="image-preview">
                    <img src={section.image} alt="Preview" />
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Bullet points</label>
                {section.bullets.map((bullet, bulletIndex) => (
                  <input
                    key={bulletIndex}
                    type="text"
                    className="form-control bullet-input"
                    placeholder={`Bullet point ${bulletIndex + 1}`}
                    value={bullet}
                    onChange={(e) => handleBulletChange(section.id, bulletIndex, e.target.value)}
                  />
                ))}
                <button
                  className="btn btn-sm btn-default"
                  onClick={() => handleAddBullet(section.id)}
                >
                  + Add bullet point
                </button>
              </div>
            </div>
          </div>
        ))}

        <div className="template-actions-simple">
          <button className="btn btn-default" onClick={handleAddSection}>
            + Add section
          </button>
          <div>
            <button className="btn btn-link">Save draft</button>
            <button className="btn btn-rbp">Preview template</button>
          </div>
        </div>
      </div>
    </div>
  );
}
