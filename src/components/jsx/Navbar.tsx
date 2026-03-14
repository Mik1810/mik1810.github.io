import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'

import { useAuth } from '../../context/useAuth'
import { useLanguage } from '../../context/useLanguage'
import { useProfile } from '../../context/useProfile'
import type { NavbarLink } from '../../types/app.js'
import LanguageSwitcher from './LanguageSwitcher'
import ThemeToggle from './ThemeToggle'
import '../css/Navbar.css'

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { t, lang } = useLanguage()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { profile } = useProfile()
  const { authenticated, logout } = useAuth()
  const isAdminRoute = pathname.startsWith('/admin')
  const name = isAdminRoute
    ? profile?.email || 'email'
    : profile?.name || 'Portfolio'
  const cv = profile?.cv || '#'
  const showHomeLinks = pathname === '/'
  const loginLabel = lang === 'it' ? 'Login admin' : 'Admin login'
  const logoutLabel = lang === 'it' ? 'Logout' : 'Logout'

  const navLinks: NavbarLink[] = [
    { href: '#hero', label: t('nav.home') },
    { href: '#about', label: t('nav.about') },
    { href: '#projects', label: t('nav.projects') },
    { href: '#experience', label: t('nav.experience') },
    { href: '#skills', label: t('nav.skills') },
    { href: '#contact', label: t('nav.contact') },
  ]

  const handleClick = () => setMenuOpen(false)
  const handleLogout = async () => {
    navigate('/', { replace: true })
    await logout()
  }

  return (
    <nav className={`navbar ${isAdminRoute ? 'admin-navbar' : ''}`.trim()}>
      <div className="navbar-container">
        <a href={showHomeLinks ? '#hero' : '/'} className="navbar-logo">
          {name}
        </a>
        {showHomeLinks && (
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
        )}
        <div className="navbar-right">
          <LanguageSwitcher />
          <ThemeToggle />
          {showHomeLinks && (
            <button
              className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          )}
          {!authenticated && showHomeLinks && (
            <Link className="navbar-login-btn" to="/login" aria-label={loginLabel}>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M10 17L15 12L10 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M13 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H13"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{loginLabel}</span>
            </Link>
          )}
          {authenticated && (
            <button
              type="button"
              className="navbar-login-btn navbar-logout-btn"
              onClick={handleLogout}
              aria-label={logoutLabel}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M14 17L9 12L14 7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9 12H21"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M11 3H6C4.89543 3 4 3.89543 4 5V19C4 20.1046 4.89543 21 6 21H11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span>{logoutLabel}</span>
            </button>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
