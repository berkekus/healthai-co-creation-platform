import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import { useAuthStore } from '../../store/authStore'
import FundingNotice from './FundingNotice'

export default function LandingFooter() {
  const { t } = useTranslation()
  const user = useAuthStore(state => state.user)

  return (
    <footer className="w-full bg-hai-plum pt-16 font-body text-hai-mint relative flex flex-col">
      <div className="px-6 md:px-16 lg:px-24 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 relative z-10">
        <div>
          <h4 className="font-bold mb-4 text-lg font-headline">{t('footer.contact')}</h4>
          <p className="font-semibold text-base leading-snug text-hai-mint/90">
            {t('footer.contactIntro')}
          </p>
          <p className="font-semibold text-base leading-snug text-hai-mint/90 mt-3">
            {t('footer.contactSub')}
          </p>
          <a
            href="https://healthai.cankaya.edu.tr/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-semibold text-sm text-hai-mint/90 hover:text-white transition-colors underline"
          >
            healthai.cankaya.edu.tr/contact
          </a>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-lg font-headline">{t('landing.nav.platform')}</h4>
          <ul className="space-y-2 text-sm font-semibold">
            <li><a href="#platform" className="hover:text-white transition-colors">{t('landing.nav.platform')}</a></li>
            <li><a href="#directory" className="hover:text-white transition-colors">{t('landing.nav.directory')}</a></li>
            <li><a href="#how" className="hover:text-white transition-colors">{t('landing.nav.how')}</a></li>
            <li><a href="#trust" className="hover:text-white transition-colors">{t('footer.trustGdpr')}</a></li>
            <li><Link to={ROUTES.ABOUT} className="hover:text-white transition-colors">{t('nav.about')}</Link></li>
            <li><Link to={ROUTES.LOGIN} className="hover:text-white transition-colors">{t('landing.actions.signIn')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-lg font-headline">{t('footer.legal')}</h4>
          <ul className="space-y-2 text-sm font-semibold">
            <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">{t('footer.privacyPolicy')}</Link></li>
            <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">{t('footer.gdprYourRights')}</Link></li>
            <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">{t('footer.dataExport')}</Link></li>
            <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">{t('footer.terms')}</Link></li>
            <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">{t('footer.accountDeletion')}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-bold mb-4 text-lg font-headline">{t('footer.access')}</h4>
          <ul className="space-y-2 text-sm font-semibold">
            <li><Link to={user ? ROUTES.POSTS : ROUTES.REGISTER} state={{ role: 'healthcare_professional' }} className="hover:text-white transition-colors">{t('footer.forClinicians')}</Link></li>
            <li><Link to={user ? ROUTES.POSTS : ROUTES.REGISTER} state={{ role: 'engineer' }} className="hover:text-white transition-colors">{t('footer.forEngineers')}</Link></li>
            <li><Link to={user ? ROUTES.POSTS : ROUTES.REGISTER} className="hover:text-white transition-colors">{t(user ? 'landing.nav.findProjects' : 'landing.actions.requestAccess')}</Link></li>
            <li><a href="mailto:team@healthai.edu" className="hover:text-white transition-colors">{t('footer.contactTeam')}</a></li>
          </ul>
        </div>
      </div>

      {/*
        Giant wordmark — sized so the entire word is visible within the
        viewport without clipping. clamp() scales between min/max caps,
        and we keep it centered with no negative margin.
      */}
      <div className="w-full px-6 mt-12 flex items-center justify-center">
        <span
          className="font-headline font-bold text-white tracking-normal leading-none w-full text-center block whitespace-nowrap"
          style={{ fontSize: 'clamp(56px, 16vw, 240px)' }}
        >
          healthai
        </span>
      </div>

      {/* Erasmus+ funding acknowledgement */}
      <div className="px-6 md:px-16 lg:px-24 pt-8 mt-6 relative z-10 w-full border-t border-hai-teal/20">
        <FundingNotice tone="plum" />
      </div>

      {/* Bottom strip */}
      <div className="px-6 md:px-16 lg:px-24 py-8 mt-2 flex justify-between items-end relative z-10 w-full text-hai-teal gap-8 flex-wrap">
        <div className="text-xs font-semibold text-hai-teal font-mono tracking-[0.12em]">
          2026<br />{t('footer.copyright')}<br />HealthAI
        </div>
        <div className="flex items-end justify-between flex-grow ml-4 md:ml-12 gap-6 flex-wrap">
          <div className="text-xs font-semibold text-hai-teal/80 leading-snug font-mono tracking-[0.12em] max-w-sm">
            <p>{t('footer.institutionalOnly')}</p>
            <p>{t('footer.noUploads')}</p>
          </div>
          <div className="text-xs font-semibold text-hai-teal/80 shrink-0 ml-4 font-mono tracking-[0.12em]">
            {t('footer.builtByTeam')}
          </div>
        </div>
      </div>
    </footer>
  )
}
