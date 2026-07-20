import axios from 'axios'

/**
 * Central axios instance.
 *
 * All API calls go through here so token attachment and error handling
 * are handled in one place — never scattered across components.
 *
 * The Vite dev proxy (vite.config.js) forwards /api/* to Django :8000,
 * so the baseURL works identically in dev and production builds.
 */
const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach stored token to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Token ${token}`
  }
  return config
})

// Response interceptor — if the server returns 401, clear stale token
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    return Promise.reject(error)
  }
)

export default client
