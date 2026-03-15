import { useEffect, useRef } from 'react'

import { useContent } from '../../context/useContent'
import { useLanguage } from '../../context/useLanguage'
import '../css/Experience.css'

function TimelineSkeletonItem({ index }: { index: number }) {
  return (
    <div
      className={`timeline-item timeline-item-skeleton reveal reveal-delay-${Math.min(index + 1, 4)}`}
      aria-hidden="true"
    >
      <div className="timeline-dot timeline-dot-skeleton"></div>

      <div className="timeline-content">
        <div className="timeline-header">
          <div className="timeline-header-left">
            <span className="timeline-icon timeline-icon-skeleton">
              <span className="ui-skeleton ui-skeleton-circle timeline-icon-skeleton-inner" />
            </span>

            <div className="timeline-copy-skeleton">
              <span
                className="ui-skeleton ui-skeleton-line"
                style={{ width: '160px', height: '18px', marginBottom: '0.45rem' }}
              />
              <span
                className="ui-skeleton ui-skeleton-line"
                style={{ width: '120px', height: '14px' }}
              />
            </div>
          </div>

          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '88px', height: '14px' }}
          />
        </div>

        <div className="timeline-description-skeleton">
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '100%', height: '14px' }}
          />
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '92%', height: '14px' }}
          />
          <span
            className="ui-skeleton ui-skeleton-line"
            style={{ width: '74%', height: '14px' }}
          />
        </div>
      </div>
    </div>
  )
}

function Experience() {
  const { t } = useLanguage()
  const { experiences, education } = useContent()
  const sectionRef = useRef<HTMLElement | null>(null)
  const showExperienceSkeletons = experiences.length === 0
  const showEducationSkeletons = education.length === 0

  useEffect(() => {
    if (!sectionRef.current) return

    const elements = sectionRef.current.querySelectorAll<HTMLElement>('.reveal')

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible')
            observer.unobserve(entry.target)
          }
        })
      },
      {
        threshold: 0.15,
      }
    )

    elements.forEach((element) => observer.observe(element))

    return () => observer.disconnect()
  }, [experiences.length, education.length])

  return (
    <section id="experience" className="experience" ref={sectionRef}>
      <div className="section-container">
        <h2 className="section-title reveal">{t('experience.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('experience.subtitle')}
        </p>

        <div className="timeline">
          <h3 className="timeline-heading">{t('experience.activitiesHeading')}</h3>

          {showExperienceSkeletons ? (
            Array.from({ length: 2 }, (_, index) => (
              <TimelineSkeletonItem key={`experience-skeleton-${index}`} index={index} />
            ))
          ) : (
            experiences.map((experience, index) => (
              <div
                key={experience.id || index}
                className={`timeline-item reveal reveal-delay-${Math.min(index + 1, 4)}`}
              >
                <div className="timeline-dot"></div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <div className="timeline-header-left">
                      <span
                        className={`timeline-icon${experience.logo_bg ? ' has-logo-bg' : ''}`}
                        style={
                          experience.logo_bg
                            ? ({ '--logo-bg': experience.logo_bg } as React.CSSProperties)
                            : undefined
                        }
                      >
                        {experience.logo ? (
                          <img src={experience.logo} alt={experience.role} loading="lazy" />
                        ) : (
                          experience.icon
                        )}
                      </span>

                      <div>
                        <h4 className="timeline-role">{experience.role}</h4>
                        <p className="timeline-company">{experience.company}</p>
                      </div>
                    </div>

                    <span className="timeline-period">{experience.period}</span>
                  </div>

                  <p className="timeline-description">{experience.description}</p>
                </div>
              </div>
            ))
          )}

          <h3 className="timeline-heading reveal" style={{ marginTop: '3rem' }}>
            {t('experience.educationHeading')}
          </h3>

          {showEducationSkeletons
            ? Array.from({ length: 2 }, (_, index) => (
                <TimelineSkeletonItem key={`education-skeleton-${index}`} index={index} />
              ))
            : education.map((item, index) => (
                <div
                  key={item.id || index}
                  className={`timeline-item reveal reveal-delay-${Math.min(index + 1, 4)}`}
                >
                  <div className="timeline-dot"></div>

                  <div className="timeline-content">
                    <div className="timeline-header">
                      <div className="timeline-header-left">
                        <span className="timeline-icon">
                          {item.logo ? (
                            <img src={item.logo} alt={item.degree} loading="lazy" />
                          ) : (
                            item.icon
                          )}
                        </span>

                        <div>
                          <h4 className="timeline-role">{item.degree}</h4>
                          <p className="timeline-company">{item.institution}</p>
                        </div>
                      </div>

                      <span className="timeline-period">{item.period}</span>
                    </div>

                    <p className="timeline-description">{item.description}</p>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  )
}

export default Experience
