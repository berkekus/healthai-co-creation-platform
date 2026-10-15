import { afterEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import i18n from '../i18n'
import AboutPage from '../pages/AboutPage'

describe('AboutPage', () => {
  afterEach(async () => { await i18n.changeLanguage('en') })

  it('reads in the interface language, lists included', async () => {
    await i18n.changeLanguage('tr')
    render(<MemoryRouter><AboutPage /></MemoryRouter>)

    expect(screen.getByRole('heading', { name: 'Projenin Amacı' })).toBeInTheDocument()
    expect(screen.getByText('Güvenli ilk temas')).toBeInTheDocument()
    expect(screen.getByText('Bir tıbbi veri sistemi')).toBeInTheDocument()
    expect(screen.queryByText('Project Purpose')).not.toBeInTheDocument()
  })
})
