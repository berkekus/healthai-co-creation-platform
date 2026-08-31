import { useEffect, useState, type ReactNode } from 'react'
import SearchableSelect from './SearchableSelect'
import { COUNTRY_NAMES } from '../../constants/countries.generated'
import { loadCities } from '../../lib/locations'

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
  /** Applied to the free-text fallback for countries with no city data. */
  inputClassName?: string
  /** Placeholder for that same free-text fallback. */
  cityFreeTextPlaceholder?: string
}

/**
 * Country and city, where city depends on country.
 *
 * Owns its own two-column layout, labels and error text so that registration
 * and profile editing cannot drift apart — the dependency rule is subtle enough
 * that two copies would eventually disagree.
 *
 * Country comes first because the city list is derived from it.
 */
export default function CountryCityPicker({
  country, city, onCountryChange, onCityChange,
  countryLabel, cityLabel, countryError, cityError,
  countryPlaceholder = 'Select a country…',
  cityPlaceholder = 'Select a city…',
  cityLockedPlaceholder = 'Select a country first',
  cityFreeTextPlaceholder = 'Enter your city',
  inputClassName,
}: Props) {
  const [cities, setCities] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!country) {
      setCities([])
      return
    }
    let cancelled = false
    setLoading(true)
    loadCities(country)
      .then(list => { if (!cancelled) setCities(list) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [country])

  // 58 countries — territories and micro-states — carry no cities in the data
  // set. Rather than hand someone an empty list they cannot get past, let them
  // type. Same escape hatch when the fetch fails.
  const noCityData = Boolean(country) && !loading && cities.length === 0

  // A city stored before this picker existed may not be in the list. Keep it as
  // an option so opening the form does not silently discard it.
  const options = city && !cities.includes(city) ? [city, ...cities] : cities

  const err = 'mt-1.5 text-xs text-red-600 font-semibold'

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div>
        {countryLabel}
        <SearchableSelect
          options={COUNTRY_NAMES}
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
            loading={loading}
          />
        )}
        {cityError && <p className={err}>{cityError}</p>}
      </div>
    </div>
  )
}
