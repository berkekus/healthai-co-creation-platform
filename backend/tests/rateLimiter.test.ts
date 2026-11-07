import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { api, createUser, uniqueEmail } from './helpers'

const wrongLogin = (email: string) => api.post('/api/auth/login').send({ email, password: 'not-the-password' })

describe('rate limits', () => {
  afterEach(() => { delete process.env.RATE_LIMIT_ENABLED })

  describe('when enabled', () => {
    beforeEach(() => { process.env.RATE_LIMIT_ENABLED = 'true' })

    it('locks one account after 10 wrong passwords without locking others on the same network', async () => {
      const target = uniqueEmail()
      for (let i = 0; i < 10; i++) expect((await wrongLogin(target)).status).toBe(401)

      expect((await wrongLogin(target)).status).toBe(429)
      // A classmate behind the same IP is unaffected.
      expect((await wrongLogin(uniqueEmail())).status).toBe(401)
    })

    it('does not count successful sign-ins', async () => {
      const { email, password } = await createUser()
      for (let i = 0; i < 12; i++) {
        expect((await api.post('/api/auth/login').send({ email, password })).status).toBe(200)
      }
    })

    it('caps emails sent to one address, not to everyone', async () => {
      const email = uniqueEmail()
      for (let i = 0; i < 5; i++) {
        expect((await api.post('/api/auth/forgot-password').send({ email })).status).toBe(200)
      }
      expect((await api.post('/api/auth/forgot-password').send({ email })).status).toBe(429)
      expect((await api.post('/api/auth/forgot-password').send({ email: uniqueEmail() })).status).toBe(200)
    })
  })

  it('is off outside production unless switched on', async () => {
    const target = uniqueEmail()
    for (let i = 0; i < 15; i++) expect((await wrongLogin(target)).status).toBe(401)
  })
})
