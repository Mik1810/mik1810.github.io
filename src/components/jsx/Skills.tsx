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
  const showTechSkeletons = safeTechStack.length === 0
  const showSkillSkeletons = safeSkillCategories.length === 0

  return (
    <section id="skills" className="skills">
      <div className="section-container">
        <h2 className="section-title reveal">{t('skills.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('skills.subtitle')}
        </p>

        <div className="tech-stack reveal reveal-delay-2">
          {showTechSkeletons
            ? Array.from({ length: 3 }, (_, categoryIndex) => (
                <div
                  key={`tech-category-skeleton-${categoryIndex}`}
                  className="tech-category tech-category-skeleton"
                  aria-hidden="true"
                >
                  <span
                    className="ui-skeleton ui-skeleton-line"
                    style={{ width: '40%', height: '12px', marginBottom: '1rem' }}
                  />
                  <div className="tech-items">
                    {Array.from({ length: 4 }, (_, itemIndex) => (
                      <div
                        key={`tech-item-skeleton-${categoryIndex}-${itemIndex}`}
                        className="tech-item tech-item-skeleton"
                      >
                        <span
                          className="ui-skeleton ui-skeleton-circle"
                          style={{ width: '32px', height: '32px' }}
                        />
                        <span
                          className="ui-skeleton ui-skeleton-line"
                          style={{ width: '70%', height: '10px' }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))
            : safeTechStack.map((category) => (
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
          {showSkillSkeletons
            ? Array.from({ length: 4 }, (_, index) => (
                <div
                  key={`skill-category-skeleton-${index}`}
                  className={`skill-category skill-category-skeleton reveal reveal-delay-${Math.min(index + 1, 4)}`}
                  aria-hidden="true"
                >
                  <span
                    className="ui-skeleton ui-skeleton-line"
                    style={{ width: '46%', height: '12px', marginBottom: '1.25rem' }}
                  />
                  <div className="skill-list">
                    {Array.from({ length: 5 }, (_, skillIndex) => (
                      <span
                        key={`skill-chip-skeleton-${index}-${skillIndex}`}
                        className="ui-skeleton ui-skeleton-chip"
                      />
                    ))}
                  </div>
                </div>
              ))
            : safeSkillCategories.map((category, index) => (
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
