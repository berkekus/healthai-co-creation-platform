import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n'
import LanguageToggle from '../components/ui/LanguageToggle'
import { reloadPage } from '../utils/reloadPage'

vi.mock('../utils/reloadPage', () => ({ reloadPage: vi.fn() }))

function choose(language: string) {
  fireEvent.click(screen.getByRole('button', { name: 'Change language' }))
  fireEvent.click(screen.getByRole('option', { name: new RegExp(language) }))
}

describe('LanguageToggle', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
    localStorage.setItem(LANGUAGE_STORAGE_KEY, 'en')
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    vi.mocked(reloadPage).mockClear()
    await i18n.changeLanguage('en')
  })

  it('saves the chosen language and reloads the whole page in it', () => {
    render(<LanguageToggle />)
    choose('Türkçe')

    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('tr')
    expect(reloadPage).toHaveBeenCalledTimes(1)
  })

  it('does not reload when the current language is picked again', () => {
    render(<LanguageToggle />)
    choose('English')

    expect(reloadPage).not.toHaveBeenCalled()
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('switches in place when the browser blocks storage, since a reload would bring the old language back', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('Storage is blocked', 'SecurityError')
    })
    render(<LanguageToggle />)
    choose('Türkçe')

    expect(reloadPage).not.toHaveBeenCalled()
    await waitFor(() => expect(i18n.language).toBe('tr'))
  })
})
