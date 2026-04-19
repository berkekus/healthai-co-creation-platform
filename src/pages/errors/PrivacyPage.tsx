import PageWrapper from '../../components/layout/PageWrapper'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 36 }}>
    <h2 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink)', margin: '0 0 12px' }}>{title}</h2>
    <div style={{ fontFamily: 'var(--ff-sans)', fontSize: 14.5, color: 'var(--ink-muted)', lineHeight: 1.75 }}>{children}</div>
  </div>
)

export default function PrivacyPage() {
  const mono: React.CSSProperties = { fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }
  return (
    <PageWrapper maxWidth={720}>
      <div style={{ ...mono, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40 }}>
        <span style={{ color: 'var(--primary)' }}>19</span> · Privacy Policy
      </div>
      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,48px)', letterSpacing: '-0.025em', margin: '0 0 8px', color: 'var(--ink)' }}>
        Privacy Policy.
      </h1>
      <p style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-muted)', margin: '0 0 48px' }}>Last updated: 19 April 2026 · GDPR compliant</p>

      <Section title="1. Who we are">
        HEALTH AI Co-Creation Platform is operated as an academic project under SENG 384, Spring 2026. We connect engineers and healthcare professionals across Europe for structured research collaboration. Contact: <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 13 }}>admin@healthai.edu</span>
      </Section>

      <Section title="2. Data we collect">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong style={{ color: 'var(--ink)' }}>Account data:</strong> Full name, institutional email (.edu only), role, institution, city, country, bio, expertise tags.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Activity data:</strong> Posts created/edited, meeting requests sent/received, login events.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Security logs:</strong> IP address (login events), failed login attempts, rate-limit hits. Retained for 24 months.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Session data:</strong> Session token stored in memory only; expires after 30 minutes of inactivity.</li>
        </ul>
        <p style={{ marginTop: 12 }}>We do <strong style={{ color: 'var(--ink)' }}>not</strong> collect patient data, clinical records, proprietary IP, or personal emails. File uploads are prohibited on this platform.</p>
      </Section>

      <Section title="3. Legal basis (GDPR Art. 6)">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong style={{ color: 'var(--ink)' }}>Contract performance</strong> — account and collaboration data processed to provide the service.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Legitimate interest</strong> — security logs and rate limiting to protect platform integrity.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Consent</strong> — non-essential cookies (accepted via banner).</li>
        </ul>
      </Section>

      <Section title="4. Data retention">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li>Account and post data: retained while account is active.</li>
          <li style={{ marginTop: 8 }}>Security and activity logs: 24 months, tamper-resistant, no manual deletion.</li>
          <li style={{ marginTop: 8 }}>Session data: in-memory, cleared on logout or timeout.</li>
        </ul>
      </Section>

      <Section title="5. Your rights (GDPR Art. 15–22)">
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong style={{ color: 'var(--ink)' }}>Access (Art. 15):</strong> View your profile and posts in the platform.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Portability (Art. 20):</strong> Export your data as JSON via Profile → Export my data.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Erasure (Art. 17):</strong> Delete your account via Profile → Delete account. Security logs cannot be deleted per retention policy.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Rectification (Art. 16):</strong> Edit your profile at any time.</li>
          <li style={{ marginTop: 8 }}><strong style={{ color: 'var(--ink)' }}>Objection (Art. 21):</strong> Contact admin@healthai.edu to object to processing.</li>
        </ul>
      </Section>

      <Section title="6. Cookies">
        We use only essential cookies required for session security. No analytics, advertising or third-party tracking cookies are used. You may choose "Essential only" in the cookie consent banner to explicitly limit cookies.
      </Section>

      <Section title="7. Data transfers">
        This is a demo platform running locally. No data is transferred outside the user's browser session. In a production deployment, data would remain within the European Economic Area (EEA).
      </Section>

      <div style={{ marginTop: 48, padding: '20px 24px', background: 'var(--paper-2)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
        <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: 6 }}>Contact & complaints</strong>
        Email: admin@healthai.edu · SENG 384, Spring 2026<br />
        You have the right to lodge a complaint with your national data protection authority.
      </div>
    </PageWrapper>
  )
}
