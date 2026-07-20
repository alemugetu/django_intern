import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { deletePost, getPost } from '../api/posts'
import CommentSection from '../components/CommentSection'
import Spinner from '../components/Spinner'
import { useAuth } from '../context/AuthContext'

export default function PostDetail() {
  const { slug } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    setLoading(true)
    getPost(slug)
      .then(({ data }) => setPost(data))
      .catch(() => setError('Post not found or unavailable.'))
      .finally(() => setLoading(false))
  }, [slug])

  const handleDelete = async () => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return
    setDeleting(true)
    try {
      await deletePost(slug)
      navigate('/')
    } catch {
      setError('Failed to delete post.')
      setDeleting(false)
    }
  }

  if (loading) return <Spinner />
  if (error) return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center text-gray-500">
      <p className="text-5xl mb-4">🔍</p>
      <p>{error}</p>
      <Link to="/" className="mt-4 inline-block text-blue-600 hover:underline">← Back to posts</Link>
    </div>
  )

  const isAuthor = user?.username === post.author

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Back link */}
      <Link to="/" className="text-sm text-blue-600 hover:underline">← All posts</Link>

      {/* Featured image */}
      {post.featured_image && (
        <img
          src={post.featured_image}
          alt={post.title}
          className="mt-6 w-full h-72 object-cover rounded-2xl"
        />
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag.slug}
              className="px-2.5 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full"
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Title */}
      <h1 className="mt-4 text-4xl font-bold text-gray-900 leading-tight">{post.title}</h1>

      {/* Meta */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-400">
        {post.author && <span className="font-medium text-gray-600">{post.author}</span>}
        <span>·</span>
        <span>{new Date(post.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        <span>·</span>
        <span>{post.read_time}</span>
        <span>·</span>
        <span>{post.number_of_views} views</span>

        {/* Author controls */}
        {isAuthor && (
          <div className="ml-auto flex gap-3">
            <Link
              to={`/edit/${post.slug}`}
              className="text-blue-500 hover:text-blue-700 text-xs font-medium"
            >
              Edit
            </Link>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-400 hover:text-red-600 text-xs font-medium disabled:opacity-50"
            >
              {deleting ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Draft banner */}
      {post.status === 'draft' && (
        <div className="mt-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 font-medium">
          ⚠️ Draft — only visible to you
        </div>
      )}

      {/* Body */}
      <div className="mt-8 prose prose-gray max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
        {post.content}
      </div>

      {/* Comments */}
      <CommentSection postSlug={slug} />
    </div>
  )
}
