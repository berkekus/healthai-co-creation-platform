import { useState } from 'react'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../lib/api'
import { guessTextLanguage } from '../../utils/textLanguage'

const TRANSLATABLE = ['en', 'tr', 'pt', 'es', 'nl'] as const

interface Props {
  text: string
  className?: string
  /** Called with the translated text; caller decides where to show it */
  onTranslated?: (translated: string) => void
}

/**
 * Inline toggle: first click translates into the reader's interface language,
 * second click reverts to the original. Hidden when the text already appears
 * to be in that language.
 */
export default function TranslateButton({ text, className = '', onTranslated }: Props) {
  const { t, i18n } = useTranslation()
  const [loading, setLoading]       = useState(false)
  const [translated, setTranslated] = useState<string | null>(null)
  const [error, setError]           = useState(false)

  const baseLanguage = i18n.language?.split('-')[0]
  const targetLang = TRANSLATABLE.find(code => code === baseLanguage) ?? 'en'

  const toggle = async () => {
    if (translated !== null) {
      setTranslated(null)
      onTranslated?.(text)
      return
    }
    setLoading(true)
    setError(false)
    try {
      const { data } = await api.post<{ success: boolean; data: { translated: string } }>('/ai/translate', {
        text,
        targetLang,
      })
      setTranslated(data.data.translated)
      onTranslated?.(data.data.translated)
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }

  if (!text?.trim() || guessTextLanguage(text) === targetLang) return null

  const label = translated ? t('common.showOriginal') : t('common.translateToCurrent')

  return (
    <div className={className}>
      <button
        type="button"
        disabled={loading}
        onClick={toggle}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-hai-teal hover:text-hai-plum transition-colors disabled:opacity-50"
      >
        <Languages size={13} />
        {loading ? t('common.translating') : label}
      </button>
      {error && <span className="ml-2 text-xs text-red-500">{t('common.translationUnavailable')}</span>}
      {translated && (
        <p className="mt-2 rounded-xl border border-hai-teal/30 bg-hai-mint/30 px-3 py-2 text-sm font-semibold leading-relaxed text-hai-plum">
          {translated}
        </p>
      )}
    </div>
  )
}
