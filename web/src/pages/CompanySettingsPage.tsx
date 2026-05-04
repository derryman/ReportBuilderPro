// Company branding settings — logo, accent colour, company name applied to PDF and UI
import { useState, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';

export default function CompanySettingsPage() {
  const { settings, reload } = useSettings();
  const { showToast } = useToast();
  const [companyName, setCompanyName] = useState('');
  const [accentColor, setAccentColor] = useState('#0d9488');
  const [logoData, setLogoData] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCompanyName(settings.companyName);
    setAccentColor(settings.accentColor || '#0d9488');
    setLogoData(settings.logoData);
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setLogoData(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetchWithAuth('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, accentColor, logoData }),
      });
      if (res.ok) {
        await reload();
        showToast('Branding settings saved');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch {
      showToast('Failed to save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveLogo = () => setLogoData('');

  return (
    <div className="company-settings-page">
      <header className="template-header">
        <h1>Company Settings</h1>
        <p className="text-muted">Branding applied to PDF exports and the app interface.</p>
      </header>

      <div className="panel panel-default">
        <div className="panel-heading">
          <h2 className="panel-title">Branding</h2>
        </div>
        <div className="panel-body">

          <div className="form-group">
            <label>Company name</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. MGM Partnership"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
            <p className="text-muted small" style={{ marginTop: 4 }}>Appears in the PDF header on every report.</p>
          </div>

          <div className="form-group">
            <label>Accent colour</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <input
                type="color"
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                style={{ width: 48, height: 38, border: '1px solid #e2e8f0', borderRadius: 6, cursor: 'pointer', padding: 2 }}
              />
              <input
                type="text"
                className="form-control"
                style={{ width: 120 }}
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
              />
            </div>
            <p className="text-muted small" style={{ marginTop: 4 }}>Applied to buttons, nav highlights, and PDF accents. Changes preview instantly.</p>
          </div>

          <div className="form-group">
            <label>Company logo</label>
            {logoData ? (
              <div style={{ marginBottom: 12 }}>
                <img
                  src={logoData}
                  alt="Company logo"
                  style={{ maxHeight: 80, maxWidth: 200, objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: 6, padding: 8, background: '#fff' }}
                />
                <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                  <label className="btn btn-default btn-sm" style={{ cursor: 'pointer', marginBottom: 0 }}>
                    Replace
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                  </label>
                  <button className="btn btn-danger btn-sm" onClick={handleRemoveLogo}>Remove</button>
                </div>
              </div>
            ) : (
              <div>
                <label className="btn btn-default" style={{ cursor: 'pointer' }}>
                  Upload logo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
                </label>
                <p className="text-muted small" style={{ marginTop: 4 }}>PNG or SVG recommended. Appears top-left on PDF exports and in the sidebar.</p>
              </div>
            )}
          </div>

          <button className="btn btn-rbp" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save settings'}
          </button>
        </div>
      </div>

      <div className="panel panel-default" style={{ marginTop: 24 }}>
        <div className="panel-heading">
          <h2 className="panel-title">Preview</h2>
        </div>
        <div className="panel-body">
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 24, background: '#f8fafc' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: `3px solid ${accentColor}` }}>
              {logoData && (
                <img src={logoData} alt="logo preview" style={{ maxHeight: 48, maxWidth: 120, objectFit: 'contain' }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{companyName || 'Your Company Name'}</div>
                <div style={{ color: '#64748b', fontSize: 12 }}>Site Report — Job ID: 2026-001</div>
              </div>
            </div>
            <div style={{ color: '#64748b', fontSize: 13 }}>Report content appears here...</div>
          </div>
          <p className="text-muted small" style={{ marginTop: 8 }}>This is how the PDF header will look.</p>
        </div>
      </div>
    </div>
  );
}
