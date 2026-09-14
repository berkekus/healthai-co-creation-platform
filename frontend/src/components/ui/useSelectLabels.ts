import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import type { SelectLabels } from './SearchableSelect'

/** SearchableSelect texts in the interface language. */
export function useSelectLabels(): SelectLabels {
  const { t, i18n } = useTranslation()
  return useMemo(() => ({
    search: t('common.select.search'),
    noResults: (query: string) => t('common.select.noResults', { query }),
    more: (count: number) => t('common.select.more', { count: count.toLocaleString(i18n.language) }),
    loading: t('common.loading'),
    useCustom: (value: string) => t('common.select.useCustom', { value }),
  }), [t, i18n.language])
}
