import { describe, it, expect } from 'vitest'
import { guessTextLanguage } from '../utils/textLanguage'

describe('guessTextLanguage', () => {
  it('recognises English prose', () => {
    expect(guessTextLanguage('Midwives on our ward want an early warning for postpartum haemorrhage from wearable vital signs, without adding alarms.')).toBe('en')
  })

  it('recognises Turkish prose', () => {
    expect(guessTextLanguage('Yapay zeka destekli glikoz izleme sistemi için bir mühendis arıyoruz ve klinik verilerimiz hazır.')).toBe('tr')
  })

  it('does not guess from a few words or a mix', () => {
    expect(guessTextLanguage('ECG triage')).toBeNull()
    expect(guessTextLanguage('')).toBeNull()
  })
})
