import { useState } from 'react'
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

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
  e.currentTarget.style.borderColor = 'var(--primary)'
  e.currentTarget.style.boxShadow = 'oklch(0.28 0.04 220 / .10) 0 0 0 3px'
}
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>, err?: string) => {
  e.currentTarget.style.borderColor = err ? '#ef4444' : 'var(--rule)'
  e.currentTarget.style.boxShadow = 'none'
}

function DeleteModal({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const [typed, setTyped] = useState('')
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'oklch(0 0 0 / .55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px 16px' }}>
      <div style={{ background: 'var(--paper)', border: '1px solid #ef4444', width: '100%', maxWidth: 440, padding: 32 }}>
        <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, letterSpacing: '.14em', textTransform: 'uppercase', color: '#ef4444', marginBottom: 16 }}>Danger zone</div>
        <h2 style={{ fontFamily: 'var(--ff-display)', fontSize: 22, fontWeight: 400, color: 'var(--ink)', margin: '0 0 16px' }}>Delete your account?</h2>
        <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.6, margin: '0 0 20px' }}>
          This action cannot be undone. All your posts and meetings will be removed.
          In this demo, no data is actually deleted.
        </p>
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--ink-muted)', display: 'block', marginBottom: 8 }}>
            Type <strong style={{ color: 'var(--ink)' }}>DELETE</strong> to confirm
          </label>
          <input
            value={typed}
            onChange={e => setTyped(e.target.value)}
            placeholder="DELETE"
            style={{ ...inputStyle(), fontFamily: 'var(--ff-mono)' }}
            autoFocus
          />
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '11px', background: 'none', border: '1px solid var(--rule)', fontFamily: 'var(--ff-sans)', fontSize: 14, cursor: 'pointer', color: 'var(--ink)' }}>
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={typed !== 'DELETE'}
            style={{ flex: 1, padding: '11px', background: typed === 'DELETE' ? '#ef4444' : 'var(--rule)', border: 'none', fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500, cursor: typed === 'DELETE' ? 'pointer' : 'not-allowed', color: 'var(--paper)' }}
          >
            Delete account
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuthStore()
  const { posts } = usePostStore()
  const { meetings } = useMeetingStore()
  const navigate = useNavigate()

  const [saved, setSaved] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>(user?.expertiseTags ?? [])

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
  }

  const handleDelete = () => {
    logout()
    navigate(ROUTES.HOME)
  }

  const ROLE_LABEL: Record<string, string> = {
    engineer: 'Engineer', healthcare_professional: 'Healthcare Professional', admin: 'Administrator',
  }

  const mono: React.CSSProperties = { fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: 'var(--ink-muted)' }

  return (
    <PageWrapper maxWidth={660}>
      <div style={{ ...mono, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40, display: 'flex', gap: 16 }}>
        <span style={{ color: 'var(--primary)' }}>16</span>
        <span>Profile</span>
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.025em', margin: '0 0 36px', color: 'var(--ink)' }}>
        Your profile.
      </h1>

      {/* Avatar + role header */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center', padding: '20px 24px', background: 'var(--paper-2)', border: '1px solid var(--rule)', marginBottom: 36 }}>
        <div style={{ width: 52, height: 52, borderRadius: '50%', border: '1.5px solid var(--rule)', background: 'color-mix(in oklab, var(--primary) 12%, var(--paper))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--ff-sans)', fontWeight: 700, fontSize: 18, color: 'var(--primary)', flexShrink: 0 }}>
          {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontFamily: 'var(--ff-sans)', fontWeight: 600, fontSize: 17, color: 'var(--ink)' }}>{user.name}</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', marginTop: 3 }}>{ROLE_LABEL[user.role]} · {user.email}</div>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: 'var(--ink-muted)', marginTop: 2 }}>
            Member since {new Date(user.createdAt).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Save success banner */}
      {saved && (
        <div style={{ marginBottom: 24, padding: '11px 16px', background: 'oklch(0.93 0.06 145)', border: '1px solid oklch(0.52 0.14 145)', fontFamily: 'var(--ff-sans)', fontSize: 13.5, color: 'oklch(0.32 0.10 145)' }}>
          Profile updated successfully.
        </div>
      )}

      {/* Edit form */}
      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 22, marginBottom: 48 }}>
        <FormField label="Full name" error={errors.name?.message} required>
          <input {...register('name')} type="text" style={inputStyle(errors.name?.message)}
            onFocus={focusIn} onBlur={e => focusOut(e, errors.name?.message)} />
        </FormField>

        <FormField label="Institution" error={errors.institution?.message} required>
          <input {...register('institution')} type="text" style={inputStyle(errors.institution?.message)}
            onFocus={focusIn} onBlur={e => focusOut(e, errors.institution?.message)} />
        </FormField>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField label="City" error={errors.city?.message} required>
            <input {...register('city')} type="text" style={inputStyle(errors.city?.message)}
              onFocus={focusIn} onBlur={e => focusOut(e, errors.city?.message)} />
          </FormField>
          <FormField label="Country" error={errors.country?.message} required>
            <input {...register('country')} type="text" style={inputStyle(errors.country?.message)}
              onFocus={focusIn} onBlur={e => focusOut(e, errors.country?.message)} />
          </FormField>
        </div>

        <FormField label="Bio" hint="Optional · max 400 chars">
          <textarea {...register('bio')} rows={4} placeholder="Briefly describe your background and interests…"
            style={{ ...inputStyle(errors.bio?.message), resize: 'vertical', lineHeight: 1.6 }}
            onFocus={focusIn} onBlur={e => focusOut(e, errors.bio?.message)} />
        </FormField>

        {/* Expertise tags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <label style={{ fontFamily: 'var(--ff-sans)', fontWeight: 500, fontSize: 13.5, color: 'var(--ink)' }}>
            Expertise tags <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--ink-muted)' }}>— press Enter to add</span>
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="e.g. Cardiology"
              style={{ ...inputStyle(), flex: 1 }}
              onFocus={focusIn} onBlur={focusOut}
            />
            <button type="button" onClick={addTag} style={{ padding: '10px 16px', background: 'var(--paper-2)', border: '1.5px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 11, cursor: 'pointer', color: 'var(--ink)', whiteSpace: 'nowrap' }}>
              Add
            </button>
          </div>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 4 }}>
              {tags.map(t => (
                <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--paper-2)', border: '1px solid var(--rule)', padding: '4px 10px', fontFamily: 'var(--ff-mono)', fontSize: 11 }}>
                  {t}
                  <button type="button" onClick={() => removeTag(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 14, lineHeight: 1, padding: 0 }}>×</button>
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          type="submit"
          style={{ padding: '13px', background: 'var(--ink)', color: 'var(--paper)', border: 'none', fontFamily: 'var(--ff-sans)', fontSize: 15, fontWeight: 500, cursor: 'pointer', marginTop: 4 }}
        >
          Save changes →
        </button>
      </form>

      {/* GDPR section */}
      <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 36 }}>
        <div style={{ ...mono, marginBottom: 20 }}>GDPR — Your data rights</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Export */}
          <div style={{ padding: '20px 24px', border: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--ff-sans)', fontWeight: 500, fontSize: 14.5, color: 'var(--ink)', marginBottom: 4 }}>Export my data</div>
              <div style={{ fontFamily: 'var(--ff-sans)', fontSize: 13, color: 'var(--ink-muted)' }}>Download all your profile, post and meeting data as JSON (GDPR Art. 20).</div>
            </div>
            <button
              onClick={handleExport}
              style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', background: 'var(--paper-2)', border: '1px solid var(--rule)', padding: '10px 20px', cursor: 'pointer', color: 'var(--ink)', whiteSpace: 'nowrap' }}
            >
              ↓ Export JSON
            </button>
          </div>

          {/* Delete */}
          <div style={{ padding: '20px 24px', border: '1px solid #ef4444', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--ff-sans)', fontWeight: 500, fontSize: 14.5, color: '#ef4444', marginBottom: 4 }}>Delete account</div>
              <div style={{ fontFamily: 'var(--ff-sans)', fontSize: 13, color: 'var(--ink-muted)' }}>Permanently delete your account and all associated data (GDPR Art. 17). Demo only.</div>
            </div>
            <button
              onClick={() => setShowDelete(true)}
              style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', background: 'none', border: '1px solid #ef4444', padding: '10px 20px', cursor: 'pointer', color: '#ef4444', whiteSpace: 'nowrap' }}
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {showDelete && (
        <DeleteModal onCancel={() => setShowDelete(false)} onConfirm={handleDelete} />
      )}
    </PageWrapper>
  )
}
