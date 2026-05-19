import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ROUTES } from '../../constants/routes'
import PageWrapper from '../../components/layout/PageWrapper'

export default function NotFoundPage() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <PageWrapper maxWidth={820}>
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-8 md:p-14 relative overflow-hidden font-body">
        <div className="absolute -top-10 -right-10 w-96 h-96 pointer-events-none opacity-60" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 pointer-events-none opacity-50" style={{ background: 'radial-gradient(circle, #D2FF74 0%, transparent 70%)' }} />

        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-6 text-xs font-mono tracking-[0.16em] uppercase text-hai-plum font-bold">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>explore_off</span>
            <span className="text-hai-plum/70">Err</span>
            <span>{t('errors.notFound.code')}</span>
          </div>

          <div className="relative mb-4 leading-none">
            <div className="font-headline font-bold tracking-normal text-hai-plum select-none" style={{ fontSize: 'clamp(120px, 22vw, 220px)', lineHeight: 0.85 }} aria-hidden>
              4<span className="text-hai-teal">0</span>4
            </div>
          </div>

          <h1 className="font-headline font-bold text-3xl md:text-5xl leading-tight tracking-normal text-hai-plum mb-3">
            {t('errors.notFound.title')}<span className="text-hai-teal">.</span>
          </h1>
          <p className="text-base text-neutral-600 leading-relaxed mb-2 max-w-xl">{t('errors.notFound.desc')}</p>
          {location.pathname && (
            <div className="mb-8 inline-flex items-center gap-1.5 bg-hai-offwhite rounded-full px-3 py-1.5 font-mono text-xs text-hai-plum">
              <span className="material-symbols-outlined text-sm">link</span>
              <span className="truncate max-w-[320px]">{location.pathname}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2.5 mb-8">
            <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 bg-white border border-neutral-200 hover:border-hai-plum text-hai-plum rounded-full px-5 py-3 text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              {t('errors.notFound.goBack')}
            </button>
            <Link to={ROUTES.HOME} className="inline-flex items-center gap-2 bg-hai-plum text-white hover:bg-black rounded-full px-5 py-3 text-sm font-bold transition-colors shadow-[0_10px_30px_-10px_rgba(54,33,62,0.4)]">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: '"FILL" 1' }}>home</span>
              {t('errors.notFound.backHome')}
            </Link>
            <Link to={ROUTES.POSTS} className="inline-flex items-center gap-2 bg-hai-mint text-hai-plum hover:bg-hai-teal/70 rounded-full px-5 py-3 text-sm font-bold transition-colors">
              <span className="material-symbols-outlined text-lg">grid_view</span>
              {t('errors.notFound.browsePosts')}
            </Link>
          </div>

          <div className="border-t border-neutral-100 pt-6">
            <div className="text-xs font-mono tracking-[0.16em] uppercase text-neutral-500 font-bold mb-3">{t('errors.notFound.quickLinks')}</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {[
                { to: ROUTES.DASHBOARD, icon: 'dashboard',     label: t('errors.notFound.dashboard') },
                { to: ROUTES.MEETINGS,  icon: 'calendar_month', label: t('errors.notFound.meetings') },
                { to: ROUTES.PROFILE,   icon: 'account_circle', label: t('errors.notFound.profile') },
              ].map(l => (
                <Link key={l.to} to={l.to} className="flex items-center gap-3 bg-hai-offwhite hover:bg-hai-mint/40 rounded-2xl px-4 py-3 text-sm text-hai-plum font-bold transition-colors">
                  <span className="material-symbols-outlined text-lg text-hai-teal" style={{ fontVariationSettings: '"FILL" 1' }}>{l.icon}</span>
                  {l.label}
                  <span className="material-symbols-outlined ml-auto text-base text-hai-plum/50">arrow_forward</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
