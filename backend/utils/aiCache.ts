import crypto from 'crypto'

/**
 * Keeps AI answers in memory for a while, so the same question is not sent to
 * Gemini twice. The API runs as one instance, so memory is enough; a restart
 * only costs a few repeated calls. The oldest entries go once a cache is full.
 */
export class TtlCache<T> {
  private readonly entries = new Map<string, { value: T; expires: number }>()

  constructor(private readonly ttlMs: number, private readonly maxEntries = 2000) {}

  get(key: string): T | undefined {
    const hit = this.entries.get(key)
    if (!hit) return undefined
    if (hit.expires <= Date.now()) {
      this.entries.delete(key)
      return undefined
    }
    return hit.value
  }

  set(key: string, value: T): void {
    this.entries.delete(key)
    this.entries.set(key, { value, expires: Date.now() + this.ttlMs })
    while (this.entries.size > this.maxEntries) {
      const oldest = this.entries.keys().next().value
      if (oldest === undefined) break
      this.entries.delete(oldest)
    }
  }

  clear(): void {
    this.entries.clear()
  }
}

const caches: TtlCache<unknown>[] = []

export function createAiCache<T>(ttlMs: number, maxEntries?: number): TtlCache<T> {
  const cache = new TtlCache<T>(ttlMs, maxEntries)
  caches.push(cache as TtlCache<unknown>)
  return cache
}

/** For tests: forget every cached answer. */
export function clearAiCaches(): void {
  for (const cache of caches) cache.clear()
}

/** A short key for everything the answer depends on. */
export function cacheKey(...parts: unknown[]): string {
  return crypto.createHash('sha256').update(JSON.stringify(parts)).digest('base64url')
}

export const HOUR = 60 * 60 * 1000
