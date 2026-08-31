import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import SearchableSelect from '../components/ui/SearchableSelect'
import CountryCityPicker from '../components/ui/CountryCityPicker'

vi.mock('../lib/locations', () => ({
  loadCities: vi.fn(async (country: string) =>
    country === 'Turkey' ? ['Ankara', 'İstanbul', 'İzmir'] :
    country === 'Germany' ? ['Berlin', 'Hamburg', 'München'] :
    country === 'Monaco' ? [] : []),
  knownCountry: () => true,
}))

const openAndType = (text: string) => {
  fireEvent.click(screen.getAllByRole('button')[0])
  fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: text } })
}

describe('SearchableSelect', () => {
  it('matches accented options from unaccented typing', () => {
    render(<SearchableSelect options={['İstanbul', 'Kraków', 'München']} value="" onChange={() => {}} />)

    openAndType('istanbul')
    expect(screen.getByText('İstanbul')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'krakow' } })
    expect(screen.getByText('Kraków')).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'munchen' } })
    expect(screen.getByText('München')).toBeInTheDocument()
  })

  it('refuses to open while disabled', () => {
    render(<SearchableSelect options={['Ankara']} value="" onChange={() => {}} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument()
  })

  it('caps how many options it renders so a 14k-city country cannot lock the page', () => {
    const many = Array.from({ length: 500 }, (_, i) => `City ${i}`)
    render(<SearchableSelect options={many} value="" onChange={() => {}} />)

    fireEvent.click(screen.getByRole('button'))
    expect(screen.getAllByRole('listitem').length).toBeLessThanOrEqual(101)
    expect(screen.getByText(/400 more/)).toBeInTheDocument()
  })
})

describe('CountryCityPicker', () => {
  const setup = (country = '', city = '') => {
    const onCountryChange = vi.fn()
    const onCityChange = vi.fn()
    const view = render(
      <CountryCityPicker
        country={country}
        city={city}
        onCountryChange={onCountryChange}
        onCityChange={onCityChange}
        countryLabel={<span>Country</span>}
        cityLabel={<span>City</span>}
      />,
    )
    return { ...view, onCountryChange, onCityChange }
  }

  beforeEach(() => { vi.clearAllMocks() })
  afterEach(() => { vi.restoreAllMocks() })

  it('leaves the city control disabled until a country is chosen', () => {
    setup()
    const [, cityButton] = screen.getAllByRole('button')
    expect(cityButton).toBeDisabled()
    expect(cityButton).toHaveTextContent('Select a country first')
  })

  it('enables the city control and offers that country only', async () => {
    setup('Turkey')
    const [, cityButton] = screen.getAllByRole('button')
    await waitFor(() => expect(cityButton).not.toBeDisabled())

    fireEvent.click(cityButton)
    await waitFor(() => expect(screen.getByText('İstanbul')).toBeInTheDocument())
    expect(screen.queryByText('Berlin')).not.toBeInTheDocument()
  })

  it('clears the city when the country changes, so no one ends up in Berlin, Turkey', async () => {
    const { onCountryChange, onCityChange } = setup('Turkey', 'İstanbul')

    fireEvent.click(screen.getAllByRole('button')[0])
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'Germany' } })
    fireEvent.click(screen.getByText('Germany'))

    expect(onCountryChange).toHaveBeenCalledWith('Germany')
    expect(onCityChange).toHaveBeenCalledWith('')
  })

  it('keeps a stored city that predates the list rather than dropping it', async () => {
    setup('Turkey', 'Some Old Value')
    const [, cityButton] = screen.getAllByRole('button')
    await waitFor(() => expect(cityButton).not.toBeDisabled())
    expect(cityButton).toHaveTextContent('Some Old Value')
  })

  it('falls back to free text for a country with no city data', async () => {
    setup('Monaco')
    await waitFor(() => expect(screen.getByPlaceholderText('Enter your city')).toBeInTheDocument())
  })
})
