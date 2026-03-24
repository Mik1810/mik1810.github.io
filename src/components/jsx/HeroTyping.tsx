import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

import { useLanguage } from '../../context/useLanguage'
import { useProfile } from '../../context/useProfile'
import heroFallback from '../../data/heroFallback.json'
import icons from '../../data/icons'
import type { HeroTypingAnimationProps } from '../../types/app.js'
import '../css/HeroTyping.css'

const EMPTY_ROLES: string[] = []

interface HeroFallbackData {
  name: string
  photo: string
  roles: {
    it: string
    en: string
  }
  university: {
    logo: string
    name: {
      it: string
      en: string
    }
  }
  socials: Array<{
    name: string
    url: string
    icon: string
  }>
}

const FALLBACK_HERO = heroFallback as HeroFallbackData
const HERO_SOCIAL_PRIORITY: Record<string, number> = {
  linkedin: 0,
  github: 1,
}

const orderHeroSocials = (
  socials: Array<{ name: string; url: string; icon: string }>
) =>
  [...socials].sort((a, b) => {
    const pa = HERO_SOCIAL_PRIORITY[a.icon] ?? 99
    const pb = HERO_SOCIAL_PRIORITY[b.icon] ?? 99
    if (pa !== pb) return pa - pb
    return a.name.localeCompare(b.name)
  })

function HeroPortrait({
  photo,
  alt,
  contentReady,
  ariaHidden = false,
}: {
  photo: string
  alt: string
  contentReady: boolean
  ariaHidden?: boolean
}) {
  const [loadedPhoto, setLoadedPhoto] = useState<string | null>(null)
  const photoLoaded = loadedPhoto === photo
  const particles = useMemo(
    () =>
      Array.from({ length: 144 }, (_, index) => {
        const duration = 1.9 + (index % 10) * 0.12
        const phaseSeed = ((index * 73) % 101) / 101
        const jitterSeed = ((index * 37) % 19) - 9

        return {
          id: index,
          angle: index * (360 / 144) + jitterSeed * 0.18,
          // Negative delay spreads particles across the full cycle on first paint.
          delay: -(duration * phaseSeed),
          duration,
          size: 0.9 + (index % 6) * 0.72,
          travelMult: 0.88 + (index % 9) * 0.07,
        }
      }),
    []
  )

  const handlePhotoRef = useCallback(
    (image: HTMLImageElement | null) => {
      if (!photo || !image) return

      if (image.complete && image.naturalWidth > 0) {
        setLoadedPhoto((current) => (current === photo ? current : photo))
      }
    },
    [photo]
  )

  return (
    <div
      className={`hero-typing-image photo-glow${photoLoaded ? ' is-loaded' : ' is-loading'}${contentReady ? ' is-content-ready' : ''}`}
      aria-hidden={ariaHidden}
    >
      <div
        className="hero-particle-field"
        aria-hidden="true"
      >
        {particles.map((particle) => (
          <span
            key={particle.id}
            className="hero-particle"
            style={
              {
                '--p-angle': `${particle.angle}deg`,
                '--p-delay': `${particle.delay}s`,
                '--p-duration': `${particle.duration}s`,
                '--p-size': `${particle.size}px`,
                '--p-travel-mult': String(particle.travelMult),
              } as CSSProperties
            }
          />
        ))}
      </div>
      {photo ? (
        <img
          ref={handlePhotoRef}
          src={photo}
          alt={alt}
          decoding="async"
          fetchPriority="high"
          onLoad={() => setLoadedPhoto(photo)}
          onError={() => setLoadedPhoto(photo)}
        />
      ) : null}
    </div>
  )
}

interface HeroTypingAnimationTextProps
  extends Omit<HeroTypingAnimationProps, 'photo'> {
  fallbackRole: string
}

const areRoleListsEqual = (current: string[], next: string[]) => {
  if (current.length !== next.length) return false
  return current.every((role, index) => role === next[index])
}

