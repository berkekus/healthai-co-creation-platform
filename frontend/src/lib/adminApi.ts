import api from './api'
import type { User } from '../types/auth.types'
import type { ActivityLog } from '../types/common.types'

/** One page of members (admins left out), searched on the server by name, email or institution. */
export async function fetchAdminUsers(params: { page: number; limit: number; search?: string }, signal?: AbortSignal) {
  const { data } = await api.get<{ success: boolean; data: { users: (User & { _id?: string })[]; total: number } }>('/auth/users', {
    params: { page: params.page, limit: params.limit, search: params.search || undefined, excludeAdmins: 'true' },
    signal,
  })
  return { users: data.data.users.map(u => ({ ...u, id: u._id ?? u.id })), total: data.data.total }
}

/** One page of activity logs, filtered on the server. */
export async function fetchLogs(params: { page: number; limit: number; action?: string; result?: string }, signal?: AbortSignal) {
  const { data } = await api.get<{ success: boolean; data: { logs: (ActivityLog & { _id?: string })[]; total: number; page: number; limit: number } }>('/logs', {
    params: { page: params.page, limit: params.limit, action: params.action || undefined, result: params.result || undefined },
    signal,
  })
  return { ...data.data, logs: data.data.logs.map(l => ({ ...l, id: l._id ?? l.id })) }
}
