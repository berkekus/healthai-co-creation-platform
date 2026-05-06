import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'
import { ROUTES } from '../constants/routes'
import { useAuthStore } from '../store/authStore'

// ─────────────────────────────────────────────────────────────────────
// HEALTH AI · Co-Creation Platform — Landing (Faz 0 refresh)
//
// Visual language adapted from the Payard reference:
//   · Teal (#8AC6D0) → Mint (#B8F3FF) → Plum (#36213E)
//   · Plus Jakarta Sans (display / pill caps) + Source Sans 3 (body) + Material Symbols
//   · Rounded white panels, floating tiles, dev wordmarks, dot atmospheres
// Content: structured clinician ↔ engineer co-creation directory
//
// Gradient plan: the hero zone fades from teal (top) to off-white at the
// midpoint of the "Join the directory" panel, so the entire bottom half
// of the hero — and everything through the "Ready to co-create?" CTA —
// sits on a calm off-white surface.
// ─────────────────────────────────────────────────────────────────────

/**
 * Detect whether the current device supports true hover input.
 * Returns `true` on desktops / trackpads (where `(hover: hover)` matches)
 * and `false` on touch devices. Used to decide whether the pathway-card
 * reveal box should rely on `whileHover` (desktop) or stay visible
 * permanently (mobile — otherwise the CTA inside would be unreachable).
 */
function useCanHover(): boolean {
  /*
    Lazy initializer — we read the media query synchronously on first
    render so the very first paint already matches the device. Without
    this, touch devices would render ONE frame of `canHover = true`
    (the default) and flash the reveal-box from hidden → visible as
    the useEffect below corrects it. Now: no flash, no layout shift.
  */
  const [canHover, setCanHover] = useState<boolean>(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return true
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  })
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)')
    const update = () => setCanHover(mq.matches)
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return canHover
}

// ── Icon helper ─────────────────────────────────────────────────────
function Icon({ name, className = '', filled = false }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: '"FILL" 1' } : undefined}
    >
      {name}
    </span>
  )
}

// ── Logo ────────────────────────────────────────────────────────────
function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <img
        src="/images/healthailogo.svg"
        alt="HealthAI logo"
        className="h-9 w-auto"
        style={inverted ? { filter: 'brightness(0) invert(1)' } : undefined}
      />
      <span className={`text-[21px] font-extrabold tracking-tight font-headline ${inverted ? 'text-white' : 'text-[#03326D]'}`}>
        HealthAI
      </span>
    </div>
  )
}

// ── Top Nav ─────────────────────────────────────────────────────────

/**
 * Thin vertical separator rendered between center-nav links.
 * Lives outside every `<a>`'s hover box on purpose — the rounded-lg black/5
 * wash can animate freely without ever clipping against a hard divider line.
 * `aria-hidden` so screen readers skip it.
 */
function NavDivider() {
  return <span aria-hidden className="mx-0.5 h-4 w-px self-center bg-neutral-200" />
}

function TopNav() {
  const { user } = useAuthStore()
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-6 md:px-12 py-5 bg-transparent font-body">
      <Logo />

      {/* Center pill — hidden below lg.
          Each anchor uses the same premium micro-interaction as the
          authenticated Navbar: px-4 py-2 tap target, rounded-lg corners,
          and a quiet black/5 wash that fades in over 200 ms.
          The vertical dividers are rendered as standalone <span>s between
          links instead of `border-r` on the anchor itself — this way the
          divider is visually outside the rounded-lg hover chamber, so the
          wash never clips against a hard line. */}
      <div className="hidden lg:flex items-center bg-white/25 backdrop-blur-md rounded-full p-1 border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.08)]">
        <div className="flex items-center bg-white rounded-full h-full">
          <div className="flex items-center px-1">
            <a href="#platform" className="text-neutral-900 font-semibold text-sm px-4 py-2 rounded-lg hover:text-neutral-900 hover:bg-black/5 transition-colors duration-200 ease-in-out">Platform</a>
            <NavDivider />
            <a href="#directory" className="text-neutral-900 font-semibold text-sm px-4 py-2 rounded-lg hover:text-neutral-900 hover:bg-black/5 transition-colors duration-200 ease-in-out">Directory</a>
            <NavDivider />
            <a href="#how" className="text-neutral-900 font-semibold text-sm px-4 py-2 rounded-lg hover:text-neutral-900 hover:bg-black/5 transition-colors duration-200 ease-in-out">How it works</a>
            <NavDivider />
            <a href="#trust" className="text-neutral-900 font-semibold text-sm px-4 py-2 rounded-lg hover:text-neutral-900 hover:bg-black/5 transition-colors duration-200 ease-in-out">Trust</a>
          </div>
          <div className="pl-1.5 pr-1.5 py-1.5 border-l border-neutral-100">
            {/* Request Access — plum bg + white font. Same premium hover
                recipe as Sign in / Sign up: soft lift, blooming shadow,
                eased color shift. Shadow is plum-tinted (rgba(54,33,62,·))
                so the drop feels branded against the white pill chamber. */}
            <Link
              to={ROUTES.REGISTER}
              className="inline-block bg-hai-plum text-white px-5 py-2 rounded-full font-bold text-sm shadow-[0_4px_14px_-4px_rgba(54,33,62,0.35)] hover:bg-black hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-8px_rgba(54,33,62,0.5)] active:translate-y-0 active:shadow-[0_3px_10px_-4px_rgba(54,33,62,0.3)] transition-all duration-[250ms] ease-out will-change-transform"
            >
              Request Access
            </Link>
          </div>
        </div>
      </div>

      {/* Right auth actions — premium hover effect:
           · soft lift (-translate-y-0.5)
           · shadow blooms from a tight base glow into a wider, softer drop
           · background color eases smoothly (no jump)
           · `active:translate-y-0` + shadow shrink gives a crisp press feedback
          transition-all runs over 250 ms ease-out so all three properties
          (transform / shadow / color) resolve in perfect sync. */}
      <div className="flex items-center gap-2 md:gap-3">
        {user ? (
          <Link
            to={ROUTES.DASHBOARD}
            className="bg-black text-white px-5 md:px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_6px_18px_-8px_rgba(0,0,0,0.4)] hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.45)] active:translate-y-0 active:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-out will-change-transform"
          >
            Go to Dashboard →
          </Link>
        ) : (
          <>
            <Link
              to={ROUTES.LOGIN}
              className="hidden sm:inline-flex text-neutral-900 font-bold text-sm px-5 py-2.5 rounded-full border border-neutral-900/30 bg-white/0 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.15)] hover:bg-white/70 hover:border-neutral-900/50 hover:-translate-y-0.5 hover:shadow-[0_12px_26px_-10px_rgba(0,0,0,0.25)] active:translate-y-0 active:shadow-[0_2px_8px_-4px_rgba(0,0,0,0.15)] transition-all duration-[250ms] ease-out will-change-transform"
            >
              Sign in
            </Link>
            <Link
              to={ROUTES.REGISTER}
              className="bg-black text-white px-5 md:px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_6px_18px_-8px_rgba(0,0,0,0.4)] hover:bg-neutral-800 hover:-translate-y-0.5 hover:shadow-[0_16px_32px_-10px_rgba(0,0,0,0.45)] active:translate-y-0 active:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.35)] transition-all duration-[250ms] ease-out will-change-transform"
            >
              Sign up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}

// ── Hero portrait card: clean photo panel for each pathway card ─────
function HeroPortraitCard({ side, cardBg }: { side: 'clinician' | 'engineer'; cardBg: string }) {
  const isClinician = side === 'clinician'
  const src = isClinician ? '/images/clinician-portrait.png' : '/images/engineer-portrait.png'
  const alt = isClinician
    ? 'Portrait of a healthcare professional in a clinical coat with a stethoscope'
    : 'Portrait of an engineer wearing minimal glasses and a dark sweater'
  return (
    <div
      aria-hidden="true"
      className="absolute right-0 top-0 bottom-0 hidden md:block pointer-events-none overflow-hidden rounded-r-[30px]"
      style={{ width: isClinician ? '46%' : '47%' }}
    >
      <div
        className="absolute bottom-0 right-0 h-[78%] w-[88%] rounded-tl-[52%] opacity-80"
        style={{ background: isClinician ? '#d7f5f7' : '#ece9ff' }}
      />
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className="absolute inset-y-0 right-0 h-full w-full object-cover"
        style={{
          objectPosition: isClinician ? '58% 50%' : '52% 50%',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, #000 18%, #000 100%)',
          maskImage: 'linear-gradient(to right, transparent 0%, #000 18%, #000 100%)',
        }}
      />
      {/* Gradient fade to blend with card background */}
      <div
        className="absolute inset-y-0 left-0 w-24 pointer-events-none"
        style={{ background: `linear-gradient(to right, ${cardBg}, transparent)` }}
      />
    </div>
  )
}

// ── Platform card icon square ───────────────────────────────────────
function IconSquare({ color, bg, icon }: { color: string; bg: string; icon: string }) {
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg, color }}>
      <Icon name={icon} filled />
    </div>
  )
}

