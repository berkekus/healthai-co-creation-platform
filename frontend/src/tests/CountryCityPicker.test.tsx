import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SearchableSelect from '../components/ui/SearchableSelect'
import CountryCityPicker from '../components/ui/CountryCityPicker'
import { CITIES_BY_COUNTRY, COUNTRIES } from '../data/locations'

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

  it("is announced by its value, without the arrow icon's ligature name", () => {
    render(<SearchableSelect options={['Turkey', 'Portugal']} value="Turkey" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Turkey' })).toBeInTheDocument()
  })

  it('refuses to open while disabled', () => {
    render(<SearchableSelect options={['Ankara']} value="" onChange={() => {}} disabled />)
    fireEvent.click(screen.getByRole('button'))
    expect(screen.queryByPlaceholderText('Search…')).not.toBeInTheDocument()
  })

  it('offers the typed text as a choice when custom values are allowed', () => {
    const onChange = vi.fn()
    render(<SearchableSelect options={['Istanbul', 'Ankara']} value="" onChange={onChange} allowCustom />)

    openAndType('Aydın')
    fireEvent.click(screen.getByText('Use “Aydın”'))

    expect(onChange).toHaveBeenCalledWith('Aydın')
  })

  it('keeps the typed text when Enter is pressed in the search box', () => {
    const onChange = vi.fn()
    render(<SearchableSelect options={['Istanbul', 'Ankara']} value="" onChange={onChange} allowCustom />)

    openAndType('Aydın')
    fireEvent.keyDown(screen.getByPlaceholderText('Search…'), { key: 'Enter' })

    expect(onChange).toHaveBeenCalledWith('Aydın')
  })

  it('does not offer a custom choice unless custom values are allowed', () => {
    render(<SearchableSelect options={['Istanbul', 'Ankara']} value="" onChange={() => {}} />)
    openAndType('Aydın')
    expect(screen.queryByText(/^Use “/)).not.toBeInTheDocument()
  })

  it('does not offer a custom choice that duplicates an existing option', () => {
    render(<SearchableSelect options={['Istanbul', 'Ankara']} value="" onChange={() => {}} allowCustom />)
    openAndType('ankara')
    expect(screen.queryByText(/^Use “/)).not.toBeInTheDocument()
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

  it('lets someone enter a city that is missing from the list', () => {
    const { onCityChange } = setup('Turkey')

    fireEvent.click(screen.getAllByRole('button')[1])
    fireEvent.change(screen.getByPlaceholderText('Search…'), { target: { value: 'Aydın' } })
    fireEvent.click(screen.getByText('Use “Aydın”'))

    expect(onCityChange).toHaveBeenCalledWith('Aydın')
  })

  it('lets every country that has a city list be chosen', () => {
    const unreachable = Object.keys(CITIES_BY_COUNTRY).filter(country => !COUNTRIES.includes(country))
    expect(unreachable).toEqual([])
  })

  it('falls back to free text for a country with no city list', () => {
    setup('Andorra')
    expect(screen.getByPlaceholderText('Enter your city')).toBeInTheDocument()
  })

  it('announces each control by its label as well as its current value', () => {
    setup('Turkey', 'Izmir')
    expect(screen.getByRole('button', { name: 'Country Turkey' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'City Izmir' })).toBeInTheDocument()
  })

  it('names the free-text city field by the city label', () => {
    setup('Andorra')
    expect(screen.getByRole('textbox', { name: 'City' })).toBeInTheDocument()
  })
})
