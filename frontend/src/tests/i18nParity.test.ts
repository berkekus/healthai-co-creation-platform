import { describe, it, expect } from 'vitest'
import en from '../i18n/locales/en.json'
import tr from '../i18n/locales/tr.json'

type Tree = { [key: string]: string | Tree }

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  )
}

describe('translations', () => {
  // A key missing from Turkish falls back to English, which is how Turkish
  // screens ended up mixing both languages in the usability survey.
  it('has every English key in Turkish and nothing extra', () => {
    const english = new Set(keys(en as Tree))
    const turkish = new Set(keys(tr as Tree))
    expect([...english].filter(key => !turkish.has(key))).toEqual([])
    expect([...turkish].filter(key => !english.has(key))).toEqual([])
  })
})
