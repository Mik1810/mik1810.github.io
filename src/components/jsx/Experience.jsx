import { useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useContent } from '../../context/ContentContext';
import '../css/Experience.css';

function Experience() {
  const { t } = useLanguage();
  const { experiences, education, loading } = useContent();
  const sectionRef = useRef(null);

  useEffect(() => {
    if (loading) return;
    if (!sectionRef.current) return;

    const elements = sectionRef.current.querySelectorAll('.reveal');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [loading, experiences.length, education.length]);

  return (
    <section id="experience" className="experience" ref={sectionRef}>
      <div className="section-container">
        <h2 className="section-title reveal">{t('experience.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('experience.subtitle')}
        </p>

        <div className="timeline">
          <h3 className="timeline-heading">
            {t('experience.activitiesHeading')}
          </h3>

          {loading ? (
            <div className="timeline-item">Caricamento esperienze...</div>
          ) : experiences.length === 0 ? (
            <div className="timeline-item">Nessuna esperienza trovata.</div>
          ) : (
            experiences.map((exp, index) => (
              <div
                key={exp.id || index}
                className={`timeline-item reveal reveal-delay-${Math.min(
                  index + 1,
                  4
                )}`}
              >
                <div className="timeline-dot"></div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <div className="timeline-header-left">
                      <span
                        className={`timeline-icon${
                          exp.logo_bg ? ' has-logo-bg' : ''
                        }`}
                        style={
                          exp.logo_bg
                            ? { '--logo-bg': exp.logo_bg }
                            : undefined
                        }
                      >
                        {exp.logo ? (
                          <img src={exp.logo} alt={exp.role} loading="lazy" />
                        ) : (
                          exp.icon
                        )}
                      </span>

                      <div>
                        <h4 className="timeline-role">{exp.role}</h4>
                        <p className="timeline-company">{exp.company}</p>
                      </div>
                    </div>

                    <span className="timeline-period">
                      {exp.period || `${exp.start_date} - ${exp.end_date}`}
                    </span>
                  </div>

                  <p className="timeline-description">{exp.description}</p>
                </div>
              </div>
            ))
          )}

          <h3
            className="timeline-heading reveal"
            style={{ marginTop: '3rem' }}
          >
            {t('experience.educationHeading')}
          </h3>

          {education.map((edu, index) => (
            <div
              key={index}
              className={`timeline-item reveal reveal-delay-${Math.min(
                index + 1,
                4
              )}`}
            >
              <div className="timeline-dot"></div>

              <div className="timeline-content">
                <div className="timeline-header">
                  <div className="timeline-header-left">
                    <span className="timeline-icon">
                      {edu.logo ? (
                        <img src={edu.logo} alt={edu.degree} loading="lazy" />
                      ) : (
                        edu.icon
                      )}
                    </span>

                    <div>
                      <h4 className="timeline-role">{edu.degree}</h4>
                      <p className="timeline-company">{edu.institution}</p>
                    </div>
                  </div>

                  <span className="timeline-period">{edu.period}</span>
                </div>

                <p className="timeline-description">{edu.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Experience;
