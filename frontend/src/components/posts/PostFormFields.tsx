import { useId, useEffect, useRef } from 'react'
import { Controller, useWatch } from 'react-hook-form'
import type { UseFormRegister, FieldErrors, Control, UseFormSetValue } from 'react-hook-form'
import type { PostCreateFormData } from '../../utils/validators'
import FormField, { inputStyle } from '../ui/FormField'
import SearchableSelect from '../ui/SearchableSelect'
import { COUNTRIES, getCitiesForCountry } from '../../data/locations'


const MEDICAL_DOMAINS = [
  'Cardiology','Oncology','Radiology & Imaging','Neurology','Orthopedics',
  'Dermatology','Ophthalmology','Pediatrics','Psychiatry & Mental Health',
  'Emergency Medicine','Intensive Care (ICU)','Surgical Robotics',
  'Genomics & Precision Medicine','Rehabilitation & Physio','Clinical Pharmacy',
  'Public Health & Epidemiology','Pathology & Lab Diagnostics',
  'Endocrinology & Diabetes','Remote Patient Monitoring','Mental Health AI',
]

const FOCUS_SHADOW = '0 0 0 3px rgba(138,198,208,0.32)'
const ERROR_SHADOW = '0 0 0 3px rgba(220,38,38,0.18)'

const focusIn = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, err?: string) => {
  e.currentTarget.style.borderColor = err ? '#DC2626' : '#36213E'
  e.currentTarget.style.boxShadow = err ? ERROR_SHADOW : FOCUS_SHADOW
}
const focusOut = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>, err?: string) => {
  e.currentTarget.style.borderColor = err ? '#DC2626' : '#E5E5E5'
  e.currentTarget.style.boxShadow = 'none'
}

const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2336213E' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`

const selectStyle = (error?: string): React.CSSProperties => ({
  ...inputStyle(error),
  appearance: 'none',
  backgroundImage: chevronSvg,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 16px center',
  paddingRight: 40,
  cursor: 'pointer',
})
const textareaStyle = (error?: string): React.CSSProperties => ({
  ...inputStyle(error),
  minHeight: 160,
  resize: 'vertical',
  lineHeight: 1.6,
})

function SectionHeader({ number, title, subtitle }: { number: string; title: string; subtitle?: string }) {
  return (
    <header className="flex items-start gap-4 mb-6">
      <div className="w-10 h-10 rounded-2xl bg-hai-mint border border-hai-teal/40 flex items-center justify-center font-mono font-bold text-[13px] text-hai-plum shrink-0">
        {number}
      </div>
      <div>
        <h2 className="font-headline font-bold text-[22px] leading-tight text-hai-plum">{title}</h2>
        {subtitle && <p className="text-[13.5px] text-neutral-600 mt-1 leading-relaxed">{subtitle}</p>}
      </div>
    </header>
  )
}

interface Props {
  register: UseFormRegister<PostCreateFormData>
  control: Control<PostCreateFormData>
  setValue: UseFormSetValue<PostCreateFormData>
  errors: FieldErrors<PostCreateFormData>
  minDateStr: string
}

