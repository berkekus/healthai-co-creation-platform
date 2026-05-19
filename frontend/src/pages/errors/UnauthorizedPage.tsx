import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'
import { useAuthStore } from '../../store/authStore'

export default function UnauthorizedPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user } = useAuthStore()

  return (
    <PageWrapper maxWidth={820}>
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-8 md:p-14 relative overflow-hidden font-body">
        <div className="absolute -top-10 -right-10 w-96 h-96 pointer-events-none opacity-60" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-40" style={{ background: 'radial-gradient(circle, #E3DCD2 0%, transparent 70%)' }} />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-red-50 border border-red-200 rounded-full px-4 py-1.5 mb-6 text-xs font-mono tracking-[0.16em] uppercase text-red-600 font-bold">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
            <span className="text-red-600/70">Err</span>
            <span>{t('errors.unauthorized.code')}</span>
          </div>

          <div className="relative mb-4 leading-none">
            <div className="font-headline font-bold tracking-normal text-hai-plum select-none" style={{ fontSize: 'clamp(120px, 22vw, 220px)', lineHeight: 0.85 }} aria-hidden>
              4<span className="text-red-500">0</span>3
            </div>
          </div>

          <h1 className="font-headline font-bold text-3xl md:text-5xl leading-tight tracking-normal text-hai-plum mb-3">
            {t('errors.unauthorized.title')}<span className="text-red-500">.</span>
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed mb-2 max-w-xl">{t('errors.unauthorized.desc')}</p>

          <div className="mb-8 flex flex-wrap gap-2">
            {location.pathname && (
              <span className="inline-flex items-center gap-1.5 bg-hai-offwhite rounded-full px-3 py-1.5 font-mono text-xs text-hai-plum">
                <span className="material-symbols-outlined text-sm">link</span>
                <span className="truncate max-w-[320px]">{location.pathname}</span>
              </span>
            )}
            {isAuthenticated && user && (
              <span className="inline-flex items-center gap-1.5 bg-hai-mint rounded-full px-3 py-1.5 font-mono text-xs text-hai-plum font-bold">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>badge</span>
                {t('errors.unauthorized.signedInAs', { role: user.role.replace('_', ' ') })}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2.5 mb-8">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 bg-white border border-neutral-200 hover:border-hai-plum text-hai-plum rounded-full px-5 py-3 text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t('errors.unauthorized.goBack')}
            </button>
            {isAuthenticated ? (
              <Link to={ROUTES.DASHBOARD} className="inline-flex items-center gap-2 bg-hai-plum text-white hover:bg-black rounded-full px-5 py-3 text-sm font-bold transition-colors shadow-[0_10px_30px_-10px_rgba(54,33,62,0.4)]">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>dashboard</span>
                {t('errors.unauthorized.backToDashboard')}
              </Link>
            ) : (
              <Link to={ROUTES.LOGIN} className="inline-flex items-center gap-2 bg-hai-plum text-white hover:bg-black rounded-full px-5 py-3 text-sm font-bold transition-colors shadow-[0_10px_30px_-10px_rgba(54,33,62,0.4)]">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>login</span>
                {t('errors.unauthorized.signIn')}
              </Link>
            )}
            <a href="mailto:admin@healthai.edu" className="inline-flex items-center gap-2 bg-hai-cream text-hai-plum hover:bg-hai-cream/70 rounded-full px-5 py-3 text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-lg">support_agent</span>
              {t('errors.unauthorized.contactAdmin')}
            </a>
          </div>

          <div className="border-t border-neutral-100 pt-5 flex items-start gap-3 text-xs text-neutral-500 leading-relaxed">
            <span className="material-symbols-outlined text-base text-hai-teal shrink-0 mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>info</span>
            <p>{t('errors.unauthorized.reasons')}</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
