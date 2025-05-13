import { InputHTMLAttributes } from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  query: string
  onQueryChange: (newQuery: string) => void
}

const SearchInput: React.FC<SearchInputProps & InputHTMLAttributes<HTMLInputElement>> = ({
  query,
  onQueryChange,
  className,
  ...rest
}) => {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      onQueryChange('')
    }
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
      <input
        {...rest}
        type="search"
        className="w-full pl-10 pr-10 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-(--card) h-12 hover:border-(--foreground) transition duration-150"
        value={query}
        onKeyDown={handleKeyDown}
        onChange={(e) => onQueryChange(e.target.value)}
      />
      {query && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={() => onQueryChange('')}
        >
          <X size={24} />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
