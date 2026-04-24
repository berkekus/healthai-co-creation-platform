export type NotificationType =
  | 'meeting_request'
  | 'meeting_accepted'
  | 'meeting_declined'
  | 'meeting_cancelled'
  | 'post_closed'
  | 'partner_found'
  | 'interest_received'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  body: string
  isRead: boolean
  createdAt: string
  linkTo?: string
}

export interface ActivityLog {
  id: string
  timestamp: string
  userId: string
  userEmail: string
  role: string
  action: string
  targetEntityId?: string
  result: 'success' | 'failure'
  ipAddress?: string
}

export type ApiResponse<T> = {
  data: T
  success: boolean
  message?: string
}
