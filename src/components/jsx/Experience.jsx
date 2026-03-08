import { useEffect, useMemo, useRef, useState } from 'react';
import educationData from '../../data/education.json';
import { useLanguage } from '../../context/LanguageContext';
import '../css/Experience.css';

function Experience() {
  const { t } = useLanguage();
  const translatedExp = t('experience.experiences');
  const translatedEdu = t('experience.education');

  const [apiExperiences, setApiExperiences] = useState([]);
  const [loading, setLoading] = useState(true);
  const sectionRef = useRef(null);

  useEffect(() => {
    const controller = new AbortController();

    const fetchExperiences = async () => {
      setLoading(true);

      try {
        const response = await fetch('/api/experiences', {
          signal: controller.signal,
        });
        const data = await response.json();

        if (!response.ok) {
          console.error('API error:', data);
          setApiExperiences([]);
        } else {
          setApiExperiences(data);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Fetch error:', error);
          setApiExperiences([]);
        }
      }

      setLoading(false);
    };

    fetchExperiences();
    return () => controller.abort();
  }, []);

  const experiences = useMemo(() => {
    return apiExperiences.map((exp, i) => ({
      ...exp,
      ...(translatedExp[i] || {}),
    }));
  }, [apiExperiences, translatedExp]);

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
  }, [loading, experiences.length, translatedEdu.length]);

  const education = useMemo(() => {
    return educationData.map((edu, i) => ({
      ...edu,
      ...(translatedEdu[i] || {}),
    }));
  }, [translatedEdu]);

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
                className="timeline-item reveal"
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
              className="timeline-item reveal"
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
