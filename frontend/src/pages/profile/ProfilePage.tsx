import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import PageWrapper from '../../components/layout/PageWrapper'
import FormField, { inputStyle } from '../../components/ui/FormField'
import { ROUTES } from '../../constants/routes'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
import type { User } from '../../types/auth.types'
import { profileSchema, type ProfileFormData } from '../../utils/validators'

const FOCUS_SHADOW = '0 0 0 3px rgba(138,198,208,0.32)'
const ERROR_SHADOW = '0 0 0 3px rgba(220,38,38,0.18)'
const API_ORIGIN = (import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api').replace(/\/api$/, '')

const EXPERTISE_TAGS = [
  // Clinical domains
  'Cardiology', 'Neurology', 'Oncology', 'Orthopedics', 'Radiology',
  'Geriatrics & Rehabilitation', 'Endocrinology & Diabetes', 'Gastroenterology',
  'Public Health & Epidemiology', 'Clinical Pharmacy', 'Mental Health',
  'Infectious Diseases', 'Pediatrics', 'Dermatology', 'Ophthalmology',
  'Emergency Medicine', 'Surgery', 'Pulmonology', 'Nephrology', 'Rheumatology',
  // Engineering / tech
  'AI/ML', 'Deep Learning', 'Natural Language Processing', 'Computer Vision',
  'Federated Learning', 'Wearables', 'Digital Health', 'mHealth',
  'Clinical NLP', 'Electronic Health Records (EHR)', 'Telemedicine',
  'Medical Imaging', 'Biostatistics', 'Data Science', 'IoT in Healthcare',
  'Healthcare Informatics', 'Signal Processing', 'Time Series Analysis',
  'Bioinformatics', 'Robotics', 'Drug Discovery', 'Genomics',
]

const ROLE_LABEL: Record<string, string> = {
  engineer: 'Engineer',
  healthcare_professional: 'Healthcare Professional',
  admin: 'Administrator',
}

const ROLE_ICON: Record<string, string> = {
  engineer: 'memory',
  healthcare_professional: 'stethoscope',
  admin: 'admin_panel_settings',
}

const resolveAvatar = (url?: string | null) => {
  if (!url) return null
  if (url.startsWith('/uploads/')) return `${API_ORIGIN}${url}`
  return url
}

const onInputFocus = (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = hasError ? '#DC2626' : '#36213E'
  e.currentTarget.style.boxShadow = hasError ? ERROR_SHADOW : FOCUS_SHADOW
}

const onInputBlur = (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = hasError ? '#DC2626' : '#E5E5E5'
  e.currentTarget.style.boxShadow = 'none'
}

function TagAutocomplete({
  value,
  onChange,
  onAdd,
  activeTags,
}: {
  value: string
  onChange: (v: string) => void
  onAdd: (tag: string) => void
  activeTags: string[]
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const query = value.trim().toLowerCase()
  const suggestions = query.length > 0
    ? EXPERTISE_TAGS.filter(t => t.toLowerCase().includes(query) && !activeTags.includes(t)).slice(0, 8)
    : []

  const add = (tag: string) => {
    if (tag && !activeTags.includes(tag)) onAdd(tag)
    onChange('')
    setOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (suggestions.length > 0) add(suggestions[0])
      else if (value.trim()) add(value.trim())
    }
    if (e.key === 'Escape') setOpen(false)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="relative flex-1">
      <input
        value={value}
        onChange={e => { onChange(e.target.value); setOpen(true) }}
        onKeyDown={handleKeyDown}
        onFocus={e => {
          setOpen(true)
          e.currentTarget.style.borderColor = '#36213E'
          e.currentTarget.style.boxShadow = FOCUS_SHADOW
        }}
        onBlur={e => {
          e.currentTarget.style.borderColor = '#E5E5E5'
          e.currentTarget.style.boxShadow = 'none'
        }}
        placeholder="Search or type a tag… (Enter to add)"
        style={inputStyle()}
      />
      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-[#D5DAE0] bg-white shadow-[0_8px_24px_-8px_rgba(54,33,62,0.18)]">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => add(s)}
              className="w-full px-4 py-2.5 text-left text-sm font-semibold text-hai-plum hover:bg-[#E8F4F7]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Section({
  id,
  icon,
  title,
  subtitle,
  children,
}: {
  id: string
  icon: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="border-b border-[#D5DAE0] py-9 last:border-b-0">
      <div className="mb-7 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-xl text-hai-plum">{icon}</span>
          <h2 className="font-headline text-xl font-black leading-tight text-hai-plum">{title}</h2>
        </div>
        {subtitle && <p className="max-w-[380px] text-right text-sm font-semibold leading-5 text-[#6F6878]">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-8 py-2">
      <div className="text-sm font-semibold text-[#6F6878]">{label}</div>
      <div className="min-w-0 text-base font-black leading-snug text-hai-plum">{children}</div>
    </div>
  )
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: (password: string) => Promise<void> }) {
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !submitting) onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel, submitting])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) return
    setSubmitting(true)
    setError(null)
    try {
      await onConfirm(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete account.')
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-hai-plum/70 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      onClick={e => { if (e.target === e.currentTarget && !submitting) onCancel() }}
    >
      <form onSubmit={handleSubmit} className="w-full max-w-[480px] rounded-[2rem] bg-white px-7 pb-6 pt-7 shadow-[0_40px_120px_-20px_rgba(54,33,62,0.5)]">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-red-600">
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>warning</span>
          Danger zone
        </div>
        <h2 className="mb-3 font-headline text-2xl font-black text-hai-plum">Delete your account?</h2>
        <p className="mb-5 text-sm font-semibold leading-6 text-neutral-600">
          This action cannot be undone. Your profile, posts, and notifications will be permanently deleted. Audit logs are kept for 24 months per our privacy policy.
        </p>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Confirm with your current password"
          autoFocus
          autoComplete="current-password"
          disabled={submitting}
          className="mb-4 w-full rounded-xl border border-neutral-200 bg-hai-offwhite px-4 py-3 text-sm font-semibold text-hai-plum outline-none transition-all focus:border-red-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(220,38,38,0.18)] disabled:opacity-60"
        />
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="flex-1 rounded-full border border-neutral-200 bg-white px-5 py-3 text-sm font-black text-hai-plum hover:bg-neutral-100 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={!password || submitting} className="flex-1 rounded-full bg-red-600 px-5 py-3 text-sm font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500">
            {submitting ? 'Deleting...' : 'Delete account'}
          </button>
        </div>
      </form>
    </div>
  )
}

