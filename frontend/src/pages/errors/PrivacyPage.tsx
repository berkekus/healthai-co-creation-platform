import { Trans, useTranslation } from 'react-i18next'
import PageWrapper from '../../components/layout/PageWrapper'

const CONTACT_EMAIL = 'admin@healthcocreate.com'

type SectionTone = 'mint' | 'lime' | 'cream' | 'plum'

const TONE_STYLES: Record<SectionTone, { disc: string; icon: string }> = {
  mint:  { disc: 'bg-hai-mint text-hai-plum',     icon: 'bg-hai-mint/60' },
  lime:  { disc: 'bg-hai-lime text-hai-plum',     icon: 'bg-hai-lime/70' },
  cream: { disc: 'bg-hai-cream text-hai-plum',    icon: 'bg-hai-cream/70' },
  plum:  { disc: 'bg-hai-plum text-hai-mint',     icon: 'bg-hai-plum/15' },
}

function SectionCard({
  index, title, icon, tone, children,
}: {
  index: string
  title: string
  icon: string
  tone: SectionTone
  children: React.ReactNode
}) {
  const s = TONE_STYLES[tone]
  return (
    <section className="bg-white rounded-[1.5rem] border border-neutral-100 p-6 md:p-7 font-body">
      <div className="flex items-start gap-3 mb-4">
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-xs tracking-[0.12em] ${s.disc}`}>
          {index}
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h2 className="font-headline font-bold text-xl leading-tight tracking-normal text-hai-plum">
            {title}
          </h2>
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${s.icon}`}>
            <span className="material-symbols-outlined text-hai-plum text-base" style={{ fontVariationSettings: '"FILL" 1' }}>
              {icon}
            </span>
          </span>
        </div>
      </div>
      <div className="text-sm text-neutral-600 leading-relaxed space-y-3">
        {children}
      </div>
    </section>
  )
}

function BulletRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-2 w-1.5 h-1.5 rounded-full bg-hai-teal shrink-0" />
      <div>
        <strong className="text-hai-plum font-body font-bold">{label}</strong>{' '}
        <span>{children}</span>
      </div>
    </div>
  )
}

/** Markup the translations may use: <b>, <mono>, <pill> and <mail>. */
const RICH = {
  b: <strong className="text-hai-plum font-body font-bold" />,
  mono: <span className="font-mono bg-hai-offwhite text-hai-plum px-1 rounded font-bold" />,
  pill: <span className="inline-flex items-center gap-1 bg-hai-offwhite text-hai-plum rounded-full px-2.5 py-0.5 font-mono text-xs font-bold" />,
  mail: <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2 text-hai-mint hover:text-white transition-colors" />,
}

function Rich({ k }: { k: string }) {
  return <Trans i18nKey={`privacyPage.${k}`} values={{ email: CONTACT_EMAIL }} components={RICH} />
}

