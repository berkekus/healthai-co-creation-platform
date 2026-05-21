import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import { CalendarDays, Lock, ShieldCheck, Sparkles } from 'lucide-react'
import type { PostCreateFormData } from '../../utils/validators'
import SearchableSelect from '../ui/SearchableSelect'
import { COUNTRIES, getCitiesForCountry } from '../../data/locations'
import api from '../../lib/api'

const MEDICAL_DOMAINS = [
  'Cardiology','Oncology','Radiology & Imaging','Neurology','Orthopedics',
  'Dermatology','Ophthalmology','Pediatrics','Psychiatry & Mental Health',
  'Emergency Medicine','Intensive Care (ICU)','Surgical Robotics',
  'Genomics & Precision Medicine','Rehabilitation & Physio','Clinical Pharmacy',
  'Public Health & Epidemiology','Pathology & Lab Diagnostics',
  'Endocrinology & Diabetes','Remote Patient Monitoring','Mental Health AI',
]

const baseInput =
  'h-14 w-full rounded-[10px] border border-[#d7dbe3] bg-white px-4 text-sm font-semibold text-[#2d1838] outline-none transition placeholder:text-[#9a95a1] focus:border-[#66c8e7] focus:ring-4 focus:ring-[#66c8e7]/20'
const baseSelect =
  `${baseInput} appearance-none pr-10`

interface AIResult {
  improvedTitle?: string
  improvedDescription?: string
  suggestedExpertise?: string[]
  tip?: string
}

interface Props {
  register: UseFormRegister<PostCreateFormData>
  control: Control<PostCreateFormData>
  setValue: UseFormSetValue<PostCreateFormData>
  errors: FieldErrors<PostCreateFormData>
  minDateStr: string
}

