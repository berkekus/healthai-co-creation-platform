import { afterEach, describe, expect, it } from 'vitest'
import i18n from '../i18n'
import { API_ERROR_KEYS, translateApiMessage } from '../i18n/apiErrors'
import en from '../i18n/locales/en.json'
import tr from '../i18n/locales/tr.json'
import es from '../i18n/locales/es.json'
import pt from '../i18n/locales/pt.json'
import nl from '../i18n/locales/nl.json'

describe('translateApiMessage', () => {
  afterEach(async () => { await i18n.changeLanguage('en') })

  it.each(Object.entries({ en, tr, es, pt, nl }))('%s has every API error key', (_, locale) => {
    const section = (locale as { apiErrors: Record<string, string> }).apiErrors
    for (const key of API_ERROR_KEYS) expect(section[key], key).toBeTruthy()
  })

  it('shows a server message in the interface language', async () => {
    await i18n.changeLanguage('tr')
    expect(translateApiMessage('Too many requests, please try again later')).toBe('Çok fazla istek gönderildi. Lütfen biraz bekleyip tekrar deneyin.')
    expect(translateApiMessage('Invalid credentials')).toBe('E-posta veya şifre hatalı.')
  })

  it('carries numbers and names from messages that contain them', async () => {
    await i18n.changeLanguage('tr')
    expect(translateApiMessage('Choose no more than 3 domains')).toBe('En fazla 3 alan seçebilirsiniz.')
    expect(translateApiMessage('LinkedIn sign-in is not configured on this server.')).toBe('LinkedIn ile giriş henüz kullanılamıyor.')
  })

  it('turns browser-level failures into plain words', () => {
    expect(translateApiMessage('Network Error')).toMatch(/can't reach the server/)
    expect(translateApiMessage('timeout of 30000ms exceeded')).toMatch(/took too long/)
  })

  it('passes an unknown message through unchanged', () => {
    expect(translateApiMessage('Something new from the server')).toBe('Something new from the server')
  })
})
