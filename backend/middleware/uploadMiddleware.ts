import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { makeError } from '../utils/AppError'
import { LEGACY_AVATAR_DIR, MAX_AVATAR_BYTES, WRONG_IMAGE_TYPE } from '../services/avatarService'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif'])

// Held in memory and stored in the database by the controller: the host's disk
// does not survive a restart.
export const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (ALLOWED_TYPES.includes(file.mimetype) && ALLOWED_EXTENSIONS.has(ext)) {
      cb(null, true)
    } else {
      cb(makeError(WRONG_IMAGE_TYPE, 400))
    }
  },
})

export function deleteAvatarFile(avatarUrl: string | undefined) {
  if (!avatarUrl) return
  try {
    const filepath = path.join(LEGACY_AVATAR_DIR, path.basename(avatarUrl))
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
  } catch {
    // non-critical
  }
}
