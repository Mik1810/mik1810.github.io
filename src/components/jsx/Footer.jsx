import { useLanguage } from '../../context/LanguageContext';
import { useProfile } from '../../context/ProfileContext';
import icons from '../../data/icons';
import '../css/Footer.css';

function Footer() {
  const year = new Date().getFullYear();
  const { t } = useLanguage();
  const { profile } = useProfile();
  const name = profile?.name || '';
  const socials = profile?.socials || [];

  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {year} {name}. {t('footer.rights')}</p>
        <div className="footer-socials">
          {socials.map((s) => (
            <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.name} className="footer-social-link">
              {icons[s.icon]?.(24)}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default Footer;