export default function PostFormFields({ register, control, setValue, errors, minDateStr }: Props) {
  const radioGroupId = useId()
  const selectedCountry = useWatch({ control, name: 'country' }) ?? ''
  const isFirstRender = useRef(true)

  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    setValue('city', '', { shouldValidate: false })
  }, [selectedCountry, setValue])

  const availableCities = getCitiesForCountry(selectedCountry)

  return (
    <div className="flex flex-col gap-10">

      {/* 01 — Basics */}
      <section className="bg-white rounded-[2rem] border border-neutral-100 p-6 md:p-8 shadow-[0_20px_50px_-30px_rgba(54,33,62,0.12)]">
        <SectionHeader number="01" title="The basics" subtitle="A clear title and the clinical domain help the right people find you." />
        <div className="flex flex-col gap-5">
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
        </div>
      </section>

      {/* 02 — Details */}
      <section className="bg-white rounded-[2rem] border border-neutral-100 p-6 md:p-8 shadow-[0_20px_50px_-30px_rgba(54,33,62,0.12)]">
        <SectionHeader number="02" title="What you're looking for" subtitle="Describe the collaboration without revealing confidential details." />
        <div className="flex flex-col gap-5">
          <FormField
            label="Expertise required"
            error={errors.expertiseRequired?.message}
            required
            hint="e.g. Signal Processing, Embedded ML"
          >
            <input
              {...register('expertiseRequired')}
              type="text"
              placeholder="Describe the technical or clinical expertise you need"
              style={inputStyle(errors.expertiseRequired?.message)}
              onFocus={e => focusIn(e, errors.expertiseRequired?.message)}
              onBlur={e => focusOut(e, errors.expertiseRequired?.message)}
            />
          </FormField>

          <FormField
            label="Description"
            error={errors.description?.message}
            required
            hint="Min. 50 characters"
          >
            <textarea
              {...register('description')}
              placeholder="Describe your project, what you've built so far, and what you're looking for in a collaborator. Patient data must not be included."
              style={textareaStyle(errors.description?.message)}
              onFocus={e => focusIn(e, errors.description?.message)}
              onBlur={e => focusOut(e, errors.description?.message)}
            />
          </FormField>
        </div>
      </section>

      {/* 03 — Classification */}
      <section className="bg-white rounded-[2rem] border border-neutral-100 p-6 md:p-8 shadow-[0_20px_50px_-30px_rgba(54,33,62,0.12)]">
        <SectionHeader number="03" title="How you want to collaborate" subtitle="Set expectations on project stage, engagement type, and confidentiality." />
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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

          <FormField label="Confidentiality level" error={errors.confidentiality?.message} required>
            <div className="flex flex-col gap-3 pt-1" role="radiogroup" aria-labelledby={`${radioGroupId}-label`}>
              {([
                { value: 'public_pitch', label: 'Public Pitch',             desc: 'Short idea summary visible to all members',                                            icon: 'visibility' },
                { value: 'meeting_only', label: 'Details in Meeting Only',  desc: 'Only title and domain are public; full details shared under NDA in meeting',           icon: 'lock' },
              ] as const).map(opt => (
                <label
                  key={opt.value}
                  className="flex gap-4 cursor-pointer p-4 rounded-2xl border border-neutral-200 bg-hai-offwhite hover:border-hai-teal hover:bg-white transition-colors has-[:checked]:border-hai-plum has-[:checked]:bg-gradient-to-br has-[:checked]:from-hai-mint/40 has-[:checked]:to-white"
                >
                  <input
                    {...register('confidentiality')}
                    type="radio"
                    value={opt.value}
                    className="peer sr-only"
                  />
                  <div className="w-10 h-10 rounded-xl bg-white border border-hai-teal/40 flex items-center justify-center shrink-0 peer-checked:bg-hai-plum peer-checked:border-hai-plum peer-checked:text-hai-mint text-hai-plum">
                    <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: '"FILL" 1' }}>{opt.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-body font-bold text-[15px] text-hai-plum">{opt.label}</div>
                    <div className="text-[12.5px] text-neutral-600 mt-0.5 leading-relaxed">{opt.desc}</div>
                  </div>
                  <div className="w-5 h-5 rounded-full border-2 border-neutral-300 flex items-center justify-center shrink-0 self-center peer-checked:border-hai-plum peer-checked:bg-hai-plum">
                    <div className="w-2 h-2 rounded-full bg-hai-mint opacity-0 peer-checked:opacity-100" />
                  </div>
                </label>
              ))}
            </div>
          </FormField>
        </div>
      </section>

      {/* 04 — Location & timeline */}
      <section className="bg-white rounded-[2rem] border border-neutral-100 p-6 md:p-8 shadow-[0_20px_50px_-30px_rgba(54,33,62,0.12)]">
        <SectionHeader number="04" title="Where & when" subtitle="Location helps with in-person meetings; the expiry date closes the post automatically." />
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <FormField label="Country" error={errors.country?.message} required>
              <Controller
                name="country"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={COUNTRIES}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder="Select a country…"
                    error={errors.country?.message}
                  />
                )}
              />
            </FormField>
            <FormField label="City" error={errors.city?.message} required>
              <Controller
                name="city"
                control={control}
                render={({ field }) => (
                  <SearchableSelect
                    options={availableCities}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    placeholder={selectedCountry ? 'Select a city…' : 'Select a country first…'}
                    error={errors.city?.message}
                  />
                )}
              />
            </FormField>
          </div>

          <FormField
            label="Listing expiry date"
            error={errors.expiryDate?.message}
            required
            hint="Post closes automatically on this date"
          >
            <input
              {...register('expiryDate')}
              type="date"
              min={minDateStr}
              style={inputStyle(errors.expiryDate?.message)}
              onFocus={e => focusIn(e, errors.expiryDate?.message)}
              onBlur={e => focusOut(e, errors.expiryDate?.message)}
            />
          </FormField>
        </div>
      </section>

      {/* GDPR notice */}
      <div className="p-5 md:p-6 bg-gradient-to-br from-hai-cream/60 to-white border border-hai-plum/10 rounded-2xl flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-hai-plum text-hai-mint flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: '"FILL" 1' }}>shield_person</span>
        </div>
        <div>
          <div className="text-[10.5px] font-mono tracking-[0.18em] uppercase text-hai-plum font-bold mb-1.5">GDPR notice</div>
          <div className="text-[13.5px] text-neutral-700 leading-relaxed">
            Do not include patient data, identifiable clinical records, or proprietary IP. File uploads are not permitted on this platform — technical details belong in meetings under NDA.
          </div>
        </div>
      </div>
    </div>
  )
}