export default function PostFormFields({ register, control, setValue, errors, minDateStr }: Props) {
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)
  const [aiError, setAiError] = useState<string | null>(null)

  const currentTitle       = useWatch({ control, name: 'title' }) ?? ''
  const currentDescription = useWatch({ control, name: 'description' }) ?? ''
  const currentDomain      = useWatch({ control, name: 'domain' }) ?? ''
  const currentExpertise   = useWatch({ control, name: 'expertiseRequired' }) ?? ''

  const handleAIAssist = async () => {
    if (!currentTitle && !currentDescription) return
    setAiLoading(true)
    setAiResult(null)
    setAiError(null)
    try {
      const { data } = await api.post<{ success: boolean; data: AIResult }>('/ai/improve-post', {
        title: currentTitle,
        description: currentDescription,
        domain: currentDomain,
        expertiseRequired: currentExpertise,
      })
      setAiResult(data.data)
    } catch {
      setAiError('AI assist is temporarily unavailable. Try again shortly.')
    } finally {
      setAiLoading(false)
    }
  }

  const applyAISuggestions = () => {
    if (!aiResult) return
    if (aiResult.improvedTitle)       setValue('title',             aiResult.improvedTitle,       { shouldValidate: true })
    if (aiResult.improvedDescription) setValue('description',       aiResult.improvedDescription, { shouldValidate: true })
    if (aiResult.suggestedExpertise?.length) setValue('expertiseRequired', aiResult.suggestedExpertise.join(', '), { shouldValidate: true })
    setAiResult(null)
  }
  const radioGroupId = useId()
  const selectedCountry = useWatch({ control, name: 'country' }) ?? ''
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setValue('city', '', { shouldValidate: false })
  }, [selectedCountry, setValue])

  const availableCities = getCitiesForCountry(selectedCountry)

  return (
    <div className="space-y-6">
      <FormSection number="1" title="The basics" subtitle="A clear title and domain help the right people find you.">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <Field label="Post title" error={errors.title?.message} required>
            <input
              {...register('title')}
              className={baseInput}
              placeholder="e.g. AI-powered glucose monitoring system"
            />
          </Field>
          <Field label="Domain" error={errors.domain?.message} required>
            <SelectShell>
              <select {...register('domain')} className={baseSelect} defaultValue="">
                <option value="">Select a domain</option>
                {MEDICAL_DOMAINS.map(domain => <option key={domain} value={domain}>{domain}</option>)}
              </select>
            </SelectShell>
          </Field>
        </div>
      </FormSection>

      <FormSection number="2" title="What you're looking for" subtitle="Describe the collaboration without revealing confidential details.">
        <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-[minmax(0,1fr)_230px]">
          <Field label="Expertise required" error={errors.expertiseRequired?.message} required>
            <input
              {...register('expertiseRequired')}
              className={baseInput}
              placeholder="e.g. Signal processing, Embedded ML, Clinical validation"
            />
          </Field>
          <Hint>Add the technical or clinical expertise you're seeking.</Hint>

          <Field label="Project summary" error={errors.description?.message} required>
            <textarea
              {...register('description')}
              className={`${baseInput} h-[96px] resize-none py-4 leading-6`}
              placeholder="Describe your project goal, what you've built so far, and what you need from a collaborator."
            />
          </Field>
          <div className="flex flex-col items-start gap-3 lg:pt-7">
            <span className="text-sm font-semibold leading-5 text-[#6f6a76]">Min. 50 characters.</span>
            <button
              type="button"
              disabled={aiLoading || (!currentTitle && !currentDescription)}
              onClick={handleAIAssist}
              className="inline-flex items-center gap-2 rounded-full bg-[#36213E] px-4 py-2 text-xs font-black text-white hover:bg-black disabled:opacity-50 transition-colors"
            >
              <Sparkles size={13} />
              {aiLoading ? 'Improving…' : 'AI Assist'}
            </button>
          </div>
        </div>

        {/* AI Suggestion Panel */}
        {aiError && (
          <div className="mt-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">{aiError}</div>
        )}
        {aiResult && (
          <div className="mt-4 rounded-[14px] border border-[#cdeefa] bg-[#eefaff] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-black text-[#2d1838]">
                <Sparkles size={14} />
                AI suggestions — review before applying
              </div>
              <button type="button" onClick={() => setAiResult(null)} className="text-[#9a95a1] hover:text-[#2d1838] transition-colors">✕</button>
            </div>
            {aiResult.improvedTitle && (
              <div className="mb-2">
                <span className="text-xs font-black uppercase tracking-wide text-[#6f6a76]">Title</span>
                <p className="mt-1 text-sm font-semibold text-[#2d1838]">{aiResult.improvedTitle}</p>
              </div>
            )}
            {aiResult.improvedDescription && (
              <div className="mb-2">
                <span className="text-xs font-black uppercase tracking-wide text-[#6f6a76]">Description</span>
                <p className="mt-1 text-sm font-semibold text-[#2d1838]">{aiResult.improvedDescription}</p>
              </div>
            )}
            {aiResult.suggestedExpertise && aiResult.suggestedExpertise.length > 0 && (
              <div className="mb-2">
                <span className="text-xs font-black uppercase tracking-wide text-[#6f6a76]">Expertise tags</span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {aiResult.suggestedExpertise.map(t => (
                    <span key={t} className="rounded-full bg-[#36213E]/10 px-2.5 py-0.5 text-xs font-bold text-[#36213E]">{t}</span>
                  ))}
                </div>
              </div>
            )}
            {aiResult.tip && (
              <div className="mb-3 text-xs font-semibold italic text-[#6f6a76]">{aiResult.tip}</div>
            )}
            <button
              type="button"
              onClick={applyAISuggestions}
              className="rounded-full bg-[#36213E] px-5 py-2 text-xs font-black text-white hover:bg-black transition-colors"
            >
              Apply all suggestions
            </button>
          </div>
        )}
      </FormSection>

      <FormSection number="3" title="How you want to collaborate" subtitle="Set expectations on project stage, engagement type, and confidentiality.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Project stage" error={errors.projectStage?.message} required>
            <SelectShell>
              <select {...register('projectStage')} className={baseSelect}>
                <option value="idea">Idea</option>
                <option value="concept_validation">Concept Validation</option>
                <option value="prototype">Prototype</option>
                <option value="pilot">Pilot</option>
                <option value="pre_deployment">Pre-deployment</option>
              </select>
            </SelectShell>
          </Field>

          <Field label="Collaboration type" error={errors.collaborationType?.message} required>
            <SelectShell>
              <select {...register('collaborationType')} className={baseSelect} defaultValue="">
                <option value="">Select type</option>
                <option value="advisor">Advisor</option>
                <option value="co_founder">Co-Founder</option>
                <option value="research_partner">Research Partner</option>
                <option value="contract">Contract Work</option>
              </select>
            </SelectShell>
          </Field>

          <Field label="Level of commitment" error={errors.levelOfCommitment?.message} required>
            <SelectShell>
              <select {...register('levelOfCommitment')} className={baseSelect}>
                <option value="flexible">Flexible / to be agreed</option>
                <option value="low">Light advisory (1-2 hrs/week)</option>
                <option value="medium">Part-time collaboration (3-6 hrs/week)</option>
                <option value="high">High commitment / focused sprint</option>
              </select>
            </SelectShell>
          </Field>
        </div>

        <Field label="Confidentiality level" error={errors.confidentiality?.message} required>
          <div id={`${radioGroupId}-label`} className="grid grid-cols-1 gap-4 md:grid-cols-2" role="radiogroup">
            {([
              { value: 'public_pitch', title: 'Public Pitch', desc: 'Short idea summary visible to all members' },
              { value: 'meeting_only', title: 'Details in Meeting Only', desc: 'Only title and domain are public; full details shared under NDA' },
            ] as const).map(option => (
              <label
                key={option.value}
                className="group relative flex cursor-pointer items-center gap-4 rounded-[10px] border border-[#d7dbe3] bg-white p-4 transition has-[:checked]:border-[#66c8e7] has-[:checked]:bg-[#f2fbff]"
              >
                <input {...register('confidentiality')} type="radio" value={option.value} className="peer sr-only" />
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eefaff] text-[#2d1838]">
                  <Lock size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-black text-[#2d1838]">{option.title}</span>
                  <span className="mt-1 block text-xs font-semibold leading-5 text-[#6f6a76]">{option.desc}</span>
                </span>
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#cfd3dc] peer-checked:border-[#2d1838] peer-checked:bg-[#2d1838]">
                  <span className="h-2 w-2 rounded-full bg-white opacity-0 peer-checked:opacity-100" />
                </span>
              </label>
            ))}
          </div>
        </Field>
      </FormSection>

      <FormSection number="4" title="Where & when" subtitle="Location helps with in-person meetings; the expiry date closes the post automatically.">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Field label="Country" error={errors.country?.message} required>
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <SearchableSelect options={COUNTRIES} value={field.value ?? ''} onChange={field.onChange} placeholder="Select country" error={errors.country?.message} />
              )}
            />
          </Field>
          <Field label="City" error={errors.city?.message} required>
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <SearchableSelect options={availableCities} value={field.value ?? ''} onChange={field.onChange} placeholder={selectedCountry ? 'Select city' : 'Select country first'} error={errors.city?.message} />
              )}
            />
          </Field>
        </div>

        <Field label="Listing expiry date" error={errors.expiryDate?.message} required>
          <div className="relative">
            <input {...register('expiryDate')} type="date" min={minDateStr} className={`${baseInput} pr-12`} />
            <CalendarDays size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#2d1838]" />
          </div>
        </Field>
      </FormSection>

      <FormSection number="5" title="Review & publish" subtitle="Review your details before making your post visible.">
        <div className="flex gap-4 rounded-[10px] border border-[#cdeefa] bg-[#eefaff] p-5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#d8f5ff] text-[#2d1838]">
            <ShieldCheck size={20} />
          </span>
          <div>
            <div className="text-sm font-black text-[#2d1838]">GDPR Notice</div>
            <p className="mt-1 text-sm font-semibold leading-5 text-[#4f4a58]">
              Do not include patient data, identifiable clinical records, or proprietary IP.
              <br />
              File uploads are not permitted on this platform - technical details belong in meetings under NDA.
            </p>
          </div>
        </div>
      </FormSection>
    </div>
  )
}

function FormSection({ number, title, subtitle, children }: { number: string; title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="rounded-[18px] bg-white p-7 shadow-[0_24px_80px_-68px_rgba(45,24,56,0.75)]">
      <header className="mb-7 flex items-start gap-4">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#66c8e7] text-xs font-black text-white">
          {number}
        </span>
        <div>
          <h2 className="text-xl font-black leading-tight text-[#2d1838]">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-[#6f6a76]">{subtitle}</p>
        </div>
      </header>
      <div className="space-y-6">{children}</div>
    </section>
  )
}

function Field({ label, error, required, children }: { label: string; error?: string; required?: boolean; children: ReactNode }) {
  return (
    <div className="block">
      <span className={`mb-2 block text-xs font-black ${error ? 'text-red-600' : 'text-[#2d1838]'}`}>
        {label} {required && <span className="text-red-600">*</span>}
      </span>
      {children}
      {error && <span className="mt-2 block text-xs font-semibold text-red-600">{error}</span>}
    </div>
  )
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center text-sm font-semibold leading-5 text-[#6f6a76] lg:pt-7">
      {children}
    </div>
  )
}

function SelectShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      {children}
      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#6f6a76]">⌄</span>
    </div>
  )
}
