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
  aborted?: boolean
  elapsedMs?: number
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
const REQUEST_TIMEOUT_MS = 15000
const RETRY_DELAY_MS = 250
const QUICK_ABORT_THRESHOLD_MS = 1200
const FETCH_CONCURRENCY = 2
type ContentSectionKey = 'about' | 'projects' | 'experiences' | 'skills'
type ContentSectionStatus = 'loading' | 'ready' | 'empty' | 'error'
const isDebugLoggingEnabled =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1')

export function ContentProvider({ children }: ProviderProps) {
  const { lang } = useLanguage()
  const [reloadKey, setReloadKey] = useState(0)
  const [loading, setLoading] = useState(true)
  const [sectionsLoading, setSectionsLoading] = useState({
    about: true,
    projects: true,
    experiences: true,
    skills: true,
  })
  const [sectionsStatus, setSectionsStatus] = useState<{
    about: ContentSectionStatus
    projects: ContentSectionStatus
    experiences: ContentSectionStatus
    skills: ContentSectionStatus
  }>({
    about: 'loading',
    projects: 'loading',
    experiences: 'loading',
    skills: 'loading',
  })
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
      const runOnce = async (): Promise<FetchJsonResult<T>> => {
        const startedAt = performance.now()
        const requestController = new AbortController()
        const timeoutId = setTimeout(() => requestController.abort(), REQUEST_TIMEOUT_MS)
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
          return { ok: res.ok, data, aborted: false }
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            if (controller.signal.aborted) {
              throw error
            }
            return {
              ok: false,
              data: null,
              aborted: true,
              elapsedMs: performance.now() - startedAt,
            }
          }
          return {
            ok: false,
            data: null,
            aborted: false,
            elapsedMs: performance.now() - startedAt,
          }
        } finally {
          clearTimeout(timeoutId)
          controller.signal.removeEventListener('abort', abortFromParent)
        }
      }

      const firstTry = await runOnce()
      if (firstTry.ok || controller.signal.aborted) return firstTry

      const shouldRetryQuickAbort =
        firstTry.aborted &&
        (firstTry.elapsedMs ?? REQUEST_TIMEOUT_MS) < QUICK_ABORT_THRESHOLD_MS

      if (firstTry.aborted && !shouldRetryQuickAbort) {
        return firstTry
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))
      if (controller.signal.aborted) return firstTry
      return runOnce()
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

    const setSectionDone = (section: ContentSectionKey) => {
      setSectionsLoading((prev) => ({ ...prev, [section]: false }))
    }
    const setSectionStatus = (
      section: ContentSectionKey,
      status: ContentSectionStatus
    ) => {
      setSectionsStatus((prev) => ({ ...prev, [section]: status }))
    }

    const loadContent = async () => {
      setLoading(true)
      setSectionsLoading({
        about: true,
        projects: true,
        experiences: true,
        skills: true,
      })
      setSectionsStatus({
        about: 'loading',
        projects: 'loading',
        experiences: 'loading',
        skills: 'loading',
      })

      if (isDebugLoggingEnabled) {
        console.info('[debug] content.bootstrap.start', {
          lang,
          concurrency: FETCH_CONCURRENCY,
          endpoints: [
            `/api/about?lang=${lang}`,
            `/api/projects?lang=${lang}`,
            `/api/experiences?lang=${lang}`,
            `/api/skills?lang=${lang}`,
          ],
        })
      }

      const tasks: Array<() => Promise<void>> = [
        async () => {
          let status: ContentSectionStatus = 'error'
          try {
            const result = await fetchJson<AboutData>(`/api/about?lang=${lang}`)
            if (controller.signal.aborted) return
            if (result.ok && result.data) {
              setAbout(result.data)
              status = (result.data.interests || []).length > 0 ? 'ready' : 'empty'
            }
          } finally {
            if (!controller.signal.aborted) {
              setSectionDone('about')
              setSectionStatus('about', status)
            }
          }
        },
        async () => {
          let status: ContentSectionStatus = 'error'
          try {
            const result = await fetchJson<ProjectsApiResponse>(`/api/projects?lang=${lang}`)
            if (controller.signal.aborted) return
            if (result.ok) {
              const data = normalizeProjects(result.data)
              setProjects(data.projects)
              setGithubProjects(data.githubProjects)
              status =
                data.projects.length > 0 || data.githubProjects.length > 0
                  ? 'ready'
                  : 'empty'
            }
          } finally {
            if (!controller.signal.aborted) {
              setSectionDone('projects')
              setSectionStatus('projects', status)
            }
          }
        },
        async () => {
          let status: ContentSectionStatus = 'error'
          try {
            const result = await fetchJson<ExperiencesApiResponse>(`/api/experiences?lang=${lang}`)
            if (controller.signal.aborted) return
            if (result.ok) {
              const expData = result.data
              const nextExperiences = Array.isArray(expData?.experiences)
                ? expData.experiences
                : []
              const nextEducation = Array.isArray(expData?.education)
                ? expData.education
                : []
              setExperiences(nextExperiences)
              setEducation(nextEducation)
              status =
                nextExperiences.length > 0 || nextEducation.length > 0
                  ? 'ready'
                  : 'empty'
            }
          } finally {
            if (!controller.signal.aborted) {
              setSectionDone('experiences')
              setSectionStatus('experiences', status)
            }
          }
        },
        async () => {
          let status: ContentSectionStatus = 'error'
          try {
            const result = await fetchJson<SkillsApiResponse>(`/api/skills?lang=${lang}`)
            if (controller.signal.aborted) return
            if (result.ok) {
              const data = normalizeSkills(result.data)
              const nextTechStack = Array.isArray(data.techStack) ? data.techStack : []
              const nextCategories = Array.isArray(data.categories) ? data.categories : []
              setTechStack(nextTechStack)
              setSkillCategories(nextCategories)
              status =
                nextTechStack.length > 0 || nextCategories.length > 0
                  ? 'ready'
                  : 'empty'
            }
          } finally {
            if (!controller.signal.aborted) {
              setSectionDone('skills')
              setSectionStatus('skills', status)
            }
          }
        },
      ]

      const queue = [...tasks]
      const workers = Array.from({ length: FETCH_CONCURRENCY }, async () => {
        while (queue.length > 0 && !controller.signal.aborted) {
          const task = queue.shift()
          if (!task) break
          try {
            await task()
          } catch (error) {
            if (error instanceof DOMException && error.name === 'AbortError') break
          }
        }
      })

      await Promise.all(workers)

      if (controller.signal.aborted) return
      setLoading(false)

      if (isDebugLoggingEnabled) {
        console.info('[debug] content.bootstrap.end', {
          lang,
          message: 'Bootstrap richieste pubbliche completato.',
        })
      }
    }

    void loadContent()
    return () => controller.abort()
  }, [lang, reloadKey])

  const value: ContentContextValue = {
    loading,
    sectionsLoading,
    sectionsStatus,
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
