import { describe, it, expect } from 'vitest'
import en from '../i18n/locales/en.json'
import tr from '../i18n/locales/tr.json'
import es from '../i18n/locales/es.json'
import pt from '../i18n/locales/pt.json'
import nl from '../i18n/locales/nl.json'

type Tree = { [key: string]: string | string[] | Tree }

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) => {
    if (typeof value === 'string') return [`${prefix}${key}`]
    if (Array.isArray(value)) return value.map((_, i) => `${prefix}${key}.${i}`)
    return keys(value, `${prefix}${key}.`)
  })
}

function entries(tree: Tree, prefix = ''): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]): [string, string][] => {
    if (typeof value === 'string') return [[`${prefix}${key}`, value]]
    if (Array.isArray(value)) return value.map((item, i): [string, string] => [`${prefix}${key}.${i}`, item])
    return entries(value, `${prefix}${key}.`)
  })
}

const OTHER_LANGUAGES = { tr, es, pt, nl } as Record<string, Tree>
const questionMarks = (text: string) => text.split('?').length - 1

describe('translation text', () => {
  // Saving a locale file in a Windows code page turns ı, ş, ğ and İ into "?"
  // ("Toplant? Taleplerim" reached the live navbar that way). A translation
  // asks a question only where English does, so an extra "?" means a lost letter.
  it.each(Object.keys(OTHER_LANGUAGES))('%s has no "?" that English does not have', language => {
    const english = new Map(entries(en as Tree))
    const extra = entries(OTHER_LANGUAGES[language])
      .filter(([key, text]) => questionMarks(text) > questionMarks(english.get(key) ?? ''))
      .map(([key, text]) => `${key}: ${text}`)
    expect(extra).toEqual([])
  })

  it.each(['en', ...Object.keys(OTHER_LANGUAGES)])('%s has no replacement or double-encoded characters', language => {
    const tree = language === 'en' ? (en as Tree) : OTHER_LANGUAGES[language]
    const broken = entries(tree)
      .filter(([, text]) => /�|Ã.|Ä[±°Ÿž]|Å[Ÿž]|â€/.test(text))
      .map(([key, text]) => `${key}: ${text}`)
    expect(broken).toEqual([])
  })
})

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
