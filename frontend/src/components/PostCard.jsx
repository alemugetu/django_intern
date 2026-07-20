import { Link } from 'react-router-dom'

/**
 * Card displayed in the post grid on the home page.
 * Receives a single post object from the API.
 */
export default function PostCard({ post }) {
  return (
    <article className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      {/* Featured image */}
      {post.featured_image ? (
        <img
          src={post.featured_image}
          alt={post.title}
          className="w-full h-44 object-cover"
        />
      ) : (
        <div className="w-full h-44 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <span className="text-5xl select-none">📝</span>
        </div>
      )}

      <div className="p-5">
        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {post.tags.map((tag) => (
              <span
                key={tag.slug}
                className="px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-600 rounded-full"
              >
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <Link to={`/posts/${post.slug}`}>
          <h2 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
            {post.title}
          </h2>
        </Link>

        {/* Meta */}
        <div className="mt-2 flex items-center gap-2 text-xs text-gray-400 flex-wrap">
          {post.author && (
            <span className="font-medium text-gray-500">{post.author}</span>
          )}
          <span>·</span>
          <span>{new Date(post.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
          <span>·</span>
          <span>{post.read_time}</span>
          <span>·</span>
          <span>{post.number_of_views} views</span>
        </div>
      </div>
    </article>
  )
}
