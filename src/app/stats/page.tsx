import { Suspense } from 'react'
import { type Metadata } from 'next'
import StatsPageContent from './stats-content'

export const metadata: Metadata = {
  title: 'Listening Stats | Krater',
}

export default function StatsPage() {
  return (
    <Suspense>
      <StatsPageContent />
    </Suspense>
  )
}
