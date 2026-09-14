import { describe, it, expect } from 'vitest'
import {
  EXPERTISE_SUGGESTIONS,
  HEALTH_DOMAINS,
  LEGACY_DOMAIN_ALIASES,
  postDomains,
  postHasDomain,
} from '../constants/domains'

const duplicatesIgnoringCase = (names: readonly string[]) => {
  const seen = new Set<string>()
  return names.filter(name => {
    const key = name.toLowerCase()
    if (seen.has(key)) return true
    seen.add(key)
    return false
  })
}

describe('health domain list', () => {
  it('lists every domain once, ignoring case', () => {
    expect(duplicatesIgnoringCase(HEALTH_DOMAINS)).toEqual([])
  })

  it('offers the care professions survey participants could not find', () => {
    expect(HEALTH_DOMAINS).toEqual(expect.arrayContaining([
      'Midwifery', 'Maternal & Newborn Health', 'Nursing', 'Obstetrics & Gynecology', 'Physiotherapy & Rehabilitation',
    ]))
  })

  it('maps every retired name only to domains that are still offered', () => {
    const missing = Object.values(LEGACY_DOMAIN_ALIASES).flat().filter(name => !HEALTH_DOMAINS.includes(name))
    expect(missing).toEqual([])
  })

  it('does not offer a retired duplicate name as a domain', () => {
    const retiredStillOffered = Object.keys(LEGACY_DOMAIN_ALIASES).filter(name => HEALTH_DOMAINS.includes(name))
    expect(retiredStillOffered).toEqual([])
  })
})

describe('postDomains', () => {
  it('reads a post saved under a retired name as its current domain', () => {
    expect(postDomains({ domain: 'Radiology' })).toEqual(['Radiology & Imaging'])
  })

  it('keeps the order of a multi-domain post', () => {
    expect(postDomains({ domain: 'Midwifery', domains: ['Midwifery', 'Nursing'] })).toEqual(['Midwifery', 'Nursing'])
  })
})

describe('expertise suggestions', () => {
  it('suggests each expertise once and never a retired domain name', () => {
    expect(duplicatesIgnoringCase(EXPERTISE_SUGGESTIONS)).toEqual([])
    expect(EXPERTISE_SUGGESTIONS.filter(name => name in LEGACY_DOMAIN_ALIASES)).toEqual([])
  })
})

describe('postHasDomain', () => {
  it("matches any of a post's domains, not only the first", () => {
    expect(postHasDomain({ domain: 'Obstetrics & Gynecology', domains: ['Obstetrics & Gynecology', 'Midwifery'] }, 'Midwifery')).toBe(true)
  })

  it('matches a post saved under a retired name when filtering by the current one', () => {
    expect(postHasDomain({ domain: 'Radiology' }, 'Radiology & Imaging')).toBe(true)
  })

  it('does not match an unrelated domain', () => {
    expect(postHasDomain({ domain: 'Cardiology', domains: ['Cardiology'] }, 'Nursing')).toBe(false)
  })
})
