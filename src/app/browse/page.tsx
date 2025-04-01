import { Suspense } from 'react'
import { type Metadata } from 'next'
import BrowsePageContent from './browse-content'

export const metadata: Metadata = {
  title: 'Releases | Krater',
}

export default function BrowsePage() {
  return (
    <Suspense>
      <BrowsePageContent />
    </Suspense>
  )
}
