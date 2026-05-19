import { useState } from 'react'
import { Languages } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import api from '../../lib/api'

interface Props {
  text: string
  className?: string
  /** Called with the translated text; caller decides where to show it */
  onTranslated?: (translated: string) => void
}

/** Inline toggle: first click translates, second click reverts to original. */
export default function TranslateButton({ text, className = '', onTranslated }: Props) {
  const { t, i18n } = useTranslation()
  const [loading, setLoading]       = useState(false)
  const [translated, setTranslated] = useState<string | null>(null)
  const [error, setError]           = useState(false)

  // Target the opposite of the current UI language
  const targetLang = i18n.language === 'tr' ? 'en' : 'tr'

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

  const label = translated
    ? t('common.showOriginal')
    : targetLang === 'tr' ? t('common.translateToTurkish') : t('common.translateToEnglish')

  return (
    <div className={className}>
      <button
        type="button"
        disabled={loading || !text?.trim()}
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
