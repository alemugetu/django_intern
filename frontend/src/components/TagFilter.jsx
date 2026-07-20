/**
 * Horizontal scrollable tag pill bar for filtering posts by topic.
 * Passes the selected tag slug up to the parent via onSelect().
 */
export default function TagFilter({ tags, selected, onSelect }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
          selected === null
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag.slug}
          onClick={() => onSelect(tag.slug)}
          className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selected === tag.slug
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          #{tag.name}
        </button>
      ))}
    </div>
  )
}
