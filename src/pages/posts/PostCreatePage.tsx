import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { postCreateSchema, type PostCreateFormData } from '../../utils/validators'
import FormField, { inputStyle } from '../../components/ui/FormField'
import PageWrapper from '../../components/layout/PageWrapper'
import { postDetail } from '../../constants/routes'

const MEDICAL_DOMAINS = [
  'Cardiology','Oncology','Radiology & Imaging','Neurology','Orthopedics',
  'Dermatology','Ophthalmology','Pediatrics','Psychiatry & Mental Health',
  'Emergency Medicine','Intensive Care (ICU)','Surgical Robotics',
  'Genomics & Precision Medicine','Rehabilitation & Physio','Clinical Pharmacy',
  'Public Health & Epidemiology','Pathology & Lab Diagnostics',
  'Endocrinology & Diabetes','Remote Patient Monitoring','Mental Health AI',
]

const selectStyle = (error?: string): React.CSSProperties => ({
  ...inputStyle(error),
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23888' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: 36,
  cursor: 'pointer',
})

const textareaStyle = (error?: string): React.CSSProperties => ({
  ...inputStyle(error),
  minHeight: 140,
  resize: 'vertical',
  lineHeight: 1.6,
})

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, err?: string) => {
  e.currentTarget.style.borderColor = err ? '#ef4444' : 'var(--primary)'
  e.currentTarget.style.boxShadow = `0 0 0 3px ${err ? 'rgba(239,68,68,.1)' : 'oklch(0.28 0.04 220 / .10)'}`
}
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, err?: string) => {
  e.currentTarget.style.borderColor = err ? '#ef4444' : 'var(--rule)'
  e.currentTarget.style.boxShadow = 'none'
}

