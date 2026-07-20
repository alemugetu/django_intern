import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import CreatePost from './pages/CreatePost'
import Login from './pages/Login'
import PostDetail from './pages/PostDetail'
import PostList from './pages/PostList'
import Register from './pages/Register'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<PostList />} />
          <Route path="/posts/:slug" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — redirect to /login if not authenticated */}
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:slug"
            element={
              <ProtectedRoute>
                <CreatePost />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  )
}
