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
 */
export default function FormField({ label, error, required, hint, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex items-baseline justify-between font-body">
        <span className={`text-[13px] font-bold ${error ? 'text-red-600' : 'text-hai-plum'}`}>
          {label}
          {required && <span className="text-red-600 ml-0.5">*</span>}
        </span>
        {hint && (
          <span className="text-[11px] font-mono tracking-wider uppercase text-neutral-400">
            {hint}
          </span>
        )}
      </label>
      {children}
      {error && (
        <span role="alert" className="text-[12px] text-red-600 font-body font-medium">
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
