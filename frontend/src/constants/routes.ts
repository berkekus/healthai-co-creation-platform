export const ROUTES = {
  HOME:          '/',
  LOGIN:         '/login',
  REGISTER:      '/register',
  VERIFY_EMAIL:  '/verify-email',
  DASHBOARD:     '/dashboard',
  POSTS:         '/posts',
  POST_DETAIL:   '/posts/:id',
  POST_CREATE:   '/posts/new',
  POST_EDIT:     '/posts/:id/edit',
  MEETINGS:      '/meetings',
  PROFILE:       '/profile',
  NOTIFICATIONS: '/notifications',
  ADMIN:         '/admin',
  PRIVACY:       '/privacy',
  NOT_FOUND:     '/404',
  UNAUTHORIZED:  '/unauthorized',
} as const

export function postDetail(id: string) { return `/posts/${id}` }
export function postEdit(id: string)   { return `/posts/${id}/edit` }
