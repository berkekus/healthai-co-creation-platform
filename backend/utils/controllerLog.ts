import { AuthenticatedRequest } from '../middleware/authMiddleware'
import { createLog } from '../services/logService'

export function log(req: AuthenticatedRequest, action: string, targetEntityId?: string) {
  createLog({
    userId: req.userId,
    userEmail: req.userEmail,
    role: req.userRole,
    action,
    targetEntityId,
    result: 'success',
    ipAddress: req.ip,
  }).catch(() => {})
}
