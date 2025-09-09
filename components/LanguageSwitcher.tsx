import React from 'react';
import { useI18n } from '../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage } = useI18n();

  return (
    <div className="flex items-center bg-brand-primary rounded-lg p-1 border border-gray-600 text-sm">
      <button
        onClick={() => setLanguage('en')}
        className={`px-3 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-primary ${
          language === 'en'
            ? 'bg-brand-accent text-brand-primary font-semibold'
            : 'text-brand-text-secondary hover:text-brand-text-primary'
        }`}
        aria-pressed={language === 'en'}
      >
        English
      </button>
      <button
        onClick={() => setLanguage('zh')}
        className={`px-3 py-1 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2 focus:ring-offset-brand-primary ${
          language === 'zh'
            ? 'bg-brand-accent text-brand-primary font-semibold'
            : 'text-brand-text-secondary hover:text-brand-text-primary'
        }`}
        aria-pressed={language === 'zh'}
      >
        中文
      </button>
    </div>
  );
};
