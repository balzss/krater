import { X } from 'lucide-react'
import Link from 'next/link'

type ClearableTagProps = {
  tagLabel: string
  tagValue: string
  href: string
}

export const ClearableTag: React.FC<ClearableTagProps> = ({ tagLabel, tagValue, href }) => {
  return (
    <div className="inline-flex items-center align-middle text-lg font-medium px-3 py-2 rounded-lg gap-1 border border-gray-300 text-gray-300">
      <span>
        {tagLabel}: {tagValue}
      </span>
      <Link
        href={href}
        className="flex-shrink-0 ml-1 -mr-1 h-6 w-6 rounded-full inline-flex items-center justify-center focus:outline-none focus:bg-blue-300 focus:text-blue-800 transition-colors duration-150 ease-in-out cursor-pointer hover:bg-gray-700"
      >
        <X strokeWidth={2.5} size={16} />
      </Link>
    </div>
  )
}
