import { createContext, useContext, useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';

const ProfileContext = createContext();

export function ProfileProvider({ children }) {
  const { lang } = useLanguage();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

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
  }, [lang]);

  return (
    <ProfileContext.Provider value={{ profile, loading }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
