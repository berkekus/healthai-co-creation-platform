/**
 * Domain names that were merged when the healthcare domain list was cleaned up.
 * Posts saved before then still carry the old names, so filters treat each old
 * name as its canonical replacement until scripts/migrate-domains.ts has run.
 *
 * Keep in sync with LEGACY_DOMAIN_ALIASES in frontend/src/constants/domains.ts.
 */
export const LEGACY_DOMAIN_ALIASES: Record<string, string[]> = {
  'Radiology': ['Radiology & Imaging'],
  'Mental Health': ['Psychiatry & Mental Health'],
  'Mental Health AI': ['Psychiatry & Mental Health'],
  'Intensive Care': ['Intensive Care (ICU)'],
  'Pathology': ['Pathology & Lab Diagnostics'],
  'Rehabilitation & Physio': ['Physiotherapy & Rehabilitation'],
  'Physical Therapy and Rehabilitation': ['Physiotherapy & Rehabilitation'],
  'Geriatrics & Rehabilitation': ['Geriatrics', 'Physiotherapy & Rehabilitation'],
}

export const MAX_POST_DOMAINS = 3

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The canonical name plus every legacy name that now means it. */
export function domainFilterVariants(domain: string): string[] {
  const legacyNames = Object.entries(LEGACY_DOMAIN_ALIASES)
    .filter(([, canonical]) => canonical.some(name => name.toLowerCase() === domain.toLowerCase()))
    .map(([legacy]) => legacy)
  return [domain, ...legacyNames]
}

/** Maps legacy names to their canonical replacements and removes duplicates. */
export function canonicalizeDomains(domains: string[]): string[] {
  const result: string[] = []
  for (const domain of domains) {
    for (const name of LEGACY_DOMAIN_ALIASES[domain] ?? [domain]) {
      if (!result.includes(name)) result.push(name)
    }
  }
  return result
}
