import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { Request } from 'express'

const AVATAR_DIR = path.join(process.cwd(), 'uploads', 'avatars')

if (!fs.existsSync(AVATAR_DIR)) {
  fs.mkdirSync(AVATAR_DIR, { recursive: true })
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATAR_DIR),
  filename: (req: Request & { userId?: string }, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const userId = req.userId ?? 'unknown'
    cb(null, `${userId}-${Date.now()}${ext}`)
  },
})

export const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'))
    }
  },
})

export function deleteAvatarFile(avatarUrl: string | undefined) {
  if (!avatarUrl) return
  try {
    const filename = path.basename(avatarUrl)
    const filepath = path.join(AVATAR_DIR, filename)
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath)
  } catch {
    // non-critical
  }
}
