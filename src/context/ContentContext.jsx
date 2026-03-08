import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useLanguage } from './LanguageContext';

const ContentContext = createContext();

export function ContentProvider({ children }) {
  const { lang } = useLanguage();
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [about, setAbout] = useState({ interests: [] });
  const [projects, setProjects] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [education, setEducation] = useState([]);
  const [techStack, setTechStack] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);
  const refreshContent = useCallback(() => {
    setReloadKey((prev) => prev + 1);
  }, []);

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

        const normalizeProjects = (data) => {
          if (Array.isArray(data)) return data;
          if (Array.isArray(data?.projects)) return data.projects;
          if (Array.isArray(data?.data)) return data.data;
          return [];
        };

        const normalizeSkills = (data) => {
          if (!data || typeof data !== 'object') {
            return { techStack: [], categories: [] };
          }
          const techStack = Array.isArray(data.techStack)
            ? data.techStack
            : Array.isArray(data.tech_stack)
              ? data.tech_stack
              : [];
          const categories = Array.isArray(data.categories)
            ? data.categories
            : Array.isArray(data.skills)
              ? data.skills
              : [];
          return { techStack, categories };
        };

        let projectsData = normalizeProjects(projectsResult.data);
        let skillsData = normalizeSkills(skillsResult.data);

        // First-load guard: if APIs transiently return empty, retry once more.
        if (projectsData.length === 0 || (skillsData.categories || []).length === 0) {
          await delay(300);
          const [projectsRetry, skillsRetry] = await Promise.all([
            fetchJson(`/api/projects?lang=${lang}`),
            fetchJson(`/api/skills?lang=${lang}`),
          ]);

          const projectsRetryData = normalizeProjects(projectsRetry.data);
          const skillsRetryData = normalizeSkills(skillsRetry.data);

          if (projectsRetry.ok && projectsRetryData.length > 0) {
            projectsData = projectsRetryData;
          }
          if (
            skillsRetry.ok &&
            Array.isArray(skillsRetryData.categories) &&
            skillsRetryData.categories.length > 0
          ) {
            skillsData = skillsRetryData;
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
  }, [lang, reloadKey]);

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
        refreshContent,
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
