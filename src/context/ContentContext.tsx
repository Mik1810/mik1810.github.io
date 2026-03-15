import { useCallback, useEffect, useState } from 'react'

import { ContentContext } from './contentContextValue'
import { useLanguage } from './useLanguage'
import type {
  AboutData,
  ContentContextValue,
  EducationItem,
  ExperienceItem,
  GithubProjectItem,
  ProjectItem,
  ProviderProps,
  SkillCategory,
  TechCategory,
} from '../types/app.js'

interface FetchJsonResult<T> {
  ok: boolean
  data: T | null
}

interface SkillsApiResponse {
  techStack?: TechCategory[]
  tech_stack?: TechCategory[]
  categories?: SkillCategory[]
  skills?: SkillCategory[]
}

interface ExperiencesApiResponse {
  experiences?: ExperienceItem[]
  education?: EducationItem[]
}

type ProjectsApiResponse =
  | ProjectItem[]
  | {
      projects?: ProjectItem[]
      githubProjects?: GithubProjectItem[]
      data?: ProjectItem[]
    }

const EMPTY_ABOUT: AboutData = { interests: [] }

export function ContentProvider({ children }: ProviderProps) {
  const { lang } = useLanguage()
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [about, setAbout] = useState<AboutData>(EMPTY_ABOUT)
  const [projects, setProjects] = useState<ProjectItem[]>([])
  const [githubProjects, setGithubProjects] = useState<GithubProjectItem[]>([])
  const [experiences, setExperiences] = useState<ExperienceItem[]>([])
  const [education, setEducation] = useState<EducationItem[]>([])
  const [techStack, setTechStack] = useState<TechCategory[]>([])
  const [skillCategories, setSkillCategories] = useState<SkillCategory[]>([])

  const refreshContent = useCallback(() => {
    setReloadKey((prev) => prev + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()

    const fetchJson = async <T,>(url: string): Promise<FetchJsonResult<T>> => {
      const requestController = new AbortController()
      const timeoutId = setTimeout(() => requestController.abort(), 8000)
      const abortFromParent = () => requestController.abort()
      controller.signal.addEventListener('abort', abortFromParent)

      try {
        const res = await fetch(url, {
          signal: requestController.signal,
          cache: 'no-store',
        })
        let data: T | null = null
        try {
          data = (await res.json()) as T
        } catch {
          data = null
        }
        return { ok: res.ok, data }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          if (controller.signal.aborted) {
            throw error
          }
        }
        return { ok: false, data: null }
      } finally {
        clearTimeout(timeoutId)
        controller.signal.removeEventListener('abort', abortFromParent)
      }
    }

    const normalizeProjects = (data: ProjectsApiResponse | null) => {
      if (Array.isArray(data)) return { projects: data, githubProjects: [] }
      if (Array.isArray(data?.projects) || Array.isArray(data?.githubProjects)) {
        return {
          projects: Array.isArray(data?.projects) ? data.projects : [],
          githubProjects: Array.isArray(data?.githubProjects)
            ? data.githubProjects
            : [],
        }
      }
      if (Array.isArray(data?.data)) {
        return { projects: data.data, githubProjects: [] }
      }
      return { projects: [], githubProjects: [] }
    }

    const normalizeSkills = (data: SkillsApiResponse | null) => {
      if (!data || typeof data !== 'object') {
        return { techStack: [], categories: [] }
      }
      const nextTechStack = Array.isArray(data.techStack)
        ? data.techStack
        : Array.isArray(data.tech_stack)
          ? data.tech_stack
          : []
      const categories = Array.isArray(data.categories)
        ? data.categories
        : Array.isArray(data.skills)
          ? data.skills
          : []
      return { techStack: nextTechStack, categories }
    }

    const loadContent = async () => {
      setLoading(true)
      try {
        const [aboutSettled, projectsSettled, expSettled, skillsSettled] =
          await Promise.allSettled([
            fetchJson<AboutData>(`/api/about?lang=${lang}`),
            fetchJson<ProjectsApiResponse>(`/api/projects?lang=${lang}`),
            fetchJson<ExperiencesApiResponse>(`/api/experiences?lang=${lang}`),
            fetchJson<SkillsApiResponse>(`/api/skills?lang=${lang}`),
          ])

        const aboutResult =
          aboutSettled.status === 'fulfilled'
            ? aboutSettled.value
            : { ok: false, data: null }
        const projectsResult =
          projectsSettled.status === 'fulfilled'
            ? projectsSettled.value
            : { ok: false, data: null }
        const expResult =
          expSettled.status === 'fulfilled'
            ? expSettled.value
            : { ok: false, data: null }
        const skillsResult =
          skillsSettled.status === 'fulfilled'
            ? skillsSettled.value
            : { ok: false, data: null }

        const projectsData = normalizeProjects(projectsResult.data)
        const skillsData = normalizeSkills(skillsResult.data)

        const aboutData = aboutResult.ok ? aboutResult.data : null
        const expData = expResult.ok ? expResult.data : null

        setAbout(aboutData || EMPTY_ABOUT)
        setProjects(projectsData.projects)
        setGithubProjects(projectsData.githubProjects)
        setExperiences(
          Array.isArray(expData?.experiences) ? expData.experiences : []
        )
        setEducation(Array.isArray(expData?.education) ? expData.education : [])
        setTechStack(Array.isArray(skillsData.techStack) ? skillsData.techStack : [])
        setSkillCategories(
          Array.isArray(skillsData.categories) ? skillsData.categories : []
        )
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setAbout(EMPTY_ABOUT)
          setProjects([])
          setGithubProjects([])
          setExperiences([])
          setEducation([])
          setTechStack([])
          setSkillCategories([])
        }
      }

      setLoading(false)
    }

    void loadContent()
    return () => controller.abort()
  }, [lang, reloadKey])

  const value: ContentContextValue = {
    loading,
    about,
    projects,
    githubProjects,
    experiences,
    education,
    techStack,
    skillCategories,
    refreshContent,
  }

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
}