export default function PrivacyPage() {
  const { t, i18n } = useTranslation()
  const p = (key: string) => t(`privacyPage.${key}`)
  return (
    <PageWrapper maxWidth={820}>
      {/* Header card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-60" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-xs font-mono tracking-[0.16em] uppercase text-hai-plum font-bold">
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>shield_lock</span>
            <span className="text-hai-plum/70">19</span>
            <span>{p('badge')}</span>
          </div>

          <h1 className="font-headline font-bold text-4xl md:text-6xl leading-tight tracking-normal text-hai-plum mb-4">
            {p('titleLine1')}<br />{p('titleLine2')}<span className="text-hai-teal">.</span>
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-hai-mint text-hai-plum rounded-full px-3 py-1 text-xs font-mono tracking-[0.12em] uppercase font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
              {p('gdprBadge')}
            </span>
            <span className="inline-flex items-center gap-1.5 bg-hai-offwhite text-hai-plum rounded-full px-3 py-1 text-xs font-mono tracking-[0.12em] uppercase font-bold">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>event</span>
              {p('lastUpdated')}
            </span>
          </div>

          {/* The policy was written in English; translations are a courtesy, not the legal text. */}
          {!i18n.resolvedLanguage?.startsWith('en') && (
            <p role="note" className="mt-5 rounded-2xl border border-hai-plum/10 bg-hai-cream/50 px-4 py-3 text-sm font-semibold text-hai-plum">
              {p('bindingNote')}
            </p>
          )}
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        <SectionCard index="01" title={p('who.title')} icon="corporate_fare" tone="mint">
          <p>{p('who.body')}</p>
          <p className="text-sm text-neutral-500">
            {p('who.contact')}{' '}
            <span className="inline-flex items-center gap-1 bg-hai-offwhite rounded-full px-2.5 py-0.5 font-mono text-xs text-hai-plum font-bold">
              <span className="material-symbols-outlined text-sm">mail</span>
              {CONTACT_EMAIL}
            </span>
          </p>
        </SectionCard>

        <SectionCard index="02" title={p('collect.title')} icon="database" tone="lime">
          <div className="flex flex-col gap-2.5">
            <BulletRow label={p('collect.accountLabel')}><Rich k="collect.account" /></BulletRow>
            <BulletRow label={p('collect.activityLabel')}>{p('collect.activity')}</BulletRow>
            <BulletRow label={p('collect.securityLabel')}>{p('collect.security')}</BulletRow>
            <BulletRow label={p('collect.sessionLabel')}>{p('collect.session')}</BulletRow>
          </div>
          <div className="mt-4 bg-hai-cream/50 border border-hai-plum/10 rounded-2xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-hai-plum text-lg shrink-0 mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>block</span>
            <p className="text-sm text-hai-plum leading-relaxed"><Rich k="collect.notCollected" /></p>
          </div>
        </SectionCard>

        <SectionCard index="03" title={p('legal.title')} icon="gavel" tone="cream">
          <div className="flex flex-col gap-2.5">
            <BulletRow label={p('legal.contractLabel')}>{p('legal.contract')}</BulletRow>
            <BulletRow label={p('legal.interestLabel')}>{p('legal.interest')}</BulletRow>
            <BulletRow label={p('legal.consentLabel')}>{p('legal.consent')}</BulletRow>
          </div>
        </SectionCard>

        <SectionCard index="04" title={p('retention.title')} icon="schedule" tone="mint">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-hai-offwhite rounded-2xl p-4">
              <div className="text-xs font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold mb-1">{p('retention.accountPosts')}</div>
              <div className="font-headline font-bold text-lg text-hai-plum leading-tight">{p('retention.whileActive')}</div>
            </div>
            <div className="bg-hai-lime/60 rounded-2xl p-4">
              <div className="text-xs font-mono tracking-[0.12em] uppercase text-hai-plum font-bold mb-1">{p('retention.securityLogs')}</div>
              <div className="font-headline font-bold text-lg text-hai-plum leading-tight">{p('retention.months24')}</div>
            </div>
            <div className="bg-hai-mint rounded-2xl p-4">
              <div className="text-xs font-mono tracking-[0.12em] uppercase text-hai-plum font-bold mb-1">{p('retention.session')}</div>
              <div className="font-headline font-bold text-lg text-hai-plum leading-tight">{p('retention.inMemory')}</div>
            </div>
          </div>
          <p className="text-sm text-neutral-500 mt-3 flex items-start gap-1.5">
            <span className="material-symbols-outlined text-sm mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
            {p('retention.tamper')}
          </p>
        </SectionCard>

        <SectionCard index="05" title={p('rights.title')} icon="account_circle" tone="lime">
          <div className="flex flex-col gap-2.5">
            <BulletRow label={p('rights.accessLabel')}>{p('rights.access')}</BulletRow>
            <BulletRow label={p('rights.portabilityLabel')}>{p('rights.portability')}</BulletRow>
            <BulletRow label={p('rights.erasureLabel')}>{p('rights.erasure')}</BulletRow>
            <BulletRow label={p('rights.rectificationLabel')}>{p('rights.rectification')}</BulletRow>
            <BulletRow label={p('rights.objectionLabel')}><Rich k="rights.objection" /></BulletRow>
          </div>
        </SectionCard>

        <SectionCard index="06" title={p('cookies.title')} icon="cookie" tone="cream">
          <p><Rich k="cookies.essential" /></p>
          <p><Rich k="cookies.choose" /></p>
        </SectionCard>

        <SectionCard index="07" title={p('transfers.title')} icon="public" tone="mint">
          <p>{p('transfers.processing')}</p>
          <p><Rich k="transfers.hosting" /></p>
        </SectionCard>
      </div>

      {/* Contact footer */}
      <div className="mt-8 bg-hai-plum text-hai-offwhite rounded-[1.75rem] p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-48 h-48 pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-hai-mint/15 text-hai-mint flex items-center justify-center">
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>contact_support</span>
          </div>
          <div className="min-w-0">
            <div className="text-xs font-mono tracking-[0.16em] uppercase text-hai-mint/80 font-bold mb-1.5">
              {p('contact.kicker')}
            </div>
            <div className="font-headline font-bold text-xl leading-tight tracking-normal mb-2">
              {p('contact.title')}
            </div>
            <p className="text-sm leading-relaxed text-hai-offwhite/85"><Rich k="contact.body" /></p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
