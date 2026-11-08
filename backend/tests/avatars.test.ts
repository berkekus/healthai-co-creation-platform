import { describe, it, expect } from 'vitest'
import fs from 'fs'
import path from 'path'
import { api, createUser } from './helpers'
import User from '../models/User'
import Avatar from '../models/Avatar'
import { clearMissingDiskAvatars, LEGACY_AVATAR_DIR, MAX_AVATAR_BYTES } from '../services/avatarService'

// A 1×1 PNG. The server judges a file by its first bytes, not by its name or the
// type the browser reports.
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
)
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(64)])

const upload = (token: string, file: Buffer, filename = 'photo.png', contentType = 'image/png') =>
  api
    .post('/api/auth/me/avatar')
    .set('Authorization', `Bearer ${token}`)
    .attach('avatar', file, { filename, contentType })

const fetchImage = (url: string) => api.get(url).responseType('blob')

describe('profile photos', () => {
  it('keeps the photo in the database and serves it from the API', async () => {
    const { token } = await createUser()

    const res = await upload(token, PNG)
    expect(res.status).toBe(200)
    const url: string = res.body.data.avatarUrl
    expect(url).toMatch(/^\/api\/avatars\/[0-9a-f]{24}$/)

    const image = await fetchImage(url)
    expect(image.status).toBe(200)
    expect(image.headers['content-type']).toBe('image/png')
    expect(image.headers['cache-control']).toContain('immutable')
    expect(Buffer.compare(image.body as Buffer, PNG)).toBe(0)
  })

  it('replaces the previous photo instead of keeping both', async () => {
    const { token, user } = await createUser()
    const first = (await upload(token, PNG)).body.data.avatarUrl as string
    const second = await upload(token, JPEG, 'photo.jpg', 'image/jpeg')

    expect(second.status).toBe(200)
    expect(second.body.data.avatarUrl).not.toBe(first)
    expect(await Avatar.countDocuments({ userId: user.id })).toBe(1)
    expect((await fetchImage(first)).status).toBe(404)
    expect((await fetchImage(second.body.data.avatarUrl)).headers['content-type']).toBe('image/jpeg')
  })

  it('refuses a file that only claims to be an image', async () => {
    const { token } = await createUser()
    const res = await upload(token, Buffer.from('<html><script>alert(1)</script></html>'))

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Only JPEG, PNG, WebP, and GIF images are allowed')
    expect(await Avatar.countDocuments()).toBe(0)
  })

  it('answers a non-image upload with 400, not a server error', async () => {
    const { token } = await createUser()
    const res = await upload(token, Buffer.from('hello'), 'notes.txt', 'text/plain')

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Only JPEG, PNG, WebP, and GIF images are allowed')
  })

  it('refuses an image over the size cap', async () => {
    const { token } = await createUser()
    const tooBig = Buffer.concat([PNG, Buffer.alloc(MAX_AVATAR_BYTES)])
    const res = await upload(token, tooBig)

    expect(res.status).toBe(400)
    expect(res.body.message).toBe('Image is too large')
  })

  it('deletes the photo along with the account', async () => {
    const { token, user, password } = await createUser()
    await upload(token, PNG)

    const res = await api.delete('/api/auth/me').set('Authorization', `Bearer ${token}`).send({ password })
    expect(res.status).toBe(200)
    expect(await Avatar.countDocuments({ userId: user.id })).toBe(0)
  })

  it('answers 404 for an unknown or malformed photo id', async () => {
    expect((await fetchImage('/api/avatars/000000000000000000000000')).status).toBe(404)
    expect((await fetchImage('/api/avatars/not-an-id')).status).toBe(404)
  })

  it('forgets photos whose file vanished from the server disk', async () => {
    const [lost, kept] = await Promise.all([createUser(), createUser()])
    const keptName = `kept-${Date.now()}.png`
    const keptPath = path.join(LEGACY_AVATAR_DIR, keptName)
    fs.mkdirSync(LEGACY_AVATAR_DIR, { recursive: true })
    fs.writeFileSync(keptPath, PNG)
    try {
      await User.updateOne({ _id: lost.user.id }, { avatarUrl: '/uploads/avatars/gone-after-restart.png' })
      await User.updateOne({ _id: kept.user.id }, { avatarUrl: `/uploads/avatars/${keptName}` })

      expect(await clearMissingDiskAvatars()).toBe(1)

      expect((await User.findById(lost.user.id))?.avatarUrl).toBeUndefined()
      expect((await User.findById(kept.user.id))?.avatarUrl).toBe(`/uploads/avatars/${keptName}`)
    } finally {
      fs.rmSync(keptPath, { force: true })
    }
  })
})
