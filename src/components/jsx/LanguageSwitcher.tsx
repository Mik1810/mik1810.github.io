import { useLanguage } from '../../context/useLanguage'
import '../css/LanguageSwitcher.css'

function LanguageSwitcher() {
  const { lang, toggleLang } = useLanguage()

  return (
    <button
      className="lang-switcher navbar-icon-btn"
      onClick={toggleLang}
      aria-label="Switch language"
    >
      <span className={`lang-option ${lang === 'it' ? 'lang-active' : ''}`}>
        <svg className="lang-flag" viewBox="0 0 640 480" aria-hidden="true">
          <rect width="213.3" height="480" fill="#009246" />
          <rect x="213.3" width="213.4" height="480" fill="#fff" />
          <rect x="426.7" width="213.3" height="480" fill="#ce2b37" />
        </svg>
        <span className="lang-label">IT</span>
      </span>
      <span className={`lang-option ${lang === 'en' ? 'lang-active' : ''}`}>
        <svg className="lang-flag" viewBox="0 0 640 480" aria-hidden="true">
          <rect width="640" height="480" fill="#012169" />
          <path d="M75 0l244 181L562 0h78v62L400 241l240 178v61h-80L320 302 81 480H0v-60l239-178L0 64V0h75z" fill="#fff" />
          <path d="M424 281l216 159v40L369 281h55zm-184 20l6 35L54 480H0l240-179zM640 0v3L391 191l2-44L590 0h50zM0 0l239 176h-60L0 42V0z" fill="#C8102E" />
          <path d="M241 0v480h160V0H241zM0 160v160h640V160H0z" fill="#fff" />
          <path d="M0 193v96h640v-96H0zM273 0v480h96V0h-96z" fill="#C8102E" />
        </svg>
        <span className="lang-label">EN</span>
      </span>
    </button>
  )
}

export default LanguageSwitcher
