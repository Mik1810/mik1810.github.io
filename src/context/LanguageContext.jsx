import { createContext, useContext, useState, useEffect, useCallback } from 'react';
const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('lang') || 'it';
  });

  useEffect(() => {
    localStorage.setItem('lang', lang);
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const loadTranslations = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/ui?lang=${lang}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok) {
          setTranslations(data || {});
        } else {
          setTranslations({});
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setTranslations({});
        }
      }
      setLoading(false);
    };

    loadTranslations();
    return () => controller.abort();
  }, [lang]);

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

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
