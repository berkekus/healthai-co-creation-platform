import axios from 'axios'
import { useNetworkStore } from '../store/networkStore'

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    /** Set when the request counts toward the app-wide "server is waking up" notice. */
    countsTowardSlowNotice?: boolean
  }
}

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token') ?? sessionStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  // AI calls are slow by design; counting them would blame a server that is awake.
  if (!config.url?.startsWith('/ai/')) {
    config.countsTowardSlowNotice = true
    useNetworkStore.getState().requestStarted()
  }
  return config
})

api.interceptors.response.use(
  (res) => {
    if (res.config.countsTowardSlowNotice) useNetworkStore.getState().requestFinished()
    return res
  },
  (error) => {
    if (error.config?.countsTowardSlowNotice) useNetworkStore.getState().requestFinished()
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      sessionStorage.removeItem('token')
      // avoid circular import — navigate via window instead of router
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    const message: string =
      error.response?.data?.message ?? error.message ?? 'Something went wrong'
    // Keep the status so callers can tell "not configured" (503) from other failures.
    return Promise.reject(Object.assign(new Error(message), { status: error.response?.status as number | undefined }))
  }
)

export default api
