import { useLanguage } from '../../context/LanguageContext';
import { useContent } from '../../context/ContentContext';
import '../css/Skills.css';

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons';

function Skills() {
  const { t } = useLanguage();
  const { techStack, skillCategories } = useContent();
  const safeTechStack = Array.isArray(techStack) ? techStack : [];
  const safeSkillCategories = Array.isArray(skillCategories)
    ? skillCategories
    : [];

  return (
    <section id="skills" className="skills">
      <div className="section-container">
        <h2 className="section-title reveal">{t('skills.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('skills.subtitle')}
        </p>

        {/* Tech Stack visuale */}
        <div className="tech-stack reveal reveal-delay-2">
          {safeTechStack.map((cat) => (
            <div key={cat.category} className="tech-category">
              <h3 className="tech-category-title">{cat.category}</h3>
              <div className="tech-items">
                {(Array.isArray(cat.items) ? cat.items : []).map((item) => (
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
          {safeSkillCategories.map((cat, index) => (
            <div key={index} className={`skill-category reveal reveal-delay-${Math.min(index + 1, 4)}`}>
              <h3 className="skill-category-title">{cat.category}</h3>
              <div className="skill-list">
                {(Array.isArray(cat.skills) ? cat.skills : []).map((skill) => (
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
