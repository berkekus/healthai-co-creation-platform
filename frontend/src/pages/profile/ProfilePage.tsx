import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { useMeetingStore } from '../../store/meetingStore'
import { profileSchema, type ProfileFormData } from '../../utils/validators'
import FormField, { inputStyle } from '../../components/ui/FormField'
import PageWrapper from '../../components/layout/PageWrapper'
import { ROUTES } from '../../constants/routes'

const FOCUS_SHADOW = '0 0 0 3px rgba(138,198,208,0.32)'
const ERROR_SHADOW = '0 0 0 3px rgba(220,38,38,0.18)'

const onInputFocus = (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = hasError ? '#DC2626' : '#36213E'
  e.currentTarget.style.boxShadow = hasError ? ERROR_SHADOW : FOCUS_SHADOW
}
const onInputBlur = (hasError: boolean) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = hasError ? '#DC2626' : '#E5E5E5'
  e.currentTarget.style.boxShadow = 'none'
}

const ROLE_LABEL: Record<string, string> = {
  engineer:                'Engineer',
  healthcare_professional: 'Healthcare Professional',
  admin:                   'Administrator',
}
const ROLE_ICON: Record<string, string> = {
  engineer:                'memory',
  healthcare_professional: 'stethoscope',
  admin:                   'admin_panel_settings',
}

