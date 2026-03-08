import { useLanguage } from '../../context/LanguageContext';
import { useContent } from '../../context/ContentContext';
import '../css/About.css';

function About() {
  const { t } = useLanguage();
  const { about } = useContent();
  const interests = about?.interests || [];

  return (
    <section id="about" className="about">
      <div className="section-container">
        <h2 className="section-title reveal">{t('about.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">{t('about.subtitle')}</p>
        <div className="about-content reveal reveal-delay-2">
          <div className="about-bio">
            <p>{t('about.bio')}</p>
            <div className="about-interests">
              {interests.map((interest) => (
                <span key={interest} className="about-interest-tag">{interest}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default About;
