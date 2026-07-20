import { useEffect, useState } from 'react'
import { createComment, deleteComment, getComments } from '../api/posts'
import { useAuth } from '../context/AuthContext'

function CommentItem({ comment, currentUser, onDelete }) {
  return (
    <div className="flex gap-3">
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
        {comment.author?.[0]?.toUpperCase() ?? '?'}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-900">{comment.author}</span>
          <span className="text-xs text-gray-400">
            {new Date(comment.created_at).toLocaleDateString()}
          </span>
          {currentUser?.username === comment.author && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-auto text-xs text-red-400 hover:text-red-600"
            >
              Delete
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{comment.body}</p>

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className="mt-3 pl-4 border-l-2 border-gray-100 space-y-3">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                currentUser={currentUser}
                onDelete={onDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function CommentSection({ postSlug }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState(null) // comment ID being replied to
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getComments(postSlug)
      .then(({ data }) => setComments(data.results ?? data))
      .catch(() => setError('Failed to load comments.'))
      .finally(() => setLoading(false))
  }, [postSlug])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!body.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const payload = { body }
      if (replyTo) payload.parent = replyTo
      const { data } = await createComment(postSlug, payload)
      // Refresh comments to get nested structure from server
      const refreshed = await getComments(postSlug)
      setComments(refreshed.data.results ?? refreshed.data)
      setBody('')
      setReplyTo(null)
    } catch (err) {
      setError(err.response?.data?.body?.[0] ?? 'Failed to post comment.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this comment?')) return
    try {
      await deleteComment(id)
      const refreshed = await getComments(postSlug)
      setComments(refreshed.data.results ?? refreshed.data)
    } catch {
      setError('Failed to delete comment.')
    }
  }

  return (
    <section className="mt-12">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Comments ({comments.length})
      </h2>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-8">
          {replyTo && (
            <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
              <span>Replying to comment #{replyTo}</span>
              <button type="button" onClick={() => setReplyTo(null)} className="underline text-gray-400">
                cancel
              </button>
            </div>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
          <div className="mt-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting || !body.trim()}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? 'Posting…' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <p className="mb-8 text-sm text-gray-500">
          <a href="/login" className="text-blue-600 hover:underline">Log in</a> to leave a comment.
        </p>
      )}

      {/* Comment list */}
      {loading ? (
        <p className="text-sm text-gray-400">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No comments yet. Be the first!</p>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUser={user}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </section>
  )
}
