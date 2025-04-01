'use client'

import { useState } from 'react'
import { SearchInput } from '@/components'
import { artists } from '@/lib/data'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState<string>('')
  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4">
      <SearchInput
        query={searchQuery}
        onQueryChange={(newSearchQuery) => setSearchQuery(newSearchQuery)}
      />
      {artists.map((artist) => (
        <a
          key={artist.rymId}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-md cursor-pointer duration-300 transform transition hover:scale-103 ease-in-out flex gap-2 items-center"
          href={`/krater/browse?a=${artist.rymId}`}
        >
          {artist.displayName}
        </a>
      ))}
    </div>
  )
}
