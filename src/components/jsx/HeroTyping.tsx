import { useEffect, useState } from 'react'

import { useLanguage } from '../../context/useLanguage'
import { useProfile } from '../../context/useProfile'
import icons from '../../data/icons'
import type { HeroTypingAnimationProps } from '../../types/app.js'
import '../css/HeroTyping.css'

const EMPTY_ROLES: string[] = []

function HeroTypingAnimation({
  nameText,
  roles,
  photo,
  university,
  socials,
  greeting,
  uniName,
  t,
}: HeroTypingAnimationProps) {
  const [nameCharIndex, setNameCharIndex] = useState(0)
  const [nameFinished, setNameFinished] = useState(false)
  const [roleIndex, setRoleIndex] = useState(0)
  const [roleCharIndex, setRoleCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    if (!nameText) return
    if (nameFinished) return
    if (nameCharIndex < nameText.length) {
      const timeout = setTimeout(() => setNameCharIndex(nameCharIndex + 1), 100)
      return () => clearTimeout(timeout)
    }

    const timeout = setTimeout(() => setNameFinished(true), 600)
    return () => clearTimeout(timeout)
  }, [nameCharIndex, nameFinished, nameText])

  useEffect(() => {
    if (!nameFinished) return
    const currentRole = roles[roleIndex]
    if (!currentRole) return
    let timeout: number | ReturnType<typeof setTimeout> | undefined

    if (!isDeleting && roleCharIndex < currentRole.length) {
      timeout = setTimeout(() => setRoleCharIndex(roleCharIndex + 1), 80)
    } else if (!isDeleting && roleCharIndex === currentRole.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000)
    } else if (isDeleting && roleCharIndex > 0) {
      timeout = setTimeout(() => setRoleCharIndex(roleCharIndex - 1), 40)
    } else if (isDeleting && roleCharIndex === 0) {
      timeout = setTimeout(() => {
        setIsDeleting(false)
        setRoleIndex((roleIndex + 1) % roles.length)
      }, 120)
    }

    return () => clearTimeout(timeout)
  }, [roleCharIndex, isDeleting, roleIndex, nameFinished, roles])

  const displayName = nameText.substring(0, nameCharIndex)
  const displayRole =
    nameFinished && roles[roleIndex]
      ? roles[roleIndex].substring(0, roleCharIndex)
      : ''

  return (
    <section id="hero" className="hero-typing">
      <div className="hero-typing-container hero-animate">
        <div className="hero-typing-text">
          <p className="hero-typing-greeting">{greeting}</p>
          <h1 className="hero-typing-name">
            <span className="typed-text">{displayName}</span>
            {!nameFinished && <span className="cursor">|</span>}
          </h1>
          <h2 className="hero-typing-role">
            {nameFinished && (
              <>
                <span className="typed-text">{displayRole}</span>
                <span className="cursor">|</span>
              </>
            )}
          </h2>
          {nameFinished && (
            <div className="hero-university-badge">
              {university.logo ? (
                <img src={university.logo} alt={uniName} className="hero-university-logo" />
              ) : null}
              <span>{uniName}</span>
            </div>
          )}
          <div className="hero-typing-actions">
            <a href="#projects" className="btn btn-primary">
              {t('hero.btnProjects')}
            </a>
            <a href="#contact" className="btn btn-outline">
              {t('hero.btnContact')}
            </a>
          </div>
          <div className="hero-typing-socials">
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.name}
              >
                {icons[social.icon]?.(22)}
              </a>
            ))}
          </div>
        </div>
        <div className="hero-typing-image photo-glow">
          {photo ? <img className="float-animation" src={photo} alt={nameText} /> : null}
        </div>
      </div>
    </section>
  )
}

function HeroTyping() {
  const { t, lang } = useLanguage()
  const { profile } = useProfile()
  const nameText = profile?.name || ''
  const photo = profile?.photo || ''
  const university = profile?.university || { logo: '', name: '' }
  const socials = Array.isArray(profile?.socials) ? profile.socials : []
  const roles = Array.isArray(profile?.roles) ? profile.roles : EMPTY_ROLES
  const greeting = profile?.greeting || t('hero.greeting')
  const uniName = university.name || ''
  const animationKey = `${lang}:${nameText}:${roles.join('|')}`

  return (
    <HeroTypingAnimation
      key={animationKey}
      nameText={nameText}
      roles={roles}
      photo={photo}
      university={university}
      socials={socials}
      greeting={greeting}
      uniName={uniName}
      t={t}
    />
  )
}

export default HeroTyping
