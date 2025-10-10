import { useState, useMemo } from 'react'

/**
 * Generic search hook for filtering arrays of items
 * Note: Debouncing is now handled by the SearchInput component
 * @param items - Array of items to search through
 * @param filterFn - Function that determines if an item matches the query
 * @returns Object with query, setQuery, and filtered results
 */
export function useSearch<T>(
  items: T[] | null,
  filterFn: (item: T, lowerQuery: string) => boolean
) {
  const [query, setQuery] = useState<string>('')

  const results = useMemo(() => {
    if (!items) return []
    if (!query.trim()) return items

    const lowerQuery = query.toLowerCase()
    return items.filter((item) => filterFn(item, lowerQuery))
  }, [items, query, filterFn])

  return {
    query,
    setQuery,
    results,
  }
}
