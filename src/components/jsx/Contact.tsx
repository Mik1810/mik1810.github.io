import { useState, type ChangeEvent, type FormEvent } from 'react'

import { useLanguage } from '../../context/useLanguage'
import { useProfile } from '../../context/useProfile'
import type { ContactFormData } from '../../types/app.js'
import '../css/Contact.css'

const EMPTY_FORM: ContactFormData = {
  name: '',
  email: '',
  message: '',
}

function Contact() {
  const { t } = useLanguage()
  const { profile } = useProfile()
  const email = String(profile?.email || '').trim()
  const location = String(profile?.location || '').trim()
  const showContactSkeleton = email.length === 0 || location.length === 0

  const [formData, setFormData] = useState<ContactFormData>(EMPTY_FORM)

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { name, email: userEmail, message } = formData
    const mailtoLink = `mailto:${email}?subject=${t('contact.mailSubject')} ${encodeURIComponent(name)}&body=${encodeURIComponent(`${t('contact.mailFrom')}: ${name}\nEmail: ${userEmail}\n\n${message}`)}`
    window.location.href = mailtoLink
  }

  return (
    <section id="contact" className="contact">
      <div className="section-container">
        <h2 className="section-title reveal">{t('contact.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('contact.subtitle')}
        </p>
        {showContactSkeleton ? (
          <div className="contact-wrapper reveal reveal-delay-2 contact-wrapper-skeleton">
            <div className="contact-info" aria-hidden="true">
              {Array.from({ length: 2 }, (_, index) => (
                <div key={`contact-info-skeleton-${index}`} className="contact-item">
                  <span
                    className="ui-skeleton ui-skeleton-circle"
                    style={{ width: '20px', height: '20px' }}
                  />
                  <span
                    className="ui-skeleton ui-skeleton-line"
                    style={{ width: index === 0 ? '210px' : '160px', height: '14px' }}
                  />
                </div>
              ))}
            </div>
            <div className="contact-form contact-form-skeleton" aria-hidden="true">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={`contact-form-skeleton-${index}`} className="form-group">
                  <span
                    className="ui-skeleton ui-skeleton-line"
                    style={{ width: '96px', height: '12px' }}
                  />
                  <span
                    className="ui-skeleton ui-skeleton-block"
                    style={{
                      width: '100%',
                      height: index === 2 ? '132px' : '48px',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              ))}
              <span
                className="ui-skeleton ui-skeleton-button"
                style={{ width: '150px' }}
              />
            </div>
          </div>
        ) : (
          <div className="contact-wrapper reveal reveal-delay-2">
            <div className="contact-info">
              <div className="contact-item">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <a href={`mailto:${email}`}>{email}</a>
              </div>
              <div className="contact-item">
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span>{location}</span>
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
                  rows={5}
                  placeholder={t('contact.messagePlaceholder')}
                />
              </div>
              <button type="submit" className="btn btn-primary">
                {t('contact.sendBtn')}
              </button>
            </form>
          </div>
        )}
      </div>
    </section>
  )
}

export default Contact
