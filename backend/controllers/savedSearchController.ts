import { AuthenticatedRequest } from '../middleware/authMiddleware'
import SavedSearch from '../models/SavedSearch'
import { asyncHandler } from '../utils/asyncHandler'
import { makeError } from '../utils/AppError'

export const listSavedSearches = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const searches = await SavedSearch.find({ userId: req.userId }).sort({ createdAt: -1 })
  res.json({ success: true, data: searches })
})

export const createSavedSearch = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const { name, filters } = req.body
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    res.status(400).json({ success: false, message: 'name is required' })
    return
  }
  const count = await SavedSearch.countDocuments({ userId: req.userId })
  if (count >= 20) throw makeError('Maximum 20 saved searches allowed', 400)

  const search = await SavedSearch.create({ userId: req.userId, name: name.trim(), filters: filters ?? {} })
  res.status(201).json({ success: true, data: search })
})

export const deleteSavedSearch = asyncHandler<AuthenticatedRequest>(async (req, res) => {
  const search = await SavedSearch.findOneAndDelete({ _id: req.params.id, userId: req.userId })
  if (!search) throw makeError('Saved search not found', 404)
  res.json({ success: true, message: 'Deleted' })
})
