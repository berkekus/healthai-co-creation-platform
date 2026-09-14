/**
 * The one list of healthcare domains, used for posts, filters and profile
 * expertise suggestions.
 *
 * Groups follow the "Medical and health sciences" branch of the OECD Fields of
 * Science and Technology classification (clinical medicine, health sciences,
 * medical research and technology) — the same scheme the EU's EuroSciVoc
 * vocabulary builds on — so the list reads familiar to anyone who has applied
 * to European projects. Within each group are the specialties our members work
 * in, including the care professions (midwifery, nursing, therapy) they asked for.
 *
 * Domain names are stored on posts as-is, so renaming one is a data migration:
 * add the old name to LEGACY_DOMAIN_ALIASES (and the backend copy) instead.
 */
export type DomainGroupId = 'clinical' | 'care' | 'research'

export interface DomainGroup {
  id: DomainGroupId
  domains: readonly string[]
}

export const HEALTH_DOMAIN_GROUPS: readonly DomainGroup[] = [
  {
    id: 'clinical',
    domains: [
      'Anesthesiology', 'Cardiology', 'Dentistry & Oral Health', 'Dermatology', 'Emergency Medicine',
      'Endocrinology & Diabetes', 'Family Medicine & Primary Care', 'Gastroenterology & Hepatology', 'Geriatrics',
      'Hematology', 'Infectious Diseases', 'Intensive Care (ICU)', 'Internal Medicine', 'Nephrology', 'Neurology',
      'Obstetrics & Gynecology', 'Oncology', 'Ophthalmology', 'Orthopedics', 'Otorhinolaryngology (ENT)',
      'Pathology & Lab Diagnostics', 'Pediatrics', 'Psychiatry & Mental Health', 'Pulmonology',
      'Radiology & Imaging', 'Rheumatology', 'Surgery', 'Urology',
    ],
  },
  {
    id: 'care',
    domains: [
      'Clinical Pharmacy', 'Health Services & Policy', 'Maternal & Newborn Health', 'Midwifery', 'Nursing',
      'Nutrition & Dietetics', 'Occupational Health', 'Occupational Therapy', 'Palliative Care',
      'Physiotherapy & Rehabilitation', 'Public Health & Epidemiology', 'Speech & Language Therapy',
      'Sports Medicine & Exercise Science',
    ],
  },
  {
    id: 'research',
    domains: [
      'Bioethics', 'Digital Health & Telemedicine', 'Genomics & Precision Medicine', 'Health Informatics & EHR',
      'Medical Devices & Biomedical Engineering', 'Pharmacology & Drug Discovery', 'Remote Patient Monitoring',
      'Surgical Robotics',
    ],
  },
]

export const HEALTH_DOMAINS: readonly string[] = HEALTH_DOMAIN_GROUPS.flatMap(group => group.domains)

export const MAX_POST_DOMAINS = 3

/**
 * Names merged away when duplicates were removed, mapped to what they mean now.
 * Keep in sync with backend/constants/domains.ts.
 */
export const LEGACY_DOMAIN_ALIASES: Readonly<Record<string, readonly string[]>> = {
  'Radiology': ['Radiology & Imaging'],
  'Mental Health': ['Psychiatry & Mental Health'],
  'Mental Health AI': ['Psychiatry & Mental Health'],
  'Intensive Care': ['Intensive Care (ICU)'],
  'Pathology': ['Pathology & Lab Diagnostics'],
  'Rehabilitation & Physio': ['Physiotherapy & Rehabilitation'],
  'Physical Therapy and Rehabilitation': ['Physiotherapy & Rehabilitation'],
  'Geriatrics & Rehabilitation': ['Geriatrics', 'Physiotherapy & Rehabilitation'],
}

/** Replaces retired names with their current ones and removes duplicates. */
export function canonicalizeDomains(names: readonly string[]): string[] {
  const result: string[] = []
  for (const name of names) {
    for (const current of LEGACY_DOMAIN_ALIASES[name] ?? [name]) {
      if (current && !result.includes(current)) result.push(current)
    }
  }
  return result
}

/** A post's domains in display order, whether it predates multi-domain posts or not. */
export function postDomains(post: { domain?: string; domains?: readonly string[] }): string[] {
  return canonicalizeDomains(post.domains?.length ? post.domains : [post.domain ?? ''])
}

/** Whether a post spans `domain`, treating retired names as their current ones. */
export function postHasDomain(post: { domain?: string; domains?: readonly string[] }, domain: string): boolean {
  const wanted = canonicalizeDomains([domain]).map(name => name.toLowerCase())
  return postDomains(post).some(name => wanted.includes(name.toLowerCase()))
}

/** Technical skills engineers list on their profiles. */
export const TECHNICAL_EXPERTISE: readonly string[] = [
  'AI/ML', 'Deep Learning', 'Natural Language Processing', 'Clinical NLP', 'Computer Vision', 'Medical Imaging',
  'Federated Learning', 'Signal Processing', 'Time Series Analysis', 'Biostatistics', 'Data Science',
  'Data Engineering & Analytics', 'Bioinformatics', 'Electronic Health Records (EHR)', 'FHIR & Interoperability',
  'Wearables', 'IoT in Healthcare', 'mHealth', 'Embedded Systems', 'Robotics', 'Backend / Cloud Engineering',
  'Frontend / UX Engineering', 'Healthcare Cybersecurity', 'Regulatory Affairs (CE/FDA)',
]

export const EXPERTISE_SUGGESTIONS: readonly string[] = [...HEALTH_DOMAINS, ...TECHNICAL_EXPERTISE]
