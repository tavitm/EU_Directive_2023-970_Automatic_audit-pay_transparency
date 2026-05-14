import { createContext, useContext } from 'react';
import type { Language } from './translations';
import { translations, t } from './translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
}

// Helper to get translation with current language
export function getTranslation(language: Language, key: string): string {
  return t(language, key);
}
