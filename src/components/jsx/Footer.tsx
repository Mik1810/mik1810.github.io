import icons from '../../data/icons'
import heroFallback from '../../data/heroFallback.json'
import { useLanguage } from '../../context/useLanguage'
import type { FooterProps } from '../../types/app.js'
import '../css/Footer.css'

interface FooterFallbackData {
  name: string
  socials: Array<{
    name: string
    url: string
    icon: string
  }>
}

const FOOTER_FALLBACK = heroFallback as FooterFallbackData

function Footer({ className = '' }: FooterProps) {
  const year = new Date().getFullYear()
  const { t } = useLanguage()
  const name = FOOTER_FALLBACK.name
  const socials = FOOTER_FALLBACK.socials

  return (
    <footer className={`footer ${className}`.trim()}>
      <div className="footer-container">
        <p>
          &copy; {year} {name}. {t('footer.rights')}
        </p>
        <div className="footer-socials">
          {socials.map((social) => (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={social.name}
              className="footer-social-link"
            >
              {icons[social.icon]?.(24)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}

export default Footer
