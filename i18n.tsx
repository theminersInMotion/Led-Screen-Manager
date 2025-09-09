import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';

type Language = 'en' | 'zh';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const [enResponse, zhResponse] = await Promise.all([
          fetch('./en.json'),
          fetch('./zh.json'),
        ]);
        if (!enResponse.ok || !zhResponse.ok) {
          throw new Error('Failed to fetch translation files.');
        }
        const en = await enResponse.json();
        const zh = await zhResponse.json();
        setTranslations({ en, zh });
      } catch (error) {
        console.error('Failed to load translations:', error);
      }
    };
    fetchTranslations();
  }, []);

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
    const langTranslations = translations[language] || {};
    let translation = langTranslations[key] || key;
    
    if (replacements) {
        Object.entries(replacements).forEach(([r_key, value]) => {
            translation = translation.replace(new RegExp(`\\{${r_key}\\}`, 'g'), String(value));
        });
    }
    return translation;
  }, [language, translations]);

  const value = useMemo(() => ({
    language,
    setLanguage,
    t
  }), [language, t]);

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};