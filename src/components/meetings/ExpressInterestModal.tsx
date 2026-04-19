import { useState } from 'react'
import type { Post } from '../../types/post.types'
import type { TimeSlot } from '../../types/meeting.types'
import { useMeetingStore } from '../../store/meetingStore'
import { useAuthStore } from '../../store/authStore'
import { usePostStore } from '../../store/postStore'
import { useNotificationStore } from '../../store/notificationStore'

interface Props {
  post: Post
  onClose: () => void
  onSuccess: () => void
}

const NDA_TEXT = `By proceeding, you acknowledge that any information shared during this collaboration process is confidential. You agree not to disclose, reproduce, or use the information shared by the other party without explicit written consent.`

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'oklch(0 0 0 / .55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000, padding: '24px 16px',
}

const panel: React.CSSProperties = {
  background: 'var(--paper)', border: '1px solid var(--rule)',
  width: '100%', maxWidth: 560, maxHeight: '90vh',
  overflow: 'auto', display: 'flex', flexDirection: 'column',
}

const inputBase: React.CSSProperties = {
  width: '100%', background: 'var(--paper-2)', border: '1px solid var(--rule)',
  padding: '10px 12px', fontSize: 14, fontFamily: 'var(--ff-sans)',
  color: 'var(--ink)', borderRadius: 0, boxSizing: 'border-box', outline: 'none',
}

function StepDot({ n, active, done }: { n: number; active: boolean; done: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <div style={{
        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: done ? 'var(--ink)' : active ? 'var(--primary)' : 'var(--paper-2)',
        border: `1.5px solid ${done || active ? 'var(--ink)' : 'var(--rule)'}`,
        fontFamily: 'var(--ff-mono)', fontSize: 11, color: done || active ? 'var(--paper)' : 'var(--ink-muted)', fontWeight: 600,
      }}>
        {done ? '✓' : n}
      </div>
    </div>
  )
}

