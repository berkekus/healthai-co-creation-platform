import { describe, it, expect } from 'vitest'
import { canonicalizeDomains, domainFilterVariants } from '../constants/domains'

describe('canonicalizeDomains', () => {
  it('replaces merged duplicates with their canonical names', () => {
    expect(canonicalizeDomains(['Radiology', 'Mental Health', 'Intensive Care'])).toEqual([
      'Radiology & Imaging', 'Psychiatry & Mental Health', 'Intensive Care (ICU)',
    ])
  })

  it('splits a legacy name that covered two domains', () => {
    expect(canonicalizeDomains(['Geriatrics & Rehabilitation'])).toEqual(['Geriatrics', 'Physiotherapy & Rehabilitation'])
  })

  it('keeps current names and drops duplicates created by the merge', () => {
    expect(canonicalizeDomains(['Radiology & Imaging', 'Radiology', 'Nursing'])).toEqual(['Radiology & Imaging', 'Nursing'])
  })
})

describe('domainFilterVariants', () => {
  it('includes every legacy name that now means the requested domain', () => {
    expect(domainFilterVariants('Physiotherapy & Rehabilitation').sort()).toEqual([
      'Geriatrics & Rehabilitation',
      'Physical Therapy and Rehabilitation',
      'Physiotherapy & Rehabilitation',
      'Rehabilitation & Physio',
    ])
  })
})
