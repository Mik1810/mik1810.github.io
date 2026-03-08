import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import '../css/Skills.css';

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

function Skills() {
  const { t, lang } = useLanguage();
  const [techStack, setTechStack] = useState([]);
  const [skillCategories, setSkillCategories] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadSkills = async () => {
      try {
        const response = await fetch(`/api/skills?lang=${lang}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok) {
          setTechStack(data?.techStack || []);
          setSkillCategories(data?.categories || []);
        } else {
          console.error('Skills API error:', data);
          setTechStack([]);
          setSkillCategories([]);
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Skills fetch error:', error);
          setTechStack([]);
          setSkillCategories([]);
        }
      }
    };

    loadSkills();
    return () => controller.abort();
  }, [lang]);

  return (
    <section id="skills" className="skills">
      <div className="section-container">
        <h2 className="section-title reveal">{t('skills.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('skills.subtitle')}
        </p>

        {/* Tech Stack visuale */}
        <div className="tech-stack reveal reveal-delay-2">
          {techStack.map((cat) => (
            <div key={cat.category} className="tech-category">
              <h3 className="tech-category-title">{cat.category}</h3>
              <div className="tech-items">
                {cat.items.map((item) => (
                  <div key={item.name} className="tech-item" style={{ '--tech-color': item.color }}>
                    <img
                      src={`${DEVICON_BASE}/${item.devicon}.svg`}
                      alt={item.name}
                      className="tech-icon"
                      loading="lazy"
                    />
                    <span className="tech-name">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Categorie skills */}
        <div className="skills-grid">
          {skillCategories.map((cat, index) => (
            <div key={index} className={`skill-category reveal reveal-delay-${Math.min(index + 1, 4)}`}>
              <h3 className="skill-category-title">{cat.category}</h3>
              <div className="skill-list">
                {cat.skills.map((skill) => (
                  <span key={skill} className="skill-item">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Skills;
