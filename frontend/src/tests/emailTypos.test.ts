import { describe, expect, it } from 'vitest'
import { suggestEmail } from '../utils/emailTypos'

describe('suggestEmail', () => {
  it.each([
    ['ayse@gmial.com', 'ayse@gmail.com'],
    ['ayse@gmai.com', 'ayse@gmail.com'],
    ['ayse@gmail.con', 'ayse@gmail.com'],
    ['ayse@gmail', 'ayse@gmail.com'],
    ['ayse@hotmial.com', 'ayse@hotmail.com'],
    ['ayse@outlok.com', 'ayse@outlook.com'],
    ['ayse@yahooo.com', 'ayse@yahoo.com'],
    ['ayse@cankaya.edu.rt', 'ayse@cankaya.edu.tr'],
    ['ayse@ogr.metu.eud.tr', 'ayse@ogr.metu.edu.tr'],
  ])('suggests a fix for %s', (typed, expected) => {
    expect(suggestEmail(typed)).toBe(expected)
  })

  it('keeps what the person typed before the @', () => {
    expect(suggestEmail('Ayse.Kaya@GMIAL.com')).toBe('Ayse.Kaya@gmail.com')
  })

  it.each([
    'ayse@gmail.com',
    'ayse@cankaya.edu.tr',
    'ayse@student.cankaya.edu.tr',
    'ayse@metu.edu.tr',
    'ayse@uni-lj.si',
    'ayse@live.com',
    'ayse@mail.ru',
    'not-an-email',
    'ayse@',
  ])('leaves %s alone', email => {
    expect(suggestEmail(email)).toBeNull()
  })
})
