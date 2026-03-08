import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import icons from '../../data/icons';
import '../css/HeroTyping.css';

function HeroTyping() {
  const { t, lang } = useLanguage();
  const { profile } = useProfile();
  const nameText = profile?.name || '';
  const photo = profile?.photo || '';
  const university = profile?.university || { logo: '', name: '' };
  const socials = profile?.socials || [];
  const roles = profile?.roles || [];
  const greeting = profile?.greeting || t('hero.greeting');
  const uniName = university.name || '';

  // Phase 1: type the name
  const [nameCharIndex, setNameCharIndex] = useState(0);
  const [nameFinished, setNameFinished] = useState(false);

  // Phase 2: cycle through roles
  const [roleIndex, setRoleIndex] = useState(0);
  const [roleCharIndex, setRoleCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setNameCharIndex(0);
    setNameFinished(false);
    setRoleIndex(0);
    setRoleCharIndex(0);
    setIsDeleting(false);
  }, [nameText, lang]);

  // Type the name first
  useEffect(() => {
    if (!nameText) return;
    if (nameFinished) return;
    if (nameCharIndex < nameText.length) {
      const timeout = setTimeout(() => setNameCharIndex(nameCharIndex + 1), 100);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => setNameFinished(true), 600);
      return () => clearTimeout(timeout);
    }
  }, [nameCharIndex, nameFinished, nameText.length]);

  // Then cycle through roles
  useEffect(() => {
    if (!nameFinished) return;
    const currentRole = roles[roleIndex];
    if (!currentRole) return;
    let timeout;

    if (!isDeleting && roleCharIndex < currentRole.length) {
      timeout = setTimeout(() => setRoleCharIndex(roleCharIndex + 1), 80);
    } else if (!isDeleting && roleCharIndex === currentRole.length) {
      timeout = setTimeout(() => setIsDeleting(true), 2000);
    } else if (isDeleting && roleCharIndex > 0) {
      timeout = setTimeout(() => setRoleCharIndex(roleCharIndex - 1), 40);
    } else if (isDeleting && roleCharIndex === 0) {
      setIsDeleting(false);
      setRoleIndex((roleIndex + 1) % roles.length);
    }

    return () => clearTimeout(timeout);
  }, [roleCharIndex, isDeleting, roleIndex, nameFinished, roles]);

  const displayName = nameText.substring(0, nameCharIndex);
  const displayRole = nameFinished && roles[roleIndex] ? roles[roleIndex].substring(0, roleCharIndex) : '';

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
              <img src={university.logo} alt={uniName} className="hero-university-logo" />
              <span>{uniName}</span>
            </div>
          )}
          <div className="hero-typing-actions">
            <a href="#projects" className="btn btn-primary">{t('hero.btnProjects')}</a>
            <a href="#contact" className="btn btn-outline">{t('hero.btnContact')}</a>
          </div>
          <div className="hero-typing-socials">
            {socials.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name}>
                {icons[s.icon]?.(22)}
              </a>
            ))}
          </div>
        </div>
        <div className="hero-typing-image photo-glow">
          <img className="float-animation" src={photo} alt={nameText} />
        </div>
      </div>
    </section>
  );
}

export default HeroTyping;
