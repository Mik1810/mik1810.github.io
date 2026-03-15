import { useContent } from '../../context/useContent'
import { useLanguage } from '../../context/useLanguage'
import { useProfile } from '../../context/useProfile'
import '../css/About.css'

function About() {
  const { t } = useLanguage()
  const { about } = useContent()
  const { profile } = useProfile()
  const interests = about?.interests || []
  const bio = String(profile?.bio || '').trim()
  const showBioSkeleton = bio.length === 0
  const showInterestsSkeleton = interests.length === 0

  return (
    <section id="about" className="about">
      <div className="section-container">
        <h2 className="section-title reveal">{t('about.title')}</h2>
        <p className="section-subtitle reveal reveal-delay-1">
          {t('about.subtitle')}
        </p>
        <div className="about-content reveal reveal-delay-2">
          <div className="about-bio">
            {showBioSkeleton ? (
              <div className="about-skeleton-copy" aria-hidden="true">
                <span
                  className="ui-skeleton ui-skeleton-line"
                  style={{ width: '100%', height: '16px' }}
                />
                <span
                  className="ui-skeleton ui-skeleton-line"
                  style={{ width: '96%', height: '16px' }}
                />
                <span
                  className="ui-skeleton ui-skeleton-line"
                  style={{ width: '88%', height: '16px' }}
                />
                <span
                  className="ui-skeleton ui-skeleton-line"
                  style={{ width: '72%', height: '16px' }}
                />
              </div>
            ) : (
              <p>{bio}</p>
            )}
            <div className="about-interests">
              {showInterestsSkeleton
                ? Array.from({ length: 6 }, (_, index) => (
                    <span
                      key={`about-skeleton-${index}`}
                      className="ui-skeleton ui-skeleton-chip"
                      aria-hidden="true"
                    />
                  ))
                : interests.map((interest) => (
                    <span key={interest} className="about-interest-tag">
                      {interest}
                    </span>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
