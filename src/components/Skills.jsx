import './Skills.css';

const skillCategories = [
  {
    category: 'Linguaggi',
    skills: ['JavaScript', 'TypeScript', 'Python', 'Java', 'C/C++', 'SQL'],
  },
  {
    category: 'Frontend',
    skills: ['React', 'HTML5', 'CSS3', 'Vite'],
  },
  {
    category: 'Backend',
    skills: ['Node.js', 'Express', 'Spring Boot', 'REST API'],
  },
  {
    category: 'Strumenti',
    skills: ['Git', 'Docker', 'Linux', 'VS Code'],
  },
];

function Skills() {
  return (
    <section id="skills" className="skills">
      <div className="section-container">
        <h2 className="section-title">Competenze</h2>
        <p className="section-subtitle">
          Le tecnologie e gli strumenti con cui lavoro
        </p>
        <div className="skills-grid">
          {skillCategories.map((cat) => (
            <div key={cat.category} className="skill-category">
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
