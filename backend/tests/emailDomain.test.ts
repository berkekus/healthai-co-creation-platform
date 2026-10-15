import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { emailDomainAcceptsMail } from '../utils/emailDomain'

const { resolveMx, resolve } = vi.hoisted(() => ({ resolveMx: vi.fn(), resolve: vi.fn() }))
vi.mock('dns', () => ({ promises: { resolveMx, resolve } }))

const dnsError = (code: string) => Object.assign(new Error(code), { code })

describe('emailDomainAcceptsMail', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production')
    resolveMx.mockReset()
    resolve.mockReset()
  })
  afterEach(() => { vi.unstubAllEnvs() })

  it('accepts a domain with mail servers', async () => {
    resolveMx.mockResolvedValue([{ exchange: 'mx.gmail.com', priority: 5 }])
    expect(await emailDomainAcceptsMail('someone@gmail.com')).toBe(true)
    expect(resolveMx).toHaveBeenCalledWith('gmail.com')
  })

  it('rejects a domain that does not exist', async () => {
    resolveMx.mockRejectedValue(dnsError('ENOTFOUND'))
    resolve.mockRejectedValue(dnsError('ENOTFOUND'))
    expect(await emailDomainAcceptsMail('someone@gmail.cm')).toBe(false)
  })

  it('rejects a domain that declares it takes no mail (null MX)', async () => {
    resolveMx.mockResolvedValue([{ exchange: '', priority: 0 }])
    expect(await emailDomainAcceptsMail('someone@example.com')).toBe(false)
  })

  it('falls back to the address record when there is no MX record', async () => {
    resolveMx.mockRejectedValue(dnsError('ENODATA'))
    resolve.mockResolvedValue(['192.0.2.1'])
    expect(await emailDomainAcceptsMail('someone@small-uni.edu')).toBe(true)
  })

  it('never blocks registration when DNS itself fails', async () => {
    resolveMx.mockRejectedValue(dnsError('ESERVFAIL'))
    expect(await emailDomainAcceptsMail('someone@anything.org')).toBe(true)
  })

  it('skips the lookup outside production', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    expect(await emailDomainAcceptsMail('someone@smoke.edu')).toBe(true)
    expect(resolveMx).not.toHaveBeenCalled()
  })
})
