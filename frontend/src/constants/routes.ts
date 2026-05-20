export const ROUTES = {
  HOME:             '/',
  LOGIN:            '/login',
  REGISTER:         '/register',
  VERIFY_EMAIL:     '/verify-email',
  FORGOT_PASSWORD:  '/forgot-password',
  RESET_PASSWORD:   '/reset-password',
  DASHBOARD:        '/dashboard',
  POSTS:            '/posts',
  POST_DETAIL:      '/posts/:id',
  POST_CREATE:      '/posts/new',
  POST_EDIT:        '/posts/:id/edit',
  MEETINGS:         '/meetings',
  PROFILE:          '/profile',
  PUBLIC_PROFILE:   '/profile/:userId',
  NOTIFICATIONS:    '/notifications',
  ADMIN:            '/admin',
  MESSAGES:         '/messages',
  CONVERSATION:     '/messages/:id',
  PRIVACY:          '/privacy',
  NOT_FOUND:        '/404',
  UNAUTHORIZED:     '/unauthorized',
  OAUTH_CALLBACK:   '/oauth-callback',
} as const

export function postDetail(id: string) { return `/posts/${id}` }
export function postEdit(id: string)   { return `/posts/${id}/edit` }