const NOTIF_KEYS: { key: keyof import('../../types/auth.types').NotifPrefs; labelKey: string; descKey: string }[] = [
  { key: 'meetingRequests',  labelKey: 'profile.notifOptions.meetingRequests',  descKey: 'profile.notifOptions.meetingRequestsDesc' },
  { key: 'meetingUpdates',   labelKey: 'profile.notifOptions.meetingUpdates',   descKey: 'profile.notifOptions.meetingUpdatesDesc' },
  { key: 'interestReceived', labelKey: 'profile.notifOptions.interestReceived', descKey: 'profile.notifOptions.interestReceivedDesc' },
  { key: 'adminMessages',    labelKey: 'profile.notifOptions.adminMessages',    descKey: 'profile.notifOptions.adminMessagesDesc' },
  { key: 'messages',         labelKey: 'profile.notifOptions.messages',         descKey: 'profile.notifOptions.messagesDesc' },
]

function NotifPrefsSection() {
  const { t } = useTranslation()
  const { user, updateNotifPrefs } = useAuthStore()
  const [saving, setSaving] = useState<string | null>(null)

  const defaults = { meetingRequests: true, meetingUpdates: true, interestReceived: true, adminMessages: true, messages: true }
  const prefs = { ...defaults, ...(user?.notifPrefs ?? {}) }

  const toggle = async (key: keyof typeof defaults) => {
    setSaving(key)
    try {
      await updateNotifPrefs({ [key]: !prefs[key] })
    } finally {
      setSaving(null)
    }
  }

  return (
    <section className="border-b border-[#D5DAE0] py-9">
      <div className="mb-7 flex items-center gap-4">
        <span className="material-symbols-outlined text-xl text-hai-plum">notifications</span>
        <h2 className="font-headline text-xl font-black leading-tight text-hai-plum">{t('profile.notifPrefs')}</h2>
      </div>
      <div className="grid gap-3">
        {NOTIF_KEYS.map(({ key, labelKey, descKey }) => (
          <div key={key} className="flex items-center justify-between gap-6 rounded-2xl border border-[#D5DAE0] bg-white px-5 py-4">
            <div>
              <p className="text-sm font-black text-hai-plum">{t(labelKey)}</p>
              <p className="mt-0.5 text-xs font-semibold text-[#6F6878]">{t(descKey)}</p>
            </div>
            <button
              type="button"
              disabled={saving === key}
              onClick={() => toggle(key)}
              aria-pressed={prefs[key]}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-hai-teal/60 focus:ring-offset-2 ${
                prefs[key] ? 'bg-hai-teal' : 'bg-[#D5DAE0]'
              } ${saving === key ? 'opacity-60' : ''}`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  prefs[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}

const COMPLETION_ITEM_KEYS = [
  { labelKey: 'profile.photo',         done: (u: User) => !!u.avatarUrl,                  href: undefined },
  { labelKey: 'profile.bioWritten',    done: (u: User) => (u.bio?.length ?? 0) >= 30,       href: '#about' },
  { labelKey: 'profile.expertiseTags', done: (u: User) => u.expertiseTags.length >= 3,      href: '#expertise' },
  { labelKey: 'profile.emailVerified', done: (u: User) => u.isVerified,                     href: undefined },
] as const

const COMPLETION_ITEMS = (user: User | null) => {
  if (!user) return []
  return COMPLETION_ITEM_KEYS.map(item => ({
    labelKey: item.labelKey,
    done: item.done(user),
    href: item.href,
  }))
}

function ProfileCompletionCard({ user, onSaved }: { user: User; onSaved?: boolean }) {
  const { t } = useTranslation()
  const items = COMPLETION_ITEMS(user)
  const [aiScore, setAiScore] = useState<number | null>(null)
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([])
  const [aiLoading, setAiLoading] = useState(false)

  const localOptionalDone = items.filter(i => i.done).length
  const localScore = 40 + Math.round((localOptionalDone / items.length) * 60)
  const score = aiScore ?? localScore

  useEffect(() => {
    let cancelled = false
    setAiLoading(true)
    api.get<{ success: boolean; data: { score: number; suggestions: string[] } }>('/ai/profile-score')
      .then(res => {
        if (cancelled) return
        setAiScore(res.data.data.score)
        setAiSuggestions(res.data.data.suggestions)
      })
      .catch(() => { /* fallback to local score */ })
      .finally(() => { if (!cancelled) setAiLoading(false) })
    return () => { cancelled = true }
  }, [onSaved])

  const r = 22
  const cx = 28
  const circumference = 2 * Math.PI * r
  const dashOffset = circumference * (1 - score / 100)
  const color = score >= 85 ? '#6FB8C4' : score >= 60 ? '#F59E0B' : '#EF4444'
  const activeSuggestions = aiSuggestions.length > 0 ? aiSuggestions : items.filter(i => !i.done).map(i => t(i.labelKey))

  return (
    <div className="mt-6 rounded-2xl border border-[#D5DAE0] bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="relative" style={{ flexShrink: 0 }}>
          <svg width="56" height="56" viewBox="0 0 56 56">
            <circle cx={cx} cy={cx} r={r} fill="none" stroke="#EEF0F3" strokeWidth="5" />
            <circle
              cx={cx} cy={cx} r={r}
              fill="none"
              stroke={color}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '28px 28px', transition: 'stroke-dashoffset 0.6s ease' }}
            />
            <text x={cx} y={cx + 1} textAnchor="middle" dominantBaseline="middle" fontSize="11" fontWeight="900" fill="#36213E">{score}%</text>
          </svg>
          {aiLoading && (
            <span className="absolute -right-1 -top-1 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-hai-teal opacity-60" />
              <span className="relative inline-flex h-3 w-3 rounded-full bg-hai-teal" />
            </span>
          )}
        </div>
        <div>
          <p className="flex items-center gap-1 text-xs font-black text-hai-plum">
            {t('profile.strength')}
            {aiScore !== null && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-[#E8F4F7] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-hai-teal">
                <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
                AI
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-[#6F6878]">
            {score === 100 ? t('profile.complete') : score >= 70 ? t('profile.almostThere') : t('profile.keepGoing')}
          </p>
        </div>
      </div>

      {activeSuggestions.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {activeSuggestions.map((suggestion, i) => (
            <li key={i} className="flex items-start gap-2">
              <span
                className="material-symbols-outlined mt-0.5 shrink-0 text-sm"
                style={{ fontVariationSettings: '"FILL" 1', color: '#D1D5DB' }}
              >radio_button_unchecked</span>
              <span className="text-xs font-semibold text-hai-plum">{suggestion}</span>
            </li>
          ))}
        </ul>
      )}

      {activeSuggestions.length === 0 && score === 100 && (
        <p className="mt-3 text-xs font-semibold text-hai-teal">{t('profile.complete')}</p>
      )}
    </div>
  )
}

export default function ProfilePage() {
  const { t } = useTranslation()
  const { user, updateProfile, uploadAvatar, deleteAccount } = useAuthStore()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(user?.expertiseTags ?? [])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name ?? '',
      institution: user?.institution ?? '',
      city: user?.city ?? '',
      country: user?.country ?? '',
      bio: user?.bio ?? '',
    },
  })

  if (!user) return null

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const avatarSrc = avatarPreview ?? resolveAvatar(user.avatarUrl)
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) { setAvatarError('Only JPEG, PNG, WebP, or GIF images are allowed'); return }
    if (file.size > 5 * 1024 * 1024) { setAvatarError('Image must be under 5 MB'); return }
    setAvatarError(null)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setAvatarUploading(true)
    try {
      await uploadAvatar(file)
    } finally {
      setAvatarUploading(false)
      URL.revokeObjectURL(previewUrl)
      setAvatarPreview(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const onSubmit = async (data: ProfileFormData) => {
    await updateProfile({ ...data, expertiseTags: tags })
    setSaved(true)
    setIsEditing(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleCancel = () => {
    reset({
      name: user.name ?? '',
      institution: user.institution ?? '',
      city: user.city ?? '',
      country: user.country ?? '',
      bio: user.bio ?? '',
    })
    setTags(user.expertiseTags ?? [])
    setTagInput('')
    setAvatarError(null)
    setIsEditing(false)
  }

  const handleExport = async () => {
    try {
      const { data: blob } = await api.get('/auth/me/export', { responseType: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `healthai-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setExportSuccess(true)
      setTimeout(() => setExportSuccess(false), 2500)
    } catch {
      // Export is non-critical UI; the API layer will surface auth/session failures globally.
    }
  }

  const handleDelete = async (password: string) => {
    await deleteAccount(password)
    navigate(ROUTES.HOME)
  }

  return (
    <PageWrapper maxWidth={1180} padTop={38} className="pb-8">
      <div className="profile-page-layout">
        <aside className="profile-profile-rail rounded-[22px] bg-white/78 px-5 py-8 shadow-[0_32px_80px_-58px_rgba(54,33,62,0.42)]">
          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={avatarUploading}
              className="relative h-16 w-16 overflow-hidden rounded-full bg-hai-plum text-xl font-black tracking-normal text-hai-mint"
              aria-label="Upload profile photo"
            >
              {avatarSrc ? <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{initials}</span>}
              {avatarUploading && <span className="absolute inset-0 flex items-center justify-center bg-hai-plum/60 text-white">...</span>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            <h2 className="mt-5 text-lg font-black leading-tight text-hai-plum">{user.name}</h2>
            <p className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#6F6878]">
              <span className="material-symbols-outlined text-base">{ROLE_ICON[user.role] ?? 'person'}</span>
              {ROLE_LABEL[user.role]}
            </p>
            {user.isVerified && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#E8F4F7] px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-hai-plum">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                {t('common.verified')}
              </span>
            )}
            {avatarError && <p className="mt-3 text-xs font-semibold text-red-500">{avatarError}</p>}
          </div>

          <ProfileCompletionCard user={user} onSaved={saved} />

          <nav className="mt-8 space-y-3 text-sm font-black text-hai-plum">
            {([
              ['person', t('profile.identity'), '#identity'],
              ['badge', t('profile.identity'), '#identity'],
              ['location_on', t('profile.location'), '#location'],
              ['chat_bubble_outline', t('profile.about'), '#about'],
              ['star', t('profile.expertise'), '#expertise'],
              ['lock', t('profile.privacy'), '#data-account'],
            ] as [string, string, string][]).map(([icon, label, href], index) => (
              <a key={label + index} href={href} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[#E8F4F7] ${index === 0 ? 'bg-[#E8F4F7] text-[#6FB8C4]' : ''}`}>
                <span className="material-symbols-outlined text-lg">{icon}</span>
                {label}
              </a>
            ))}
          </nav>

          <div className="profile-help-card rounded-2xl bg-[#EEF0F3] p-4">
            <div className="text-xs font-black text-hai-plum">{t('profile.help.title')}</div>
            <p className="mt-3 text-xs font-semibold leading-5 text-[#6F6878]">{t('profile.help.desc')}</p>
            <button className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#D5DAE0] bg-white text-xs font-black text-hai-plum">
              <span className="material-symbols-outlined text-base">support_agent</span>
              {t('profile.help.contact')}
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-8 pt-10">
            <div>
              <h1 className="font-headline text-5xl font-black leading-none tracking-normal text-hai-plum">
                {t('profile.title')}<span className="text-hai-teal">.</span>
              </h1>
              <p className="mt-5 text-base font-semibold text-[#6F6878]">{t('profile.subtitle')}</p>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="mt-1 inline-flex items-center gap-2 rounded-full bg-hai-plum px-7 py-3 text-sm font-black text-white shadow-[0_18px_36px_-22px_rgba(54,33,62,0.7)]">
                <span className="material-symbols-outlined text-base">edit</span>
                {t('profile.edit')}
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={handleCancel} className="rounded-full border border-[#D5DAE0] bg-white px-5 py-3 text-sm font-black text-hai-plum">{t('profile.cancel')}</button>
                <button form="profile-form" type="submit" className="rounded-full bg-hai-plum px-6 py-3 text-sm font-black text-white">{t('profile.save')}</button>
              </div>
            )}
          </div>

          {saved && <div className="mt-7 rounded-2xl border border-hai-teal/40 bg-hai-mint/70 px-5 py-4 text-sm font-bold text-hai-plum">{t('profile.saved')}</div>}

          <div className="mt-10 flex items-center justify-between gap-6 rounded-[22px] bg-[#E8F4F7] px-7 py-8">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#D7EEF2] text-[#6FB8C4]">
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>verified_user</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-hai-plum">Verified {ROLE_LABEL[user.role]}</h2>
                <p className="mt-2 text-sm font-semibold text-[#6F6878]">Your profile has been verified. You can now connect and collaborate with others.</p>
              </div>
            </div>
            <button className="rounded-full border border-[#D5DAE0] px-6 py-3 text-sm font-black text-hai-plum">Learn more</button>
          </div>

          <form id="profile-form" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9">
            <Section id="identity" icon="badge" title={t('profile.identity')}>
              {isEditing ? (
                <div className="grid gap-4">
                  <FormField label={t('profile.fields.fullName')} error={errors.name?.message} required>
                    <input {...register('name')} type="text" style={inputStyle(errors.name?.message)} onFocus={onInputFocus(!!errors.name)} onBlur={onInputBlur(!!errors.name)} />
                  </FormField>
                  <FormField label={t('profile.fields.institution')} error={errors.institution?.message} required>
                    <input {...register('institution')} type="text" style={inputStyle(errors.institution?.message)} onFocus={onInputFocus(!!errors.institution)} onBlur={onInputBlur(!!errors.institution)} />
                  </FormField>
                </div>
              ) : (
                <div className="grid gap-3">
                  <FieldRow label={t('profile.fields.fullName')}>{user.name}</FieldRow>
                  <FieldRow label={t('profile.fields.institution')}>{user.institution}</FieldRow>
                  <FieldRow label={t('profile.fields.email')}>
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {user.email}
                      <span className="rounded-full bg-[#E8F4F7] px-2 py-0.5 text-xs font-black uppercase tracking-[0.12em] text-[#6F6878]">.edu only</span>
                    </span>
                  </FieldRow>
                  <FieldRow label={t('profile.fields.memberSince')}>{memberSince}</FieldRow>
                </div>
              )}
            </Section>

            <Section id="location" icon="location_on" title={t('profile.location')}>
              {isEditing ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label={t('profile.fields.city')} error={errors.city?.message} required>
                    <input {...register('city')} type="text" style={inputStyle(errors.city?.message)} onFocus={onInputFocus(!!errors.city)} onBlur={onInputBlur(!!errors.city)} />
                  </FormField>
                  <FormField label={t('profile.fields.country')} error={errors.country?.message} required>
                    <input {...register('country')} type="text" style={inputStyle(errors.country?.message)} onFocus={onInputFocus(!!errors.country)} onBlur={onInputBlur(!!errors.country)} />
                  </FormField>
                </div>
              ) : (
                <div className="grid gap-3">
                  <FieldRow label={t('profile.fields.city')}>{user.city || <span className="text-neutral-400">{t('common.noData')}</span>}</FieldRow>
                  <FieldRow label={t('profile.fields.country')}>{user.country || <span className="text-neutral-400">{t('common.noData')}</span>}</FieldRow>
                  <FieldRow label={t('profile.fields.regionVisibility')}>Visible to members <span className="material-symbols-outlined ml-1 align-middle text-base">visibility</span></FieldRow>
                </div>
              )}
            </Section>

            <Section id="about" icon="chat_bubble_outline" title={t('profile.about')}>
              {isEditing ? (
                <FormField label={t('profile.fields.bio')} hint={t('profile.fields.bioHint')} error={errors.bio?.message}>
                  <textarea {...register('bio')} rows={5} placeholder={t('profile.fields.bioPlaceholder')} style={{ ...inputStyle(errors.bio?.message), resize: 'vertical', lineHeight: 1.6 }} onFocus={onInputFocus(!!errors.bio)} onBlur={onInputBlur(!!errors.bio)} />
                </FormField>
              ) : (
                <p className="max-w-[650px] text-base font-semibold leading-7 text-hai-plum">{user.bio || t('common.noData')}</p>
              )}
            </Section>

            <Section id="expertise" icon="star" title={t('profile.expertise')}>
              {isEditing && (
                <div className="mb-4">
                  <TagAutocomplete
                    value={tagInput}
                    onChange={setTagInput}
                    onAdd={tag => setTags(prev => [...prev, tag])}
                    activeTags={tags}
                  />
                </div>
              )}
              <div className="flex flex-wrap gap-3">
                {tags.length > 0 ? tags.map(tag => (
                  <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-[#EEF0F3] px-4 py-1.5 text-xs font-bold text-hai-plum">
                    {tag}
                    {isEditing && <button type="button" onClick={() => setTags(prev => prev.filter(item => item !== tag))} className="text-sm">x</button>}
                  </span>
                )) : <span className="text-sm font-semibold italic text-neutral-400">{t('common.noData')}</span>}
              </div>
            </Section>
          </form>

          <NotifPrefsSection />

          <section id="data-account" className="py-9">
            <div className="mb-5 flex items-center gap-4">
              <span className="material-symbols-outlined text-xl text-hai-plum">lock</span>
              <h2 className="font-headline text-xl font-black text-hai-plum">{t('profile.data.title')}</h2>
            </div>

            {exportSuccess && <div className="mb-4 rounded-2xl border border-hai-teal/40 bg-hai-mint/70 p-3.5 text-sm font-bold text-hai-plum">{t('profile.data.export')}</div>}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-[22px] bg-white/82 p-6 shadow-[0_28px_74px_-60px_rgba(54,33,62,0.36)]">
                <div className="flex items-start gap-5">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-hai-lime text-hai-plum">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>download</span>
                  </div>
                  <div>
                    <div className="mb-2 font-headline text-lg font-bold leading-tight text-hai-plum">{t('profile.data.export')}</div>
                    <p className="mb-4 text-sm leading-relaxed text-neutral-600">{t('profile.data.exportDesc')}</p>
                    <div className="mb-4 text-xs font-semibold text-neutral-400">{t('profile.data.gdpr20')}</div>
                    <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-full bg-hai-plum px-5 py-2.5 text-xs font-black text-white hover:bg-black">
                      <span className="material-symbols-outlined text-base">file_download</span>
                      {t('profile.data.exportBtn')}
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] bg-white/82 p-6 shadow-[0_28px_74px_-60px_rgba(54,33,62,0.36)]">
                <div className="flex items-start gap-5">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>delete_forever</span>
                  </div>
                  <div>
                    <div className="mb-2 font-headline text-lg font-bold leading-tight text-red-600">{t('profile.data.delete')}</div>
                    <p className="mb-4 text-sm leading-relaxed text-neutral-600">{t('profile.data.deleteDesc')}</p>
                    <div className="mb-4 text-xs font-semibold text-neutral-400">{t('profile.data.gdpr17')}</div>
                    <button type="button" onClick={() => setShowDelete(true)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-xs font-black text-red-600 hover:bg-red-50">
                      <span className="material-symbols-outlined text-base">warning</span>
                      {t('profile.data.deleteBtn')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 flex items-start gap-4 rounded-2xl border border-[#D5DAE0] bg-white/36 px-6 py-5 text-xs font-semibold leading-relaxed text-neutral-500">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-sm" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
              All data is stored encrypted at rest. Audit logs related to your account are retained for 24 months per our privacy policy, even after account deletion.
            </p>
          </section>

          {showDelete && <DeleteModal onCancel={() => setShowDelete(false)} onConfirm={handleDelete} />}
        </div>
      </div>
    </PageWrapper>
  )
}
