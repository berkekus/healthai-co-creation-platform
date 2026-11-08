import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { sendVerificationEmail } from '../services/emailService'

const accepted = () => new Response('{"id":"mail_1"}', { status: 200 })

describe('verification mail delivery through Resend', () => {
  beforeEach(() => { process.env.RESEND_API_KEY = 're_test_key' })
  afterEach(() => {
    delete process.env.RESEND_API_KEY
    vi.unstubAllGlobals()
  })

  it('retries a mail the provider turned away with 429', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response('{"name":"rate_limit_exceeded"}', { status: 429, headers: { 'retry-after': '1' } }))
      .mockResolvedValueOnce(accepted())
    vi.stubGlobal('fetch', fetchMock)

    await sendVerificationEmail('student@example.edu', 'token', 'Student')

    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('sends one mail at a time when a class registers together', async () => {
    let inFlight = 0
    let peak = 0
    vi.stubGlobal('fetch', vi.fn(async () => {
      inFlight++
      peak = Math.max(peak, inFlight)
      await new Promise(resolve => setTimeout(resolve, 20))
      inFlight--
      return accepted()
    }))

    await Promise.all([1, 2, 3].map(i => sendVerificationEmail(`s${i}@example.edu`, 'token', 'Student')))

    expect(peak).toBe(1)
  })
})
