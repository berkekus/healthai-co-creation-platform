import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { fold } from './SearchableSelect'

export interface ComboOption { value: string; label: string }
export interface ComboGroup { label: string; options: ComboOption[] }

interface Props {
  /** Id of the visible label, so the control is announced by it. */
  labelledBy: string
  value: string
  onChange: (value: string) => void
  /** Option for the empty value ("All domains"), listed first. */
  allLabel: string
  groups: ComboGroup[]
  searchPlaceholder: string
  noResults: (query: string) => string
  /** Language of the option labels when it differs from the page (domain names are English). */
  optionLang?: string
}

/**
 * A searchable, grouped single choice drawn in the site's own style. Filters used
 * the operating system's dropdown, whose look varies per machine and which cannot
 * be searched; a list of ~40 domains needs both.
 * Keyboard: arrows move, Enter picks, Escape closes; focus stays in the search box.
 */
export default function FilterCombobox({ labelledBy, value, onChange, allLabel, groups, searchPlaceholder, noResults, optionLang }: Props) {
  const listId = useId()
  const optionId = (index: number) => `${listId}-opt-${index}`
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const selectedLabel = groups.flatMap(group => group.options).find(option => option.value === value)?.label

  // Groups after the search, plus one flat list for arrow-key movement.
  const { visibleGroups, flat } = useMemo(() => {
    const needle = fold(query.trim())
    const visible = groups
      .map(group => ({ ...group, options: needle ? group.options.filter(o => fold(o.label).includes(needle)) : group.options }))
      .filter(group => group.options.length > 0)
    const all = needle ? [] : [{ value: '', label: allLabel }]
    return { visibleGroups: visible, flat: [...all, ...visible.flatMap(group => group.options)] }
  }, [groups, query, allLabel])

  useEffect(() => {
    if (!open) return
    setActive(Math.max(0, flat.findIndex(option => option.value === value)))
    setTimeout(() => searchRef.current?.focus(), 0)
    // Re-run only when opening; moving through the list must not reset it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    const onOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) close(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [])

  useEffect(() => {
    document.getElementById(optionId(active))?.scrollIntoView?.({ block: 'nearest' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  function close(returnFocus = true) {
    setOpen(false)
    setQuery('')
    if (returnFocus) triggerRef.current?.focus()
  }

  function pick(option: ComboOption) {
    onChange(option.value)
    close()
  }

  const onSearchKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); setActive(i => Math.min(flat.length - 1, i + 1)) }
    else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(i => Math.max(0, i - 1)) }
    else if (event.key === 'Enter') { event.preventDefault(); if (flat[active]) pick(flat[active]) }
    else if (event.key === 'Escape') { event.preventDefault(); close() }
    else if (event.key === 'Tab') close(false)
  }

  const renderOption = (option: ComboOption) => {
    const index = flat.indexOf(option)
    const selected = option.value === value
    return (
      <li
        key={option.value || '__all'}
        id={optionId(index)}
        role="option"
        aria-selected={selected}
        lang={option.value ? optionLang : undefined}
        onMouseDown={event => event.preventDefault()}
        onMouseEnter={() => setActive(index)}
        onClick={() => pick(option)}
        className={`cursor-pointer rounded-xl px-3 py-2 text-sm transition-colors ${
          selected ? 'bg-hai-mint/60 font-black text-[var(--primary)]' : 'font-semibold text-[var(--text)]'
        } ${index === active && !selected ? 'bg-hai-offwhite' : ''}`}
      >
        {option.label}
      </li>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${labelledBy} ${listId}-value`}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={event => {
          if (event.key === 'ArrowDown' && !open) { event.preventDefault(); setOpen(true) }
        }}
        className={`flex h-[46px] w-full items-center justify-between gap-2 rounded-[14px] border bg-white px-4 text-left text-sm font-black text-[var(--text)] transition hover:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 ${
          open ? 'border-[var(--accent)]' : 'border-[var(--border)]'
        }`}
      >
        <span id={`${listId}-value`} lang={value ? optionLang : undefined} className="truncate">{selectedLabel ?? allLabel}</span>
        <ChevronDown size={16} aria-hidden="true" className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full min-w-[240px] overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-[0_24px_60px_-24px_rgba(45,24,56,0.4)]">
          <div className="border-b border-[var(--border)] p-2">
            <div className="relative">
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={flat[active] ? optionId(active) : undefined}
                aria-label={searchPlaceholder}
                value={query}
                onChange={event => { setQuery(event.target.value); setActive(0) }}
                onKeyDown={onSearchKey}
                placeholder={searchPlaceholder}
                className="w-full rounded-xl border border-[var(--border)] bg-hai-offwhite py-2 pl-9 pr-3 text-sm font-semibold text-[var(--text)] outline-none placeholder:text-ink-muted focus:border-[var(--accent)]"
              />
            </div>
          </div>
          <ul id={listId} role="listbox" aria-labelledby={labelledBy} className="max-h-72 overflow-y-auto overscroll-contain p-2">
            {!query.trim() && renderOption(flat[0])}
            {visibleGroups.map(group => (
              <li key={group.label} role="presentation">
                <div aria-hidden="true" className="px-3 pb-1 pt-3 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">{group.label}</div>
                <ul role="group" aria-label={group.label}>
                  {group.options.map(renderOption)}
                </ul>
              </li>
            ))}
            {flat.length === 0 && (
              <li className="px-3 py-3 text-sm font-semibold text-[var(--muted)]">{noResults(query.trim())}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
