import { MainPageContent } from './MainPageContent'
import { type Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home | Krater',
}

export default function Home() {
  return <MainPageContent />
}