// ── Step data & visuals for the interactive user guide ──────────────
type Step = {
  num: string
  name: string
  tagline: string
  desc: string
  icon: string
  accent: string  // subtle tint for the illustration panel
  Visual: () => JSX.Element
}

const PostVisual = () => (
  <div className="relative w-full max-w-[340px] aspect-[5/4] mx-auto">
    <div className="absolute inset-0 bg-white rounded-3xl shadow-[0_25px_60px_-25px_rgba(54,33,62,0.35)] border border-hai-teal/20 p-5 flex flex-col gap-2.5">
      <div className="flex items-center gap-2 text-[9px] font-mono tracking-[0.18em] uppercase text-hai-plum/70 font-bold mb-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Draft · new post
      </div>
      <div className="h-6 bg-gradient-to-r from-hai-teal/30 to-hai-mint/40 rounded-md w-5/6" />
      <div className="grid grid-cols-2 gap-2 mt-1">
        <div className="bg-neutral-100 rounded-md h-7 flex items-center px-2 text-[10px] font-mono tracking-wider uppercase text-neutral-500">Domain</div>
        <div className="bg-neutral-100 rounded-md h-7 flex items-center px-2 text-[10px] font-mono tracking-wider uppercase text-neutral-500">Stage</div>
      </div>
      <div className="h-2 bg-neutral-100 rounded-full w-full" />
      <div className="h-2 bg-neutral-100 rounded-full w-4/5" />
      <div className="h-2 bg-neutral-100 rounded-full w-3/5" />
      <div className="mt-auto flex items-center justify-between pt-2">
        <span className="text-[10px] font-mono tracking-[0.12em] uppercase text-neutral-400">0 / 0 files</span>
        <span className="bg-hai-plum text-white text-[11px] font-bold px-3 py-1.5 rounded-full">Publish →</span>
      </div>
    </div>
    <div className="absolute -bottom-3 -right-3 w-14 h-14 bg-hai-lime rounded-2xl shadow-lg flex items-center justify-center rotate-6">
      <Icon name="edit_note" className="text-hai-plum text-[30px]" filled />
    </div>
  </div>
)

const MatchVisual = () => {
  const chips: [string, boolean][] = [
    ['Cardiology', true], ['Oncology', false], ['Radiology', false], ['Neurology', true],
    ['Embedded ML', true], ['Signal Proc.', false], ['Computer Vision', false], ['ICU · Berlin', true],
  ]
  return (
    <div className="w-full max-w-[360px] mx-auto bg-white rounded-3xl shadow-[0_25px_60px_-25px_rgba(54,33,62,0.35)] border border-hai-teal/20 p-5">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum/70 font-bold">Directory · filters</span>
        <span className="flex items-center gap-1 text-[10px] font-mono tracking-[0.15em] uppercase text-hai-plum"><Icon name="tune" className="text-[14px]" filled /> 04 active</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {chips.map(([label, active]) => (
          <span key={label} className={`text-[11px] font-bold px-3 py-1.5 rounded-full transition ${active ? 'bg-hai-plum text-white' : 'bg-neutral-100 text-neutral-500'}`}>
            {label}
          </span>
        ))}
      </div>
      <div className="mt-5 pt-4 border-t border-neutral-100 flex items-center gap-3">
        <Icon name="location_on" className="text-hai-plum text-[18px]" filled />
        <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-500">12 European cities · 20 domains</span>
      </div>
    </div>
  )
}

const MeetVisual = () => (
  <div className="w-full max-w-[340px] mx-auto bg-white rounded-3xl shadow-[0_25px_60px_-25px_rgba(54,33,62,0.35)] border border-hai-teal/20 p-5">
    <div className="flex items-start gap-3 mb-4 pb-4 border-b border-neutral-100">
      <div className="w-9 h-9 rounded-xl bg-hai-mint/60 flex items-center justify-center shrink-0">
        <Icon name="shield_lock" className="text-hai-plum text-[20px]" filled />
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-mono tracking-[0.16em] uppercase text-hai-plum/70 font-bold mb-0.5">Step 01 · NDA</div>
        <div className="font-headline text-[15px] font-bold text-hai-plum leading-tight">One-page NDA, accepted inline.</div>
      </div>
      <Icon name="check_circle" className="text-emerald-600 text-[22px]" filled />
    </div>
    {[
      ['Mon · 28 Apr', '14:00 CET'],
      ['Wed · 30 Apr', '10:30 CET'],
      ['Fri · 02 May', '16:00 CET'],
    ].map(([date, time], i) => (
      <div key={date} className="flex items-center justify-between py-2.5 border-b border-neutral-100 last:border-0">
        <span className="flex items-center gap-2.5">
          <span className={`w-5 h-5 rounded-full border-2 ${i === 1 ? 'bg-hai-teal border-hai-teal' : 'border-neutral-300'}`} />
          <span className="text-[13px] font-semibold text-neutral-800">{date}</span>
        </span>
        <span className="text-[11px] font-mono tracking-wider text-neutral-500">{time}</span>
      </div>
    ))}
  </div>
)

