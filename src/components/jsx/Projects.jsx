import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { useContent } from '../../context/useContent';
import '../css/Projects.css';

const handleTilt = (e) => {
  const card = e.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((y - centerY) / centerY) * -6;
  const rotateY = ((x - centerX) / centerX) * 6;
  card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
};

const handleTiltReset = (e) => {
  e.currentTarget.style.transform = '';
};

function GithubProjectMediaCarousel({ project, images, loopedImages }) {
  const [currentIndex, setCurrentIndex] = useState(images.length > 1 ? 1 : 0);
  const [isTransitionEnabled, setIsTransitionEnabled] = useState(true);

  useEffect(() => {
    if (images.length <= 1) return undefined;

    const frameId = window.requestAnimationFrame(() => {
      setIsTransitionEnabled(true);
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [images.length, project.slug]);

  useEffect(() => {
    if (images.length <= 1) return undefined;

    const intervalId = window.setInterval(() => {
      if (document.hidden) return;
      setIsTransitionEnabled(true);
      setCurrentIndex((prev) => {
        if (prev >= images.length) return images.length + 1;
        if (prev < 1) return 1;
        return prev + 1;
      });
    }, 3500);

    return () => window.clearInterval(intervalId);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="github-project-fallback github-project-fallback-static">
        <span>{project.title}</span>
      </div>
    );
  }

  const showControls = images.length > 1;
  const activeDotIndex = showControls
    ? (currentIndex - 1 + images.length) % images.length
    : currentIndex;
  const goPrev = () => {
    setIsTransitionEnabled(true);
    setCurrentIndex((prev) => {
      if (prev <= 1) return 0;
      if (prev > images.length) return images.length;
      return prev - 1;
    });
  };
  const goNext = () => {
    setIsTransitionEnabled(true);
    setCurrentIndex((prev) => {
      if (prev >= images.length) return images.length + 1;
      if (prev < 1) return 1;
      return prev + 1;
    });
  };
  const handleTrackTransitionEnd = () => {
    if (!showControls) return;
    if (currentIndex <= 0) {
      setIsTransitionEnabled(false);
      setCurrentIndex(images.length);
      return;
    }
    if (currentIndex >= images.length + 1) {
      setIsTransitionEnabled(false);
      setCurrentIndex(1);
    }
  };

  return (
    <div className="github-project-media">
      <div
        className="github-project-media-track"
        onTransitionEnd={handleTrackTransitionEnd}
        data-transition={isTransitionEnabled ? 'enabled' : 'disabled'}
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {loopedImages.map((imageSrc, index) => (
          <div key={`${project.slug}-image-${index}`} className="github-project-media-slide">
            <img
              src={imageSrc}
              alt={`${project.title} screenshot ${((index - 1 + images.length) % images.length) + 1}`}
              loading="lazy"
              className="github-project-media-image"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
                const fallback = event.currentTarget.parentElement?.parentElement?.nextElementSibling;
                if (fallback) fallback.hidden = false;
              }}
            />
          </div>
        ))}
      </div>
      <div className="github-project-fallback" hidden>
        <span>{project.title}</span>
      </div>
      {showControls && (
        <>
          <button
            type="button"
            className="github-project-nav github-project-nav-left"
            onClick={goPrev}
            aria-label={`Previous ${project.title} screenshot`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            className="github-project-nav github-project-nav-right"
            onClick={goNext}
            aria-label={`Next ${project.title} screenshot`}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
          <div className="github-project-dots" aria-hidden="true">
            {images.map((_, index) => (
              <span
                key={`${project.slug}-dot-${index}`}
                className={index === activeDotIndex ? 'is-active' : ''}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GithubProjectMedia({ project }) {
  const images = Array.isArray(project.images) && project.images.length > 0
    ? project.images
    : project.image
      ? [project.image]
      : [];
  const loopedImages = images.length > 1
    ? [images[images.length - 1], ...images, images[0]]
    : images;

  return (
    <GithubProjectMediaCarousel
      key={`${project.slug}:${images.join('|')}`}
      project={project}
      images={images}
      loopedImages={loopedImages}
    />
  );
}

function Projects() {
  const { t } = useLanguage();
  const { projects, githubProjects } = useContent();
  const safeProjects = Array.isArray(projects) ? projects : [];
  const featuredGithubProjects = Array.isArray(githubProjects) ? githubProjects : [];

  return (
    <section id="projects" className="projects">
      <div className="section-container">
        <h2 className="section-title reveal">{t('projects.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('projects.subtitle')}
        </p>
        <div className="projects-grid">
          {safeProjects.map((project, index) => (
            <div
              key={project.id || index}
              className={`project-card reveal reveal-delay-${index + 1}`}
              onMouseMove={handleTilt}
              onMouseLeave={handleTiltReset}
            >
              <div className="project-card-content">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {(Array.isArray(project.tags) ? project.tags : []).map((tag) => (
                    <span key={tag} className="project-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="project-links">
                  {project.github && (
                    <a
                      href={project.github}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                      {t('projects.codeLabel')}
                    </a>
                  )}
                  {project.live && project.live !== '#' && (
                    <a
                      href={project.live}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                      </svg>
                      {t('projects.siteLabel')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="projects-subsection">
          <div className="projects-subsection-header reveal">
            <h3 className="projects-subsection-title">{t('projects.githubTitle')}</h3>
            <p className="projects-subsection-subtitle">{t('projects.githubSubtitle')}</p>
          </div>

          <div className="github-projects-grid">
            {featuredGithubProjects.map((project, index) => (
              <article
                key={project.slug || index}
                className={`github-project-card reveal reveal-delay-${Math.min(index + 1, 4)}`}
              >
                <div className="github-project-header">
                  <div className="github-project-topline">
                    <h4 className="github-project-title">{project.title}</h4>
                    <span className="github-project-badge">GitHub</span>
                  </div>
                </div>

                <GithubProjectMedia project={project} />

                <div className="github-project-content">
                  <p className="github-project-description">{project.description}</p>

                  <div className="project-tags">
                    {(Array.isArray(project.tags) ? project.tags : []).map((tag) => (
                      <span key={`${project.slug}-${tag}`} className="project-tag">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="project-links">
                    <a
                      href={project.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-link"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                      </svg>
                      {t('projects.repoLabel')}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Projects;
