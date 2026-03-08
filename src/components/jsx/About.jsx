import { useEffect, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import '../css/About.css';

function About() {
  const { t, lang } = useLanguage();
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    const controller = new AbortController();

    const loadAbout = async () => {
      try {
        const response = await fetch(`/api/about?lang=${lang}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (response.ok) setInterests(data?.interests || []);
      } catch (error) {
        if (error.name !== 'AbortError') setInterests([]);
      }
    };

    loadAbout();
    return () => controller.abort();
  }, [lang]);

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
