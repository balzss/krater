import { MenuItem } from '@/components'
import { usePageTitle } from '@/hooks'
import { House } from 'lucide-react'

export default function NotFoundPage() {
  usePageTitle('Not found | Krater')

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 gap-4">
      <h1 className="text-4xl font-bold">Not found</h1>
      <MenuItem startIcon={House} href="/" className="max-w-lg">
        Back to the library
      </MenuItem>
    </div>
  )
}
