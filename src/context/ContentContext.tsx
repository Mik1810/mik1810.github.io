import { useCallback, useEffect, useState } from 'react'

import { ContentContext } from './contentContextValue'
import { useProfile } from './useProfile'
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
  const { loading: profileLoading } = useProfile()
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
    if (profileLoading) return undefined

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
        const aboutResult = await fetchJson<AboutData>(`/api/about?lang=${lang}`)
        if (controller.signal.aborted) return
        setAbout(aboutResult.ok && aboutResult.data ? aboutResult.data : EMPTY_ABOUT)

        const projectsResult = await fetchJson<ProjectsApiResponse>(
          `/api/projects?lang=${lang}`
        )
        if (controller.signal.aborted) return
        const projectsData = normalizeProjects(projectsResult.data)
        setProjects(projectsData.projects)
        setGithubProjects(projectsData.githubProjects)

        const experiencesResult = await fetchJson<ExperiencesApiResponse>(
          `/api/experiences?lang=${lang}`
        )
        if (controller.signal.aborted) return
        const expData = experiencesResult.ok ? experiencesResult.data : null
        setExperiences(
          Array.isArray(expData?.experiences) ? expData.experiences : []
        )
        setEducation(Array.isArray(expData?.education) ? expData.education : [])

        const skillsResult = await fetchJson<SkillsApiResponse>(
          `/api/skills?lang=${lang}`
        )
        if (controller.signal.aborted) return
        const skillsData = normalizeSkills(skillsResult.data)
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
  }, [lang, reloadKey, profileLoading])

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
