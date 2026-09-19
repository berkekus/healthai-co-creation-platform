import { useCallback, useId, useRef, type ReactNode } from 'react'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface Props {
  title: string
  children: ReactNode
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  onCancel: () => void
  busy?: boolean
  /** Disables the confirm button, e.g. until a required date is chosen. */
  confirmDisabled?: boolean
  error?: string | null
}

/** A small modal that spells out the consequences before an action takes effect. */
export default function ConfirmDialog({
  title, children, confirmLabel, cancelLabel, onConfirm, onCancel, busy = false, confirmDisabled = false, error,
}: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const titleId = useId()
  const handleEscape = useCallback(() => { if (!busy) onCancel() }, [busy, onCancel])
  useFocusTrap(dialogRef, true, handleEscape)

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-hai-plum/60 p-4 backdrop-blur-sm"
      onClick={event => { if (event.target === event.currentTarget && !busy) onCancel() }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="w-full max-w-[460px] rounded-[24px] bg-white p-6 shadow-[0_40px_120px_-20px_rgba(54,33,62,0.5)]"
      >
        <h2 id={titleId} className="font-headline text-xl font-black text-hai-plum">{title}</h2>
        <div className="mt-3 space-y-3 text-sm font-semibold leading-6 text-[#4f4a58]">{children}</div>
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-600">{error}</p>}
        <div className="mt-6 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-10 rounded-full border border-[#D5DAE0] bg-white px-5 text-sm font-black text-hai-plum transition hover:border-hai-teal disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || confirmDisabled}
            className="h-10 rounded-full bg-hai-plum px-5 text-sm font-black text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
