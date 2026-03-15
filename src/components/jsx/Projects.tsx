import { useContent } from '../../context/useContent'
import { useLanguage } from '../../context/useLanguage'
import type { GithubProjectItem, ProjectItem } from '../../types/app.js'
import '../css/ProjectsSection.css'
import GithubProjectsGrid from './GithubProjectsGrid'
import PortfolioProjectsGrid from './PortfolioProjectsGrid'

function Projects() {
  const { t } = useLanguage()
  const { projects, githubProjects } = useContent()
  const safeProjects: ProjectItem[] = Array.isArray(projects) ? projects : []
  const featuredGithubProjects: GithubProjectItem[] = Array.isArray(githubProjects)
    ? githubProjects
    : []

  return (
    <section id="projects" className="projects">
      <div className="section-container">
        <h2 className="section-title reveal">{t('projects.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('projects.subtitle')}
        </p>

        <PortfolioProjectsGrid
          projects={safeProjects}
          codeLabel={t('projects.codeLabel')}
          siteLabel={t('projects.siteLabel')}
        />

        <div className="projects-subsection">
          <div className="projects-subsection-header reveal">
            <h3 className="projects-subsection-title">{t('projects.githubTitle')}</h3>
            <p className="projects-subsection-subtitle">
              {t('projects.githubSubtitle')}
            </p>
          </div>

          <GithubProjectsGrid
            projects={featuredGithubProjects}
            previewCtaLabel={t('projects.previewLabel')}
            expandHintLabel={t('projects.expandHint')}
            emptyMediaLabel={t('projects.mediaUnavailable')}
            repoLabel={t('projects.repoLabel')}
          />
        </div>
      </div>
    </section>
  )
}

export default Projects
