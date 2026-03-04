import { useState } from 'react';
import './Navbar.css';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { href: '#hero', label: 'Home' },
    { href: '#projects', label: 'Progetti' },
    { href: '#experience', label: 'Esperienze' },
    { href: '#skills', label: 'Competenze' },
    { href: '#contact', label: 'Contatti' },
  ];

  const handleClick = () => setMenuOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <a href="#hero" className="navbar-logo">
          Michael
        </a>
        <button
          className={`navbar-toggle ${menuOpen ? 'active' : ''}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
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
              href="/docs/Curriculum_Vitae_10_2025.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="navbar-cv-btn"
              onClick={handleClick}
            >
              Scarica CV
            </a>
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