function HeroTypingAnimationText({
  nameText,
  roles,
  university,
  socials,
  greeting,
  uniName,
  t,
  fallbackRole,
}: HeroTypingAnimationTextProps) {
  const roleSource = useMemo(
    () => (roles.length > 0 ? roles : [fallbackRole || FALLBACK_HERO.roles.en]),
    [roles, fallbackRole]
  )
  const [activeRoles, setActiveRoles] = useState<string[]>(roleSource)
  const [roleIndex, setRoleIndex] = useState(0)
  const [roleCharIndex, setRoleCharIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [hasRoleRendered, setHasRoleRendered] = useState(false)
  const latestRoleSourceRef = useRef<string[]>(roleSource)

  useEffect(() => {
    latestRoleSourceRef.current = roleSource
  }, [roleSource])

  useEffect(() => {
    const safeActiveRoles =
      activeRoles.length > 0 ? activeRoles : [fallbackRole || FALLBACK_HERO.roles.en]
    const currentRole = safeActiveRoles[roleIndex] ?? safeActiveRoles[0] ?? ''
    if (!currentRole) return

    let timeout: number | ReturnType<typeof setTimeout> | undefined

    if (roleIndex >= safeActiveRoles.length) {
      timeout = setTimeout(() => {
        setRoleIndex(0)
        setRoleCharIndex(0)
        setIsDeleting(false)
      }, 0)
    } else if (!isDeleting && roleCharIndex < currentRole.length) {
      timeout = setTimeout(() => {
        setRoleCharIndex((current) => current + 1)
        setHasRoleRendered(true)
      }, 65)
    } else if (!isDeleting && roleCharIndex === currentRole.length) {
      timeout = setTimeout(() => setIsDeleting(true), 1800)
    } else if (isDeleting && roleCharIndex > 0) {
      timeout = setTimeout(() => setRoleCharIndex((current) => current - 1), 32)
    } else if (isDeleting && roleCharIndex === 0) {
      timeout = setTimeout(() => {
        const nextRoles = latestRoleSourceRef.current
        const rolesChanged = !areRoleListsEqual(activeRoles, nextRoles)
        const previousRole = safeActiveRoles[roleIndex] ?? ''

        if (rolesChanged) {
          const nextStartIndex =
            nextRoles.length > 1 && nextRoles[0] === previousRole ? 1 : 0
          setActiveRoles(nextRoles)
          setRoleIndex(nextStartIndex)
        } else {
          setRoleIndex((current) => (current + 1) % safeActiveRoles.length)
        }

        setIsDeleting(false)
        setRoleCharIndex(0)
      }, 120)
    }

    return () => clearTimeout(timeout)
  }, [activeRoles, fallbackRole, isDeleting, roleCharIndex, roleIndex])

  const displayRole = activeRoles[roleIndex]
    ? activeRoles[roleIndex].substring(0, roleCharIndex)
    : ''
  const showRolePlaceholder =
    activeRoles.length > 0 && !hasRoleRendered && displayRole.length === 0

  return (
    <div className="hero-typing-text">
      <p className="hero-typing-greeting">{greeting}</p>
      <h1 className="hero-typing-name">
        <span className="typed-text">{nameText}</span>
      </h1>
      <h2 className="hero-typing-role">
        {showRolePlaceholder ? (
          <span
            className="hero-inline-skeleton hero-inline-skeleton-role"
            aria-hidden="true"
          />
        ) : (
          <>
            <span className="typed-text">{displayRole}</span>
            <span className="cursor">|</span>
          </>
        )}
      </h2>
      {uniName ? (
        <div className="hero-university-badge">
          {university.logo ? (
            <img
              src={university.logo}
              alt={uniName}
              className="hero-university-logo"
              decoding="async"
            />
          ) : null}
          <span>{uniName}</span>
        </div>
      ) : null}
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
  )
}

function HeroTyping() {
  const { t, lang } = useLanguage()
  const { profile, loading: profileLoading, profileLang } = useProfile()
  const profileAlignedWithLang = profileLang === lang
  const useDbProfile = !profileLoading && profileAlignedWithLang
  const nameText = profile?.name || FALLBACK_HERO.name
  const photo = profile?.photo || FALLBACK_HERO.photo
  const fallbackUniversityName =
    lang === 'it'
      ? FALLBACK_HERO.university.name.it
      : FALLBACK_HERO.university.name.en
  const university = {
    logo: profile?.university?.logo || FALLBACK_HERO.university.logo,
    name: useDbProfile
      ? profile?.university?.name || fallbackUniversityName
      : fallbackUniversityName,
  }
  const socials =
    useDbProfile && Array.isArray(profile?.socials) && profile.socials.length > 0
      ? orderHeroSocials(profile.socials)
      : orderHeroSocials(FALLBACK_HERO.socials)
  const roles =
    useDbProfile && Array.isArray(profile?.roles) ? profile.roles : EMPTY_ROLES
  const greeting = useDbProfile
    ? profile?.greeting || t('hero.greeting')
    : t('hero.greeting')
  const fallbackRole =
    lang === 'it' ? FALLBACK_HERO.roles.it : FALLBACK_HERO.roles.en
  const uniName = university.name
  const portraitAlt = nameText || FALLBACK_HERO.name

  return (
    <section id="hero" className="hero-typing">
      <div className="hero-typing-container hero-animate">
        <HeroTypingAnimationText
          key={lang}
          nameText={nameText}
          roles={roles}
          university={university}
          socials={socials}
          greeting={greeting}
          uniName={uniName}
          t={t}
          fallbackRole={fallbackRole}
        />
        <HeroPortrait
          photo={photo}
          alt={portraitAlt}
          contentReady={Boolean(photo)}
          ariaHidden={false}
        />
      </div>
    </section>
  )
}

export default HeroTyping
