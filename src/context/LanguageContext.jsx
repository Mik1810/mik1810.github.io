import { useState, useEffect, useCallback, useMemo } from 'react';
import { LanguageContext } from './languageContextValue';
import staticI18n from '../data/staticI18n.json';

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'it';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const translations = useMemo(() => staticI18n[lang] || staticI18n.it || {}, [lang]);
  const loading = false;

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === 'it' ? 'en' : 'it'));
  }, []);

  const t = useCallback(
    (key) => {
      const keys = key.split('.');
      let val = translations;
      for (const k of keys) {
        val = val?.[k];
      }
      return val ?? key;
    },
    [translations]
  );

  return (
    <LanguageContext.Provider value={{ lang, toggleLang, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}
