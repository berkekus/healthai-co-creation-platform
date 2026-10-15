// Mailbox providers people mistype most often. University domains are too many
// to list; their usual slips are in the ending (".edu.rt") and fixed below.
const COMMON_DOMAINS = [
  'gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'icloud.com', 'live.com',
  'yandex.com', 'msn.com', 'me.com', 'aol.com', 'protonmail.com', 'proton.me',
  'gmx.com', 'mail.com', 'hotmail.com.tr', 'outlook.com.tr',
]

const ENDING_FIXES: [RegExp, string][] = [
  [/\.(con|cpm|cmo|cim|comm|ocm|vom|xom)$/, '.com'],
  [/\.(edu\.rt|eud\.tr|ed\.tr|edu\.t|edutr|edu\.tt)$/, '.edu.tr'],
  [/\.(ogr|orgg|rog)$/, '.org'],
  [/\.(nt|nett)$/, '.net'],
]

/** Edit distance that counts swapping two neighbouring letters ("gmial") as one edit. */
function editDistance(a: string, b: string): number {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)])
  for (let j = 1; j <= b.length; j++) d[0][j] = j
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost)
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1)
      }
    }
  }
  return d[a.length][b.length]
}

function suggestDomain(domain: string): string | null {
  if (COMMON_DOMAINS.includes(domain)) return null

  // "gmail" with no ending at all
  const bare = COMMON_DOMAINS.find(known => known.split('.')[0] === domain)
  if (bare) return bare

  for (const [pattern, ending] of ENDING_FIXES) {
    if (pattern.test(domain)) {
      const fixed = domain.replace(pattern, ending)
      return suggestDomain(fixed) ?? fixed
    }
  }

  let best: string | null = null
  let bestDistance = Infinity
  for (const known of COMMON_DOMAINS) {
    const distance = editDistance(domain, known)
    if (distance < bestDistance) { best = known; bestDistance = distance }
  }
  // Short names sit close to unrelated real domains, so allow less slack there.
  const allowed = domain.length <= 8 ? 1 : 2
  return best && bestDistance > 0 && bestDistance <= allowed ? best : null
}

/**
 * The address the person most likely meant, when the domain looks like a typo
 * of a common one ("name@gmial.com" → "name@gmail.com"); otherwise null.
 */
export function suggestEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase()
  const at = trimmed.lastIndexOf('@')
  if (at < 1 || at === trimmed.length - 1) return null
  const domain = trimmed.slice(at + 1)
  const suggestion = suggestDomain(domain)
  return suggestion ? `${email.trim().slice(0, at)}@${suggestion}` : null
}
