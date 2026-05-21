import { Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cx } from './cx'

interface LanguageToggleProps {
  className?: string
  compact?: boolean
}

export default function LanguageToggle({ className, compact = false }: LanguageToggleProps) {
  const { i18n } = useTranslation()
  const isTR = i18n.language.startsWith('tr')
  const currentLabel = isTR ? 'TR' : 'EN'
  const ariaLabel = isTR ? 'Switch language to English' : 'Dili Turkceye gecir'
  const title = isTR ? 'Switch to English' : 'Turkceye gec'

  return (
    <button
      type="button"
      onClick={() => i18n.changeLanguage(isTR ? 'en' : 'tr')}
      className={cx(
        'h-10 rounded-full border border-[#E3E7EC] bg-white hover:bg-hai-mint/40 hover:border-hai-teal transition-colors flex items-center gap-1.5 text-xs font-black text-hai-plum focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hai-teal/70 focus-visible:ring-offset-2',
        compact ? 'px-2.5' : 'px-3',
        className,
      )}
      aria-label={ariaLabel}
      title={title}
    >
      <Globe2 size={15} aria-hidden="true" />
      <span aria-hidden="true">{currentLabel}</span>
    </button>
  )
}
