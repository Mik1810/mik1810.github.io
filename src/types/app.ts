import type { Dispatch, ReactNode, SetStateAction } from 'react'

export type SupportedLocale = 'it' | 'en'

export interface TranslationTree {
  [key: string]: TranslationNode
}

export type TranslationNode = string | TranslationTree

export interface LanguageContextValue {
  lang: SupportedLocale
  toggleLang: () => void
  t: (key: string) => string
  loading: boolean
}

export interface AuthUser {
  id: string
  email: string
}

export interface AuthContextValue {
  authLoading: boolean
  authenticated: boolean
  user: AuthUser | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => Promise<void>
  refreshSession: () => Promise<boolean>
}

export interface AboutData {
  interests: string[]
}

export interface ProjectItem {
  id: number | string
  slug: string
  title: string
  description: string
  tags: string[]
  live: string | null
  github: string | null
}

export interface GithubProjectItem {
  id: number | string
  slug: string
  title: string
  description: string
  tags: string[]
  githubUrl: string | null
  liveUrl: string | null
  images: string[]
}

export interface ExperienceItem {
  id: number
  order_index: number | null
  logo: string | null
  logo_bg: string | null
  role: string
  company: string
  period: string
  description: string
  icon?: ReactNode
}

export interface EducationItem {
  id: number
  order_index: number | null
  logo: string | null
  degree: string
  institution: string
  period: string
  description: string
  icon?: ReactNode
}

export interface TechItem {
  name: string
  devicon: string
  color: string
}

export interface TechCategory {
  category: string
  items: TechItem[]
}

export interface SkillCategory {
  category: string
  skills: string[]
}

export interface ProfileData {
  name: string
  photo: string
  email: string
  cv: string
  greeting: string
  location: string
  bio: string
  university: {
    name: string
    logo: string
  }
  roles: string[]
  socials: Array<{
    name: string
    url: string
    icon: string
  }>
}

export interface HeroTypingAnimationProps {
  nameText: string
  roles: string[]
  photo: string
  university: ProfileData['university']
  socials: ProfileData['socials']
  greeting: string
  uniName: string
  t: (key: string) => string
}

export interface NavbarLink {
  href: string
  label: string
}

export interface GithubProjectMediaCarouselProps {
  project: GithubProjectItem
  images: string[]
  loopedImages: string[]
}

export interface ContentContextValue {
  loading: boolean
  about: AboutData
  projects: ProjectItem[]
  githubProjects: GithubProjectItem[]
  experiences: ExperienceItem[]
  education: EducationItem[]
  techStack: TechCategory[]
  skillCategories: SkillCategory[]
  refreshContent: () => void
}

export interface ProfileContextValue {
  profile: ProfileData | null
  loading: boolean
  refreshProfile: () => void
}

export interface ThemeContextValue {
  theme: 'light' | 'dark'
  isDark: boolean
  setTheme: Dispatch<SetStateAction<'light' | 'dark'>>
  toggleTheme: () => void
}

export interface ProviderProps {
  children: ReactNode
}

export interface FooterProps {
  className?: string
}

export interface ContactFormData {
  name: string
  email: string
  message: string
}

export interface AdminTableDefinition {
  name: string
  label: string
  description?: string
  group: string
  groupLabel: string
  subgroup: string
  subgroupLabel: string
  primaryKeys: string[]
  defaultRow: Record<string, unknown>
  fields: AdminFieldDefinition[]
}

export type AdminFieldEditorKind =
  | 'text'
  | 'textarea'
  | 'number'
  | 'url'
  | 'email'
  | 'checkbox'
  | 'color'
  | 'select'

export interface AdminFieldEditorOption {
  value: string
  label: string
}

export interface AdminFieldRelationConfig {
  table: string
  valueColumn?: string
  labelColumns: string[]
  emptyLabel?: string
}

export interface AdminFieldEditorConfig {
  kind: AdminFieldEditorKind
  rows?: number
  options?: AdminFieldEditorOption[]
  relation?: AdminFieldRelationConfig
}

export interface AdminFieldDefinition {
  name: string
  label: string
  editor: AdminFieldEditorConfig
  editable: boolean
  primaryKey: boolean
  system: boolean
  foreignKey: boolean
}

export interface AdminTablesResponse {
  tables: AdminTableDefinition[]
  error?: string
}

export interface AdminRowsResponse {
  rows: Record<string, unknown>[]
  error?: string
}

export interface AdminRowResponse {
  row: Record<string, unknown> | null
  error?: string
}

export interface AdminCreateResponse {
  row?: Record<string, unknown> | null
  rows?: Record<string, unknown>[]
  error?: string
}

export interface AdminOkResponse {
  ok: boolean
  error?: string
}
