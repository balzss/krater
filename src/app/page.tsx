'use client'

import { Library, User, Dices } from 'lucide-react'
import { releases, artists } from '@/lib/data'

export default function Home() {
  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-8">
      <a
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-sm cursor-pointer duration-300 transform transition hover:scale-103 ease-in-out flex gap-2 items-center"
        href="/krater/browse"
      >
        <Library size={20} />
        Browse all {releases.length} releases
      </a>

      <a className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-sm cursor-pointer duration-300 transform transition hover:scale-103 ease-in-out flex gap-2 items-center">
        <User size={20} />
        View {artists.length} artists
      </a>

      <a
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-sm cursor-pointer duration-300 transform transition hover:scale-103 ease-in-out flex gap-2 items-center"
        href="/krater/random"
      >
        <Dices size={20} />
        Get a random suggestion
      </a>
    </div>
  )
}
