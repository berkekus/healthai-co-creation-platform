import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import i18n from '../i18n'
import api from '../lib/api'
import TranslateButton from '../components/ui/TranslateButton'

vi.mock('../lib/api', () => ({ default: { post: vi.fn() } }))

const english = 'Midwives on our ward want an early warning for postpartum haemorrhage from wearable vital signs.'
const turkish = 'Yapay zeka destekli glikoz izleme sistemi için bir mühendis arıyoruz ve klinik verilerimiz hazır.'

describe('TranslateButton', () => {
  beforeEach(() => {
    vi.mocked(api.post).mockReset().mockResolvedValue({ data: { success: true, data: { translated: 'Servisimizdeki ebeler…' } } })
  })

  afterEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('translates into the language the reader is using', async () => {
    await i18n.changeLanguage('tr')
    render(<TranslateButton text={english} />)

    fireEvent.click(screen.getByRole('button', { name: 'Türkçeye çevir' }))

    expect(api.post).toHaveBeenCalledWith('/ai/translate', { text: english, targetLang: 'tr' })
    expect(await screen.findByText('Servisimizdeki ebeler…')).toBeInTheDocument()
  })

  it('offers English to an English reader of a Turkish text', () => {
    render(<TranslateButton text={turkish} />)
    expect(screen.getByRole('button', { name: 'Translate to English' })).toBeInTheDocument()
  })

  it('stays out of the way when the text is already in the reader’s language', async () => {
    await i18n.changeLanguage('tr')
    render(<TranslateButton text={turkish} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
