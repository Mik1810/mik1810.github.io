import './Experience.css';

const experiences = [
  {
    role: 'Software Developer',
    company: 'Nome Azienda',
    period: '2024 – Presente',
    description:
      'Descrizione delle attività svolte, tecnologie utilizzate e risultati raggiunti.',
  },
  {
    role: 'Stagista / Junior Developer',
    company: 'Nome Azienda',
    period: '2023 – 2024',
    description:
      'Descrizione delle attività svolte, tecnologie utilizzate e risultati raggiunti.',
  },
];

const education = [
  {
    degree: 'Laurea in Informatica',
    institution: 'Università',
    period: '2020 – 2024',
    description: 'Descrizione del percorso di studi e tesi.',
  },
];

function Experience() {
  return (
    <section id="experience" className="experience">
      <div className="section-container">
        <h2 className="section-title">Esperienze</h2>
        <p className="section-subtitle">Il mio percorso professionale e accademico</p>

        <div className="timeline">
          <h3 className="timeline-heading">Lavoro</h3>
          {experiences.map((exp, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <div>
                    <h4 className="timeline-role">{exp.role}</h4>
                    <p className="timeline-company">{exp.company}</p>
                  </div>
                  <span className="timeline-period">{exp.period}</span>
                </div>
                <p className="timeline-description">{exp.description}</p>
              </div>
            </div>
          ))}

          <h3 className="timeline-heading" style={{ marginTop: '3rem' }}>
            Formazione
          </h3>
          {education.map((edu, index) => (
            <div key={index} className="timeline-item">
              <div className="timeline-dot"></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <div>
                    <h4 className="timeline-role">{edu.degree}</h4>
                    <p className="timeline-company">{edu.institution}</p>
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
