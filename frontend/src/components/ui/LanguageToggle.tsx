import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGE_STORAGE_KEY } from '../../i18n'
import { reloadPage } from '../../utils/reloadPage'
import { cx } from './cx'

const LANGUAGE_OPTIONS = [
  { code: 'en', short: 'EN', label: 'English' },
  { code: 'tr', short: 'TR', label: 'Türkçe' },
  { code: 'pt', short: 'PT', label: 'Português' },
  { code: 'es', short: 'ES', label: 'Español' },
  { code: 'nl', short: 'NL', label: 'Nederlands' },
] as const

type LanguageCode = (typeof LANGUAGE_OPTIONS)[number]['code']

interface LanguageToggleProps {
  className?: string
  compact?: boolean
}

function normalizeLanguage(language: string | undefined): LanguageCode {
  const baseLanguage = language?.split('-')[0]
  return LANGUAGE_OPTIONS.some(option => option.code === baseLanguage)
    ? baseLanguage as LanguageCode
    : 'en'
}

/** Saves the choice where the next page load reads it; false where the browser blocks storage. */
function saveLanguage(code: LanguageCode): boolean {
  try {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, code)
    return window.localStorage.getItem(LANGUAGE_STORAGE_KEY) === code
  } catch {
    return false
  }
}

export default function LanguageToggle({ className, compact = false }: LanguageToggleProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const currentCode = normalizeLanguage(i18n.language)
  const currentLanguage = LANGUAGE_OPTIONS.find(option => option.code === currentCode) ?? LANGUAGE_OPTIONS[0]

  useEffect(() => {
    if (!open) return

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  // The whole page reloads in the new language, so nothing on it (text the server
  // sent, dates, AI tips) is left over from the old one.
  const changeLanguage = (code: LanguageCode) => {
    setOpen(false)
    if (code === currentCode) return
    if (saveLanguage(code)) {
      reloadPage()
      return
    }
    // Storage is blocked (some private windows): a reload would bring the old
    // language back, so switch the text in place instead.
    void i18n.changeLanguage(code)
  }

  return (
    <div ref={rootRef} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className={cx(
          'h-10 rounded-full border border-line bg-white hover:bg-hai-mint/40 hover:border-hai-teal transition-colors flex items-center gap-1.5 text-xs font-black text-hai-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hai-focus focus-visible:ring-offset-2',
          compact ? 'px-2.5' : 'px-3',
          className,
        )}
        aria-label={t('language.change')}
        aria-haspopup="listbox"
        aria-expanded={open}
        title={t('language.change')}
      >
        <Globe2 size={15} aria-hidden="true" />
        <span aria-hidden="true">{currentLanguage.short}</span>
        <ChevronDown
          size={14}
          aria-hidden="true"
          // Hidden on phones: at 360px the header ran 5px past the screen; globe and code still read as a menu.
          className={cx('hidden transition-transform duration-200 sm:block', open && 'rotate-180')}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={t('language.options')}
          className="absolute right-0 top-[calc(100%+8px)] z-[70] w-44 overflow-hidden rounded-2xl border border-line bg-white py-1.5 shadow-[0_20px_50px_-22px_rgba(45,24,56,0.35)]"
        >
          {LANGUAGE_OPTIONS.map(option => {
            const selected = option.code === currentCode

            return (
              <button
                key={option.code}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => changeLanguage(option.code)}
                className={cx(
                  'flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-bold transition-colors',
                  selected
                    ? 'bg-hai-mint/45 text-hai-plum'
                    : 'text-neutral-700 hover:bg-neutral-100 hover:text-hai-plum',
                )}
              >
                <span className="w-7 rounded-full bg-hai-offwhite px-1.5 py-0.5 text-center text-xs font-black leading-none text-hai-teal-dark">
                  {option.short}
                </span>
                <span>{option.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
