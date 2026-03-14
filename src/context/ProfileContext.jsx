import { useCallback, useEffect, useState } from 'react';
import { ProfileContext } from './profileContextValue';
import { useLanguage } from './useLanguage';

export function ProfileProvider({ children }) {
  const { lang } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const refreshProfile = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/profile?lang=${lang}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok) {
          setProfile(data);
        } else {
          setProfile(null);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setProfile(null);
        }
      }
      setLoading(false);
    };

    loadProfile();
    return () => controller.abort();
  }, [lang, reloadKey]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}
