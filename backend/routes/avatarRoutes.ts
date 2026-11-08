import { Router } from 'express'
import { asyncHandler } from '../utils/asyncHandler'
import { findAvatar } from '../services/avatarService'

const router = Router()

// Public like the profile it belongs to. Each upload gets a new id, so a browser
// may keep a photo for good.
router.get('/:id', asyncHandler(async (req, res) => {
  const avatar = await findAvatar(req.params.id)
  if (!avatar) {
    res.status(404).json({ success: false, message: 'Photo not found' })
    return
  }
  res.set('Content-Type', avatar.contentType)
  res.set('Cache-Control', 'public, max-age=31536000, immutable')
  res.send(avatar.data)
}))

export default router