const BuildVisual = () => (
  <div className="relative w-full max-w-[340px] aspect-square mx-auto flex items-center justify-center">
    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-hai-mint via-hai-teal/60 to-hai-plum/10 shadow-[0_25px_60px_-25px_rgba(54,33,62,0.4)]" />
    <div className="absolute inset-6 rounded-[1.6rem] bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 border border-white/60">
      <div className="w-16 h-16 bg-hai-plum rounded-2xl flex items-center justify-center shadow-lg">
        <Icon name="handshake" className="text-hai-mint text-[36px]" filled />
      </div>
      <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum/70 font-bold">Partner Found</div>
      <div className="font-headline text-[20px] font-bold text-hai-plum text-center leading-tight">The handshake,<br />on record.</div>
      <div className="flex items-center gap-1.5 text-[10px] font-mono tracking-wider uppercase text-hai-plum/60">
        <Icon name="verified" className="text-[14px]" filled /> Logged · immutable
      </div>
    </div>
    <div className="absolute -top-3 -left-3 w-12 h-12 bg-hai-lime rounded-2xl shadow-lg flex items-center justify-center -rotate-12">
      <Icon name="rocket_launch" className="text-hai-plum text-[24px]" filled />
    </div>
  </div>
)

const STEPS: Step[] = [
  { num: '01', name: 'Post', tagline: 'Publish the need. Structure it.', desc: 'Describe your domain, the expertise you need, the project stage, and the confidentiality level. No file uploads. No patient data. Ever.', icon: 'edit_note', accent: '#B8F3FF', Visual: PostVisual },
  { num: '02', name: 'Match', tagline: '20 domains · 12 specialties.', desc: 'Browse the directory. Filter by medical domain, engineering specialty, city, or project stage. Every profile is tied to an institutional .edu account.', icon: 'tune', accent: '#D2FF74', Visual: MatchVisual },
  { num: '03', name: 'Meet', tagline: 'NDA inline. Three slots. Done.', desc: 'Express interest. Accept a one-page NDA inline. Propose three timeslots. The post owner confirms — the meeting is scheduled and logged immutably.', icon: 'handshake', accent: '#E3DCD2', Visual: MeetVisual },
  { num: '04', name: 'Build', tagline: "The platform steps aside.", desc: "Real collaboration happens off-platform, where it belongs. Mark the post as Partner Found. Your handshake — and its full history — stays on record.", icon: 'rocket_launch', accent: '#8AC6D0', Visual: BuildVisual },
]

