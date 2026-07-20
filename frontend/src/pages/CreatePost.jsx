import MDEditor from '@uiw/react-md-editor'
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createPost, getPost, getTags, updatePost } from '../api/posts'

/**
 * Dual-purpose page — handles both creating a new post and editing an existing one.
 * When a `slug` param is present in the URL, it fetches the existing post and
 * switches to edit mode.
 */
export default function CreatePost() {
  const { slug } = useParams() // undefined when creating
  const navigate = useNavigate()
  const isEditing = Boolean(slug)

  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'draft',
    tag_ids: [],
  })
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(isEditing)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Load all available tags
  useEffect(() => {
    getTags().then(({ data }) => setTags(data.results ?? data)).catch(() => {})
  }, [])

  // If editing, pre-fill the form with existing data
  useEffect(() => {
    if (!isEditing) return
    getPost(slug)
      .then(({ data }) => {
        setForm({
          title: data.title,
          content: data.content,
          status: data.status,
          tag_ids: data.tags?.map((t) => t.id) ?? [],
        })
      })
      .catch(() => navigate('/'))
      .finally(() => setLoading(false))
  }, [slug, isEditing, navigate])

  const set = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target ? e.target.value : e }))

  const toggleTag = (id) => {
    setForm((prev) => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(id)
        ? prev.tag_ids.filter((t) => t !== id)
        : [...prev.tag_ids, id],
    }))
  }

  const validate = () => {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Title is required.'
    if (!form.content.trim()) errs.content = 'Content is required.'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSubmitting(true)
    setErrors({})
    try {
      const payload = { ...form }
      if (isEditing) {
        await updatePost(slug, payload)
        navigate(`/posts/${slug}`)
      } else {
        const { data } = await createPost(payload)
        navigate(`/posts/${data.slug}`)
      }
    } catch (err) {
      const serverErrors = err.response?.data ?? {}
      setErrors(
        typeof serverErrors === 'object'
          ? serverErrors
          : { non_field: 'Something went wrong. Please try again.' }
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        {isEditing ? 'Edit Post' : 'New Post'}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={form.title}
            onChange={set('title')}
            placeholder="Your post title"
            className={`w-full px-4 py-2.5 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-400' : 'border-gray-200'
            }`}
          />
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title}</p>}
        </div>

        {/* Markdown editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Content <span className="text-red-500">*</span>
          </label>
          <div data-color-mode="light">
            <MDEditor
              value={form.content}
              onChange={set('content')}
              height={400}
              preview="live"
            />
          </div>
          {errors.content && <p className="mt-1 text-xs text-red-500">{errors.content}</p>}
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    form.tag_ids.includes(tag.id)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  #{tag.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            value={form.status}
            onChange={set('status')}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="draft">Draft — save privately</option>
            <option value="published">Published — visible to everyone</option>
          </select>
        </div>

        {errors.non_field && (
          <p className="text-sm text-red-500">{errors.non_field}</p>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {submitting
              ? isEditing ? 'Saving…' : 'Publishing…'
              : isEditing ? 'Save changes' : 'Create post'}
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 border border-gray-200 text-sm font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
