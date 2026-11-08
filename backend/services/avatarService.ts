import fs from 'fs'
import path from 'path'
import mongoose from 'mongoose'
import Avatar from '../models/Avatar'
import User from '../models/User'
import { makeError } from '../utils/AppError'
import logger from '../src/logger'

const AVATAR_PATH = '/api/avatars/'

/** Where photos were written before they moved to the database; still served for local copies. */
export const LEGACY_AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars')

// The browser shrinks a photo to 256 px before sending it (~20-40 KB). This cap
// only stops a client that skipped that step from filling the database.
export const MAX_AVATAR_BYTES = 512 * 1024

export const WRONG_IMAGE_TYPE = 'Only JPEG, PNG, WebP, and GIF images are allowed'

/** The image type read from the file's first bytes; the type the browser reports is not trusted. */
export function sniffImageType(data: Buffer): string | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return 'image/jpeg'
  if (data.length >= 8 && data.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return 'image/png'
  }
  const head = data.subarray(0, 6).toString('ascii')
  if (head === 'GIF87a' || head === 'GIF89a') return 'image/gif'
  if (data.length >= 12 && data.subarray(0, 4).toString('ascii') === 'RIFF' && data.subarray(8, 12).toString('ascii') === 'WEBP') {
    return 'image/webp'
  }
  return null
}

/** Stores a photo and returns the URL to save on the user. Older photos stay until `deleteAvatarsExcept`. */
export async function storeAvatar(userId: string, data: Buffer) {
  const contentType = sniffImageType(data)
  if (!contentType) throw makeError(WRONG_IMAGE_TYPE, 400)
  const avatar = await Avatar.create({ userId, contentType, data })
  return { id: avatar.id as string, url: `${AVATAR_PATH}${avatar.id}` }
}

/** Run after the user points at the new photo, so a failed profile update never leaves a dangling URL. */
export async function deleteAvatarsExcept(userId: string, keepId: string) {
  await Avatar.deleteMany({ userId, _id: { $ne: keepId } })
}

export async function findAvatar(id: string) {
  if (!mongoose.isValidObjectId(id)) return null
  // Not lean: a hydrated document hands back `data` as a Buffer of exactly the photo's bytes.
  return Avatar.findById(id).select('contentType data')
}

/**
 * Photos uploaded before they moved to the database were written to the server
 * disk, which the host wipes on every restart. Their URLs now point at nothing,
 * so the profile shows a broken image and the "upload a photo" tip never
 * appears. Clear those, leaving any file that is still there.
 */
export async function clearMissingDiskAvatars(): Promise<number> {
  const users = await User.find({ avatarUrl: /^\/uploads\/avatars\// }).select('avatarUrl').lean()
  const missing = users
    .filter(u => !fs.existsSync(path.join(LEGACY_AVATAR_DIR, path.basename(u.avatarUrl as string))))
    .map(u => u._id)
  if (missing.length === 0) return 0

  const result = await User.updateMany({ _id: { $in: missing } }, { $unset: { avatarUrl: 1 } })
  logger.info({ count: result.modifiedCount }, 'Cleared profile photos whose file is gone from disk')
  return result.modifiedCount
}
