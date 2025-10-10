import { InputHTMLAttributes, useState, useEffect } from 'react'
import { Search, X, Loader2 } from 'lucide-react'

interface SearchInputProps {
  query: string
  onQueryChange: (newQuery: string) => void
  debounceMs?: number
}

const SearchInput: React.FC<SearchInputProps & InputHTMLAttributes<HTMLInputElement>> = ({
  query,
  onQueryChange,
  debounceMs = 150,
  className,
  ...rest
}) => {
  // Use local state for immediate input updates
  const [localValue, setLocalValue] = useState(query)

  // Show loading indicator when value is pending propagation to parent
  const isSearching = localValue !== query && localValue.trim() !== ''

  // Sync local value when parent query changes (e.g., when cleared externally)
  useEffect(() => {
    setLocalValue(query)
  }, [query])

  // Debounce propagation to parent
  useEffect(() => {
    const timer = setTimeout(() => {
      onQueryChange(localValue)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [localValue, debounceMs, onQueryChange])

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setLocalValue('')
      onQueryChange('')
    }
  }

  const handleClear = () => {
    setLocalValue('')
    onQueryChange('')
  }

  return (
    <div className={`relative w-full max-w-md ${className}`}>
      {isSearching ? (
        <Loader2
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin"
          size={20}
        />
      ) : (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
      )}
      <input
        {...rest}
        type="search"
        className="w-full pl-10 pr-10 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent bg-(--card) h-12 hover:border-(--foreground) transition duration-150"
        value={localValue}
        onKeyDown={handleKeyDown}
        onChange={(e) => setLocalValue(e.target.value)}
      />
      {localValue && (
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 cursor-pointer"
          onClick={handleClear}
        >
          <X size={24} />
        </button>
      )}
    </div>
  )
}

export { SearchInput }
