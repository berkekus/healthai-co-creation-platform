import PageWrapper from '../../components/layout/PageWrapper'

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
        <div className={`shrink-0 w-9 h-9 rounded-full flex items-center justify-center font-mono font-bold text-[11px] tracking-[0.08em] ${s.disc}`}>
          {index}
        </div>
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <h2 className="font-headline font-bold text-[20px] leading-tight tracking-[-0.015em] text-hai-plum">
            {title}
          </h2>
          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${s.icon}`}>
            <span className="material-symbols-outlined text-hai-plum text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>
              {icon}
            </span>
          </span>
        </div>
      </div>
      <div className="text-[14.5px] text-neutral-600 leading-relaxed space-y-3">
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

export default function PrivacyPage() {
  return (
    <PageWrapper maxWidth={820}>
      {/* Header card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-60" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
            <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>shield_lock</span>
            <span className="text-hai-plum/70">19</span>
            <span>Privacy policy</span>
          </div>

          <h1 className="font-headline font-bold text-[40px] md:text-[56px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-4">
            Privacy<br />policy<span className="text-hai-teal">.</span>
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 bg-hai-mint text-hai-plum rounded-full px-3 py-1 text-[10.5px] font-mono tracking-[0.14em] uppercase font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
              GDPR compliant
            </span>
            <span className="inline-flex items-center gap-1.5 bg-hai-offwhite text-hai-plum rounded-full px-3 py-1 text-[10.5px] font-mono tracking-[0.14em] uppercase font-bold">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>event</span>
              Last updated · 19 Apr 2026
            </span>
            <span className="inline-flex items-center gap-1.5 bg-hai-lime text-hai-plum rounded-full px-3 py-1 text-[10.5px] font-mono tracking-[0.14em] uppercase font-bold">
              <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>location_on</span>
              EEA
            </span>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        <SectionCard index="01" title="Who we are" icon="corporate_fare" tone="mint">
          <p>
            HEALTH AI Co-Creation Platform is operated as an academic project under{' '}
            <strong className="text-hai-plum font-body font-bold">SENG 384, Spring 2026</strong>.
            We connect engineers and healthcare professionals across Europe for structured research collaboration.
          </p>
          <p className="text-[13px] text-neutral-500">
            Contact:{' '}
            <span className="inline-flex items-center gap-1 bg-hai-offwhite rounded-full px-2.5 py-0.5 font-mono text-[12px] text-hai-plum font-bold">
              <span className="material-symbols-outlined text-[13px]">mail</span>
              admin@healthai.edu
            </span>
          </p>
        </SectionCard>

        <SectionCard index="02" title="Data we collect" icon="database" tone="lime">
          <div className="flex flex-col gap-2.5">
            <BulletRow label="Account data:">
              Full name, institutional email (<span className="font-mono bg-hai-mint/60 text-hai-plum px-1 rounded font-bold">.edu</span> only), role, institution, city, country, bio, expertise tags.
            </BulletRow>
            <BulletRow label="Activity data:">
              Posts created / edited, meeting requests sent / received, login events.
            </BulletRow>
            <BulletRow label="Security logs:">
              IP address (login events), failed login attempts, rate-limit hits. Retained for 24 months.
            </BulletRow>
            <BulletRow label="Session data:">
              Session token stored in memory only; expires after 30 minutes of inactivity.
            </BulletRow>
          </div>
          <div className="mt-4 bg-hai-cream/50 border border-hai-plum/10 rounded-2xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-hai-plum text-[18px] shrink-0 mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>block</span>
            <p className="text-[13.5px] text-hai-plum leading-relaxed">
              We do <strong className="font-body font-bold">not</strong> collect patient data, clinical records, proprietary IP, or personal emails. File uploads are prohibited on this platform.
            </p>
          </div>
        </SectionCard>

        <SectionCard index="03" title="Legal basis (GDPR Art. 6)" icon="gavel" tone="cream">
          <div className="flex flex-col gap-2.5">
            <BulletRow label="Contract performance —">
              account and collaboration data processed to provide the service.
            </BulletRow>
            <BulletRow label="Legitimate interest —">
              security logs and rate limiting to protect platform integrity.
            </BulletRow>
            <BulletRow label="Consent —">
              non-essential cookies (accepted via banner).
            </BulletRow>
          </div>
        </SectionCard>

        <SectionCard index="04" title="Data retention" icon="schedule" tone="mint">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-hai-offwhite rounded-2xl p-4">
              <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold mb-1">Account & posts</div>
              <div className="font-headline font-bold text-[18px] text-hai-plum leading-tight">While active</div>
            </div>
            <div className="bg-hai-lime/60 rounded-2xl p-4">
              <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-hai-plum font-bold mb-1">Security logs</div>
              <div className="font-headline font-bold text-[18px] text-hai-plum leading-tight">24 months</div>
            </div>
            <div className="bg-hai-mint rounded-2xl p-4">
              <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-hai-plum font-bold mb-1">Session</div>
              <div className="font-headline font-bold text-[18px] text-hai-plum leading-tight">In-memory</div>
            </div>
          </div>
          <p className="text-[13px] text-neutral-500 mt-3 flex items-start gap-1.5">
            <span className="material-symbols-outlined text-[14px] mt-0.5" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
            Security logs are tamper-resistant — no manual deletion permitted.
          </p>
        </SectionCard>

        <SectionCard index="05" title="Your rights (GDPR Art. 15–22)" icon="account_circle" tone="lime">
          <div className="flex flex-col gap-2.5">
            <BulletRow label="Access (Art. 15):">View your profile and posts in the platform.</BulletRow>
            <BulletRow label="Portability (Art. 20):">Export your data as JSON via Profile → Export my data.</BulletRow>
            <BulletRow label="Erasure (Art. 17):">Delete your account via Profile → Delete account. Security logs cannot be deleted per retention policy.</BulletRow>
            <BulletRow label="Rectification (Art. 16):">Edit your profile at any time.</BulletRow>
            <BulletRow label="Objection (Art. 21):">Contact <span className="font-mono bg-hai-offwhite text-hai-plum px-1 rounded font-bold">admin@healthai.edu</span> to object to processing.</BulletRow>
          </div>
        </SectionCard>

        <SectionCard index="06" title="Cookies" icon="cookie" tone="cream">
          <p>
            We use only <strong className="text-hai-plum font-body font-bold">essential cookies</strong> required for session security. No analytics, advertising, or third-party tracking cookies are used.
          </p>
          <p>
            You may choose <span className="inline-flex items-center gap-1 bg-hai-offwhite text-hai-plum rounded-full px-2.5 py-0.5 font-mono text-[11px] font-bold">Essential only</span> in the cookie consent banner to explicitly limit cookies.
          </p>
        </SectionCard>

        <SectionCard index="07" title="Data transfers" icon="public" tone="mint">
          <p>
            This is a demo platform running locally — no data is transferred outside the user's browser session.
          </p>
          <p>
            In a production deployment, data would remain within the <strong className="text-hai-plum font-body font-bold">European Economic Area (EEA)</strong>.
          </p>
        </SectionCard>
      </div>

      {/* Contact footer */}
      <div className="mt-8 bg-hai-plum text-hai-offwhite rounded-[1.75rem] p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-6 -right-6 w-48 h-48 pointer-events-none opacity-30" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative flex items-start gap-4">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-hai-mint/15 text-hai-mint flex items-center justify-center">
            <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: '"FILL" 1' }}>contact_support</span>
          </div>
          <div className="min-w-0">
            <div className="text-[10.5px] font-mono tracking-[0.18em] uppercase text-hai-mint/80 font-bold mb-1.5">
              Contact & complaints
            </div>
            <div className="font-headline font-bold text-[22px] leading-tight tracking-[-0.015em] mb-2">
              Reach out anytime.
            </div>
            <p className="text-[13.5px] leading-relaxed text-hai-offwhite/85">
              Email{' '}
              <a href="mailto:admin@healthai.edu" className="underline underline-offset-2 text-hai-mint hover:text-white transition-colors">
                admin@healthai.edu
              </a>{' '}
              · SENG 384, Spring 2026. You have the right to lodge a complaint with your national data protection authority.
            </p>
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}