function SectionCard({
  index, title, subtitle, children,
}: {
  index: string
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-[1.75rem] border border-neutral-100 p-6 md:p-7 flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <div className="shrink-0 w-9 h-9 rounded-full bg-hai-mint text-hai-plum flex items-center justify-center font-mono font-bold text-[11px] tracking-[0.08em]">
          {index}
        </div>
        <div>
          <div className="font-headline font-bold text-[20px] leading-tight tracking-[-0.015em] text-hai-plum">
            {title}
          </div>
          {subtitle && (
            <div className="text-[12.5px] text-neutral-500 leading-relaxed mt-1">{subtitle}</div>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState('')
  const canDelete = typed === 'DELETE'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-hai-plum/70 backdrop-blur-sm font-body"
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-[480px] rounded-[2rem] shadow-[0_40px_120px_-20px_rgba(54,33,62,0.5)] overflow-hidden">
        <div className="px-7 pt-7 pb-6">
          <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-3 py-1 mb-4 text-[10.5px] font-mono tracking-[0.16em] uppercase font-bold">
            <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>warning</span>
            Danger zone
          </div>
          <h2 className="font-headline font-bold text-[24px] leading-tight tracking-[-0.02em] text-hai-plum mb-3">
            Delete your account?
          </h2>
          <p className="text-[14px] text-neutral-600 leading-relaxed mb-5">
            This action cannot be undone. All your posts and meetings will be removed.
            In this demo, no data is actually deleted — you'll simply be signed out.
          </p>

          <label className="block mb-5">
            <span className="block text-[11px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold mb-2">
              Type <span className="text-hai-plum">DELETE</span> to confirm
            </span>
            <input
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="DELETE"
              autoFocus
              className="w-full bg-hai-offwhite border border-neutral-200 rounded-xl px-4 py-3 text-[14px] font-mono font-bold text-hai-plum outline-none focus:border-red-400 focus:bg-white focus:shadow-[0_0_0_3px_rgba(220,38,38,0.18)] transition-all"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-5 py-3 rounded-full bg-white border border-neutral-200 text-hai-plum text-[13px] font-bold hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!canDelete}
              className={`flex-1 px-5 py-3 rounded-full text-[13px] font-bold transition-colors inline-flex items-center justify-center gap-1.5 ${
                canDelete
                  ? 'bg-red-600 text-white hover:bg-red-700 shadow-[0_10px_30px_-10px_rgba(220,38,38,0.5)]'
                  : 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">delete_forever</span>
              Delete account
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateProfile, uploadAvatar, logout } = useAuthStore()
  const { posts } = usePostStore()
  const { meetings } = useMeetingStore()
  const navigate = useNavigate()

  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(user?.expertiseTags ?? [])
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!ALLOWED.includes(file.type)) {
      setAvatarError('Only JPEG, PNG, WebP, or GIF images are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Image must be under 5 MB')
      return
    }
    setAvatarError(null)
    const previewUrl = URL.createObjectURL(file)
    setAvatarPreview(previewUrl)
    setAvatarUploading(true)
    await uploadAvatar(file)
    setAvatarUploading(false)
    URL.revokeObjectURL(previewUrl)
    setAvatarPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name:        user?.name ?? '',
      institution: user?.institution ?? '',
      city:        user?.city ?? '',
      country:     user?.country ?? '',
      bio:         user?.bio ?? '',
    },
  })

  if (!user) return null

  const onSubmit = (data: ProfileFormData) => {
    updateProfile({ ...data, expertiseTags: tags })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }
  const removeTag = (t: string) => setTags(prev => prev.filter(x => x !== t))

  const handleExport = () => {
    const userPosts = posts.filter(p => p.authorId === user.id)
    const userMeetings = meetings.filter(m => m.requesterId === user.id || m.ownerId === user.id)
    const payload = {
      exportedAt: new Date().toISOString(),
      profile: { ...user },
      posts: userPosts,
      meetings: userMeetings,
      gdprNote: 'Data exported per GDPR Article 20 (Right to Data Portability). Retained for 24 months.',
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `healthai-data-${user.id}-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setExportSuccess(true)
    setTimeout(() => setExportSuccess(false), 2500)
  }

  const handleDelete = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
  const userPostCount = posts.filter(p => p.authorId === user.id).length
  const userMeetingCount = meetings.filter(m => m.requesterId === user.id || m.ownerId === user.id).length
  const memberSince = new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })

  return (
    <PageWrapper maxWidth={820}>

      {/* Header card */}
      <div className="bg-white rounded-[2rem] border border-neutral-100 shadow-[0_30px_80px_-30px_rgba(54,33,62,0.12)] p-6 md:p-10 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none opacity-60" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
        <div className="relative">
          <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-4 py-1.5 mb-5 text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
            <span className="text-hai-plum/70">16</span>
            <span>Profile</span>
          </div>

          <h1 className="font-headline font-bold text-[40px] md:text-[56px] leading-[0.98] tracking-[-0.035em] text-hai-plum mb-6">
            Your profile<span className="text-hai-teal">.</span>
          </h1>

          {/* Identity row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 bg-hai-offwhite rounded-[1.5rem] p-5">
            <div className="shrink-0 w-16 h-16 rounded-full overflow-hidden bg-hai-plum text-hai-mint flex items-center justify-center font-mono font-bold text-[20px] tracking-[0.06em]">
              {(avatarPreview ?? user.avatarUrl)
                ? <img src={avatarPreview ?? user.avatarUrl} alt={user.name} className="w-full h-full object-cover" onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; (e.currentTarget.nextElementSibling as HTMLElement | null)?.removeAttribute('hidden') }} />
                : null}
              <span hidden={!!(avatarPreview ?? user.avatarUrl)}>{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-headline font-bold text-[22px] leading-tight text-hai-plum truncate">{user.name}</div>
              <div className="mt-1.5 flex items-center gap-2 flex-wrap text-[11px] font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold">
                <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1 text-hai-plum">
                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                    {ROLE_ICON[user.role] ?? 'person'}
                  </span>
                  {ROLE_LABEL[user.role]}
                </span>
                {user.isVerified && (
                  <span className="inline-flex items-center gap-1 bg-hai-mint text-hai-plum rounded-full px-2.5 py-1">
                    <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                    Verified
                  </span>
                )}
              </div>
              <div className="mt-1 font-mono text-[11.5px] text-neutral-500 truncate">{user.email}</div>
              <div className="mt-1 font-mono text-[10.5px] text-neutral-400">Member since {memberSince}</div>
            </div>
            <div className="flex sm:flex-col gap-2 shrink-0">
              <div className="bg-white rounded-2xl px-4 py-2.5 text-center min-w-[76px]">
                <div className="font-headline font-bold text-[20px] leading-none text-hai-plum">{userPostCount}</div>
                <div className="mt-1 text-[9.5px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold">Posts</div>
              </div>
              <div className="bg-white rounded-2xl px-4 py-2.5 text-center min-w-[76px]">
                <div className="font-headline font-bold text-[20px] leading-none text-hai-plum">{userMeetingCount}</div>
                <div className="mt-1 text-[9.5px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold">Meetings</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save success banner */}
      {saved && (
        <div className="mb-5 bg-hai-mint border border-hai-teal/40 rounded-2xl p-3.5 flex items-center gap-2.5 text-[13.5px] text-hai-plum font-body font-medium">
          <span className="material-symbols-outlined text-hai-plum text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
          Profile updated successfully.
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
        <SectionCard index="01" title="Identity" subtitle="Your name and affiliation — visible to other members.">
          <div className="flex flex-col gap-4">
            <FormField label="Full name" error={errors.name?.message} required>
              <input {...register('name')} type="text"
                style={inputStyle(errors.name?.message)}
                onFocus={onInputFocus(!!errors.name)}
                onBlur={onInputBlur(!!errors.name)} />
            </FormField>
            <FormField label="Institution" error={errors.institution?.message} required>
              <input {...register('institution')} type="text"
                style={inputStyle(errors.institution?.message)}
                onFocus={onInputFocus(!!errors.institution)}
                onBlur={onInputBlur(!!errors.institution)} />
            </FormField>
            <FormField label="Profile photo">
              <div className="flex items-center gap-4">
                <div className="relative shrink-0 w-16 h-16 rounded-full overflow-hidden bg-hai-plum text-hai-mint flex items-center justify-center font-mono font-bold text-[20px] tracking-[0.06em]">
                  {(avatarPreview ?? user.avatarUrl) ? (
                    <img src={avatarPreview ?? user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                  {avatarUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-hai-plum/60">
                      <span className="material-symbols-outlined text-white text-[20px] animate-spin">progress_activity</span>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-hai-plum text-white text-[12px] font-mono tracking-[0.1em] uppercase font-bold hover:bg-black disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">upload</span>
                    {avatarUploading ? 'Uploading…' : 'Upload photo'}
                  </button>
                  <p className="text-[11px] font-mono text-neutral-400">JPEG, PNG, WebP or GIF · max 5 MB</p>
                  {avatarError && (
                    <p className="text-[11px] text-red-500">{avatarError}</p>
                  )}
                </div>
              </div>
            </FormField>
          </div>
        </SectionCard>

        <SectionCard index="02" title="Location" subtitle="Helps surface posts in your region for cross-team matching.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="City" error={errors.city?.message} required>
              <input {...register('city')} type="text"
                style={inputStyle(errors.city?.message)}
                onFocus={onInputFocus(!!errors.city)}
                onBlur={onInputBlur(!!errors.city)} />
            </FormField>
            <FormField label="Country" error={errors.country?.message} required>
              <input {...register('country')} type="text"
                style={inputStyle(errors.country?.message)}
                onFocus={onInputFocus(!!errors.country)}
                onBlur={onInputBlur(!!errors.country)} />
            </FormField>
          </div>
        </SectionCard>

        <SectionCard index="03" title="About" subtitle="Briefly describe your background, interests, and what you bring to collaborations.">
          <FormField label="Bio" hint="Optional · max 400 chars" error={errors.bio?.message}>
            <textarea {...register('bio')} rows={5} placeholder="Briefly describe your background and interests…"
              style={{ ...inputStyle(errors.bio?.message), resize: 'vertical', lineHeight: 1.6 }}
              onFocus={onInputFocus(!!errors.bio)}
              onBlur={onInputBlur(!!errors.bio)} />
          </FormField>
        </SectionCard>

        <SectionCard index="04" title="Expertise tags" subtitle="Used by our matching engine to surface relevant collaboration posts.">
          <div className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="e.g. Cardiology, Federated Learning, DICOM…"
                style={inputStyle()}
                onFocus={onInputFocus(false)}
                onBlur={onInputBlur(false)}
              />
              <button
                type="button"
                onClick={addTag}
                disabled={!tagInput.trim()}
                className="shrink-0 px-5 rounded-xl bg-hai-plum text-white text-[12px] font-mono tracking-[0.1em] uppercase font-bold hover:bg-black disabled:bg-neutral-300 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[15px]">add</span>
                Add
              </button>
            </div>
            {tags.length === 0 ? (
              <div className="border-2 border-dashed border-neutral-200 rounded-2xl py-6 px-4 text-center">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-hai-mint/40 mb-2">
                  <span className="material-symbols-outlined text-hai-plum text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>auto_awesome</span>
                </div>
                <p className="text-[12.5px] text-neutral-500 font-body leading-relaxed">
                  No tags yet. Add keywords to improve post matching.
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1.5 bg-hai-lime text-hai-plum rounded-full pl-3 pr-1.5 py-1 text-[12px] font-body font-bold">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      aria-label={`Remove ${t}`}
                      className="w-5 h-5 rounded-full bg-hai-plum/10 hover:bg-hai-plum hover:text-hai-mint text-hai-plum flex items-center justify-center transition-colors"
                    >
                      <span className="material-symbols-outlined text-[13px]">close</span>
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </SectionCard>

        {/* Save action */}
        <div className="sticky bottom-4 z-10 mt-2 bg-white rounded-full border border-neutral-100 shadow-[0_20px_50px_-20px_rgba(54,33,62,0.25)] p-2 flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-2 pl-4 text-[10.5px] font-mono tracking-[0.14em] uppercase text-neutral-500 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
            Unsaved changes are kept locally
          </span>
          <button
            type="submit"
            className="ml-auto px-6 py-3 rounded-full bg-hai-plum text-white text-[13px] font-bold hover:bg-black transition-colors inline-flex items-center gap-2 shadow-[0_10px_30px_-10px_rgba(54,33,62,0.4)]"
          >
            Save changes <span aria-hidden="true">→</span>
          </button>
        </div>
      </form>

      {/* GDPR section */}
      <div className="mt-10">
        <div className="flex items-center gap-2 mb-4 px-1">
          <span className="material-symbols-outlined text-hai-plum text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>
            shield_lock
          </span>
          <span className="text-[11px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
            GDPR · Your data rights
          </span>
        </div>

        {exportSuccess && (
          <div className="mb-4 bg-hai-mint border border-hai-teal/40 rounded-2xl p-3.5 flex items-center gap-2.5 text-[13.5px] text-hai-plum font-body font-medium">
            <span className="material-symbols-outlined text-hai-plum text-[18px]" style={{ fontVariationSettings: '"FILL" 1' }}>download_done</span>
            Your data export has started. Check your downloads.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Export card */}
          <div className="bg-white rounded-[1.5rem] border border-neutral-100 p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-28 h-28 pointer-events-none opacity-70" style={{ background: 'radial-gradient(circle, #D2FF74 0%, transparent 70%)' }} />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-hai-lime text-hai-plum mb-3">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>download</span>
              </div>
              <div className="font-headline font-bold text-[17px] leading-tight text-hai-plum mb-1">
                Export my data
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed mb-4">
                Download your profile, posts and meetings as a portable JSON file.
              </p>
              <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-neutral-400 font-bold mb-4">
                GDPR Art. 20 · Right to data portability
              </div>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 bg-hai-plum text-white rounded-full px-5 py-2.5 text-[12px] font-mono tracking-[0.1em] uppercase font-bold hover:bg-black transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">file_download</span>
                Export JSON
              </button>
            </div>
          </div>

          {/* Delete card */}
          <div className="bg-white rounded-[1.5rem] border-2 border-red-100 p-5 flex flex-col gap-4 relative overflow-hidden">
            <div className="relative">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-2xl bg-red-50 text-red-600 mb-3">
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>delete_forever</span>
              </div>
              <div className="font-headline font-bold text-[17px] leading-tight text-red-600 mb-1">
                Delete account
              </div>
              <p className="text-[13px] text-neutral-600 leading-relaxed mb-4">
                Permanently remove your account and all associated data. This action cannot be undone.
              </p>
              <div className="text-[10px] font-mono tracking-[0.14em] uppercase text-neutral-400 font-bold mb-4">
                GDPR Art. 17 · Right to erasure · Demo only
              </div>
              <button
                onClick={() => setShowDelete(true)}
                className="inline-flex items-center gap-2 bg-white border border-red-200 text-red-600 rounded-full px-5 py-2.5 text-[12px] font-mono tracking-[0.1em] uppercase font-bold hover:bg-red-50 transition-colors"
              >
                <span className="material-symbols-outlined text-[15px]">warning</span>
                Delete account
              </button>
            </div>
          </div>
        </div>

        <p className="mt-6 flex items-start gap-2 text-[11.5px] font-mono tracking-[0.06em] text-neutral-500 leading-relaxed px-1">
          <span className="material-symbols-outlined text-[14px] mt-0.5 shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
          All data is stored encrypted at rest. Audit logs related to your account are retained for 24 months per our privacy policy, even after account deletion.
        </p>
      </div>

      {showDelete && (
        <DeleteModal onCancel={() => setShowDelete(false)} onConfirm={handleDelete} />
      )}
    </PageWrapper>
  )
}
