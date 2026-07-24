import MDEditor from '@uiw/react-md-editor'
import { useEffect, useRef, useState } from 'react'
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
  const fileInputRef = useRef(null)

  const [form, setForm] = useState({
    title: '',
    content: '',
    status: 'draft',
    tag_ids: [],
  })
  const [imageFile, setImageFile] = useState(null)       // File object for upload
  const [imagePreview, setImagePreview] = useState(null) // Preview URL
  const [existingImage, setExistingImage] = useState(null) // URL from server on edit
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
        if (data.featured_image) setExistingImage(data.featured_image)
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

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setExistingImage(null)
  }

  const clearImage = () => {
    setImageFile(null)
    setImagePreview(null)
    setExistingImage(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
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
      // Use FormData when an image file is attached — multipart/form-data required
      let payload
      if (imageFile) {
        payload = new FormData()
        payload.append('title', form.title)
        payload.append('content', form.content)
        payload.append('status', form.status)
        form.tag_ids.forEach((id) => payload.append('tag_ids', id))
        payload.append('featured_image', imageFile)
      } else {
        payload = { ...form }
      }

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

  const previewSrc = imagePreview || existingImage

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

        {/* Featured image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Featured Image
          </label>

          {previewSrc ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden border border-gray-200">
              <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={clearImage}
                className="absolute top-2 right-2 px-2 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600"
              >
                Remove
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
              <span className="text-2xl mb-1">🖼️</span>
              <span className="text-sm text-gray-500">Click to upload an image</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
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
