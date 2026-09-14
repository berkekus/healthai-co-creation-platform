import { cloneElement, isValidElement, useId } from 'react'

interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

/**
 * FormField — hai-* palette + Plus Jakarta Sans / Source Sans 3 typography.
 * Used by Login, Register, Post forms, Profile, etc.
 *
 * The label is tied to its control by id, so clicking the label focuses the
 * field and screen readers announce the field by name.
 */
export default function FormField({ label, error, required, hint, children }: FormFieldProps) {
  const generatedId = useId()
  const control = isValidElement<{ id?: string }>(children) ? children : null
  const controlId = control ? (control.props.id ?? generatedId) : undefined

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={controlId} className="flex items-baseline justify-between font-body">
        <span className={`text-sm font-bold ${error ? 'text-red-600' : 'text-hai-plum'}`}>
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </span>
        {hint && (
          <span className="text-xs font-mono tracking-[0.12em] uppercase text-neutral-400">
            {hint}
          </span>
        )}
      </label>
      {control ? cloneElement(control, { id: controlId }) : children}
      {error && (
        <span role="alert" className="text-xs text-red-600 font-body font-semibold">
          {error}
        </span>
      )}
    </div>
  )
}

/**
 * Shared input style helper — rounded, white bg, plum focus ring via
 * outline instead of box-shadow so it layers cleanly over siblings.
 * Pages typically spread this on <input>/<select> plus their own
 * onFocus/onBlur handlers for accent-color transitions.
 */
export const inputStyle = (error?: string): React.CSSProperties => ({
  width: '100%',
  background: '#FFFFFF',
  border: `1.5px solid ${error ? '#DC2626' : '#E5E5E5'}`,
  borderRadius: 12,
  padding: '12px 16px',
  fontSize: 15,
  fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
  fontWeight: 500,
  color: '#36213E',
  outline: 'none',
  transition: 'border-color 200ms, box-shadow 200ms',
  boxSizing: 'border-box',
})