// ── Main ────────────────────────────────────────────────────────────
export default function LandingPage() {
  const [step, setStep] = useState(0)
  const [dir, setDir] = useState<'right' | 'left'>('right')

  const goTo = (i: number) => {
    setDir(i > step ? 'right' : 'left')
    setStep(i)
  }
  const next = () => step < STEPS.length - 1 && goTo(step + 1)
  const prev = () => step > 0 && goTo(step - 1)

  const active = STEPS[step]
  const ActiveVisual = active.Visual


  /* ──────────────────────────────────────────────────────────────
     STICKY PARALLAX OVERLAP — scroll-driven blur + drift + fade
     ──────────────────────────────────────────────────────────────
     · Hero sticks at top (z-0). As the user scrolls, the foreground
       slab (z-10, opaque bg) climbs up and covers the hero.
     · Effect cadence (inspired by the Payard reference):
         [0.02 → 0.26]  blur(0px)    → blur(14px)   ← primary tell
         [0.04 → 0.28]  y:0          → y:-60 px     ← "pulled behind"
         [0.16 → 0.34]  opacity:1    → opacity:0    ← delayed fade
       Blur starts *immediately* on first scroll so the user's eye
       reads the text "going out of focus" long before it fades. The
       y-drift reinforces the sense the copy is sliding behind the
       rising card, and opacity only begins to drop once the text is
       already significantly blurred — recreating the soft,
       depth-of-field feel of the reference instead of a harsh fade.
     · GPU contract: motion.div animates `transform`, `opacity` and
       `filter` — all compositor-thread properties, zero layout
       reflow. `useMotionTemplate` builds the `blur(<px>px)` string
       from a MotionValue so React never re-renders on scroll.
       Tailwind `will-change-transform` hints layer promotion.
  ────────────────────────────────────────────────────────────── */
  const parallaxRef = useRef<HTMLDivElement>(null)
  const prefersReducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: parallaxRef,
    offset: ['start start', 'end start'],
  })
  const heroOpacity = useTransform(scrollYProgress, [0.16, 0.34], [1, 0])
  const heroY       = useTransform(scrollYProgress, [0.04, 0.28], [0, -60])
  const heroBlurPx  = useTransform(scrollYProgress, [0.02, 0.26], [0, 14])
  const heroFilter  = useMotionTemplate`blur(${heroBlurPx}px)`

  /* ──────────────────────────────────────────────────────────────
     FOREGROUND SLAB · parallax lift
     ──────────────────────────────────────────────────────────────
     Without this transform, the slab moves up ONLY at scroll speed
     (1:1 with document). Visually that reads as "passive" — the
     card doesn't feel like it's *climbing* over the hero, it just
     slides into view.

     Adding a negative `y` that ramps from 0 → -180 px across the
     same scroll window as the hero blur means the slab rises
     FASTER than the document scroll during the overlap phase. Per
     unit of scroll the card gains extra altitude, recreating the
     Payard-style "card is actively climbing over the headline"
     sensation the user is asking for.

     After 0.26 progress the transform holds at -180 (no further
     climb) so the rest of the page still scrolls 1:1 — no rubber-
     banding, no visible shift below the hero zone.
  ────────────────────────────────────────────────────────────── */
  const slabY = useTransform(scrollYProgress, [0, 0.26], [0, -180])

  /* ──────────────────────────────────────────────────────────────
     CARD MICRO-INTERACTIONS — two-layer hover effect
     ──────────────────────────────────────────────────────────────
     1) Outer pathway card (clinician / engineer):
          rest  → scale 1,    zIndex 1
          hover → scale 1.03, zIndex 50   (spring — overlaps sibling)

     2) Inner reveal box (description + CTA pill, frosted glass):
          rest  → opacity 0, y 20px       (tucked below, invisible)
          hover → opacity 1, y 0          (floats into place, spring)

     Children inherit the parent's `hover`/`rest` state via Framer
     Motion's variant propagation, so a single pointer-enter on the
     outer card drives BOTH animations in lockstep.

     Touch / mobile: `useCanHover()` detects `(hover: hover)` media
     query. If hover is unavailable, we force both cards into the
     "hover" state permanently so the reveal box is always visible
     (otherwise the CTA would be unreachable on touch devices).

     Reduced motion: when user prefers reduced motion, scale snaps
     1→1 (no bump) and the reveal box still appears but without the
     spring — a subtle opacity crossfade only.
  ────────────────────────────────────────────────────────────── */
  const canHover = useCanHover()

  /*
    Per-card hover state. We drive BOTH the outer card (scale/zIndex)
    and the inner reveal box from the same boolean so the two
    animations are perfectly in lockstep. Using explicit state here
    is intentional — Framer Motion's automatic variant propagation
    via `whileHover` only covers the direct motion component; once
    the inner reveal motion.div wanted its OWN transition + initial
    state, propagation proved brittle (children kept missing the
    parent's hover variant). A shared hover flag is bullet-proof.

    On touch devices (`!canHover`) the outer card stays at "rest"
    (no scale bump) while the inner reveal box is forced to "hover"
    permanently so the CTA remains reachable.
  */
  const [clinicianHovered, setClinicianHovered] = useState(false)
  const [engineerHovered,  setEngineerHovered]  = useState(false)

  const clinicianOuterState = canHover ? (clinicianHovered ? 'hover' : 'rest') : 'rest'
  const engineerOuterState  = canHover ? (engineerHovered  ? 'hover' : 'rest') : 'rest'

  const cardSpring = prefersReducedMotion
    ? { duration: 0.2 }
    : { type: 'spring' as const, stiffness: 260, damping: 22, mass: 0.9 }

  const cardOverlapVariants: Variants = {
    rest:  { scale: 1,                               zIndex: 1,  transition: cardSpring },
    hover: { scale: prefersReducedMotion ? 1 : 1.02, zIndex: 50, transition: cardSpring },
  }

  return (
    <div className="min-h-screen flex flex-col font-body bg-[#E8F4F7] overflow-x-hidden antialiased">
      <TopNav />

      <main className="flex-grow pb-0 relative bg-hai-offwhite">
        {/*
          ──────────────────────────────────────────────────────────────
          STICKY PARALLAX OVERLAP ZONE
          ──────────────────────────────────────────────────────────────
          Two physical layers, one visual composition:

            Layer 1 (z-0, background) — `sticky top-0 h-screen` hero.
              Pins to the viewport. Badge + headline + subtitle fade
              (opacity 1 → 0) and drift up (y 0 → -60 px) as the
              foreground climbs over it.

            Layer 2 (z-10, foreground) — solid off-white slab carrying
              the "Join the Directory" panel, stats ribbon, giant
              "Platform" wordmark, 4-card platform grid and CTA row.
              Pulled up with `-mt-[20vh] md:-mt-[28vh]` so the Join
              panel is already *peeking* at page-load. As the user
              scrolls, this slab climbs up and fully occludes the
              sticky hero (its `bg-hai-offwhite` is opaque = zero
              bleed-through).

          ──────────────────────────────────────────────────────────────
        */}
        <div ref={parallaxRef} className="relative">

          {/* ── HERO · sticky background layer (z-0) ───────────
              `min-h-[720px]` gives the hero a longer sticky budget on
              tall viewports so the foreground slab has plenty of room
              to climb completely over it before the parent container
              runs out and un-sticks the hero. */}
          {/*
            items-start + large top padding (instead of items-center) —
            pins the hero copy near the upper third of the viewport so
            that as the foreground slab rises it *never clips* the
            headline. The full "Healthcare co-creation, without the
            silos." headline stays readable through the entire blur
            lifecycle; the card climbs over empty teal space below it
            before starting to encroach on the copy.
          */}
          <section
            aria-labelledby="hero-headline"
            className="sticky top-0 z-0 w-full overflow-hidden flex items-start justify-center pt-24 sm:pt-28 md:pt-32 pb-16 bg-[#E8F4F7]"
          >
            {/* dot atmosphere */}
            <div
              aria-hidden
              className="absolute inset-0 pointer-events-none"
              style={{ backgroundImage: 'radial-gradient(circle at center, rgba(54,33,62,0.04) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
            />
            {/* soft glow */}
            <div
              aria-hidden
              className="absolute top-[18%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-white/60 rounded-full blur-[100px] pointer-events-none"
            />

            <motion.div
              style={{
                opacity: prefersReducedMotion ? 1 : heroOpacity,
                y:       prefersReducedMotion ? 0 : heroY,
                filter:  prefersReducedMotion ? 'none' : heroFilter,
              }}
              className="relative text-center max-w-5xl mx-auto px-6 md:px-8 will-change-[transform,filter,opacity]"
            >
              <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-md border border-hai-teal/40 rounded-full px-4 py-1.5 mb-6 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-hai-plum animate-pulse" />
                SENG 384 · Spring 2026 · v0.1
              </div>
              <h1
                id="hero-headline"
                className="font-headline font-bold text-hai-plum leading-[1.0] tracking-[-0.03em] text-[42px] sm:text-[60px] md:text-[72px] lg:text-[84px]"
              >
                Healthcare co-creation,<br />
                <span className="opacity-25">without the silos.</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-[17px] md:text-[19px] leading-relaxed text-hai-plum/65 font-medium">
                A structured, GDPR-native directory where European clinicians and engineers publish, match, and meet — all under institutional <span className="font-bold text-hai-plum">.edu</span> verification and an immutable audit trail.
              </p>
            </motion.div>

          </section>

          {/* ── FOREGROUND · teal→off-white gradient slab (z-10) ──
              Climbs up over the sticky hero. Negative margin pulls the
              slab UP into the hero zone so the "Join the Directory"
              panel is peeking at page-load.

              Its background is a vertical gradient that starts in the
              SAME teal as the sticky hero (so slab ↔ hero merge
              seamlessly during the overlap climb) and fades to
              off-white right before the "Platform" wordmark. The
              effect recreates the pre-parallax atmosphere: teal
              atmosphere extends across the Join Directory cards and
              calmly resolves to off-white from the Platform section
              onwards.

              The gradient is OPAQUE — still fully occludes the hero
              when scrolled. The plum-tinted shadow was removed
              because with a teal top edge there is no longer a
              colour contrast for the halo to read against (both
              surfaces are teal at the seam).
          */}
          {/*
            Negative margin defines how deeply the slab "peeks" into
            the hero at rest. Previous values (-20vh / -28vh) climbed
            so deep that the headline's second line + subtitle landed
            in the slab's feather zone and became illegible before any
            scroll. New values (-10vh / -14vh) keep a clear visual
            HINT of the pathway panel below the fold — enough to say
            "there's something to scroll to" — while guaranteeing that
            the FULL hero copy, down to the last word of the subtitle,
            is uncovered at scrollY = 0 across every reasonable
            viewport height (≥ 640 px).
          */}
          <motion.div
            className="relative z-10 -mt-4 will-change-transform"
            style={{
              /*
                Top 3% ramps from transparent → solid teal so the slab's
                leading edge BLENDS into the sticky hero's teal instead
                of landing as a hard horizontal line. Both layers share
                #8AC6D0, so even a 3% alpha ramp (≈ 100 px on a 3500 px
                slab) is enough to dissolve the seam completely while
                preserving the calm teal-to-off-white journey below.
              */
              background: 'linear-gradient(180deg, rgba(232,244,247,0) 0%, #E8F4F7 3%, #E8F4F7 14%, #F3F4F6 57%, #F3F4F6 100%)',
              y: prefersReducedMotion ? 0 : slabY,
            }}
          >

            <section
              id="directory"
              className="max-w-[1420px] mx-auto px-6 md:px-10 pt-6 md:pt-10 pb-20 md:pb-24 relative"
            >

            {/* ── Pathway cards ─────────────────────────────── */}
            <div className="relative mb-12">
              <div className="relative rounded-[36px] bg-white px-6 pb-7 pt-6 shadow-[0_30px_86px_-66px_rgba(45,24,56,0.55),0_-14px_50px_-18px_rgba(255,255,255,0.9)] md:px-8 md:pb-8 md:pt-8">
                <div className="mb-7 flex items-center justify-between px-1">
                  <p className="text-[12px] font-mono tracking-[0.32em] uppercase text-[#77728f] font-black">Join the Directory</p>
                </div>

                <div className="relative grid gap-5 md:grid-cols-2">

                  {/* ───── Engineer card (LEFT) ───── */}
                  <motion.div
                    className="relative min-h-[430px] overflow-hidden rounded-[28px] bg-[#f8f9fb] text-neutral-900 will-change-transform"
                    variants={cardOverlapVariants}
                    initial="rest"
                    animate={engineerOuterState}
                    onHoverStart={() => canHover && setEngineerHovered(true)}
                    onHoverEnd={() => canHover && setEngineerHovered(false)}
                  >
                    {/* Content — stacks naturally from top, no h-full stretch */}
                    <div className="relative z-10 flex min-h-[430px] flex-col p-7 pb-8 sm:p-10 md:w-[56%] lg:p-11">
                      <span className="mb-10 inline-flex items-center gap-3 text-[12px] font-mono font-black uppercase tracking-[0.24em] text-[#2d2844]">
                        <span className="h-4 w-1 bg-[#4933a3]" />
                        FOR ENGINEERS
                      </span>
                      <h2 className="font-headline text-[2.35rem] font-black leading-[1.12] tracking-[-0.035em] text-hai-plum sm:text-[2.75rem] lg:text-[3.05rem]">
                        Build with clinical insight.
                      </h2>
                      <p className="mt-7 max-w-[330px] font-body text-[17px] font-semibold leading-[1.55] text-[#514d62]">
                        Share your idea or look for the right healthcare partner to co-create solutions.
                      </p>
                      <Link
                        to={ROUTES.REGISTER}
                        className="mt-auto inline-flex w-[260px] items-center justify-between border-b-2 border-[#b9b2e0] pb-4 text-[16px] font-black text-hai-plum transition hover:border-hai-plum"
                      >
                        Create Engineer Account
                        <span className="text-[34px] leading-none">→</span>
                      </Link>
                    </div>
                    {/* Portrait — right half, desktop only. Stretches to card height. */}
                    <HeroPortraitCard side="engineer" cardBg="#f8f9fb" />
                    {/* Mobile portrait strip */}
                    <div className="md:hidden w-full h-44 relative overflow-hidden">
                      <img
                        src="/images/engineer-portrait.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: '50% 15%' }}
                      />
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#f8f9fb] to-transparent" />
                    </div>
                  </motion.div>

                  {/* ───── Healthcare Professional card (RIGHT) ───── */}
                  <motion.div
                    className="relative min-h-[430px] overflow-hidden rounded-[28px] bg-[#f8fbfc] text-neutral-900 will-change-transform"
                    variants={cardOverlapVariants}
                    initial="rest"
                    animate={clinicianOuterState}
                    onHoverStart={() => canHover && setClinicianHovered(true)}
                    onHoverEnd={() => canHover && setClinicianHovered(false)}
                  >
                    {/* Content — stacks naturally from top */}
                    <div className="relative z-10 flex min-h-[430px] flex-col p-7 pb-8 sm:p-10 md:w-[56%] lg:p-11">
                      <span className="mb-10 inline-flex items-center gap-3 text-[12px] font-mono font-black uppercase tracking-[0.24em] text-[#2d2844]">
                        <span className="h-4 w-1 bg-[#72d6dd]" />
                        FOR HEALTHCARE PROFESSIONALS
                      </span>
                      <h2 className="font-headline text-[2.35rem] font-black leading-[1.12] tracking-[-0.035em] text-hai-plum sm:text-[2.75rem] lg:text-[3.05rem]">
                        Shape technology that matters.
                      </h2>
                      <p className="mt-7 max-w-[340px] font-body text-[17px] font-semibold leading-[1.55] text-[#514d62]">
                        Collaborate with engineers on real clinical needs and innovations.
                      </p>
                      <Link
                        to={ROUTES.REGISTER}
                        className="mt-auto inline-flex w-[300px] items-center justify-between border-b-2 border-[#9fdde4] pb-5 text-[18px] font-black text-hai-plum transition after:text-[34px] after:leading-none after:content-['→'] hover:border-hai-plum [&>span]:hidden"
                      >
                        Create HCP Account
                        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-hai-mint/30 text-[10px] font-bold">♦</span>
                      </Link>
                    </div>
                    {/* Portrait — right half, desktop only. Stretches to card height. */}
                    <HeroPortraitCard side="clinician" cardBg="#f8fbfc" />
                    {/* Mobile portrait strip */}
                    <div className="md:hidden w-full h-44 relative overflow-hidden">
                      <img
                        src="/images/clinician-portrait.png"
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ objectPosition: '65% 15%' }}
                      />
                      <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-[#f8fbfc] to-transparent" />
                    </div>
                  </motion.div>

                </div>

                <div className="mt-9 flex flex-wrap items-center justify-center gap-x-10 gap-y-4 pt-2">
                  {([
                    ['language',        'EU hosted & GDPR-native'],
                    ['verified_user',   'Immutable audit trail'],
                    ['lock',            'Zero patient data'],
                    ['account_balance', 'Built for European institutions'],
                  ] as [string, string][]).map(([icon, label], index) => (
                    <span key={label} className="flex items-center gap-4 text-[12px] font-mono font-black uppercase tracking-[0.18em] text-[#77728f]">
                      {index > 0 && <span className="hidden h-5 w-px bg-[#d9d7e4] lg:block" />}
                      <Icon name={icon} className="text-[20px] text-[#77728f]" filled />
                      {label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Trust badges ribbon */}
            <div className="hidden flex-wrap items-center justify-center gap-x-8 md:gap-x-10 gap-y-3 mb-14">
              {([
                ['language',        '.EU hosted & GDPR-native'],
                ['history',         'Immutable audit trail'],
                ['block',           'Zero patient data'],
                ['account_balance', 'Built for European institutions'],
              ] as [string, string][]).map(([icon, label]) => (
                <span key={label} className="flex items-center gap-2 text-[11px] font-mono tracking-[0.14em] uppercase text-hai-plum/70 font-bold">
                  <Icon name={icon} className="text-[16px] text-hai-plum/60" filled />
                  {label}
                </span>
              ))}
            </div>

            {/* Giant "Platform" wordmark — on off-white, uses ghost tone */}
            <div className="text-center">
              <h2 className="text-[5.5rem] sm:text-[8rem] md:text-[10rem] font-headline font-bold leading-none tracking-[-0.04em]"
                style={{ color: '#36213E', opacity: 0.08 }}>
                Platform
              </h2>
            </div>
          </section>

          {/* ── PLATFORM · 4 cards ─────────────────────────── */}
          <section id="platform" className="max-w-7xl mx-auto px-6 md:px-8 pb-20 md:pb-24 text-neutral-900">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

              {/* Card 1 — Structured Directory */}
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-neutral-100 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                  <IconSquare icon="account_tree" color="#006C7A" bg="rgba(138,198,208,0.25)" />
                  <h3 className="text-xl font-headline font-bold">Structured Directory</h3>
                </div>
                <div className="flex-grow flex items-center justify-center mb-5 min-h-[200px] bg-hai-cream rounded-2xl p-4 relative overflow-hidden">
                  <div className="w-28 h-36 bg-gradient-to-b from-white to-neutral-200 shadow-xl rounded-sm relative">
                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-20 h-10 bg-white/95 rounded shadow-md border border-neutral-200" />
                    <div className="absolute inset-x-3 top-9  h-1.5 bg-neutral-300 rounded-full" />
                    <div className="absolute inset-x-3 top-12 h-1   bg-neutral-200 rounded-full" />
                    <div className="absolute inset-x-3 bottom-4 h-1.5 bg-hai-teal rounded-full w-1/2" />
                  </div>
                </div>
                <p className="font-body text-[13.5px] text-neutral-600 leading-relaxed">
                  Every post follows a clinical–engineering grammar: domain, expertise required, project stage, confidentiality level. Engineers publish capability, clinicians publish need — matches become meaningful.
                </p>
              </div>

              {/* Card 2 — NDA → Meeting */}
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-neutral-100 flex flex-col h-full">
                <div className="flex flex-col mb-5">
                  <IconSquare icon="shield_lock" color="#5B9E00" bg="rgba(210,255,116,0.35)" />
                  <h3 className="text-xl font-headline font-bold leading-tight mt-4">NDA-first meetings, logged &amp; immutable.</h3>
                </div>
                <div className="grid grid-cols-1 gap-3 mb-5 flex-grow">
                  <div className="bg-neutral-100 rounded-2xl flex items-center justify-between px-5 py-4 min-h-[72px]">
                    <span className="text-neutral-900 font-semibold text-sm">One-page NDA</span>
                    <Icon name="check_circle" filled className="text-emerald-600" />
                  </div>
                  <div className="bg-neutral-100 rounded-2xl flex items-center justify-between px-5 py-4 min-h-[72px]">
                    <span className="text-neutral-900 font-semibold text-sm">Three timeslots</span>
                    <span className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-hai-teal" />
                      <span className="w-2 h-2 rounded-full bg-hai-teal" />
                      <span className="w-2 h-2 rounded-full bg-hai-teal" />
                    </span>
                  </div>
                </div>
                <p className="font-body text-[13.5px] text-neutral-600 leading-relaxed">
                  Express interest. Accept a one-page NDA inline. Propose three timeslots. The post owner confirms — a meeting is scheduled and the handshake is logged in a 24-month audit trail.
                </p>
              </div>

              {/* Card 3 — Matching */}
              <div className="bg-white rounded-3xl p-7 shadow-sm border border-neutral-100 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-5">
                  <IconSquare icon="tune" color="#1E40AF" bg="rgba(59,130,246,0.18)" />
                  <h3 className="text-xl font-headline font-bold leading-tight">Intelligent matching across disciplines.</h3>
                </div>
                <div className="flex-grow flex flex-col items-center justify-center mb-5 bg-indigo-700 rounded-2xl p-6 min-h-[200px] relative overflow-hidden">
                  <div className="w-full max-w-[200px] bg-hai-cream h-11 rounded-lg mb-2 relative z-10 shadow-lg border border-white/20 flex items-center px-3 text-[10px] font-mono uppercase tracking-widest text-neutral-700">
                    Cardiology · ICU
                  </div>
                  <button className="bg-hai-plum text-hai-mint font-bold py-2 px-7 rounded-full relative z-20 -my-3 shadow-lg border-[3px] border-indigo-700 w-max text-sm">
                    Match
                  </button>
                  <div className="w-full max-w-[200px] bg-hai-mint h-11 rounded-lg mt-2 relative z-10 shadow-lg border border-white/20 flex items-center px-3 text-[10px] font-mono uppercase tracking-widest text-hai-plum">
                    Embedded ML · Berlin
                  </div>
                </div>
                <p className="font-body text-[13.5px] text-neutral-600 leading-relaxed">
                  Filter across <b>20 medical domains</b> and <b>12 engineering specialties</b>. By city. By project stage. By collaboration type. City-based match highlights surface the nearest credible partner.
                </p>
              </div>

              {/* Card 4 — GDPR native (dark) */}
              <div className="bg-black text-white rounded-3xl p-7 shadow-sm border border-neutral-800 flex flex-col h-full relative overflow-hidden">
                <div className="flex items-start gap-3 mb-5 relative z-10">
                  <IconSquare icon="public" color="#FFFFFF" bg="rgba(59,130,246,0.9)" />
                  <h3 className="text-xl font-headline font-bold leading-tight">GDPR-native by design.</h3>
                </div>
                <div className="absolute -right-10 -bottom-10 w-64 h-64 rounded-full bg-blue-500/30 blur-2xl z-0" />
                <div className="flex-grow flex items-center justify-center relative z-10 mb-5 min-h-[200px]">
                  <div className="relative w-40 h-40">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-blue-400 via-blue-600 to-black shadow-[0_0_60px_rgba(37,99,235,0.6)] border border-blue-400/40" />
                    <div className="absolute inset-4 rounded-full border border-blue-300/30" />
                    <div className="absolute inset-8 rounded-full border border-blue-300/20" />
                  </div>
                </div>
                <p className="font-body text-[13.5px] text-neutral-300 leading-relaxed relative z-10">
                  Institutional .edu verification, tamper-resistant audit log, export everything, delete everything. No file uploads. No patient data. <b className="text-white">No exceptions.</b>
                </p>
              </div>
            </div>
          </section>

          {/* ── CTA row — last piece of the foreground slab ──── */}
          <section className="max-w-7xl mx-auto px-6 md:px-8 pb-20">
            <div className="bg-white rounded-full p-5 md:p-6 shadow-sm border border-neutral-100 flex items-center justify-between gap-4 flex-wrap">
              <h2 className="text-xl md:text-2xl font-headline font-bold text-neutral-900 ml-2 md:ml-4">Ready to co-create?</h2>
              <Link to={ROUTES.REGISTER} className="bg-hai-teal text-hai-plum px-7 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all">
                Request Access
              </Link>
            </div>
          </section>

          </motion.div>
          {/* ── end foreground slab (z-10, opaque bg-hai-offwhite) ─ */}
        </div>
        {/* ── end parallax container (ref={parallaxRef}) ────────── */}

        {/* ── HOW IT WORKS · interactive step-by-step guide ───── */}
        <section id="how" className="w-full bg-hai-offwhite py-24 md:py-28 border-t border-neutral-200">
          <div className="max-w-7xl mx-auto px-6 md:px-8">

            {/* Section header */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
              <div>
                <p className="text-[11px] font-mono tracking-[0.2em] uppercase text-hai-plum/70 font-bold mb-3">03 · How it works</p>
                <h2 className="text-[3rem] md:text-[5.5rem] font-headline font-bold text-hai-plum tracking-[-0.03em] leading-[0.95]">
                  Four deliberate<br />steps.
                </h2>
              </div>
              <p className="text-base md:text-lg text-neutral-600 max-w-sm leading-relaxed">
                From publishing a collaboration post to logging the handshake — the protocol is the same for every user, every time.
              </p>
            </div>

            {/* Stepper stage */}
            <div className="bg-white rounded-[2rem] shadow-[0_40px_100px_-40px_rgba(54,33,62,0.25)] border border-neutral-100 overflow-hidden relative">
              {/* Progress bar */}
              <div className="h-1.5 bg-neutral-100 relative">
                <div
                  className="absolute top-0 left-0 h-full bg-hai-plum transition-all duration-500 ease-out"
                  style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
                />
              </div>

              {/* Slide viewport */}
              <div className="overflow-hidden">
                <div key={step} className={dir === 'right' ? 'step-in-right' : 'step-in-left'}>
                  <div className="grid md:grid-cols-2 gap-0 items-stretch min-h-[500px]">
                    {/* Left — copy */}
                    <div className="p-8 md:p-12 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-5">
                          <div className="w-12 h-12 rounded-xl bg-hai-mint flex items-center justify-center">
                            <Icon name={active.icon} className="text-hai-plum text-[26px]" filled />
                          </div>
                          <span className="text-[11px] font-mono tracking-[0.2em] uppercase text-hai-plum/70 font-bold">
                            Step {active.num} / 0{STEPS.length}
                          </span>
                        </div>

                        <h3 className="font-headline font-bold text-hai-plum tracking-[-0.035em] leading-[0.95] text-[3.5rem] md:text-[5rem] mb-2">
                          {active.name}<span className="text-hai-teal">.</span>
                        </h3>
                        <p className="text-lg md:text-xl font-headline text-neutral-700 leading-snug mb-6">
                          {active.tagline}
                        </p>
                        <p className="text-[15px] md:text-base text-neutral-600 leading-relaxed max-w-md">
                          {active.desc}
                        </p>
                      </div>

                      {/* Step breadcrumbs */}
                      <div className="mt-10 flex items-center gap-3 flex-wrap">
                        {STEPS.map((s, i) => (
                          <button
                            key={s.num}
                            onClick={() => goTo(i)}
                            className={`flex items-center gap-2 text-[12px] font-mono tracking-[0.14em] uppercase font-bold transition-colors ${i === step ? 'text-hai-plum' : 'text-neutral-400 hover:text-neutral-700'}`}
                            aria-label={`Jump to step ${s.num}`}
                          >
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] transition-all ${i === step ? 'bg-hai-plum text-white' : i < step ? 'bg-hai-teal text-hai-plum' : 'bg-neutral-100 text-neutral-400'}`}>
                              {i < step ? '✓' : s.num}
                            </span>
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Right — visual */}
                    <div
                      className="flex items-center justify-center p-8 md:p-12 relative overflow-hidden"
                      style={{ background: `linear-gradient(160deg, ${active.accent}44 0%, #F3F4F6 100%)` }}
                    >
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(circle at center, rgba(54,33,62,0.05) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
                      />
                      <div className="relative z-10 w-full">
                        <ActiveVisual />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav buttons */}
            <div className="flex items-center justify-between mt-8 gap-4">
              <button
                onClick={prev}
                disabled={step === 0}
                aria-label="Previous step"
                className="group flex items-center gap-3 bg-white border border-neutral-200 rounded-full pl-3 pr-5 py-3 font-bold text-sm text-hai-plum shadow-sm hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <span className="w-9 h-9 rounded-full bg-hai-plum text-white flex items-center justify-center group-hover:-translate-x-0.5 transition-transform">
                  <Icon name="arrow_back" className="text-[20px]" />
                </span>
                {step > 0 ? STEPS[step - 1].name : 'Start'}
              </button>

              <div className="hidden sm:flex items-center gap-2">
                {STEPS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    aria-label={`Go to step ${i + 1}`}
                    className="transition-all"
                    style={{
                      width: i === step ? 32 : 10,
                      height: 10,
                      background: i === step ? '#36213E' : i < step ? '#8AC6D0' : '#D4D4D4',
                      borderRadius: 9999,
                    }}
                  />
                ))}
              </div>

              <button
                onClick={next}
                disabled={step === STEPS.length - 1}
                aria-label="Next step"
                className="group flex items-center gap-3 bg-hai-plum text-white rounded-full pr-3 pl-5 py-3 font-bold text-sm shadow-sm hover:shadow-md disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                {step < STEPS.length - 1 ? STEPS[step + 1].name : 'Done'}
                <span className="w-9 h-9 rounded-full bg-hai-mint text-hai-plum flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                  <Icon name="arrow_forward" className="text-[20px]" />
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* ── STACKED HEADLINES · guarantees ─────────────────── */}
        <section
          id="trust"
          className="w-full bg-hai-mint py-6 pb-28"
          style={{ backgroundImage: 'radial-gradient(circle at center, rgba(54,33,62,0.06) 2px, transparent 2px)', backgroundSize: '32px 32px' }}
        >
          <div className="max-w-7xl mx-auto px-6 md:px-8 text-center flex flex-col gap-6 pt-10">
            <div className="border-y border-hai-teal/50 py-4">
              <h2 className="text-5xl md:text-7xl font-headline font-bold text-hai-plum tracking-[-0.025em]">GDPR-native</h2>
            </div>
            <div className="border-b border-hai-teal/50 pb-4">
              <h2 className="text-5xl md:text-7xl font-headline font-bold text-hai-plum tracking-[-0.025em]">Built for European institutions</h2>
            </div>
            <div className="border-b border-hai-teal/50 py-8 max-w-3xl mx-auto w-full">
              <p className="text-hai-plum font-semibold text-lg leading-relaxed">
                Planning a medical–engineering collaboration? Every interaction is governed by institutional <b>.edu</b> verification, a <b>24-month tamper-resistant audit log</b>, and a zero-patient-data policy. No file uploads. No ambiguity. Every Article 6 &amp; 15–22 right is exercisable from your profile, one click away.
              </p>
            </div>
            <div className="border-b border-hai-teal/50 pb-4">
              <h3 className="text-5xl md:text-7xl font-headline font-bold text-hai-plum tracking-[-0.025em]">Immutable audit trail</h3>
            </div>
            <div className="border-b border-hai-teal/50 pb-4">
              <h3 className="text-5xl md:text-7xl font-headline font-bold text-hai-plum tracking-[-0.025em]">Zero patient data</h3>
            </div>
          </div>
        </section>

        {/* ── STRUCTURED COLLABORATION ──────────────────────── */}
        <section className="w-full bg-hai-offwhite py-28 md:py-32 relative">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-hai-mint to-transparent pointer-events-none" />
          <div className="max-w-5xl mx-auto px-6 md:px-8 relative z-10">
            <h2 className="text-[3rem] md:text-[5rem] font-headline font-bold text-black tracking-[-0.025em] leading-[0.95] mb-10">
              Structured<br />collaboration.
            </h2>

            <div className="max-w-4xl mb-14 space-y-6">
              <p className="text-xl md:text-[28px] font-headline text-neutral-900 leading-snug">
                We know medical–engineering partnerships can stall in legal uncertainty, vague scope, and the wrong introduction. Our protocol is designed to make the first conversation easy — and the handshake legitimate.
              </p>
              <p className="text-xl md:text-[28px] font-headline text-neutral-900 leading-snug">
                Think of the platform as the common ground: a shared grammar, a shared NDA, a shared log — so every meeting starts on record.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-5">
                <div className="bg-white rounded-2xl p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-neutral-100 flex items-center justify-between group cursor-pointer hover:shadow-md transition-shadow">
                  <span className="font-body text-lg md:text-xl font-semibold text-neutral-900">Directory &amp; Matching</span>
                  <Icon name="add" className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                </div>
                <div className="bg-white rounded-2xl p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-neutral-100 flex items-center justify-between group cursor-pointer hover:shadow-md transition-shadow">
                  <span className="font-body text-lg md:text-xl font-semibold text-neutral-900">Institutional Verification</span>
                  <Icon name="add" className="text-neutral-400 group-hover:text-neutral-900 transition-colors" />
                </div>
              </div>

              <div className="space-y-5">
                <div className="bg-hai-teal rounded-2xl p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between group cursor-pointer hover:shadow-md transition-shadow h-[88px]">
                  <span className="font-body text-lg md:text-xl font-semibold text-neutral-900">NDA &amp; Meeting Flow</span>
                  <Icon name="add" className="text-neutral-900" />
                </div>
                <div className="bg-hai-teal rounded-2xl p-7 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] flex items-center justify-between">
                  <span className="font-body text-base md:text-lg font-semibold text-neutral-900 max-w-[170px] leading-tight">Have any questions about the platform?</span>
                  <Link to={ROUTES.PRIVACY} className="bg-hai-plum text-hai-mint px-6 py-3 rounded-full font-bold text-sm hover:opacity-90 transition-all shadow-sm whitespace-nowrap">
                    Read policy →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── UPCOMING FEATURES ──────────────────────────────── */}
        <section className="w-full bg-hai-offwhite py-24 border-t border-neutral-200">
          <div className="max-w-5xl mx-auto px-6 md:px-8 text-center mb-14">
            <h2 className="text-[4rem] md:text-[7rem] font-headline font-bold text-black tracking-[-0.04em] leading-[0.95] mb-4">
              Upcoming<br />Features
            </h2>
            <p className="text-base md:text-lg text-neutral-600 max-w-xl mx-auto">
              The protocol is live. Here is what we're scoping next.
            </p>
          </div>
          <div className="max-w-4xl mx-auto px-6 md:px-8">
            {[
              { icon: 'payments', title: 'Cross-Institutional Grants', desc: 'Co-apply to European funding calls with shared draft templates, compliance checklists, and a joint submission timeline.' },
              { icon: 'monitoring', title: 'Outcome Tracking', desc: 'Track collaboration milestones after the first meeting, with opt-in timelines and post-publication logging.' },
              { icon: 'groups', title: 'Multi-Site Clinical Trials', desc: 'Coordinate recruitment and protocol reviews across multiple institutions within the directory.' },
            ].map((f) => (
              <div key={f.title} className="flex flex-col md:flex-row items-start md:items-center py-7 border-b border-neutral-300 gap-6 md:gap-12">
                <div className="flex items-center gap-5 w-full md:w-1/2">
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm border border-neutral-100 flex items-center justify-center shrink-0">
                    <Icon name={f.icon} className="text-[28px] text-hai-plum" filled />
                  </div>
                  <h3 className="text-xl md:text-2xl font-headline font-semibold text-black">{f.title}</h3>
                </div>
                <p className="text-[15px] md:text-base text-neutral-600 font-body leading-relaxed w-full md:w-1/2">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="w-full bg-hai-plum pt-16 font-body text-hai-mint relative flex flex-col">
        <div className="px-6 md:px-16 lg:px-24 grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-12 relative z-10">
          <div>
            <h4 className="font-bold mb-4 text-lg font-headline">Contact</h4>
            <p className="font-semibold text-[15px] leading-snug text-hai-mint/90">
              Bilkent University<br />
              Dept. of Software Engineering<br />
              06800 Çankaya, Ankara<br />
              TÜRKİYE
            </p>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-lg font-headline">Platform</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><a href="#platform" className="hover:text-white transition-colors">Platform</a></li>
              <li><a href="#directory" className="hover:text-white transition-colors">Directory</a></li>
              <li><a href="#how" className="hover:text-white transition-colors">How it works</a></li>
              <li><a href="#trust" className="hover:text-white transition-colors">Trust &amp; GDPR</a></li>
              <li><Link to={ROUTES.LOGIN} className="hover:text-white transition-colors">Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-lg font-headline">Legal</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">GDPR &amp; your rights</Link></li>
              <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">Data Export</Link></li>
              <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link to={ROUTES.PRIVACY} className="hover:text-white transition-colors">Account Deletion</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-lg font-headline">Access</h4>
            <ul className="space-y-2 text-sm font-medium">
              <li><Link to={ROUTES.REGISTER} className="hover:text-white transition-colors">For Clinicians</Link></li>
              <li><Link to={ROUTES.REGISTER} className="hover:text-white transition-colors">For Engineers</Link></li>
              <li><Link to={ROUTES.REGISTER} className="hover:text-white transition-colors">Request Access</Link></li>
              <li><a href="mailto:team@healthai.edu" className="hover:text-white transition-colors">Contact team</a></li>
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
            className="font-headline font-bold text-white tracking-[-0.05em] leading-[0.9] w-full text-center block whitespace-nowrap"
            style={{ fontSize: 'clamp(56px, 16vw, 240px)' }}
          >
            healthai
          </span>
        </div>

        {/* Bottom strip */}
        <div className="px-6 md:px-16 lg:px-24 py-8 mt-6 flex justify-between items-end relative z-10 w-full text-hai-teal gap-8 flex-wrap border-t border-hai-teal/20">
          <div className="text-xs font-medium text-hai-teal font-mono tracking-wider">
            2026<br />Copyright<br />HealthAI
          </div>
          <div className="flex items-end justify-between flex-grow ml-4 md:ml-12 gap-6 flex-wrap">
            <div className="text-[10px] font-medium text-hai-teal/80 leading-snug font-mono tracking-wide max-w-sm">
              <p>SENG 384 · Spring 2026 · v0.1 · last audited 20·04·2026</p>
              <p>Institutional .edu accounts only. Verification is automated and one-time.</p>
              <p>No file uploads. No patient data. No exceptions.</p>
            </div>
            <div className="text-[10px] font-medium text-hai-teal/80 shrink-0 ml-4 font-mono tracking-wide">
              Built in Europe · by Team HealthAI
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
