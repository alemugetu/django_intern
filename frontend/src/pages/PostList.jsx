import { useEffect, useState } from 'react'
import { getPosts, getTags } from '../api/posts'
import PostCard from '../components/PostCard'
import Spinner from '../components/Spinner'
import TagFilter from '../components/TagFilter'

export default function PostList() {
  const [posts, setPosts] = useState([])
  const [tags, setTags] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('') // debounced value
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pagination, setPagination] = useState({ next: null, previous: null, count: 0 })
  const [page, setPage] = useState(1)

  // Debounce search input by 400ms. To reduce unnecessary API requests and improve performance
  useEffect(() => {
    const id = setTimeout(() => {
      setQuery(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(id)
  }, [search])

  // Fetch tags once
  useEffect(() => {
    getTags()
      .then(({ data }) => setTags(data.results ?? data))
      .catch(() => {})
  }, [])

  // Fetch posts when filters or page change
  useEffect(() => {
    setLoading(true)
    const params = { page }
    if (query) params.search = query
    if (selectedTag) params.tag = selectedTag

    getPosts(params) //call the backend 
      .then(({ data }) => {
        setPosts(data.results ?? data)
        setPagination({ next: data.next, previous: data.previous, count: data.count ?? 0 })
      })
      .catch(() => setError('Failed to load posts. Is the Django server running?'))
      .finally(() => setLoading(false))
  }, [query, selectedTag, page])

  const handleTagSelect = (slug) => {
    setSelectedTag(slug)
    setPage(1)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Latest Posts</h1>
        <p className="mt-1 text-gray-500">{pagination.count} article{pagination.count !== 1 ? 's' : ''} published</p>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">🔍</span>
        <input
          type="search"
          placeholder="Search posts…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Tag filter */}
      {tags.length > 0 && (
        <div className="mb-8">
          <TagFilter tags={tags} selected={selectedTag} onSelect={handleTagSelect} />
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Spinner />
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 text-red-700 text-sm">{error}</div>
      ) : posts.length === 0 ? (
        <div className="text-center py-24 text-gray-400">
          <p className="text-5xl mb-4">📭</p>
          <p className="text-lg font-medium">No posts found</p>
          <p className="text-sm mt-1">Try a different search or tag filter.</p>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </div>

          {/* Pagination */}
          {(pagination.previous || pagination.next) && (
            <div className="mt-10 flex justify-center gap-3">
              <button
                disabled={!pagination.previous}
                onClick={() => setPage((p) => p - 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Previous
              </button>
              <span className="px-4 py-2 text-sm text-gray-500">Page {page}</span>
              <button
                disabled={!pagination.next}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
