import { useEffect, useState } from 'react'

// ── Palette switcher state ────────────────────────────────────────────
type Palette = 'A' | 'B' | 'C' | 'D'
type FontSet = 'newsreader' | 'instrument'
type StampVis = 'on' | 'off'

// ── Utility ───────────────────────────────────────────────────────────
function SecLabel({ num, title, sub }: { num: string; title: string; sub: string }) {
  return (
    <div className="sec-label">
      <span className="num">{num}</span>
      <span>{title}</span>
      <span className="dot" />
      <span>{sub}</span>
    </div>
  )
}

// ── Button ────────────────────────────────────────────────────────────
function Btn({ children, variant = 'default', href = '#', style: extraStyle }: {
  children: React.ReactNode
  variant?: 'default' | 'primary' | 'ghost'
  href?: string
  style?: React.CSSProperties
}) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '10px 18px', border: '1px solid var(--ink)',
    fontFamily: 'var(--ff-sans)', fontSize: 13.5, fontWeight: 500,
    cursor: 'pointer', position: 'relative', overflow: 'hidden',
    transition: 'box-shadow .3s, border-color .3s',
    textDecoration: 'none',
  }
  const variants: Record<string, React.CSSProperties> = {
    default:  { background: 'var(--ink)', color: 'var(--paper)' },
    primary:  { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--paper)' },
    ghost:    { background: 'transparent', color: 'var(--ink)', borderColor: 'var(--ink)' },
  }
  return (
    <a href={href} className="btn-slide" style={{ ...base, ...variants[variant], ...extraStyle }}>
      {children}
    </a>
  )
}

// ── Index Card (hero right) ───────────────────────────────────────────
function IndexCard({ showStamp }: { showStamp: boolean }) {
  return (
    <aside aria-label="Example collaboration post" style={{
      position: 'relative',
      background: 'var(--paper-2)',
      border: '1px solid var(--ink)',
      padding: 0, fontSize: 13,
      boxShadow: '6px 6px 0 0 var(--primary), 6px 6px 0 1px var(--ink)',
      transform: 'rotate(-0.6deg)',
      transition: 'transform .4s cubic-bezier(.2,.7,.2,1)',
    }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'rotate(0deg) translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = 'rotate(-0.6deg)')}
    >
      {showStamp && (
        <div style={{
          position: 'absolute', right: -18, top: 72,
          fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.2em',
          color: 'var(--primary)', border: '1.5px solid var(--primary)',
          padding: '4px 10px', transform: 'rotate(8deg)', opacity: 0.85, zIndex: 2,
          background: 'color-mix(in oklab, var(--paper) 92%, transparent)',
        }}>NDA REQUIRED</div>
      )}
      {/* head */}
      <div style={{
        padding: '10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        borderBottom: '1px solid var(--ink)',
        fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase',
        background: 'var(--ink)', color: 'var(--paper)',
      }}>
        <span style={{ opacity: 0.7 }}>POST · #HAI-0427</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', boxShadow: '0 0 0 2px color-mix(in oklab, var(--accent) 40%, transparent)' }} />
          ACTIVE
        </span>
      </div>
      {/* body */}
      <div style={{ padding: '22px 24px 8px' }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 14 }}>
          Healthcare Professional · Berlin
        </div>
        <h3 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 26, lineHeight: 1.12, letterSpacing: '-0.015em', color: 'var(--ink)', margin: '0 0 14px' }}>
          Low-latency <span style={{ fontWeight: 500, color: 'var(--primary)' }}>ECG anomaly</span> detection for ICU bedside monitors.
        </h3>
        <p style={{ color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1.55, margin: '0 0 22px' }}>
          Seeking a signal-processing or ML engineer to co-develop an on-device classifier. Clinical dataset and validation protocol already in place. Details shared under NDA.
        </p>
        {/* table */}
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', fontSize: 12.5, borderTop: '1px solid var(--rule)' }}>
          {[
            ['Domain',          'Cardiology · ICU'],
            ['Needs',           <><b style={{ fontWeight: 500 }}>Signal Processing, Embedded ML</b></>],
            ['Stage',           'Concept Validation → Prototype'],
            ['Commitment',      'Research Partner'],
            ['Confidentiality', 'Meeting Only'],
            ['Expires',         '14 May 2026'],
          ].map(([k, v], i) => (
            <>
              <div key={`k${i}`} style={{ padding: '9px 0', borderBottom: '1px dashed var(--rule-soft)', fontFamily: 'var(--ff-mono)', fontSize: 10.5, textTransform: 'uppercase', letterSpacing: '.1em', color: 'var(--ink-muted)', paddingRight: 24 }}>{k}</div>
              <div key={`v${i}`} style={{ padding: '9px 0', borderBottom: '1px dashed var(--rule-soft)', color: 'var(--ink)' }}>{v}</div>
            </>
          ))}
        </div>
      </div>
      {/* foot */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '14px 24px', borderTop: '1px solid var(--ink)',
        fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase',
        color: 'var(--ink-muted)',
      }}>
        <span>03 interests · 01 meeting scheduled</span>
        <span style={{ color: 'var(--paper)', background: 'var(--primary)', padding: '6px 12px', letterSpacing: '.08em', fontWeight: 500 }}>Express Interest →</span>
      </div>
    </aside>
  )
}

