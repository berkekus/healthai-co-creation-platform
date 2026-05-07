import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '../../components/layout/PageWrapper'
import FormField, { inputStyle } from '../../components/ui/FormField'
import { ROUTES } from '../../constants/routes'
import api from '../../lib/api'
import { useAuthStore } from '../../store/authStore'
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
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-[#e5e5e5] bg-white shadow-[0_8px_24px_-8px_rgba(54,33,62,0.18)]">
          {suggestions.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={() => add(s)}
              className="w-full px-4 py-2.5 text-left text-[13px] font-semibold text-hai-plum hover:bg-[#f5f3ff]"
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
    <section id={id} className="border-b border-[#dde3ea] py-9 last:border-b-0">
      <div className="mb-7 flex items-start justify-between gap-6">
        <div className="flex items-center gap-4">
          <span className="material-symbols-outlined text-[21px] text-hai-plum">{icon}</span>
          <h2 className="font-headline text-[20px] font-black leading-tight text-hai-plum">{title}</h2>
        </div>
        {subtitle && <p className="max-w-[380px] text-right text-[13px] font-semibold leading-5 text-[#77727f]">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[180px_minmax(0,1fr)] gap-8 py-2">
      <div className="text-[14px] font-semibold text-[#77727f]">{label}</div>
      <div className="min-w-0 text-[15px] font-black leading-snug text-hai-plum">{children}</div>
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
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-red-600">
          <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>warning</span>
          Danger zone
        </div>
        <h2 className="mb-3 font-headline text-[24px] font-black text-hai-plum">Delete your account?</h2>
        <p className="mb-5 text-[14px] font-semibold leading-6 text-neutral-600">
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
          className="mb-4 w-full rounded-xl border border-neutral-200 bg-hai-offwhite px-4 py-3 text-[14px] font-semibold text-hai-plum outline-none transition-all focus:border-red-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(220,38,38,0.18)] disabled:opacity-60"
        />
        {error && <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-[13px] font-semibold text-red-700">{error}</div>}
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} disabled={submitting} className="flex-1 rounded-full border border-neutral-200 bg-white px-5 py-3 text-[13px] font-black text-hai-plum hover:bg-neutral-100 disabled:opacity-60">
            Cancel
          </button>
          <button type="submit" disabled={!password || submitting} className="flex-1 rounded-full bg-red-600 px-5 py-3 text-[13px] font-black text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500">
            {submitting ? 'Deleting...' : 'Delete account'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function ProfilePage() {
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
              className="relative h-16 w-16 overflow-hidden rounded-full bg-hai-plum text-[20px] font-black tracking-[0.06em] text-hai-mint"
              aria-label="Upload profile photo"
            >
              {avatarSrc ? <img src={avatarSrc} alt={user.name} className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center">{initials}</span>}
              {avatarUploading && <span className="absolute inset-0 flex items-center justify-center bg-hai-plum/60 text-white">...</span>}
            </button>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={handleAvatarChange} />
            <h2 className="mt-5 text-[17px] font-black leading-tight text-hai-plum">{user.name}</h2>
            <p className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#77727f]">
              <span className="material-symbols-outlined text-[15px]">{ROLE_ICON[user.role] ?? 'person'}</span>
              {ROLE_LABEL[user.role]}
            </p>
            {user.isVerified && (
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[#dff4fb] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-hai-plum">
                <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                Verified
              </span>
            )}
            {avatarError && <p className="mt-3 text-[11px] font-semibold text-red-500">{avatarError}</p>}
          </div>

          <nav className="mt-12 space-y-3 text-[14px] font-black text-hai-plum">
            {[
              ['person', 'Overview', '#identity'],
              ['badge', 'Identity', '#identity'],
              ['location_on', 'Location', '#location'],
              ['chat_bubble_outline', 'About', '#about'],
              ['star', 'Expertise', '#expertise'],
              ['lock', 'Privacy & Data', '#data-account'],
            ].map(([icon, label, href], index) => (
              <a key={label} href={href} className={`flex items-center gap-4 rounded-xl px-4 py-3 transition hover:bg-[#eef9fc] ${index === 0 ? 'bg-[#e8f8fc] text-[#008ed0]' : ''}`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {label}
              </a>
            ))}
          </nav>

          <div className="profile-help-card rounded-2xl bg-[#f2f4f8] p-4">
            <div className="text-[12px] font-black text-hai-plum">Need help?</div>
            <p className="mt-3 text-[11px] font-semibold leading-5 text-[#77727f]">If you have any questions or need support, we're here to help.</p>
            <button className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full border border-[#d9dee7] bg-white text-[12px] font-black text-hai-plum">
              <span className="material-symbols-outlined text-[16px]">support_agent</span>
              Contact support
            </button>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-start justify-between gap-8 pt-10">
            <div>
              <h1 className="font-headline text-[46px] font-black leading-none tracking-[-0.035em] text-hai-plum">
                Your profile<span className="text-hai-teal">.</span>
              </h1>
              <p className="mt-5 text-[15px] font-semibold text-[#6f6978]">Manage your information and preferences.</p>
            </div>
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)} className="mt-1 inline-flex items-center gap-2 rounded-full bg-hai-plum px-7 py-3 text-[13px] font-black text-white shadow-[0_18px_36px_-22px_rgba(54,33,62,0.7)]">
                <span className="material-symbols-outlined text-[16px]">edit</span>
                Edit profile
              </button>
            ) : (
              <div className="flex gap-2">
                <button type="button" onClick={handleCancel} className="rounded-full border border-[#dbe0e8] bg-white px-5 py-3 text-[13px] font-black text-hai-plum">Cancel</button>
                <button form="profile-form" type="submit" className="rounded-full bg-hai-plum px-6 py-3 text-[13px] font-black text-white">Save changes</button>
              </div>
            )}
          </div>

          {saved && <div className="mt-7 rounded-2xl border border-hai-teal/40 bg-hai-mint/70 px-5 py-4 text-[14px] font-bold text-hai-plum">Profile updated successfully.</div>}

          <div className="mt-10 flex items-center justify-between gap-6 rounded-[22px] bg-[#dff4fb] px-7 py-8">
            <div className="flex items-center gap-5">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#c8eef8] text-[#008ed0]">
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified_user</span>
              </div>
              <div>
                <h2 className="text-[18px] font-black text-hai-plum">Verified {ROLE_LABEL[user.role]}</h2>
                <p className="mt-2 text-[13px] font-semibold text-[#5f6877]">Your profile has been verified. You can now connect and collaborate with others.</p>
              </div>
            </div>
            <button className="rounded-full border border-[#bdd7e2] px-6 py-3 text-[13px] font-black text-hai-plum">Learn more</button>
          </div>

          <form id="profile-form" onSubmit={handleSubmit(onSubmit)} noValidate className="mt-9">
            <Section id="identity" icon="badge" title="Identity">
              {isEditing ? (
                <div className="grid gap-4">
                  <FormField label="Full name" error={errors.name?.message} required>
                    <input {...register('name')} type="text" style={inputStyle(errors.name?.message)} onFocus={onInputFocus(!!errors.name)} onBlur={onInputBlur(!!errors.name)} />
                  </FormField>
                  <FormField label="Institution" error={errors.institution?.message} required>
                    <input {...register('institution')} type="text" style={inputStyle(errors.institution?.message)} onFocus={onInputFocus(!!errors.institution)} onBlur={onInputBlur(!!errors.institution)} />
                  </FormField>
                </div>
              ) : (
                <div className="grid gap-3">
                  <FieldRow label="Full name">{user.name}</FieldRow>
                  <FieldRow label="Institution">{user.institution}</FieldRow>
                  <FieldRow label="Professional email">
                    <span className="inline-flex flex-wrap items-center gap-2">
                      {user.email}
                      <span className="rounded-full bg-[#dff4fb] px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#4d7080]">.edu only</span>
                    </span>
                  </FieldRow>
                  <FieldRow label="Member since">{memberSince}</FieldRow>
                </div>
              )}
            </Section>

            <Section id="location" icon="location_on" title="Location">
              {isEditing ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField label="City" error={errors.city?.message} required>
                    <input {...register('city')} type="text" style={inputStyle(errors.city?.message)} onFocus={onInputFocus(!!errors.city)} onBlur={onInputBlur(!!errors.city)} />
                  </FormField>
                  <FormField label="Country" error={errors.country?.message} required>
                    <input {...register('country')} type="text" style={inputStyle(errors.country?.message)} onFocus={onInputFocus(!!errors.country)} onBlur={onInputBlur(!!errors.country)} />
                  </FormField>
                </div>
              ) : (
                <div className="grid gap-3">
                  <FieldRow label="City">{user.city || <span className="text-neutral-400">Not set</span>}</FieldRow>
                  <FieldRow label="Country">{user.country || <span className="text-neutral-400">Not set</span>}</FieldRow>
                  <FieldRow label="Region visibility">Visible to members <span className="material-symbols-outlined ml-1 align-middle text-[15px]">visibility</span></FieldRow>
                </div>
              )}
            </Section>

            <Section id="about" icon="chat_bubble_outline" title="About" subtitle="Briefly describe your background, interests, and what you bring to collaborations.">
              {isEditing ? (
                <FormField label="Bio" hint="Optional - max 400 chars" error={errors.bio?.message}>
                  <textarea {...register('bio')} rows={5} placeholder="Briefly describe your background and interests..." style={{ ...inputStyle(errors.bio?.message), resize: 'vertical', lineHeight: 1.6 }} onFocus={onInputFocus(!!errors.bio)} onBlur={onInputBlur(!!errors.bio)} />
                </FormField>
              ) : (
                <p className="max-w-[650px] text-[15px] font-semibold leading-7 text-hai-plum">{user.bio || 'No bio added yet.'}</p>
              )}
            </Section>

            <Section id="expertise" icon="star" title="Expertise" subtitle="These tags help others find you for relevant opportunities.">
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
                  <span key={tag} className="inline-flex items-center gap-2 rounded-full bg-[#eef0f5] px-4 py-1.5 text-[12px] font-bold text-hai-plum">
                    {tag}
                    {isEditing && <button type="button" onClick={() => setTags(prev => prev.filter(item => item !== tag))} className="text-[14px]">x</button>}
                  </span>
                )) : <span className="text-[13px] font-semibold italic text-neutral-400">No expertise tags added yet.</span>}
              </div>
            </Section>
          </form>

          <section id="data-account" className="py-9">
            <div className="mb-5 flex items-center gap-4">
              <span className="material-symbols-outlined text-[21px] text-hai-plum">lock</span>
              <h2 className="font-headline text-[20px] font-black text-hai-plum">Data & Account</h2>
            </div>

            {exportSuccess && <div className="mb-4 rounded-2xl border border-hai-teal/40 bg-hai-mint/70 p-3.5 text-[13.5px] font-bold text-hai-plum">Your data export has started. Check your downloads.</div>}

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-[22px] bg-white/82 p-6 shadow-[0_28px_74px_-60px_rgba(54,33,62,0.36)]">
                <div className="flex items-start gap-5">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-hai-lime text-hai-plum">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>download</span>
                  </div>
                  <div>
                    <div className="mb-2 font-headline text-[17px] font-bold leading-tight text-hai-plum">Export my data</div>
                    <p className="mb-4 text-[13px] leading-relaxed text-neutral-600">Download your profile, posts and meetings as a portable JSON file.</p>
                    <div className="mb-4 text-[11px] font-semibold text-neutral-400">GDPR Art. 20 - Right to data portability</div>
                    <button type="button" onClick={handleExport} className="inline-flex items-center gap-2 rounded-full bg-hai-plum px-5 py-2.5 text-[12px] font-black text-white hover:bg-black">
                      <span className="material-symbols-outlined text-[15px]">file_download</span>
                      Export JSON
                    </button>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] bg-white/82 p-6 shadow-[0_28px_74px_-60px_rgba(54,33,62,0.36)]">
                <div className="flex items-start gap-5">
                  <div className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>delete_forever</span>
                  </div>
                  <div>
                    <div className="mb-2 font-headline text-[17px] font-bold leading-tight text-red-600">Delete account</div>
                    <p className="mb-4 text-[13px] leading-relaxed text-neutral-600">Permanently remove your account and all associated data. This action cannot be undone.</p>
                    <div className="mb-4 text-[11px] font-semibold text-neutral-400">GDPR Art. 17 - Right to erasure</div>
                    <button type="button" onClick={() => setShowDelete(true)} className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white px-5 py-2.5 text-[12px] font-black text-red-600 hover:bg-red-50">
                      <span className="material-symbols-outlined text-[15px]">warning</span>
                      Delete account
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-6 flex items-start gap-4 rounded-2xl border border-[#dfe4ea] bg-white/36 px-6 py-5 text-[12px] font-semibold leading-relaxed text-neutral-500">
              <span className="material-symbols-outlined mt-0.5 shrink-0 text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
              All data is stored encrypted at rest. Audit logs related to your account are retained for 24 months per our privacy policy, even after account deletion.
            </p>
          </section>

          {showDelete && <DeleteModal onCancel={() => setShowDelete(false)} onConfirm={handleDelete} />}
        </div>
      </div>
    </PageWrapper>
  )
}
