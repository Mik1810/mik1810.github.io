import { useContent } from '../../context/useContent'
import { useLanguage } from '../../context/useLanguage'
import '../css/Skills.css'

const DEVICON_BASE = 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons'

const normalizeLabel = (value: string) => String(value || '').trim().toLowerCase()

function getTechCategoryLabel(label: string, t: (key: string) => string) {
  const normalized = normalizeLabel(label)
  if (normalized === 'libraries' || normalized === 'librerie') {
    const mapped = t('skills.pythonAiStack')
    return mapped === 'skills.pythonAiStack' ? label : mapped
  }
  return label
}

function Skills() {
  const { t } = useLanguage()
  const { techStack, skillCategories } = useContent()
  const safeTechStack = Array.isArray(techStack) ? techStack : []
  const safeSkillCategories = Array.isArray(skillCategories)
    ? skillCategories
    : []

  return (
    <section id="skills" className="skills">
      <div className="section-container">
        <h2 className="section-title reveal">{t('skills.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('skills.subtitle')}
        </p>

        <div className="tech-stack reveal reveal-delay-2">
          {safeTechStack.map((category) => (
            <div key={category.category} className="tech-category">
              <h3 className="tech-category-title">
                {getTechCategoryLabel(category.category, t)}
              </h3>
              <div className="tech-items">
                {(Array.isArray(category.items) ? category.items : []).map((item) => (
                  <div
                    key={item.name}
                    className="tech-item"
                    style={{ '--tech-color': item.color } as React.CSSProperties}
                  >
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

        <div className="skills-grid">
          {safeSkillCategories.map((category, index) => (
            <div
              key={category.category || index}
              className={`skill-category reveal reveal-delay-${Math.min(index + 1, 4)}`}
            >
              <h3 className="skill-category-title">{category.category}</h3>
              <div className="skill-list">
                {(Array.isArray(category.skills) ? category.skills : []).map((skill) => (
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
  )
}

export default Skills
