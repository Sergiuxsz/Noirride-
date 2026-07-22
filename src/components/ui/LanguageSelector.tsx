import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import { translateDictionary } from '../../services/translate';
import enDict from '../../locales/en.json';

const AVAILABLE_LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'ro', label: 'RO' },
  { code: 'fr', label: 'FR' },
  { code: 'de', label: 'DE' },
  { code: 'es', label: 'ES' },
  { code: 'it', label: 'IT' },
];

export const LanguageSelector: React.FC = () => {
  const { i18n } = useTranslation();
  const [isTranslating, setIsTranslating] = useState(false);

  const handleLanguageChange = async (lng: string) => {
    if (i18n.language.startsWith(lng)) return;

    // Hardcoded local files don't need API calls
    if (lng === 'en') {
      i18n.changeLanguage(lng);
      return;
    }

    // Check if we already have this resource loaded in i18n
    if (i18n.hasResourceBundle(lng, 'translation')) {
      i18n.changeLanguage(lng);
      return;
    }

    // Check localStorage cache
    const cached = localStorage.getItem(`i18n_${lng}`);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        i18n.addResourceBundle(lng, 'translation', parsed, true, true);
        i18n.changeLanguage(lng);
        return;
      } catch (e) {
        console.warn('Cache corrupted, re-translating');
      }
    }

    setIsTranslating(true);
    try {
      const translated = await translateDictionary(enDict as any, lng);
      
      // Save to i18n memory
      i18n.addResourceBundle(lng, 'translation', translated, true, true);
      
      // Cache to localStorage
      localStorage.setItem(`i18n_${lng}`, JSON.stringify(translated));
      
      // Switch language
      i18n.changeLanguage(lng);
    } catch (err) {
      console.error('Failed to switch language via Google Translate:', err);
      // Fallback
      i18n.changeLanguage('en');
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="relative group">
      <button className="flex items-center gap-1 text-muted hover:text-gold-500 transition-colors py-1 focus:outline-none min-w-[32px] justify-center">
        {isTranslating ? (
          <Loader2 size={12} className="animate-spin text-gold-500" />
        ) : (
          <>
            <span className="uppercase">{i18n.language.split('-')[0]}</span>
            <span className="text-[8px] opacity-70">▼</span>
          </>
        )}
      </button>
      {/* Dropdown Menu on Hover */}
      <div className="absolute right-0 top-7 hidden group-hover:block bg-secondary border border-border rounded-lg p-1 shadow-xl z-50 text-[10px] min-w-[60px]">
        {AVAILABLE_LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            disabled={isTranslating}
            className={`block w-full text-left px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded ${
              i18n.language.startsWith(lang.code) ? 'text-gold-500 font-bold' : 'text-muted'
            } disabled:opacity-50`}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
};
