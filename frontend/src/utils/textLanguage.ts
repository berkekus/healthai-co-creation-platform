/**
 * A rough guess at whether user-written text is English or Turkish — the two
 * languages people write posts and messages in — so a "translate" offer can be
 * skipped when the reader already reads the text in their own language.
 *
 * It counts common function words rather than detecting languages properly, and
 * says `null` whenever the evidence is thin; callers then simply offer the
 * translation.
 */
export type GuessedLanguage = 'en' | 'tr'

const ENGLISH_WORDS = new Set([
  'the', 'and', 'of', 'to', 'in', 'for', 'with', 'on', 'is', 'are', 'was', 'were', 'be', 'we', 'our',
  'you', 'your', 'that', 'this', 'from', 'by', 'as', 'or', 'an', 'it', 'at', 'have', 'has', 'will',
  'can', 'would', 'not', 'but', 'if', 'into', 'about', 'which', 'who', 'how', 'what', 'they', 'their',
  'there', 'also', 'more', 'without', 'want', 'need', 'looking',
])

// "de", "da" and "en" are left out: they are just as common in Spanish, Portuguese and Dutch.
const TURKISH_WORDS = new Set([
  've', 'bir', 'bu', 'için', 'ile', 'çok', 'daha', 'olan', 'olarak', 'gibi', 'ama', 'veya', 'ki', 'mi',
  'mı', 'ne', 'kadar', 'sonra', 'önce', 'her', 'şu', 'biz', 'siz', 'ben', 'var', 'yok', 'değil', 'ise',
  'hem', 'çünkü', 'göre', 'ancak', 'nasıl', 'neden', 'eğer', 'bunu', 'bizim', 'sizin',
])

// ğ, ı and ş do not occur in English, Spanish, Portuguese or Dutch words.
const TURKISH_ONLY_LETTERS = /[ğış]/i

export function guessTextLanguage(text: string): GuessedLanguage | null {
  const words = text.replace(/İ/g, 'i').toLowerCase().match(/\p{L}+/gu) ?? []
  if (words.length < 3) return null

  const english = words.filter(word => ENGLISH_WORDS.has(word)).length
  const turkish = words.filter(word => TURKISH_WORDS.has(word)).length + (TURKISH_ONLY_LETTERS.test(text) ? 2 : 0)

  if (turkish >= 2 && turkish > english * 2) return 'tr'
  if (english >= 2 && english > turkish * 2) return 'en'
  return null
}
