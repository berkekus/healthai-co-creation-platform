export const LOG = {
  // Auth
  REGISTER:         'register',
  REGISTER_FAILED:  'register_failed',
  LOGIN:            'login',
  LOGIN_FAILED:     'login_failed',
  PROFILE_UPDATE:   'profile_update',
  PASSWORD_CHANGE:  'password_change',
  LOGOUT:           'logout',
  // Admin — user management
  USER_SUSPEND:     'user_suspend',
  USER_UNSUSPEND:   'user_unsuspend',
  // Posts
  POST_CREATE:      'post_create',
  POST_PUBLISH:     'post_publish',
  POST_PARTNER_FOUND: 'post_partner_found',
  POST_DELETE:      'post_delete',
  POST_INTEREST:    'post_interest',
  // Meetings
  MEETING_REQUEST:  'meeting_request',
  MEETING_ACCEPT:   'meeting_accept',
  MEETING_DECLINE:  'meeting_decline',
  MEETING_CANCEL:   'meeting_cancel',
  MEETING_COMPLETE: 'meeting_complete',
} as const

export type LogAction = typeof LOG[keyof typeof LOG]

// Actions displayed with a warning indicator in the admin panel
export const CRITICAL_LOG_ACTIONS = new Set<LogAction>([
  LOG.LOGIN_FAILED,
  LOG.REGISTER_FAILED,
  LOG.USER_SUSPEND,
  LOG.POST_DELETE,
])