export default function PostCreatePage() {
  const { user } = useAuthStore()
  const { create } = usePostStore()
  const navigate = useNavigate()
  const [submitAction, setSubmitAction] = useState<'draft' | 'publish'>('draft')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PostCreateFormData>({
    resolver: zodResolver(postCreateSchema),
    defaultValues: { confidentiality: 'public_pitch', projectStage: 'idea' },
  })

  const onSubmit = (data: PostCreateFormData) => {
    if (!user) return
    const role = user.role === 'admin' ? 'engineer' : user.role
    const post = create(data, user.id, user.name, role as 'engineer' | 'healthcare_professional')
    if (submitAction === 'publish') {
      usePostStore.getState().publish(post.id)
    }
    navigate(postDetail(post.id))
  }

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const sectionLabel: React.CSSProperties = {
    fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.16em',
    textTransform: 'uppercase', color: 'var(--ink-muted)',
  }

  return (
    <PageWrapper maxWidth={720}>
      <div style={{ ...sectionLabel, paddingBottom: 14, borderBottom: '1px solid var(--rule)', marginBottom: 40, display: 'flex', gap: 16 }}>
        <span style={{ color: 'var(--primary)' }}>07</span>
        <span>New Post</span>
        <span style={{ width: 4, height: 4, background: 'var(--ink-muted)', borderRadius: '50%', alignSelf: 'center' }} />
        <span>Post a collaboration opportunity</span>
      </div>

      <h1 style={{ fontFamily: 'var(--ff-display)', fontWeight: 400, fontSize: 'clamp(28px,4vw,40px)', letterSpacing: '-0.025em', margin: '0 0 8px', color: 'var(--ink)' }}>
        Post a collaboration opportunity.
      </h1>
      <p style={{ color: 'var(--ink-muted)', fontSize: 15, margin: '0 0 40px', lineHeight: 1.5 }}>
        Connect with the right partner across engineering and healthcare.
        No file uploads — details are shared in meetings under NDA.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Title */}
        <FormField label="Post title" error={errors.title?.message} required>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g. ECG anomaly detection for ICU bedside monitors"
            style={inputStyle(errors.title?.message)}
            onFocus={e => focusIn(e, errors.title?.message)}
            onBlur={e => focusOut(e, errors.title?.message)}
          />
        </FormField>

        {/* Domain */}
        <FormField label="Medical domain" error={errors.domain?.message} required>
          <select
            {...register('domain')}
            style={selectStyle(errors.domain?.message)}
            onFocus={e => focusIn(e, errors.domain?.message)}
            onBlur={e => focusOut(e, errors.domain?.message)}
          >
            <option value="">Select a domain…</option>
            {MEDICAL_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </FormField>

        {/* Expertise required */}
        <FormField label="Expertise required" error={errors.expertiseRequired?.message} required
          hint="e.g. Signal Processing, Embedded ML">
          <input
            {...register('expertiseRequired')}
            type="text"
            placeholder="Describe the technical or clinical expertise you need"
            style={inputStyle(errors.expertiseRequired?.message)}
            onFocus={e => focusIn(e, errors.expertiseRequired?.message)}
            onBlur={e => focusOut(e, errors.expertiseRequired?.message)}
          />
        </FormField>

        {/* Description */}
        <FormField label="Description" error={errors.description?.message} required
          hint="Min. 50 characters">
          <textarea
            {...register('description')}
            placeholder="Describe your project, what you've built so far, and what you're looking for in a collaborator. Patient data must not be included."
            style={textareaStyle(errors.description?.message)}
            onFocus={e => focusIn(e, errors.description?.message)}
            onBlur={e => focusOut(e, errors.description?.message)}
          />
        </FormField>

        {/* Two columns: Project stage + Collaboration type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField label="Project stage" error={errors.projectStage?.message} required>
            <select
              {...register('projectStage')}
              style={selectStyle(errors.projectStage?.message)}
              onFocus={e => focusIn(e, errors.projectStage?.message)}
              onBlur={e => focusOut(e, errors.projectStage?.message)}
            >
              <option value="idea">Idea</option>
              <option value="concept_validation">Concept Validation</option>
              <option value="prototype">Prototype Developed</option>
              <option value="pilot">Pilot Testing</option>
              <option value="pre_deployment">Pre-Deployment</option>
            </select>
          </FormField>

          <FormField label="Collaboration type" error={errors.collaborationType?.message} required>
            <select
              {...register('collaborationType')}
              style={selectStyle(errors.collaborationType?.message)}
              onFocus={e => focusIn(e, errors.collaborationType?.message)}
              onBlur={e => focusOut(e, errors.collaborationType?.message)}
            >
              <option value="">Select…</option>
              <option value="advisor">Advisor</option>
              <option value="co_founder">Co-Founder</option>
              <option value="research_partner">Research Partner</option>
              <option value="contract">Contract Work</option>
            </select>
          </FormField>
        </div>

        {/* Confidentiality */}
        <FormField label="Confidentiality level" error={errors.confidentiality?.message} required>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 4 }}>
            {([
              { value: 'public_pitch', label: 'Public Pitch', desc: 'Short idea summary visible to all members' },
              { value: 'meeting_only', label: 'Details in Meeting Only', desc: 'Only title and domain are public; full details shared under NDA in meeting' },
            ] as const).map(opt => (
              <label key={opt.value} style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '12px 14px', border: '1px solid var(--rule)', transition: 'border-color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--rule)')}>
                <input {...register('confidentiality')} type="radio" value={opt.value} style={{ marginTop: 2, accentColor: 'var(--primary)', flexShrink: 0 }} />
                <span>
                  <span style={{ display: 'block', fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>{opt.label}</span>
                  <span style={{ display: 'block', fontSize: 12.5, color: 'var(--ink-muted)', marginTop: 2 }}>{opt.desc}</span>
                </span>
              </label>
            ))}
          </div>
        </FormField>

        {/* Two columns: City + Country */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <FormField label="City" error={errors.city?.message} required>
            <input
              {...register('city')}
              type="text"
              placeholder="e.g. Berlin"
              style={inputStyle(errors.city?.message)}
              onFocus={e => focusIn(e, errors.city?.message)}
              onBlur={e => focusOut(e, errors.city?.message)}
            />
          </FormField>
          <FormField label="Country" error={errors.country?.message} required>
            <input
              {...register('country')}
              type="text"
              placeholder="e.g. Germany"
              style={inputStyle(errors.country?.message)}
              onFocus={e => focusIn(e, errors.country?.message)}
              onBlur={e => focusOut(e, errors.country?.message)}
            />
          </FormField>
        </div>

        {/* Expiry date */}
        <FormField label="Listing expiry date" error={errors.expiryDate?.message} required
          hint="Post closes automatically on this date">
          <input
            {...register('expiryDate')}
            type="date"
            min={minDateStr}
            style={inputStyle(errors.expiryDate?.message)}
            onFocus={e => focusIn(e, errors.expiryDate?.message)}
            onBlur={e => focusOut(e, errors.expiryDate?.message)}
          />
        </FormField>

        {/* GDPR notice */}
        <div style={{ padding: '12px 16px', background: 'var(--paper-2)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', lineHeight: 1.8 }}>
          <span style={{ color: 'var(--primary)', fontWeight: 600, letterSpacing: '.12em', textTransform: 'uppercase' }}>GDPR notice · </span>
          Do not include patient data, identifiable clinical records, or proprietary IP in this form.
          File uploads are not permitted on this platform. Technical details are shared in meetings under NDA.
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 12, marginTop: 8, flexWrap: 'wrap' }}>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSubmitAction('draft')}
            style={{
              flex: 1, minWidth: 160, padding: '13px 24px',
              background: 'transparent', color: 'var(--ink)',
              border: '1.5px solid var(--ink)', fontFamily: 'var(--ff-sans)',
              fontSize: 14.5, fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'background .18s, color .18s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--ink)'; (e.currentTarget as HTMLElement).style.color = 'var(--paper)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'var(--ink)' }}
          >
            Save as Draft
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            onClick={() => setSubmitAction('publish')}
            style={{
              flex: 1, minWidth: 160, padding: '13px 24px',
              background: 'var(--ink)', color: 'var(--paper)',
              border: '1.5px solid var(--ink)', fontFamily: 'var(--ff-sans)',
              fontSize: 14.5, fontWeight: 500, cursor: isSubmitting ? 'not-allowed' : 'pointer',
              transition: 'opacity .18s',
            }}
            onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '.85')}
            onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
          >
            Publish Post →
          </button>
        </div>
      </form>
    </PageWrapper>
  )
}
