// Loads company branding settings and applies accent colour as a CSS variable
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { fetchWithAuth } from '../utils/api';

export type CompanySettings = {
  companyName: string;
  accentColor: string;
  logoData: string;
};

const DEFAULT_SETTINGS: CompanySettings = {
  companyName: '',
  accentColor: '',
  logoData: '',
};

type SettingsContextType = {
  settings: CompanySettings;
  reload: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  reload: async () => {},
});

function applyAccentColor(color: string) {
  const root = document.documentElement;
  if (color) {
    root.style.setProperty('--rbp-teal', color);
    // Darken slightly for hover state
    root.style.setProperty('--rbp-teal-dark', color);
  } else {
    root.style.removeProperty('--rbp-teal');
    root.style.removeProperty('--rbp-teal-dark');
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);

  const reload = useCallback(async () => {
    try {
      const res = await fetchWithAuth('/api/settings');
      if (res.ok) {
        const data: CompanySettings = await res.json();
        setSettings(data);
        applyAccentColor(data.accentColor);
      }
    } catch {
      // settings unavailable — use defaults
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return (
    <SettingsContext.Provider value={{ settings, reload }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
