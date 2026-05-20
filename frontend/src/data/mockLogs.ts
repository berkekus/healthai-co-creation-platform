import type { ActivityLog } from '../types/common.types'

export const mockLogs: ActivityLog[] = [
  { id: 'l1',  timestamp: '2026-04-19T08:01:00Z', userId: 'u1', userEmail: 'e.muller@charite.edu',   role: 'healthcare_professional', action: 'login',              result: 'success', ipAddress: '78.45.12.3'   },
  { id: 'l2',  timestamp: '2026-04-19T08:05:00Z', userId: 'u1', userEmail: 'e.muller@charite.edu',   role: 'healthcare_professional', action: 'post_create',        targetEntityId: 'p5', result: 'success' },
  { id: 'l3',  timestamp: '2026-04-19T09:12:00Z', userId: 'u2', userEmail: 'm.rossi@polimi.edu',      role: 'engineer',                action: 'login',              result: 'success', ipAddress: '91.23.44.7'   },
  { id: 'l4',  timestamp: '2026-04-19T09:15:00Z', userId: 'u2', userEmail: 'm.rossi@polimi.edu',      role: 'engineer',                action: 'meeting_request',    targetEntityId: 'p1', result: 'success' },
  { id: 'l5',  timestamp: '2026-04-19T09:45:00Z', userId: 'u1', userEmail: 'e.muller@charite.edu',   role: 'healthcare_professional', action: 'meeting_accept',     targetEntityId: 'p1', result: 'success' },
  { id: 'l6',  timestamp: '2026-04-18T14:30:00Z', userId: 'u3', userEmail: 'i.larsson@ki.edu',        role: 'healthcare_professional', action: 'login',              result: 'success', ipAddress: '185.12.9.44'  },
  { id: 'l7',  timestamp: '2026-04-18T14:32:00Z', userId: 'u3', userEmail: 'i.larsson@ki.edu',        role: 'healthcare_professional', action: 'post_update',        targetEntityId: 'p2', result: 'success' },
  { id: 'l8',  timestamp: '2026-04-18T10:00:00Z', userId: 'u4', userEmail: 'k.nakamura@tum.edu',      role: 'engineer',                action: 'register',           result: 'success' },
  { id: 'l9',  timestamp: '2026-04-18T10:05:00Z', userId: 'u4', userEmail: 'k.nakamura@tum.edu',      role: 'engineer',                action: 'login',              result: 'success' },
  { id: 'l10', timestamp: '2026-04-18T10:10:00Z', userId: 'u4', userEmail: 'k.nakamura@tum.edu',      role: 'engineer',                action: 'post_create',        targetEntityId: 'p8', result: 'success' },
  { id: 'l11', timestamp: '2026-04-17T16:20:00Z', userId: 'u5', userEmail: 'admin@healthai.edu',      role: 'admin',                   action: 'post_delete',        targetEntityId: 'p9', result: 'success' },
  { id: 'l12', timestamp: '2026-04-17T09:00:00Z', userId: 'u2', userEmail: 'm.rossi@polimi.edu',      role: 'engineer',                action: 'login_failed',       result: 'failure', ipAddress: '91.23.44.7'   },
  { id: 'l13', timestamp: '2026-04-17T09:01:00Z', userId: 'u2', userEmail: 'm.rossi@polimi.edu',      role: 'engineer',                action: 'login_failed',       result: 'failure', ipAddress: '91.23.44.7'   },
  { id: 'l14', timestamp: '2026-04-17T09:02:00Z', userId: 'u2', userEmail: 'm.rossi@polimi.edu',      role: 'engineer',                action: 'register_failed',    result: 'failure', ipAddress: '91.23.44.7'   },
  { id: 'l15', timestamp: '2026-04-16T11:00:00Z', userId: 'u1', userEmail: 'e.muller@charite.edu',   role: 'healthcare_professional', action: 'data_export',        result: 'success' },
  { id: 'l16', timestamp: '2026-04-15T08:00:00Z', userId: 'u3', userEmail: 'i.larsson@ki.edu',        role: 'healthcare_professional', action: 'post_partner_found', targetEntityId: 'p7', result: 'success' },
  { id: 'l17', timestamp: '2026-04-14T17:00:00Z', userId: 'u5', userEmail: 'admin@healthai.edu',      role: 'admin',                   action: 'user_suspend',       targetEntityId: 'u9', result: 'success' },
  { id: 'l18', timestamp: '2026-04-14T10:00:00Z', userId: 'u4', userEmail: 'k.nakamura@tum.edu',      role: 'engineer',                action: 'meeting_request',    targetEntityId: 'p6', result: 'success' },
  { id: 'l19', timestamp: '2026-04-13T12:00:00Z', userId: 'u1', userEmail: 'e.muller@charite.edu',   role: 'healthcare_professional', action: 'post_partner_found', targetEntityId: 'p9', result: 'success' },
  { id: 'l20', timestamp: '2026-04-12T09:00:00Z', userId: 'u5', userEmail: 'admin@healthai.edu',      role: 'admin',                   action: 'login',              result: 'success' },
]
