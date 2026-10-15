import { useTranslation } from 'react-i18next'
import PageWrapper from '../components/layout/PageWrapper'

function BulletList({ items, accent = 'teal' }: { items: string[]; accent?: 'teal' | 'plum' }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3">
          <span
            aria-hidden
            className={`mt-2 h-2 w-2 shrink-0 rounded-full ${accent === 'teal' ? 'bg-[#79ADB6]' : 'bg-[#6F5B75]'}`}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export default function AboutPage() {
  const { t } = useTranslation()
  const list = (key: string) => t(`aboutPage.${key}`, { returnObjects: true }) as string[]
  return (
    <PageWrapper maxWidth={1120} className="min-w-0 overflow-x-hidden font-body">
      <section className="relative w-full min-w-0 overflow-hidden rounded-[2.25rem] border border-[#CFDFE2] bg-[linear-gradient(135deg,#EEF5F5_0%,#DDEBED_52%,#E9E5EA_100%)] px-6 py-9 text-hai-plum shadow-[0_28px_70px_-38px_rgba(54,33,62,0.24)] md:px-10 md:py-12">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-28 -top-32 h-96 w-96 rounded-full opacity-35"
          style={{ background: 'radial-gradient(circle, #B8DDE3 0%, transparent 68%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-36 -left-28 h-80 w-80 rounded-full opacity-35"
          style={{ background: 'radial-gradient(circle, #D7CFE0 0%, transparent 70%)' }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(82,113,122,0.28) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
          }}
        />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#8AA7AE]/40 bg-white/55 px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-[0.16em] text-[#52717A] backdrop-blur-sm">
            <span className="material-symbols-outlined text-sm" aria-hidden>info</span>
            {t('aboutPage.badge')}
          </div>

          <h1 className="max-w-4xl break-words font-headline text-[2rem] font-bold leading-[1.04] tracking-normal sm:text-4xl md:text-6xl">
            {t('landing.hero.titleLine1')}
            <br />
            <span className="text-[#52717A]">{t('landing.hero.titleLine2')}</span>
          </h1>

          <p className="mt-6 max-w-3xl break-words text-lg font-bold leading-snug text-hai-plum/80 sm:text-xl md:text-2xl">
            {t('aboutPage.challenge')}
          </p>

          <div className="group relative isolate mt-8 min-w-0 max-w-full overflow-hidden rounded-[2rem] border border-white/75 bg-[linear-gradient(135deg,#F9FBFB_0%,#DCEDEF_48%,#ECE7EE_100%)] p-4 shadow-[0_24px_60px_-36px_rgba(54,33,62,0.35)] md:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-45"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(82,113,122,0.2) 1px, transparent 1px)',
                backgroundSize: '18px 18px',
              }}
            />
            <div aria-hidden className="pointer-events-none absolute inset-4 rotate-[0.6deg] rounded-[1.6rem] border border-white/65 md:inset-6" />
            <img
              src="/images/about-cocreation-workflow.png"
              alt={t('aboutPage.imageAlt')}
              className="relative z-10 mx-auto block h-auto w-full max-w-[900px] object-contain mix-blend-multiply drop-shadow-[0_18px_26px_rgba(54,33,62,0.08)] transition-transform duration-500 ease-out group-hover:-rotate-[0.2deg] group-hover:scale-[1.012]"
              style={{
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
                maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)',
              }}
            />
          </div>
        </div>
      </section>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <section className="rounded-[1.75rem] border border-[#DCE8EA] bg-[#EFF5F6] p-6 md:p-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#DCE8EA] bg-[#F9FBFB] text-[#536F76]">
            <span className="material-symbols-outlined" aria-hidden>hub</span>
          </div>
          <h2 className="font-headline text-2xl font-bold leading-tight text-hai-plum">
            {t('aboutPage.whyTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-700">
            {t('aboutPage.whyBody')}
          </p>
        </section>

        <section className="rounded-[1.75rem] border border-line bg-[#FAFBFB] p-6 shadow-[0_22px_56px_-38px_rgba(54,33,62,0.2)] md:p-8">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl border border-[#DCE8EA] bg-[#E8F0F1] text-[#536F76]">
            <span className="material-symbols-outlined" aria-hidden>handshake</span>
          </div>
          <h2 className="font-headline text-2xl font-bold leading-tight text-hai-plum">
            {t('aboutPage.gapTitle')}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-neutral-700">
            {t('aboutPage.gapBody')}
          </p>
        </section>
      </div>

      <section className="mt-5 rounded-[1.75rem] border border-line bg-[#FCFCFC] p-6 shadow-[0_22px_56px_-38px_rgba(54,33,62,0.2)] md:p-9">
        <div className="mb-6 flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4A374F] font-mono text-xs font-bold text-[#D5E8EB]">
            01
          </span>
          <h2 className="font-headline text-3xl font-bold leading-tight text-hai-plum">
            {t('aboutPage.purposeTitle')}
          </h2>
        </div>

        <div className="space-y-5 text-base leading-relaxed text-neutral-700">
          <p>
            {t('aboutPage.purposeBody')}
          </p>

          <p className="font-bold text-hai-plum">
            {t('aboutPage.purposeLead')}
          </p>

          <div className="rounded-2xl border border-[#E5E9EA] bg-[#F3F6F6] p-5 md:p-6">
            <BulletList items={list('capabilities')} />
          </div>

          <p>
            {t('aboutPage.objective')}
          </p>
        </div>
      </section>

      <section className="mt-5 rounded-[1.75rem] border border-[#E2E6E7] bg-[#F4F5F5] p-6 md:p-9">
        <div className="mb-6 flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#D7E8EB] font-mono text-xs font-bold text-[#425E66]">
            02
          </span>
          <h2 className="font-headline text-3xl font-bold leading-tight text-hai-plum">
            {t('aboutPage.philosophyTitle')}
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#E1E4E6] bg-[#FBFBFB] p-5 md:p-6">
            <h3 className="mb-4 font-headline text-xl font-bold text-hai-plum">{t('aboutPage.notTitle')}</h3>
            <BulletList items={list('notItems')} accent="plum" />
          </div>
          <div className="rounded-2xl border border-[#D2E1E4] bg-[#EAF1F2] p-5 text-neutral-700 md:p-6">
            <h3 className="mb-4 font-headline text-xl font-bold text-hai-plum">{t('aboutPage.isTitle')}</h3>
            <BulletList items={list('isItems')} />
          </div>
        </div>

        <div className="mt-6 space-y-4 text-base leading-relaxed text-neutral-700">
          <p>
            {t('aboutPage.avoids')}
          </p>
          <p>
            {t('aboutPage.ux')}
          </p>
          <div className="rounded-2xl border border-[#D2E3E6] bg-[#EDF4F5] p-5 md:p-6">
            <p className="mb-3 font-bold text-hai-plum">{t('aboutPage.usersMustTitle')}</p>
            <BulletList items={list('usersMust')} />
          </div>
        </div>
      </section>
    </PageWrapper>
  )
}
