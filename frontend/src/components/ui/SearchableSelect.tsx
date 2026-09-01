import { useState, useRef, useEffect } from 'react'

const FOCUS_SHADOW = '0 0 0 3px rgba(138,198,208,0.32)'
const ERROR_SHADOW  = '0 0 0 3px rgba(220,38,38,0.18)'

/**
 * A country can carry ~14k cities, and putting that many <li> in the DOM locks
 * the browser up. Only ever render this many; the search box is how you reach
 * the rest.
 */
const MAX_RENDERED = 100

/**
 * Folds accents so a search matches what people actually type: "Izmir" has to
 * find "İzmir", "Krakow" has to find "Kraków", "Munchen" has to find "München".
 *
 * Turkish dotted İ needs handling before the generic strip — lowercasing it
 * yields "i̇", an i with a combining dot that NFD would leave behind as its own
 * character, so the plain fold alone would not match a typed "i".
 */
function fold(s: string): string {
  return s
    .replace(/İ/g, 'I')
    .replace(/ı/g, 'i')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

interface Props {
  options: string[]
  value: string
  onChange: (value: string) => void
  placeholder?: string
  error?: string
  /** Greys the control out and refuses to open — e.g. city before a country is picked. */
  disabled?: boolean
  /** Shown in place of the list while options are still being fetched. */
  loading?: boolean
}

export default function SearchableSelect({
  options, value, onChange, placeholder = 'Select…', error, disabled = false, loading = false,
}: Props) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef    = useRef<HTMLInputElement>(null)
  const listRef      = useRef<HTMLUListElement>(null)

  const needle = fold(query.trim())
  const filtered = needle ? options.filter(o => fold(o).includes(needle)) : options
  const shown = filtered.slice(0, MAX_RENDERED)
  const hiddenCount = filtered.length - shown.length

  // A control that becomes disabled while open would otherwise keep its list up.
  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 10)
    } else {
      setQuery('')
    }
  }, [open])

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [])

  const triggerStyle: React.CSSProperties = {
    width: '100%',
    background: disabled ? '#F5F5F4' : '#FFFFFF',
    border: `1.5px solid ${error ? '#DC2626' : open ? '#36213E' : '#E5E5E5'}`,
    borderRadius: 12,
    padding: '12px 40px 12px 16px',
    fontSize: 15,
    fontFamily: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
    fontWeight: 500,
    color: value ? '#36213E' : '#A3A3A3',
    outline: 'none',
    boxShadow: open ? (error ? ERROR_SHADOW : FOCUS_SHADOW) : 'none',
    transition: 'border-color 200ms, box-shadow 200ms',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.65 : 1,
    textAlign: 'left',
    boxSizing: 'border-box',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        style={triggerStyle}
        disabled={disabled}
        aria-disabled={disabled}
        onClick={() => { if (!disabled) setOpen(o => !o) }}
        onFocus={e => {
          if (disabled) return
          (e.currentTarget as HTMLButtonElement).style.borderColor = error ? '#DC2626' : '#36213E'
          ;(e.currentTarget as HTMLButtonElement).style.boxShadow = error ? ERROR_SHADOW : FOCUS_SHADOW
        }}
        onBlur={e => {
          if (!open) {
            ;(e.currentTarget as HTMLButtonElement).style.borderColor = error ? '#DC2626' : '#E5E5E5'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'
          }
        }}
        onKeyDown={e => {
          if (disabled) return
          if (e.key === 'Escape') setOpen(false)
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setOpen(o => !o) }
        }}
      >
        <span className="block truncate pr-2">{value || placeholder}</span>
        <span
          className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-lg text-neutral-400 pointer-events-none transition-transform"
          style={{ transform: `translateY(-50%) rotate(${open ? '180deg' : '0deg'})` }}
        >
          expand_more
        </span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1.5 w-full bg-white rounded-2xl border border-neutral-200 shadow-[0_16px_48px_-12px_rgba(54,33,62,0.18)] overflow-hidden">
          <div className="p-2 border-b border-neutral-100">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-base text-neutral-400 pointer-events-none">
                search
              </span>
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Escape') setOpen(false)
                }}
                placeholder="Search…"
                className="w-full pl-8 pr-3 py-2 text-sm font-body text-hai-plum placeholder:text-neutral-400 bg-hai-offwhite rounded-xl border border-neutral-200 outline-none focus:border-hai-teal focus:ring-2 focus:ring-hai-teal/25"
              />
            </div>
          </div>

          <ul
            ref={listRef}
            className="max-h-56 overflow-y-auto py-1 overscroll-contain"
          >
            {loading ? (
              <li className="px-4 py-3 text-sm text-neutral-400 font-body">Loading…</li>
            ) : filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-neutral-400 font-body">
                No results for "{query}"
              </li>
            ) : (
              <>
                {shown.map(opt => (
                  <li
                    key={opt}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => { onChange(opt); setOpen(false) }}
                    className={`px-4 py-2.5 cursor-pointer text-sm font-body transition-colors ${
                      opt === value
                        ? 'bg-hai-mint/60 text-hai-plum font-bold'
                        : 'text-neutral-700 hover:bg-hai-offwhite hover:text-hai-plum'
                    }`}
                  >
                    {opt}
                  </li>
                ))}
                {hiddenCount > 0 && (
                  <li className="px-4 py-2.5 text-xs font-semibold text-neutral-400 font-body">
                    +{hiddenCount.toLocaleString()} more — keep typing to narrow
                  </li>
                )}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
