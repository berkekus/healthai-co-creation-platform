import { promises as dns } from 'dns'

const LOOKUP_TIMEOUT_MS = 3000
// Answers that mean "this name has no such records", as opposed to DNS trouble.
const NOT_FOUND_CODES = new Set(['ENOTFOUND', 'ENODATA'])

function withTimeout<T>(lookup: Promise<T>): Promise<T> {
  return Promise.race([
    lookup,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(Object.assign(new Error('DNS lookup timed out'), { code: 'ETIMEOUT' })), LOOKUP_TIMEOUT_MS)
    ),
  ])
}

function isNotFound(err: unknown): boolean {
  return NOT_FOUND_CODES.has((err as { code?: string }).code ?? '')
}

/**
 * Whether the domain of `email` exists and can receive mail, so a typo such as
 * "name@gmial.cm" is caught at registration instead of sending a link nowhere.
 * Only a definite "no such domain" answer returns false: a slow or failing DNS
 * server must never stop someone from registering. Production only, so local
 * and test accounts can keep using made-up domains such as "@smoke.edu".
 */
export async function emailDomainAcceptsMail(email: string): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return true
  const domain = email.split('@').pop()?.trim().toLowerCase()
  if (!domain) return false

  try {
    const records = await withTimeout(dns.resolveMx(domain))
    // A lone "null MX" record (RFC 7505) says the domain accepts no mail.
    if (records.length > 0) return !(records.length === 1 && records[0].exchange === '')
  } catch (err) {
    if (!isNotFound(err)) return true
  }

  // Without MX records, mail goes to the domain's own address (RFC 5321 §5.1).
  try {
    return (await withTimeout(dns.resolve(domain))).length > 0
  } catch (err) {
    return !isNotFound(err)
  }
}
