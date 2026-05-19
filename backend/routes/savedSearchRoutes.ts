import { Router } from 'express'
import { listSavedSearches, createSavedSearch, deleteSavedSearch } from '../controllers/savedSearchController'
import { protect } from '../middleware/authMiddleware'

const router = Router()

router.get('/',       protect, listSavedSearches)
router.post('/',      protect, createSavedSearch)
router.delete('/:id', protect, deleteSavedSearch)

export default router
