import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { loginUser, logoutUser, registerUser } from '../api/auth'

const AuthContext = createContext(null)

/**
 * AuthProvider wraps the entire app and exposes:
 *   user     — { user_id, username, email, ... } or null
 *   token    — string or null
 *   login()  — async, resolves with user data
 *   logout() — async, clears everything
 *   register()— async, resolves with user data
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [token, setToken] = useState(() => localStorage.getItem('token'))

  // Keep localStorage in sync whenever user/token changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
    } else {
      localStorage.removeItem('token')
    }
  }, [token])

  useEffect(() => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user))
    } else {
      localStorage.removeItem('user')
    }
  }, [user])

  const login = useCallback(async (credentials) => {
    const { data } = await loginUser(credentials)
    setToken(data.token)
    setUser({ user_id: data.user_id, username: data.username })
    return data
  }, [])

  const register = useCallback(async (formData) => {
    const { data } = await registerUser(formData)
    setToken(data.token)
    setUser({ user_id: data.user_id, username: data.username })
    return data
  }, [])

  const logout = useCallback(async () => {
    try {
      await logoutUser()
    } catch {
      // Token may already be invalid — clear locally regardless
    } finally {
      setToken(null)
      setUser(null)
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook — components import this, never AuthContext directly
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
