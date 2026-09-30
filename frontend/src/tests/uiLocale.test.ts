import { afterEach, describe, it, expect } from 'vitest'
import i18n from '../i18n'
import { uiLocale } from '../utils/formatDate'

describe('uiLocale', () => {
  afterEach(async () => { await i18n.changeLanguage('en') })

  it('formats month names in the interface language, not a fixed English locale', async () => {
    const date = new Date(2026, 8, 30)
    await i18n.changeLanguage('tr')
    expect(date.toLocaleDateString(uiLocale(), { month: 'long' })).toBe('Eylül')

    await i18n.changeLanguage('nl')
    expect(date.toLocaleDateString(uiLocale(), { month: 'long' })).toBe('september')
  })
})
