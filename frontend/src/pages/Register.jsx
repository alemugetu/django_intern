import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    const errs = {}
    if (!form.username.trim()) errs.username = 'Username is required.'
    if (form.password.length < 8) errs.password = 'Password must be at least 8 characters.'
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setErrors({})
    setLoading(true)
    try {
      await register({ username: form.username, email: form.email, password: form.password })
      navigate('/')
    } catch (err) {
      const serverErrors = err.response?.data ?? {}
      setErrors(
        typeof serverErrors === 'object'
          ? serverErrors
          : { non_field: 'Registration failed. Please try again.' }
      )
    } finally {
      setLoading(false)
    }
  }

  const Field = ({ id, label, type = 'text', autoComplete, field }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        value={form[field]}
        onChange={set(field)}
        className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          errors[field] ? 'border-red-400' : 'border-gray-200'
        }`}
      />
      {errors[field] && <p className="mt-1 text-xs text-red-500">{errors[field]}</p>}
    </div>
  )

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Create account</h1>
          <p className="text-sm text-gray-500 mb-6">Join the community</p>

          {errors.non_field && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.non_field}
            </div>
          )}
          {errors.error && (
            <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {errors.error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Field id="username" label="Username" autoComplete="username" field="username" />
            <Field id="email" label="Email (optional)" type="email" autoComplete="email" field="email" />
            <Field id="password" label="Password" type="password" autoComplete="new-password" field="password" />
            <Field id="confirm" label="Confirm password" type="password" autoComplete="new-password" field="confirm" />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
