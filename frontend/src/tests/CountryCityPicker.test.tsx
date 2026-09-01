import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchableSelect from '../components/ui/SearchableSelect'
import CountryCityPicker from '../components/ui/CountryCityPicker'

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

  it('caps how many options it renders', () => {
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
    render(
      <CountryCityPicker
        country={country}
        city={city}
        onCountryChange={onCountryChange}
        onCityChange={onCityChange}
        countryLabel={<span>Country</span>}
        cityLabel={<span>City</span>}
      />,
    )
    return { onCountryChange, onCityChange }
  }

  it('leaves the city control disabled until a country is chosen', () => {
    setup()
    const [, cityButton] = screen.getAllByRole('button')
    expect(cityButton).toBeDisabled()
    expect(cityButton).toHaveTextContent('Select country first')
  })

  it('offers real cities for the chosen country, not its districts', () => {
    setup('Turkey')
    const [, cityButton] = screen.getAllByRole('button')
    expect(cityButton).not.toBeDisabled()

    fireEvent.click(cityButton)
    expect(screen.getByText('Istanbul')).toBeInTheDocument()
    expect(screen.getByText('Ankara')).toBeInTheDocument()
    // Districts of Istanbul must not be offered as cities.
    expect(screen.queryByText('Beşiktaş')).not.toBeInTheDocument()
    expect(screen.queryByText('Kadıköy')).not.toBeInTheDocument()
    // Nor may another country's cities leak in.
    expect(screen.queryByText('Berlin')).not.toBeInTheDocument()
  })

  it('keeps the list short enough to scan', () => {
    setup('Turkey')
    fireEvent.click(screen.getAllByRole('button')[1])
    expect(screen.getAllByRole('listitem').length).toBeLessThan(60)
  })

  it('clears the city when the country changes, so no one ends up in Berlin, Turkey', () => {
    const { onCountryChange, onCityChange } = setup('Turkey', 'Istanbul')

    fireEvent.click(screen.getAllByRole('button')[0])
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'Germany' } })
    fireEvent.click(screen.getByText('Germany'))

    expect(onCountryChange).toHaveBeenCalledWith('Germany')
    expect(onCityChange).toHaveBeenCalledWith('')
  })

  it('keeps a stored city that predates the list rather than dropping it', () => {
    setup('Turkey', 'Some Old Value')
    const [, cityButton] = screen.getAllByRole('button')
    expect(cityButton).toHaveTextContent('Some Old Value')
  })

  it('falls back to free text for a country with no city list', () => {
    setup('Andorra')
    expect(screen.getByPlaceholderText('Enter your city')).toBeInTheDocument()
  })
})
