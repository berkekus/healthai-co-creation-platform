import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_UPLOAD_BYTES, prepareAvatar, resolveAvatarUrl } from '../utils/avatarImage'

describe('resolveAvatarUrl', () => {
  it('points photos the API serves at the API host', () => {
    expect(resolveAvatarUrl('/api/avatars/0123456789abcdef01234567')).toMatch(/^https?:\/\/[^/]+\/api\/avatars\/0123456789abcdef01234567$/)
    expect(resolveAvatarUrl('/uploads/avatars/old.png')).toMatch(/^https?:\/\/[^/]+\/uploads\/avatars\/old\.png$/)
  })

  it('leaves outside addresses alone and returns nothing for no photo', () => {
    expect(resolveAvatarUrl('https://example.org/me.jpg')).toBe('https://example.org/me.jpg')
    expect(resolveAvatarUrl(undefined)).toBeUndefined()
    expect(resolveAvatarUrl(null)).toBeUndefined()
    expect(resolveAvatarUrl('')).toBeUndefined()
  })
})

describe('prepareAvatar when the browser cannot shrink the photo', () => {
  afterEach(() => { vi.unstubAllGlobals() })

  const undecodable = () => vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('cannot decode')))

  it('sends a small original as it is', async () => {
    undecodable()
    const file = new File([new Uint8Array(1024)], 'me.png', { type: 'image/png' })
    expect(await prepareAvatar(file)).toBe(file)
  })

  it('gives up on an original the server would refuse', async () => {
    undecodable()
    const file = new File([new Uint8Array(MAX_UPLOAD_BYTES + 1)], 'me.png', { type: 'image/png' })
    expect(await prepareAvatar(file)).toBeNull()
  })
})
