import bcrypt from 'bcryptjs'
import { makeError } from './AppError'

// Cost 10 is OWASP's floor for bcrypt. The API runs on a tenth of a CPU core,
// where one cost-12 hash takes ~3 s; at 10 it takes ~0.75 s. Hashes stored at
// a higher cost still verify, because bcrypt reads the cost from the hash.
const SALT_ROUNDS = 10

// Longest a request waits for its turn before being told to retry
const MAX_WAIT_MS = 30_000

/*
 * bcryptjs hashes on the main thread in 100 ms slices. When a whole class signs
 * in at once, running every hash side by side makes each one, and every other
 * request squeezing in between the slices, as slow as all of them together.
 * Taking turns lets the first people in within a second and keeps the rest of
 * the API responsive.
 */
let busy = false
const queue: Array<() => void> = []

export async function runExclusive<T>(work: () => Promise<T>, maxWaitMs = MAX_WAIT_MS): Promise<T> {
  if (busy) {
    await new Promise<void>((resolve, reject) => {
      const turn = () => { clearTimeout(timer); resolve() }
      const timer = setTimeout(() => {
        queue.splice(queue.indexOf(turn), 1)
        reject(makeError('The server is busy. Please try again in a moment.', 503))
      }, maxWaitMs)
      queue.push(turn)
    })
  }
  busy = true
  try {
    return await work()
  } finally {
    const next = queue.shift()
    if (next) next() // hand the turn straight over, so no newcomer can cut in
    else busy = false
  }
}

export function hashPassword(password: string): Promise<string> {
  return runExclusive(() => bcrypt.hash(password, SALT_ROUNDS))
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return runExclusive(() => bcrypt.compare(password, hash))
}
