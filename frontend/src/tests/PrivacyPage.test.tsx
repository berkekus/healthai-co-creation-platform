import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import PrivacyPage from '../pages/errors/PrivacyPage'

const renderPage = () => render(<MemoryRouter><PrivacyPage /></MemoryRouter>)

describe('PrivacyPage', () => {
  afterEach(async () => { await i18n.changeLanguage('en') })

  it('reads in the interface language and says the English text is binding', async () => {
    await i18n.changeLanguage('tr')
    renderPage()

    expect(screen.getByRole('heading', { name: 'Topladığımız veriler' })).toBeInTheDocument()
    expect(screen.getByRole('note')).toHaveTextContent('Bağlayıcı olan, bu politikanın İngilizce metnidir.')
    // Inline markup survives translation: the bold word and the contact link.
    expect(screen.getByText('toplamıyoruz').tagName).toBe('STRONG')
    expect(screen.getByRole('link', { name: 'admin@healthcocreate.com' })).toHaveAttribute('href', 'mailto:admin@healthcocreate.com')
  })

  it('shows no translation note on the English original', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Data we collect' })).toBeInTheDocument()
    expect(screen.queryByRole('note')).not.toBeInTheDocument()
  })
})
