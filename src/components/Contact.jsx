import { useState } from 'react';
import './Contact.css';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, message } = formData;
    const mailtoLink = `mailto:your.email@example.com?subject=Contatto da ${encodeURIComponent(name)}&body=${encodeURIComponent(`Da: ${name}\nEmail: ${email}\n\n${message}`)}`;
    window.location.href = mailtoLink;
  };

  return (
    <section id="contact" className="contact">
      <div className="section-container">
        <h2 className="section-title">Contatti</h2>
        <p className="section-subtitle">
          Hai un progetto in mente? Scrivimi, sarò felice di parlarne
        </p>
        <div className="contact-wrapper">
          <div className="contact-info">
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <a href="mailto:your.email@example.com">your.email@example.com</a>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>Italia</span>
            </div>
            <div className="contact-socials">
              <a href="https://github.com/Mik1810" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
              <a href="https://linkedin.com/in/" target="_blank" rel="noopener noreferrer">
                LinkedIn
              </a>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Nome</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Il tuo nome"
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="La tua email"
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">Messaggio</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                placeholder="Scrivi il tuo messaggio..."
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary">
              Invia messaggio
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Contact;
