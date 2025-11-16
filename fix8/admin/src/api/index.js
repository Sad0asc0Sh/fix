import axios from 'axios'
import { useAuthStore } from '../stores'

// Base URL can be overridden via Vite env (VITE_API_BASE_URL)
const baseURL = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:5000/api').replace(/\/$/, '')

// Create a shared axios instance
export const api = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Attach Authorization header from Zustand store for all requests except login endpoints
api.interceptors.request.use((config) => {
  try {
    const url = (config.url || '').toString()
    const isLogin = url.endsWith('/auth/login') || url.endsWith('/auth/admin/login')
    if (!isLogin) {
      const token = useAuthStore.getState()?.token
      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }
    }
  } catch (_) {}
  return config
})

// Optional: normalize API errors & handle auth expiry
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    const url = error?.config?.url || ''
    const messageText =
      error?.response?.data?.message || error?.message || 'Request failed'

    const isLoginEndpoint =
      url.endsWith('/auth/login') || url.endsWith('/auth/admin/login')

    if (status === 401 && !isLoginEndpoint) {
      try {
        const { logout } = useAuthStore.getState() || {}
        if (logout) {
          logout()
        }
      } catch (_) {
        // ignore
      }

      if (typeof window !== 'undefined' && window.location) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(new Error(messageText))
  },
)

export default api
