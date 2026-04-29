import { useEffect, useState } from 'react'
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

const STEP_LABELS = ['Your message', 'NDA agreement', 'Propose times']

const inputCls =
  'w-full bg-white border border-neutral-200 rounded-xl px-4 py-3 text-[14.5px] font-body font-medium text-hai-plum outline-none transition-colors focus:border-hai-plum focus:shadow-[0_0_0_3px_rgba(138,198,208,0.32)]'

function StepPill({ n, active, done, label }: { n: number; active: boolean; done: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-full transition-colors ${
      done ? 'bg-hai-plum text-hai-mint' :
      active ? 'bg-hai-mint text-hai-plum' :
      'bg-hai-offwhite text-neutral-500'
    }`}>
      <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono font-bold ${
        done ? 'bg-hai-mint text-hai-plum' :
        active ? 'bg-hai-plum text-hai-mint' :
        'bg-white text-neutral-500'
      }`}>
        {done ? '✓' : n}
      </span>
      <span className="text-[10.5px] font-mono tracking-[0.12em] uppercase font-bold hidden sm:inline">{label}</span>
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

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

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
    if (step === 1 && message.trim().length < 20) {
      setError('Please write at least 20 characters about your interest.'); return false
    }
    if (step === 2 && !ndaChecked) {
      setError('You must accept the NDA to continue.'); return false
    }
    if (step === 3 && slots.filter(s => s.date && s.time).length < 3) {
      setError('Please propose at least 3 time slots.'); return false
    }
    return true
  }

  const handleNext = () => { if (validateStep()) setStep(s => s + 1) }

  const handleSubmit = async () => {
    if (!validateStep() || !user) return
    const filledSlots = slots.filter(s => s.date && s.time)
    try {
      await request(
        { postId: post.id, message, ndaAccepted: true, proposedSlots: filledSlots },
        user.id, user.name, post.authorId, post.authorName, post.title,
      )
      update(post.id, { status: 'meeting_scheduled' })
      push({ userId: user.id, type: 'meeting_request', title: 'Interest expressed', body: `Your request for "${post.title}" has been sent.`, isRead: false, linkTo: '/meetings' })
      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send request. Please try again.')
    }
  }

  const filledCount = slots.filter(s => s.date && s.time).length

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-hai-plum/70 backdrop-blur-sm font-body"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="express-interest-title"
    >
      <div className="bg-white w-full max-w-[640px] max-h-[92vh] rounded-[2rem] shadow-[0_40px_120px_-20px_rgba(54,33,62,0.5)] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="relative px-6 md:px-8 pt-7 pb-5 border-b border-neutral-100 overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-60" style={{ background: 'radial-gradient(circle, #B8F3FF 0%, transparent 70%)' }} />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 bg-hai-offwhite border border-hai-teal/30 rounded-full px-3 py-1 mb-3 text-[10px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-hai-teal" />
                Express interest
              </div>
              <h2 id="express-interest-title" className="font-headline font-bold text-[22px] md:text-[26px] leading-[1.15] tracking-[-0.02em] text-hai-plum line-clamp-2">
                {post.title}
              </h2>
              <div className="mt-1.5 text-[12px] font-mono tracking-[0.12em] uppercase text-neutral-500 font-bold">
                To {post.authorName}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close"
              className="shrink-0 w-9 h-9 rounded-full bg-hai-offwhite hover:bg-hai-mint/60 text-hai-plum flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>

        {/* Step indicator */}
        <div className="px-6 md:px-8 py-4 border-b border-neutral-100 flex items-center gap-2 overflow-x-auto">
          {STEP_LABELS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 shrink-0">
              <StepPill n={i + 1} active={step === i + 1} done={step > i + 1} label={label} />
              {i < STEP_LABELS.length - 1 && (
                <span className={`block w-6 h-px ${step > i + 1 ? 'bg-hai-plum' : 'bg-neutral-200'}`} />
              )}
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 md:px-8 py-6 flex-1 overflow-auto">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-[14.5px] text-neutral-600 leading-relaxed">
                Write a short message to <strong className="text-hai-plum">{post.authorName}</strong> explaining your background and why you're interested in this collaboration.
              </p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe your relevant experience and what you can bring to this collaboration…"
                rows={6}
                className={`${inputCls} resize-y leading-relaxed`}
              />
              <div className={`inline-flex items-center gap-2 text-[10.5px] font-mono tracking-[0.12em] uppercase font-bold ${
                message.length >= 20 ? 'text-neutral-500' : 'text-amber-700'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${message.length >= 20 ? 'bg-hai-teal' : 'bg-amber-500'}`} />
                {message.length} / 20 min characters
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <div className="bg-hai-cream/60 border border-hai-plum/10 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3 text-[10.5px] font-mono tracking-[0.16em] uppercase text-hai-plum font-bold">
                  <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>
                    shield_lock
                  </span>
                  Non-disclosure agreement
                </div>
                <p className="text-[14px] text-hai-plum leading-relaxed">{NDA_TEXT}</p>
              </div>

              <label className={`cursor-pointer flex items-start gap-3 p-4 rounded-2xl border-2 transition-all ${
                ndaChecked ? 'border-hai-plum bg-hai-mint/40' : 'border-neutral-200 hover:border-hai-plum/40 bg-white'
              }`}>
                <span className={`shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                  ndaChecked ? 'bg-hai-plum text-hai-mint' : 'bg-hai-offwhite text-transparent border border-neutral-300'
                }`}>
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: '"FILL" 1' }}>check</span>
                </span>
                <input
                  type="checkbox"
                  checked={ndaChecked}
                  onChange={e => setNdaChecked(e.target.checked)}
                  className="sr-only"
                />
                <span className="text-[14px] text-hai-plum leading-relaxed">
                  I have read and accept the terms of this NDA. I understand that all information shared during this collaboration is confidential.
                </span>
              </label>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <p className="text-[14.5px] text-neutral-600 leading-relaxed flex-1 min-w-[240px]">
                  Propose at least 3 time slots when you're available. <strong className="text-hai-plum">{post.authorName}</strong> will confirm one.
                </p>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10.5px] font-mono tracking-[0.12em] uppercase font-bold ${
                  filledCount >= 3 ? 'bg-hai-mint text-hai-plum' : 'bg-hai-offwhite text-neutral-500'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${filledCount >= 3 ? 'bg-hai-teal' : 'bg-neutral-400'}`} />
                  {filledCount} / 3 filled
                </span>
              </div>

              <div className="flex flex-col gap-3 max-w-md mx-auto w-full">
                {slots.map((slot, i) => (
                  <div key={i} className="bg-hai-offwhite rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-hai-plum/10 flex items-center justify-center font-mono font-bold text-[11px] text-hai-plum">
                          {i + 1}
                        </div>
                        <span className="text-[10.5px] font-mono tracking-[0.14em] uppercase font-bold text-neutral-400">
                          Time slot {i + 1}
                        </span>
                      </div>
                      {slots.length > 3 && (
                        <button
                          onClick={() => removeSlot(i)}
                          aria-label={`Remove slot ${i + 1}`}
                          className="w-7 h-7 rounded-full bg-white hover:bg-red-50 text-neutral-400 hover:text-red-500 flex items-center justify-center transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-mono tracking-[0.14em] uppercase text-neutral-400 mb-1.5">
                          <span className="material-symbols-outlined text-[13px]">calendar_month</span>
                          Date
                        </div>
                        <input
                          type="date"
                          value={slot.date}
                          min={minDateStr}
                          onChange={e => updateSlot(i, 'date', e.target.value)}
                          onClick={e => { try { (e.target as HTMLInputElement).showPicker?.() } catch {} }}
                          className={`${inputCls} !py-2.5 !rounded-xl cursor-pointer`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-[10px] font-mono tracking-[0.14em] uppercase text-neutral-400 mb-1.5">
                          <span className="material-symbols-outlined text-[13px]">schedule</span>
                          Time
                        </div>
                        <input
                          type="time"
                          value={slot.time}
                          onChange={e => updateSlot(i, 'time', e.target.value)}
                          onClick={e => { try { (e.target as HTMLInputElement).showPicker?.() } catch {} }}
                          className={`${inputCls} !py-2.5 !rounded-xl cursor-pointer`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="max-w-md mx-auto w-full">
                <button
                  onClick={addSlot}
                  className="w-full rounded-full border-2 border-dashed border-neutral-300 py-3 text-[11px] font-mono tracking-[0.14em] uppercase font-bold text-hai-plum hover:border-hai-plum hover:bg-hai-mint/20 transition-colors flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Add another slot
                </button>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-5 flex items-start gap-2.5 bg-red-50 border border-red-200 rounded-2xl p-3.5 text-[13px] text-red-700 font-medium leading-relaxed">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-px" style={{ fontVariationSettings: '"FILL" 1' }}>error</span>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 md:px-8 py-4 border-t border-neutral-100 bg-hai-offwhite/60 flex items-center justify-between gap-3">
          <button
            onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
            className="px-5 py-2.5 rounded-full bg-white border border-neutral-200 text-hai-plum text-[13px] font-bold hover:bg-neutral-100 transition-colors inline-flex items-center gap-1.5"
          >
            {step === 1 ? 'Cancel' : <><span aria-hidden="true">←</span> Back</>}
          </button>
          {step < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 rounded-full bg-hai-plum text-white text-[13px] font-bold hover:bg-black transition-colors inline-flex items-center gap-1.5"
            >
              {step === 2 ? 'I accept & continue' : 'Next'} <span aria-hidden="true">→</span>
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              className="px-6 py-2.5 rounded-full bg-hai-plum text-white text-[13px] font-bold hover:bg-black transition-colors inline-flex items-center gap-2 shadow-[0_10px_30px_-10px_rgba(54,33,62,0.4)]"
            >
              <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: '"FILL" 1' }}>send</span>
              Send request
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
