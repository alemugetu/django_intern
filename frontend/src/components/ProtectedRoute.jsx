import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Wraps any route that requires authentication.
 * Saves the attempted URL so we can redirect back after login.
 *
 * Usage:
 *   <Route path="/create" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
 */
export default function ProtectedRoute({ children }) {
  const { token } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}