export default function ExpressInterestModal({ post, onClose, onSuccess }: Props) {
  const { user } = useAuthStore()
  const { request } = useMeetingStore()
  const { update } = usePostStore()
  const { push } = useNotificationStore()

  const [step, setStep] = useState(1)
  const [message, setMessage] = useState('')
  const [ndaChecked, setNdaChecked] = useState(false)
  const [slots, setSlots] = useState<TimeSlot[]>([
    { date: '', time: '' },
    { date: '', time: '' },
    { date: '', time: '' },
  ])
  const [error, setError] = useState('')

  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateStr = minDate.toISOString().split('T')[0]

  const updateSlot = (i: number, field: keyof TimeSlot, val: string) => {
    setSlots(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s))
  }

  const addSlot = () => setSlots(prev => [...prev, { date: '', time: '' }])

  const removeSlot = (i: number) => {
    if (slots.length <= 3) return
    setSlots(prev => prev.filter((_, idx) => idx !== i))
  }

  const validateStep = () => {
    setError('')
    if (step === 1) {
      if (message.trim().length < 20) { setError('Please write at least 20 characters about your interest.'); return false }
    }
    if (step === 2) {
      if (!ndaChecked) { setError('You must accept the NDA to continue.'); return false }
    }
    if (step === 3) {
      const filled = slots.filter(s => s.date && s.time)
      if (filled.length < 3) { setError('Please propose at least 3 time slots.'); return false }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep(s => s + 1)
  }

  const handleSubmit = () => {
    if (!validateStep() || !user) return
    const filledSlots = slots.filter(s => s.date && s.time)
    request(
      { postId: post.id, message, ndaAccepted: true, proposedSlots: filledSlots },
      user.id, user.name, post.authorId, post.authorName, post.title
    )
    update(post.id, { status: 'meeting_scheduled' })
    push({ userId: post.authorId, type: 'meeting_request', title: 'New meeting request', body: `${user.name} expressed interest in your post.`, isRead: false, linkTo: '/meetings' })
    push({ userId: user.id, type: 'meeting_request', title: 'Interest expressed', body: `Your request for "${post.title}" has been sent.`, isRead: false, linkTo: '/meetings' })
    onSuccess()
  }

  const STEP_LABELS = ['Your message', 'NDA Agreement', 'Propose times']

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={panel}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--rule)', background: 'var(--paper-2)' }}>
          <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 6 }}>Express Interest</div>
          <div style={{ fontFamily: 'var(--ff-display)', fontSize: 18, color: 'var(--ink)', fontWeight: 400, lineHeight: 1.3 }}>{post.title}</div>
        </div>

        {/* Step indicator */}
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--rule)', display: 'flex', alignItems: 'center', gap: 0 }}>
          {STEP_LABELS.map((label, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}>
                <StepDot n={i + 1} active={step === i + 1} done={step > i + 1} />
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 9, letterSpacing: '.1em', textTransform: 'uppercase', color: step === i + 1 ? 'var(--ink)' : 'var(--ink-muted)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
              {i < 2 && <div style={{ flex: 1, height: 1, background: step > i + 1 ? 'var(--ink)' : 'var(--rule)', margin: '0 8px', marginBottom: 20 }} />}
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: '24px 24px', flex: 1 }}>

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.6 }}>
                Write a short message to <strong style={{ color: 'var(--ink)' }}>{post.authorName}</strong> explaining your background and why you're interested in this collaboration.
              </p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your relevant experience and what you can bring to this collaboration…"
                style={{ ...inputBase, minHeight: 140, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
              />
              <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10, color: message.length >= 20 ? 'var(--ink-muted)' : '#d97706', letterSpacing: '.08em' }}>
                {message.length} / 20 min characters
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ padding: '16px 18px', background: 'var(--paper-2)', border: '1px solid var(--rule)', fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.7 }}>
                <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 9.5, letterSpacing: '.14em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>Non-Disclosure Agreement</div>
                {NDA_TEXT}
              </div>
              <label style={{ display: 'flex', gap: 12, cursor: 'pointer', padding: '14px 16px', border: `1.5px solid ${ndaChecked ? 'var(--ink)' : 'var(--rule)'}`, transition: 'border-color .15s' }}>
                <input
                  type="checkbox"
                  checked={ndaChecked}
                  onChange={e => setNdaChecked(e.target.checked)}
                  style={{ marginTop: 2, accentColor: 'var(--primary)', flexShrink: 0, width: 16, height: 16 }}
                />
                <span style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink)', lineHeight: 1.5 }}>
                  I have read and accept the terms of this NDA. I understand that all information shared is confidential.
                </span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <p style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, color: 'var(--ink-muted)', margin: 0, lineHeight: 1.6 }}>
                Propose at least 3 time slots when you're available. {post.authorName} will confirm one.
              </p>
              {slots.map((slot, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-muted)', width: 20, flexShrink: 0, textAlign: 'right' }}>{i + 1}</div>
                  <input
                    type="date"
                    value={slot.date}
                    min={minDateStr}
                    onChange={e => updateSlot(i, 'date', e.target.value)}
                    style={{ ...inputBase, flex: 1 }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
                  />
                  <input
                    type="time"
                    value={slot.time}
                    onChange={e => updateSlot(i, 'time', e.target.value)}
                    style={{ ...inputBase, width: 110 }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'var(--primary)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'var(--rule)')}
                  />
                  {slots.length > 3 && (
                    <button onClick={() => removeSlot(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-muted)', fontSize: 18, lineHeight: 1, padding: '0 4px' }}>×</button>
                  )}
                </div>
              ))}
              <button
                onClick={addSlot}
                style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--primary)', background: 'none', border: '1px dashed var(--rule)', padding: '8px', cursor: 'pointer', width: '100%' }}
              >
                + Add another slot
              </button>
            </div>
          )}

          {error && (
            <div role="alert" style={{ marginTop: 14, padding: '10px 14px', background: 'color-mix(in oklab, #ef4444 8%, var(--paper))', border: '1px solid #ef4444', fontSize: 13, color: '#ef4444', fontFamily: 'var(--ff-sans)' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid var(--rule)', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, letterSpacing: '.1em', textTransform: 'uppercase', background: 'none', border: '1px solid var(--rule)', padding: '10px 18px', cursor: 'pointer', color: 'var(--ink-muted)' }}
          >
            {step === 1 ? 'Cancel' : '← Back'}
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500, background: 'var(--ink)', color: 'var(--paper)', border: 'none', padding: '10px 28px', cursor: 'pointer' }}
            >
              {step === 2 ? 'I Accept & Continue →' : 'Next →'}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              style={{ fontFamily: 'var(--ff-sans)', fontSize: 14, fontWeight: 500, background: 'var(--primary)', color: 'var(--paper)', border: 'none', padding: '10px 28px', cursor: 'pointer' }}
            >
              Send Request →
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
