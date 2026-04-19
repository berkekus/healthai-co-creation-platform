interface FormFieldProps {
  label: string
  error?: string
  required?: boolean
  hint?: string
  children: React.ReactNode
}

export default function FormField({ label, error, required, hint, children }: FormFieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <label style={{
        fontFamily: 'var(--ff-sans)', fontWeight: 500, fontSize: 13.5,
        color: error ? '#ef4444' : 'var(--ink)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      }}>
        <span>
          {label}
          {required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
        </span>
        {hint && <span style={{ fontWeight: 400, fontSize: 12, color: 'var(--ink-muted)' }}>{hint}</span>}
      </label>
      {children}
      {error && (
        <span role="alert" style={{ fontSize: 12, color: '#ef4444', fontFamily: 'var(--ff-sans)' }}>
          {error}
        </span>
      )}
    </div>
  )
}

export const inputStyle = (error?: string): React.CSSProperties => ({
  width: '100%',
  background: 'var(--paper)',
  border: `1.5px solid ${error ? '#ef4444' : 'var(--rule)'}`,
  borderRadius: 0,
  padding: '10px 14px',
  fontSize: 15,
  fontFamily: 'var(--ff-sans)',
  color: 'var(--ink)',
  outline: 'none',
  transition: 'border-color 200ms, box-shadow 200ms',
  boxSizing: 'border-box',
})
