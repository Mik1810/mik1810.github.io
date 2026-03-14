import icons from '../../data/icons'
import { useLanguage } from '../../context/useLanguage'
import { useProfile } from '../../context/useProfile'
import type { FooterProps } from '../../types/app.js'
import '../css/Footer.css'

function Footer({ className = '' }: FooterProps) {
  const year = new Date().getFullYear()
  const { t } = useLanguage()
  const { profile } = useProfile()
  const name = profile?.name || ''
  const socials = profile?.socials || []

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
