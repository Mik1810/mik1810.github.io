import { createContext, useContext, useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';

const ContentContext = createContext();

export function ContentProvider({ children }) {
  const { lang } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState({ interests: [] });
  const [projects, setProjects] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [techStack, setTechStack] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const fetchJson = async (url, retryCount = 1) => {
      let lastData = { ok: false, data: null };
      for (let attempt = 0; attempt <= retryCount; attempt += 1) {
        try {
          const res = await fetch(url, { signal: controller.signal });
          let data = null;
          try {
            data = await res.json();
          } catch {
            data = null;
          }
          lastData = { ok: res.ok, data };
          if (res.ok) return lastData;
        } catch (error) {
          if (error.name === 'AbortError') throw error;
        }
        if (attempt < retryCount) await delay(250);
      }
      return lastData;
    };

    const loadContent = async () => {
      setLoading(true);
      try {
        const [aboutSettled, projectsSettled, expSettled, skillsSettled] =
          await Promise.allSettled([
            fetchJson(`/api/about?lang=${lang}`, 2),
            fetchJson(`/api/projects?lang=${lang}`, 3),
            fetchJson(`/api/experiences?lang=${lang}`, 2),
            fetchJson(`/api/skills?lang=${lang}`, 3),
          ]);

        const aboutResult =
          aboutSettled.status === 'fulfilled'
            ? aboutSettled.value
            : { ok: false, data: null };
        const projectsResult =
          projectsSettled.status === 'fulfilled'
            ? projectsSettled.value
            : { ok: false, data: null };
        const expResult =
          expSettled.status === 'fulfilled'
            ? expSettled.value
            : { ok: false, data: null };
        const skillsResult =
          skillsSettled.status === 'fulfilled'
            ? skillsSettled.value
            : { ok: false, data: null };

        let projectsData = Array.isArray(projectsResult.data)
          ? projectsResult.data
          : [];
        let skillsData =
          skillsResult.data && typeof skillsResult.data === 'object'
            ? skillsResult.data
            : { techStack: [], categories: [] };

        // First-load guard: if APIs transiently return empty, retry once more.
        if (projectsData.length === 0 || (skillsData.categories || []).length === 0) {
          await delay(300);
          const [projectsRetry, skillsRetry] = await Promise.all([
            fetchJson(`/api/projects?lang=${lang}`),
            fetchJson(`/api/skills?lang=${lang}`),
          ]);

          if (projectsRetry.ok && Array.isArray(projectsRetry.data) && projectsRetry.data.length > 0) {
            projectsData = projectsRetry.data;
          }
          if (
            skillsRetry.ok &&
            skillsRetry.data &&
            Array.isArray(skillsRetry.data.categories) &&
            skillsRetry.data.categories.length > 0
          ) {
            skillsData = skillsRetry.data;
          }
        }

        const aboutData = aboutResult.ok ? aboutResult.data : null;
        const expData = expResult.ok ? expResult.data : null;

        setAbout(aboutData || { interests: [] });
        setProjects(projectsData);
        setExperiences(
          Array.isArray(expData?.experiences) ? expData.experiences : []
        );
        setEducation(
          Array.isArray(expData?.education) ? expData.education : []
        );
        setTechStack(
          Array.isArray(skillsData?.techStack)
            ? skillsData.techStack
            : []
        );
        setSkillCategories(
          Array.isArray(skillsData?.categories)
            ? skillsData.categories
            : []
        );
      } catch (error) {
        if (error.name !== 'AbortError') {
          setAbout({ interests: [] });
          setProjects([]);
          setExperiences([]);
          setEducation([]);
          setTechStack([]);
          setSkillCategories([]);
        }
      }

      setLoading(false);
    };

    loadContent();
    return () => controller.abort();
  }, [lang]);

  return (
    <ContentContext.Provider
      value={{
        loading,
        about,
        projects,
        experiences,
        education,
        techStack,
        skillCategories,
      }}
    >
      {children}
    </ContentContext.Provider>
  );
}

export function useContent() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContent must be used within ContentProvider');
  return ctx;
}
