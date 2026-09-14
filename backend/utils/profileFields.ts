import { makeError } from './AppError'

/**
 * Optional professional details that make a public profile credible: role,
 * department, ORCID iD, and ways to reach the person through their institution.
 */
export const PROFESSIONAL_FIELDS = [
  'position', 'department', 'orcid', 'institutionWebsite', 'contactEmail', 'linkedinUrl',
] as const

export type ProfessionalField = typeof PROFESSIONAL_FIELDS[number]

/** Longest accepted input; ORCID leaves room for the https://orcid.org/ form. */
const MAX_LENGTH: Record<ProfessionalField, number> = {
  position: 100,
  department: 120,
  orcid: 40,
  institutionWebsite: 200,
  contactEmail: 254,
  linkedinUrl: 200,
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ORCID_RE = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/

/** ORCID iDs end in an ISO 7064 MOD 11-2 check character. */
export function isValidOrcid(id: string): boolean {
  if (!ORCID_RE.test(id)) return false
  const digits = id.replace(/-/g, '')
  let total = 0
  for (const char of digits.slice(0, -1)) total = (total + Number(char)) * 2
  const result = (12 - (total % 11)) % 11
  const expected = result === 10 ? 'X' : String(result)
  return digits.slice(-1) === expected
}

function webAddress(value: string): URL | null {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

function normalizeField(field: ProfessionalField, value: string): string {
  switch (field) {
    case 'orcid': {
      const id = value.replace(/^https?:\/\/(www\.)?orcid\.org\//i, '').toUpperCase()
      if (!isValidOrcid(id)) throw makeError('Enter a valid ORCID iD, e.g. 0000-0002-1825-0097', 400)
      return id
    }
    case 'institutionWebsite':
      if (!webAddress(value)) throw makeError('Institution website must be a web address starting with https://', 400)
      return value
    case 'linkedinUrl': {
      const url = webAddress(value)
      const host = url?.hostname.toLowerCase() ?? ''
      if (!url || !(host === 'linkedin.com' || host.endsWith('.linkedin.com'))) {
        throw makeError('LinkedIn link must point to linkedin.com', 400)
      }
      return value
    }
    case 'contactEmail':
      if (!EMAIL_RE.test(value)) throw makeError('Contact email is not a valid email address', 400)
      return value.toLowerCase()
    default:
      return value
  }
}

/**
 * Validates the professional details present in a profile update. A field sent
 * as an empty string (or null) is cleared; a field left out is not touched.
 */
export function normalizeProfessionalFields(input: Record<string, unknown>) {
  const set: Partial<Record<ProfessionalField, string>> = {}
  const unset: ProfessionalField[] = []

  for (const field of PROFESSIONAL_FIELDS) {
    const raw = input[field]
    if (raw === undefined) continue
    if (raw === null || (typeof raw === 'string' && raw.trim() === '')) {
      unset.push(field)
      continue
    }
    if (typeof raw !== 'string') throw makeError(`${field} must be text`, 400)
    const value = raw.trim()
    if (value.length > MAX_LENGTH[field]) throw makeError(`${field} is too long`, 400)
    set[field] = normalizeField(field, value)
  }

  return { set, unset }
}