// ── Feature Cell ──────────────────────────────────────────────────────
function Feat({ num, title, desc, colSpan, children, className = '' }: {
  num: string; title: React.ReactNode; desc: string; colSpan: number; children?: React.ReactNode; className?: string
}) {
  return (
    <div className={className} style={{
      background: 'var(--paper)', padding: '48px 40px',
      display: 'flex', flexDirection: 'column', gap: 18,
      gridColumn: `span ${colSpan}`, minHeight: 340,
      transition: 'background .4s ease',
    }}
      onMouseEnter={e => (e.currentTarget.style.background = 'color-mix(in oklab, var(--paper) 70%, var(--paper-2) 100%)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'var(--paper)')}
    >
      <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', color: 'var(--primary)', fontWeight: 500 }}>{num}</span>
      <h3 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 30, lineHeight: 1.12, letterSpacing: '-0.015em', margin: 0 }}>{title}</h3>
      <p style={{ color: 'var(--ink-muted)', fontSize: 14.5, lineHeight: 1.6, margin: 0, maxWidth: '46ch' }}>{desc}</p>
      {children}
    </div>
  )
}

// ── Art components ────────────────────────────────────────────────────
function ArtDirectory() {
  return (
    <div className="art-hatch" style={{ marginTop: 'auto', border: '1px solid var(--rule)', minHeight: 120, position: 'relative', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', padding: '0 20px', fontFamily: 'var(--ff-display)', fontSize: 20, lineHeight: 1.1 }}>
      <div style={{ padding: '20px 8px', borderRight: '1px dashed var(--rule)', color: 'var(--ink)' }}>
        <small style={{ display: 'block', fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--ink-muted)', textTransform: 'uppercase', fontStyle: 'normal', marginBottom: 6 }}>Engineer</small>
        Machine Learning<br />Computer Vision<br />Signal Processing
      </div>
      <div style={{ padding: '20px 8px', paddingLeft: 24, color: 'var(--primary)', fontWeight: 500 }}>
        <small style={{ display: 'block', fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.16em', color: 'var(--ink-muted)', textTransform: 'uppercase', fontStyle: 'normal', marginBottom: 6 }}>Healthcare</small>
        Cardiology<br />Radiology<br />Emergency Medicine
      </div>
    </div>
  )
}

function ArtLifecycle() {
  const steps = ['Interest', 'NDA', 'Meeting', 'Partner']
  return (
    <div className="art-hatch" style={{ marginTop: 'auto', border: '1px solid var(--rule)', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 22px', fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
      {steps.map((s, i) => (
        <>
          <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 10, height: 10, border: '1px solid var(--ink)', background: i < 3 ? 'var(--primary)' : 'var(--paper)', borderColor: i < 3 ? 'var(--primary)' : 'var(--ink)' }} />
            <span>{s}</span>
          </div>
          {i < steps.length - 1 && <div key={`arr${i}`} style={{ flex: 1, height: 1, background: 'var(--ink)', margin: '0 8px', position: 'relative', top: -8 }} />}
        </>
      ))}
    </div>
  )
}

function ArtGDPR() {
  const items: [string, boolean][] = [
    ['Export my data', false], ['Delete account', false], ['Session timeout', false],
    ['File upload', true], ['Patient records', true], ['Chat history', true],
    ['.edu verification', false], ['RBAC', false], ['Rate-limited auth', false],
    ['Tamper-resistant log', false],
  ]
  return (
    <div className="art-hatch" style={{ marginTop: 'auto', border: '1px solid var(--rule)', minHeight: 80, padding: '22px 24px', fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.06em', color: 'var(--ink-muted)', lineHeight: 1.9 }}>
      {items.map(([label, struck]) => (
        <span key={label}>
          <b style={{ color: 'var(--primary)', fontWeight: 500 }}>· </b>
          {struck
            ? <s style={{ textDecorationColor: 'var(--primary)', color: 'var(--ink-muted)' }}>{label}</s>
            : <span>{label}</span>
          }
          {'  '}
        </span>
      ))}
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────────────
export default function LandingPage() {
  const [scrollPct, setScrollPct] = useState(0)
  const [palette, setPalette] = useState<Palette>('B')
  const [fontSet, setFontSet] = useState<FontSet>('newsreader')
  const [stamp, setStamp] = useState<StampVis>('off')
  const [tweaksOpen, setTweaksOpen] = useState(false)
  const [howStep, setHowStep] = useState(0)
  const [howDir, setHowDir] = useState<'right' | 'left'>('right')
  // scroll handler
  useEffect(() => {
    function onScroll() {
      const h = document.documentElement.scrollHeight - window.innerHeight
      const p = h > 0 ? window.scrollY / h : 0
      setScrollPct(p)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // reveal on scroll
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>('.reveal-on-scroll')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) }
      })
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' })
    els.forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  // hero word reveal
  useEffect(() => {
    const words = document.querySelectorAll<HTMLElement>('.hero-word-reveal')
    words.forEach((el, i) => { el.style.animationDelay = `${i * 80}ms` })
  }, [])

  // palette on body
  useEffect(() => {
    document.body.dataset.palette = palette
  }, [palette])

  // font switching
  useEffect(() => {
    const root = document.documentElement
    if (fontSet === 'instrument') {
      root.style.setProperty('--ff-display', '"Instrument Serif", "Newsreader", serif')
      root.style.setProperty('--ff-sans', '"Geist", "IBM Plex Sans", system-ui, sans-serif')
      if (!document.getElementById('alt-fonts')) {
        const l = document.createElement('link')
        l.id = 'alt-fonts'; l.rel = 'stylesheet'
        l.href = 'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600&display=swap'
        document.head.appendChild(l)
      }
    } else {
      root.style.setProperty('--ff-display', '"Newsreader", serif')
      root.style.setProperty('--ff-sans', '"IBM Plex Sans", system-ui, sans-serif')
    }
  }, [fontSet])

  const HOW_STEPS = [
    { num: '01', name: 'Post', desc: 'Publish a collaboration opportunity: your domain, the expertise you need, project stage, and confidentiality level. No file uploads. No patient data. Ever.' },
    { num: '02', name: 'Match', desc: 'Browse the directory. Filter by medical domain, engineering specialty, city, or project stage. Every profile is tied to an institutional .edu account.' },
    { num: '03', name: 'Meet', desc: 'Express interest. Accept a one-page NDA inline. Propose three time slots. The post owner confirms — a meeting is scheduled and logged, immutably.' },
    { num: '04', name: 'Build', desc: "The platform's role ends here. Real collaboration happens off-platform, where it belongs. Mark the post as Partner Found when your work begins." },
  ]

  const domains = [
    'Cardiology', 'Oncology', 'Radiology & Imaging', 'Neurology', 'Orthopedics',
    'Dermatology', 'Ophthalmology', 'Pediatrics', 'Psychiatry & Mental Health', 'Emergency Medicine',
    'Intensive Care', 'Surgical Robotics', 'Genomics & Precision Medicine', 'Rehabilitation & Physio',
    'Clinical Pharmacy', 'Public Health', 'Pathology & Lab Diagnostics', 'Endocrinology & Diabetes',
    'Remote Patient Monitoring', 'Mental Health AI',
  ]
  const highlightedDomains = new Set(['Oncology', 'Dermatology', 'Intensive Care', 'Public Health', 'Mental Health AI'])
  const cities = ['Berlin', 'Amsterdam', 'London', 'Paris', 'Stockholm', 'Vienna', 'Zurich', 'Helsinki', 'Copenhagen', 'Barcelona', 'Istanbul', 'Warsaw']

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* atmosphere */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: -1, pointerEvents: 'none',
        background: `radial-gradient(50vw 45vh at 85% 10%, var(--glow), transparent 65%), radial-gradient(45vw 40vh at 5% 85%, color-mix(in oklab, var(--accent-2) 22%, transparent), transparent 70%), linear-gradient(180deg, var(--paper) 0%, var(--paper-2) 100%)`,
      }} />

      {/* scroll indicator */}
      <div className="scroll-ind" aria-hidden="true" style={{
        position: 'fixed', right: 14, top: '50%', transform: 'translateY(-50%)', zIndex: 40,
        fontFamily: 'var(--ff-mono)', fontSize: 9.5, color: 'var(--ink-muted)', letterSpacing: '.04em',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, mixBlendMode: 'multiply', width: 32, textAlign: 'center',
      }}>
        <span>{scrollPct.toFixed(2)}</span>
        <div style={{ width: 1, height: 120, background: 'var(--rule)', position: 'relative', overflow: 'hidden' }}>
          <span style={{ position: 'absolute', left: 0, top: 0, width: '100%', background: 'var(--ink)', height: `${scrollPct * 100}%`, display: 'block' }} />
        </div>
        <span>SCROLL</span>
      </div>

      {/* ── HERO ────────────────────────────────────── */}
      <section className="hero-section reveal-on-scroll" style={{ paddingTop: 'clamp(48px,7vw,96px)', paddingBottom: 'clamp(64px,10vw,140px)' }}>
        <div className="wrap">
          <SecLabel num="00" title="Co-Creation Platform" sub="Spring 2026 · v0.1" />
          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: 'clamp(32px,5vw,80px)', alignItems: 'end' }}>
            {/* left */}
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(44px,6.8vw,104px)', lineHeight: 1.02, letterSpacing: '-0.035em', margin: '0 0 44px', color: 'var(--ink)' }}>
                {['Where', 'clinicians', 'meet the', 'engineers', 'who can', 'build', 'their\u00A0ideas.'].map((w, i) => {
                  const isAccent = w === 'clinicians' || w === 'build'
                  return (
                    <span key={i}>
                      <span className="hero-word-reveal" style={isAccent ? { fontWeight: 500, color: 'var(--primary)' } : {}}>
                        {w}
                      </span>
                      {i < 6 && (i === 1 || i === 3 || i === 5 ? <br /> : ' ')}
                    </span>
                  )
                })}
              </h1>

              <p style={{ maxWidth: '48ch', fontSize: 17, lineHeight: 1.55, color: 'var(--ink-muted)', margin: '0 auto 36px', textWrap: 'pretty' } as React.CSSProperties}>
                HEALTH AI is a structured, GDPR-native directory for European medical professionals and engineers to co-create credible healthcare technology — <b style={{ color: 'var(--ink)', fontWeight: 500 }}>not a job board, not a chat app</b>, not a place for patient data. Post a collaboration opportunity. Find one. Meet.
              </p>

              <div style={{ display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 40 }}>
                <Btn variant="primary" href="#">Post an opportunity <span className="arr">→</span></Btn>
                <Btn variant="ghost" href="#">Browse the directory</Btn>
              </div>

              <div style={{ display: 'flex', gap: 28, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.1em', color: 'var(--ink-muted)', textTransform: 'uppercase', paddingTop: 20, borderTop: '1px solid var(--rule)', flexWrap: 'wrap' }}>
                {[
                  ['.edu', 'institutional email only'],
                  ['20', 'medical domains'],
                  ['12', 'European cities'],
                  ['0', 'files, uploads or patient data'],
                ].map(([strong, rest]) => (
                  <span key={strong}><strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{strong}</strong> {rest}</span>
                ))}
              </div>
            </div>

            {/* right: index card */}
            <IndexCard showStamp={stamp === 'on'} />
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────── */}
      <section className="features-section reveal-on-scroll" id="features" style={{ padding: 'clamp(64px,9vw,120px) 0', borderTop: '1px solid var(--rule)' }}>
        <div className="wrap">
          <SecLabel num="01" title="What the platform does" sub="Six primitives" />
          <h2 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,3.6vw,52px)', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: '22ch', margin: '0 0 60px' }}>
            Three <span style={{ fontWeight: 500, color: 'var(--primary)' }}>deliberate</span> primitives.
          </h2>
          <div className="feat-grid">
            <Feat
              num="01 — Directory"
              title={<>Two worlds, <span style={{ fontWeight: 500, color: 'var(--primary)' }}>one</span> ledger.</>}
              desc="Engineers publish capability. Clinicians publish need. The grammar is enforced so matches are meaningful."
              colSpan={6}
            >
              <ArtDirectory />
            </Feat>
            <Feat
              num="02 — NDA → Meeting"
              title={<>Confidentiality <span style={{ fontWeight: 500, color: 'var(--primary)' }}>before</span> conversation.</>}
              desc="Interest triggers a one-page NDA. Then three timeslots. Then a meeting. Every step is logged and immutable."
              colSpan={6}
            >
              <ArtLifecycle />
            </Feat>
            <Feat
              num="03 — Trust"
              title={<>GDPR-native. No file uploads. No patient data. <span style={{ fontWeight: 500, color: 'var(--primary)' }}>No exceptions.</span></>}
              desc="Export everything. Delete everything. Every login, post edit, and meeting acceptance lands in a 24-month tamper-resistant audit trail."
              colSpan={12}
              className="feat-w12"
            >
              <ArtGDPR />
            </Feat>
          </div>
        </div>
      </section>

      {/* ── COVERAGE ──────────────────────────────── */}
      <section className="proof-section reveal-on-scroll" id="coverage" style={{ padding: 'clamp(64px,9vw,110px) 0', borderTop: '1px solid var(--rule)' }}>
        <div className="wrap">
          <SecLabel num="02" title="Coverage" sub="20 medical domains · 12 engineering specialties" />
          <div className="proof-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 'clamp(24px,4vw,80px)', alignItems: 'start' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,3.4vw,44px)', lineHeight: 1.1, letterSpacing: '-0.02em', margin: 0, maxWidth: '14ch' }}>
                Every field where an engineer and a clinician should already <span style={{ fontStyle: 'normal', color: 'var(--primary)', fontWeight: 500 }}>be talking</span>.
              </h2>
              <p style={{ fontSize: 14.5, color: 'var(--ink-muted)', marginTop: 14, maxWidth: '30ch' }}>
                Twenty medical domains, twelve engineering specialties, vetted and indexed. No vague "health tech" category — specificity is the design.
              </p>
            </div>
            <div style={{ border: '1px solid var(--rule)', padding: 0 }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
                <b style={{ color: 'var(--ink)', fontWeight: 500 }}>Medical Domains</b>
                <span>20 / 20</span>
              </div>
              <div style={{ padding: '22px 20px', fontFamily: 'var(--ff-display)', fontSize: 'clamp(18px,2vw,26px)', lineHeight: 1.35, letterSpacing: '-0.01em', columnCount: 2, columnGap: 40 } as React.CSSProperties}>
                {domains.map(d => (
                  <span key={d} style={{ display: 'block', breakInside: 'avoid', color: highlightedDomains.has(d) ? 'var(--accent)' : 'var(--ink)', fontWeight: highlightedDomains.has(d) ? 500 : 400 }}>{d}</span>
                ))}
              </div>
            </div>
          </div>

          {/* cities marquee */}
          <div aria-hidden="true" style={{ marginTop: 28, overflow: 'hidden', whiteSpace: 'nowrap', borderTop: '1px solid var(--rule)', borderBottom: '1px solid var(--rule)', padding: '14px 0', fontFamily: 'var(--ff-mono)', fontSize: 12, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>
            <div className="cities-inner">
              {[...cities, ...cities].map((city, i) => <span key={i}>{city}</span>)}
            </div>
          </div>
        </div>
      </section>

      {/* ── STATEMENT ─────────────────────────────── */}
      <section className="statement-section reveal-on-scroll" id="how" style={{ padding: 'clamp(80px,12vw,160px) 0', borderTop: '1px solid var(--rule)' }}>
        <div className="wrap">
          <SecLabel num="03" title="How it works" sub="Four deliberate steps" />
          {/* Step stepper */}
          <div style={{ overflow: 'hidden', borderBottom: '1px solid var(--rule)' }}>
            <div key={howStep} className={howDir === 'right' ? 'step-in-right' : 'step-in-left'} style={{ padding: '48px 0 44px' }}>
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.18em', textTransform: 'uppercase', color: 'var(--primary)', marginBottom: 20 }}>
                Step {HOW_STEPS[howStep].num} / 04
              </div>
              <p style={{ fontFamily: 'var(--ff-display)', fontWeight: 500, fontSize: 'clamp(56px,9vw,140px)', lineHeight: 1, letterSpacing: '-0.03em', color: 'var(--ink)', margin: '0 0 32px' }}>
                {HOW_STEPS[howStep].name}<span style={{ color: 'var(--accent)' }}>.</span>
              </p>
              <p style={{ maxWidth: '52ch', fontSize: 18, lineHeight: 1.6, color: 'var(--ink-muted)', margin: 0 }}>
                {HOW_STEPS[howStep].desc}
              </p>
            </div>
          </div>

          {/* Step nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '32px 0 48px' }}>
            <button
              onClick={() => { setHowDir('left'); setHowStep(s => Math.max(s - 1, 0)) }}
              disabled={howStep === 0}
              aria-label="Previous step"
              style={{
                width: 44, height: 44, border: '1px solid var(--ink)', background: 'var(--paper)',
                cursor: howStep === 0 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: howStep === 0 ? 0.25 : 1, transition: 'opacity .2s',
                fontFamily: 'var(--ff-mono)', fontSize: 18, color: 'var(--ink)',
              }}
            >←</button>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {HOW_STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setHowDir(i > howStep ? 'right' : 'left'); setHowStep(i) }}
                  aria-label={`Step ${i + 1}`}
                  style={{
                    width: i === howStep ? 28 : 8, height: 8,
                    border: '1px solid var(--ink)',
                    background: i === howStep ? 'var(--ink)' : 'transparent',
                    cursor: 'pointer', padding: 0,
                    transition: 'width .3s ease, background .2s',
                  }}
                />
              ))}
            </div>
            <button
              onClick={() => { setHowDir('right'); setHowStep(s => Math.min(s + 1, HOW_STEPS.length - 1)) }}
              disabled={howStep === HOW_STEPS.length - 1}
              aria-label="Next step"
              style={{
                width: 44, height: 44, border: '1px solid var(--ink)',
                background: howStep === HOW_STEPS.length - 1 ? 'var(--paper)' : 'var(--ink)',
                cursor: howStep === HOW_STEPS.length - 1 ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: howStep === HOW_STEPS.length - 1 ? 0.25 : 1,
                transition: 'opacity .2s, background .2s',
                fontFamily: 'var(--ff-mono)', fontSize: 18,
                color: howStep === HOW_STEPS.length - 1 ? 'var(--ink)' : 'var(--paper)',
              }}
            >→</button>
          </div>
          <div style={{ marginTop: 56, display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 20, borderTop: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-muted)', flexWrap: 'wrap', gap: 16 }}>
            <span>Access is restricted to institutional <b style={{ color: 'var(--ink)' }}>.edu</b> accounts.</span>
            <span><a href="#" style={{ color: 'var(--primary)' }}>Read the privacy policy →</a></span>
            <span>SENG 384 · Spring 2026 · v0.1</span>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────── */}
      <footer className="foot-bg" id="trust" style={{ color: 'var(--paper)', padding: '100px 0 0', position: 'relative', overflow: 'hidden' }}>
        <div className="wrap" style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(72px,14vw,200px)', lineHeight: 0.9, letterSpacing: '-0.03em', color: 'var(--paper)', margin: '0 0 56px' }}>
            <small style={{ display: 'block', fontFamily: 'var(--ff-mono)', fontStyle: 'normal', fontSize: 11, letterSpacing: '.2em', textTransform: 'uppercase', color: 'color-mix(in oklab, var(--paper) 60%, var(--ink))', marginBottom: 24 }}>HEALTH · AI · CO-CREATION</small>
            Health<span style={{ fontStyle: 'normal', color: 'var(--accent)', fontWeight: 500 }}>AI</span><span style={{ color: 'var(--accent)', fontWeight: 500 }}>.</span>
          </h2>

          <div className="foot-cols" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: 40, paddingBottom: 64, borderBottom: '1px solid color-mix(in oklab, var(--paper) 20%, var(--ink))' }}>
            {/* CTA */}
            <div>
              <h4 style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 18px', color: 'color-mix(in oklab, var(--paper) 70%, var(--ink))' }}>Join the directory</h4>
              <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14.5, color: 'color-mix(in oklab, var(--paper) 70%, var(--ink))', margin: '0 0 10px', lineHeight: 1.55 }}>Institutional .edu accounts only. Verification is automated and one-time.</p>
              <Btn href="#" style={{ background: 'var(--accent)', color: 'var(--ink)', borderColor: 'var(--accent)', marginTop: 8 }}>Request access <span className="arr">→</span></Btn>
            </div>
            {/* Platform */}
            <FootCol title="Platform" links={['Browse posts', 'Post an opportunity', 'Meetings', 'Notifications', 'Sign in']} />
            {/* Trust */}
            <FootCol title="Trust & Legal" links={['Privacy policy', 'GDPR & your rights', 'Data export', 'Terms of use', 'Security disclosure']} />
            {/* Context */}
            <FootCol title="Context" links={['About HEALTH AI', 'SENG 384 · Spring 2026', 'Demo scenarios', 'Roadmap', 'Contact']} />
          </div>

          <div style={{ padding: '22px 0 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.12em', textTransform: 'uppercase', color: 'color-mix(in oklab, var(--paper) 55%, var(--ink))', gap: 16, flexWrap: 'wrap' }}>
            <span><b style={{ color: 'var(--paper)', fontWeight: 500 }}>HEALTH AI</b> · Co-Creation Platform · Built in Europe</span>
            <span>v0.1 · Last audited 19 · 04 · 2026</span>
            <span>© 2026 · All rights reserved</span>
          </div>
        </div>
      </footer>

      {/* ── TWEAKS PANEL ──────────────────────────── */}
      <button
        onClick={() => setTweaksOpen(o => !o)}
        aria-label="Open tweaks panel"
        style={{
          position: 'fixed', right: tweaksOpen ? 316 : 16, bottom: 16, zIndex: 101,
          width: 36, height: 36, border: '1px solid var(--ink)', background: 'var(--paper)',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--ff-mono)', fontSize: 16, color: 'var(--ink)',
          transition: 'right .25s ease',
        }}
      >⚙</button>

      {tweaksOpen && (
        <div style={{
          position: 'fixed', right: 16, bottom: 16, zIndex: 100, width: 300,
          background: 'var(--paper)', border: '1px solid var(--ink)',
          boxShadow: '8px 8px 0 0 var(--primary)',
          fontFamily: 'var(--ff-sans)', fontSize: 13,
        }}>
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--ink)', color: 'var(--paper)', fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.15em', textTransform: 'uppercase' }}>
            <span>Tweaks</span>
            <button onClick={() => setTweaksOpen(false)} style={{ background: 'none', border: 0, color: 'var(--paper)', cursor: 'pointer', fontSize: 'inherit', fontFamily: 'inherit' }}>×</button>
          </header>
          <TweakSection title="Color palette">
            {(['A', 'B', 'C', 'D'] as Palette[]).map((p, i) => (
              <TweakBtn key={p} active={palette === p} onClick={() => setPalette(p)}>
                {['A · Oxblood', 'B · Graphite', 'C · Terracotta', 'D · Navy'][i]}
              </TweakBtn>
            ))}
          </TweakSection>
          <TweakSection title="Typography">
            <TweakBtn active={fontSet === 'newsreader'} onClick={() => setFontSet('newsreader')}>Newsreader + Plex</TweakBtn>
            <TweakBtn active={fontSet === 'instrument'} onClick={() => setFontSet('instrument')}>Instrument + Geist</TweakBtn>
          </TweakSection>
          <TweakSection title="Confidential stamp" last>
            <TweakBtn active={stamp === 'on'} onClick={() => setStamp('on')}>Show</TweakBtn>
            <TweakBtn active={stamp === 'off'} onClick={() => setStamp('off')}>Hide</TweakBtn>
          </TweakSection>
        </div>
      )}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────
function FootCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div>
      <h4 style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.16em', textTransform: 'uppercase', fontWeight: 500, margin: '0 0 18px', color: 'color-mix(in oklab, var(--paper) 55%, var(--ink))' }}>{title}</h4>
      {links.map(l => (
        <a key={l} href="#" style={{ display: 'block', fontFamily: 'var(--ff-sans)', fontSize: 14.5, color: 'color-mix(in oklab, var(--paper) 88%, var(--ink))', margin: '0 0 10px', transition: 'color .2s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'color-mix(in oklab, var(--paper) 88%, var(--ink))')}
        >{l}</a>
      ))}
    </div>
  )
}

function TweakSection({ title, children, last }: { title: string; children: React.ReactNode; last?: boolean }) {
  return (
    <section style={{ padding: 14, borderBottom: last ? 0 : '1px solid var(--rule)' }}>
      <h5 style={{ margin: '0 0 10px', fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', fontWeight: 500 }}>{title}</h5>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{children}</div>
    </section>
  )
}

function TweakBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      background: active ? 'var(--ink)' : 'var(--paper)',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--rule)'}`,
      padding: '6px 10px', fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.08em',
      textTransform: 'uppercase', color: active ? 'var(--paper)' : 'var(--ink-muted)', cursor: 'pointer',
    }}>{children}</button>
  )
}
