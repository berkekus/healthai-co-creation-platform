import { countryCodeFor } from '../constants/countries.generated'

/**
 * Cities load per country rather than shipping with the app: the full set is
 * ~134k names across 250 countries, and the largest single country (the US, at
 * ~14k) is 188KB on its own. Picking a country fetches just that country's file
 * once and keeps it for the session.
 */
const cache = new Map<string, string[]>()
const inFlight = new Map<string, Promise<string[]>>()

/**
 * City names for a country name as stored on the user record.
 *
 * Returns an empty array for a country the dataset has no cities for — 58 of
 * them, all territories and micro-states — and for a country name this build
 * does not know. Callers are expected to fall back to a free-text field there
 * rather than leaving someone with an empty list and no way forward.
 */
export async function loadCities(countryName: string): Promise<string[]> {
  const code = countryCodeFor(countryName)
  if (!code) return []

  const cached = cache.get(code)
  if (cached) return cached

  const pending = inFlight.get(code)
  if (pending) return pending

  const request = fetch(`/cities/${code}.json`)
    .then(res => (res.ok ? res.json() as Promise<string[]> : []))
    .then(list => {
      const names = Array.isArray(list) ? list : []
      cache.set(code, names)
      return names
    })
    .catch(() => {
      // Offline or a missing file: an empty list sends the caller to the
      // free-text fallback, which is better than blocking the form.
      cache.set(code, [])
      return []
    })
    .finally(() => { inFlight.delete(code) })

  inFlight.set(code, request)
  return request
}

/** Synchronous check used to decide whether a stored city needs preserving. */
export function knownCountry(countryName: string): boolean {
  return countryCodeFor(countryName) !== null
}
