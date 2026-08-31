import { type ReactNode } from 'react'
import SearchableSelect from './SearchableSelect'
import { COUNTRIES, getCitiesForCountry } from '../../data/locations'

interface Props {
  country: string
  city: string
  onCountryChange: (value: string) => void
  onCityChange: (value: string) => void
  countryLabel: ReactNode
  cityLabel: ReactNode
  countryError?: string
  cityError?: string
  countryPlaceholder?: string
  cityPlaceholder?: string
  /** Shown on the city control before a country has been chosen. */
  cityLockedPlaceholder?: string
  /** Applied to the free-text fallback for countries with no city list. */
  inputClassName?: string
  /** Placeholder for that same free-text fallback. */
  cityFreeTextPlaceholder?: string
}

/**
 * Country and city, where city depends on country.
 *
 * Registration and profile editing share this so the two cannot drift apart,
 * and it reads the same city list the post form does — one source, so a city
 * you can register with is a city you can post from.
 *
 * Country comes first because the city list is derived from it.
 */
export default function CountryCityPicker({
  country, city, onCountryChange, onCityChange,
  countryLabel, cityLabel, countryError, cityError,
  countryPlaceholder = 'Select country',
  cityPlaceholder = 'Select city',
  cityLockedPlaceholder = 'Select country first',
  cityFreeTextPlaceholder = 'Enter your city',
  inputClassName,
}: Props) {
  const cities = country ? getCitiesForCountry(country) : []

  // Roughly half the countries carry no city list. Rather than hand someone an
  // empty dropdown they cannot get past, let them type.
  const noCityData = Boolean(country) && cities.length === 0

  // A city stored before this picker existed may not be in the list. Keep it as
  // an option so opening the form does not silently discard it.
  const options = city && !cities.includes(city) ? [city, ...cities] : cities

  const err = 'mt-1.5 text-xs text-red-600 font-semibold'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        {countryLabel}
        <SearchableSelect
          options={COUNTRIES}
          value={country}
          onChange={next => {
            if (next === country) return
            onCountryChange(next)
            onCityChange('')       // the old city belongs to the old country
          }}
          placeholder={countryPlaceholder}
          error={countryError}
        />
        {countryError && <p className={err}>{countryError}</p>}
      </div>

      <div>
        {cityLabel}
        {noCityData ? (
          <input
            type="text"
            value={city}
            onChange={e => onCityChange(e.target.value)}
            placeholder={cityFreeTextPlaceholder}
            className={inputClassName}
            aria-invalid={Boolean(cityError)}
          />
        ) : (
          <SearchableSelect
            options={options}
            value={city}
            onChange={onCityChange}
            placeholder={country ? cityPlaceholder : cityLockedPlaceholder}
            error={cityError}
            disabled={!country}
          />
        )}
        {cityError && <p className={err}>{cityError}</p>}
      </div>
    </div>
  )
}
