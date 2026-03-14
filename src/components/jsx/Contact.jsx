import { useState } from 'react';
import { useLanguage } from '../../context/useLanguage';
import { useProfile } from '../../context/useProfile';
import '../css/Contact.css';

function Contact() {
  const { t } = useLanguage();
  const { profile } = useProfile();
  const email = profile?.email || '';

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
    const { name, email: userEmail, message } = formData;
    const mailtoLink = `mailto:${email}?subject=${t('contact.mailSubject')} ${encodeURIComponent(name)}&body=${encodeURIComponent(`${t('contact.mailFrom')}: ${name}\nEmail: ${userEmail}\n\n${message}`)}`;
    window.location.href = mailtoLink;
  };

  return (
    <section id="contact" className="contact">
      <div className="section-container">
        <h2 className="section-title reveal">{t('contact.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('contact.subtitle')}
        </p>
        <div className="contact-wrapper reveal reveal-delay-2">
          <div className="contact-info">
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              <a href={`mailto:${email}`}>{email}</a>
            </div>
            <div className="contact-item">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              <span>{profile?.location || t('contact.location')}</span>
            </div>
          </div>
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">{t('contact.nameLabel')}</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder={t('contact.namePlaceholder')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">{t('contact.emailLabel')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder={t('contact.emailPlaceholder')}
              />
            </div>
            <div className="form-group">
              <label htmlFor="message">{t('contact.messageLabel')}</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows="5"
                placeholder={t('contact.messagePlaceholder')}
              ></textarea>
            </div>
            <button type="submit" className="btn btn-primary">
              {t('contact.sendBtn')}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

export default Contact;
