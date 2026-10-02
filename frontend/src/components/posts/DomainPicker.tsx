import { useId, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { HEALTH_DOMAIN_GROUPS, MAX_POST_DOMAINS } from '../../constants/domains'

interface Props {
  value: string[]
  onChange: (domains: string[]) => void
  error?: string
  /** Id of the visible field label, so the whole picker is announced by name. */
  labelledBy?: string
}

function fold(text: string) {
  return text.toLocaleLowerCase('en').normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/**
 * Pick the one to three domains an idea spans. The list is always on screen
 * (grouped, searchable) rather than hidden in a dropdown, so people can see
 * what exists — the survey showed they could not tell whether their field was
 * missing or just hard to find.
 */
export default function DomainPicker({ value, onChange, error, labelledBy }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const hintId = useId()
  const needle = fold(query.trim())
  const full = value.length >= MAX_POST_DOMAINS

  const toggle = (domain: string) => {
    if (value.includes(domain)) onChange(value.filter(item => item !== domain))
    else if (!full) onChange([...value, domain])
  }

  const groups = HEALTH_DOMAIN_GROUPS
    .map(group => ({ ...group, domains: group.domains.filter(domain => !needle || fold(domain).includes(needle)) }))
    .filter(group => group.domains.length > 0)

  return (
    <div role="group" aria-labelledby={labelledBy} aria-describedby={hintId} className="space-y-3">
      <div className="flex min-h-[40px] flex-wrap items-center gap-2">
        {value.length === 0 ? (
          <span className="text-sm font-semibold text-ink-muted">{t('posts.form.domainNoneSelected')}</span>
        ) : value.map((domain, index) => (
          <span
            key={domain}
            className={`inline-flex items-center gap-1.5 rounded-full py-1.5 pl-3 pr-1.5 text-xs font-black ${
              index === 0 ? 'bg-ink text-white' : 'bg-[#eefaff] text-ink border border-[#cdeefa]'
            }`}
          >
            {domain}
            <button
              type="button"
              onClick={() => toggle(domain)}
              aria-label={t('posts.form.domainRemove', { domain })}
              className={`flex h-5 w-5 items-center justify-center rounded-full transition ${
                index === 0 ? 'hover:bg-white/20' : 'hover:bg-[#cdeefa]'
              }`}
            >
              <X size={12} aria-hidden="true" />
            </button>
          </span>
        ))}
      </div>

      <p id={hintId} className="text-xs font-semibold leading-5 text-ink-muted">
        {t('posts.form.domainHint', { count: value.length, max: MAX_POST_DOMAINS })}
      </p>

      <div className={`rounded-[10px] border bg-white ${error ? 'border-red-400' : 'border-line-strong'}`}>
        <label className="relative block border-b border-surface-muted">
          <span className="sr-only">{t('posts.form.domainSearch')}</span>
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder={t('posts.form.domainSearch')}
            className="h-11 w-full rounded-t-[10px] bg-transparent pl-9 pr-3 text-sm font-semibold text-ink outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-inset focus:ring-hai-focus"
          />
        </label>

        <div className="max-h-64 overflow-y-auto overscroll-contain p-3">
          {groups.length === 0 ? (
            <p className="px-1 py-2 text-sm font-semibold text-ink-muted">{t('common.select.noResults', { query })}</p>
          ) : groups.map(group => (
            <fieldset key={group.id} className="mb-3 last:mb-0">
              <legend className="mb-1.5 px-1 text-xs font-black uppercase tracking-[0.14em] text-ink-muted">
                {t(`posts.form.domainGroups.${group.id}`)}
              </legend>
              <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
                {group.domains.map(domain => {
                  const checked = value.includes(domain)
                  const disabled = full && !checked
                  return (
                    <label
                      key={domain}
                      className={`flex items-center gap-2.5 rounded-lg px-1 py-1.5 text-sm font-semibold ${
                        disabled ? 'cursor-not-allowed text-[#b8b3bd]' : 'cursor-pointer text-ink hover:bg-[#f2fbff]'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(domain)}
                        className="h-4 w-4 shrink-0 accent-ink"
                      />
                      {domain}
                    </label>
                  )
                })}
              </div>
            </fieldset>
          ))}
        </div>
      </div>
    </div>
  )
}
