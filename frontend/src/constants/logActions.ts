// Same values as backend/constants/logActions.ts. The admin log filter offers these, not only the actions
// that happen to be on the page it has loaded.
export const LOG_ACTIONS = [
  'register', 'register_failed', 'email_verified', 'login', 'login_failed', 'profile_update', 'password_change',
  'forgot_password', 'password_reset', 'account_delete', 'logout',
  'user_suspend', 'user_unsuspend', 'user_delete',
  'post_create', 'post_update', 'post_publish', 'post_partner_found', 'post_reopen', 'post_delete', 'post_interest',
  'meeting_request', 'meeting_accept', 'meeting_confirm', 'meeting_decline', 'meeting_cancel', 'meeting_complete',
  'data_export',
] as const

/** Shown with a warning mark in the admin panel (backend CRITICAL_LOG_ACTIONS). */
export const CRITICAL_LOG_ACTIONS = new Set<string>(['login_failed', 'register_failed', 'user_suspend', 'post_delete'])
