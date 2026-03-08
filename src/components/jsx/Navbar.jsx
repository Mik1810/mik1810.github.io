import { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import '../css/Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();
  const { profile } = useProfile();
  const name = profile?.name || 'Portfolio';
  const cv = profile?.cv || '#';

  const navLinks = [
    { href: '#hero', label: t('nav.home') },
    { href: '#about', label: t('nav.about') },
    { href: '#projects', label: t('nav.projects') },
    { href: '#experience', label: t('nav.experience') },
    { href: '#skills', label: t('nav.skills') },
    { href: '#contact', label: t('nav.contact') },
  ];

  const handleClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#hero" className="navbar-logo">
          {name}
        </a>
        <ul className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.href}>
              <a href={link.href} onClick={handleClick}>
                {link.label}
              </a>
            </li>
          ))}
          <li>
            <a
              href={cv}
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-cv-btn"
              onClick={handleClick}
            >
              {t('nav.downloadCv')}
            </a>
          </li>
          <li className="navbar-lang-mobile">
            <LanguageSwitcher />
          </li>
        </ul>
        <div className="navbar-right">
          <LanguageSwitcher />
          <ThemeToggle />
          <button
            className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
