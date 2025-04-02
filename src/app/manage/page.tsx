'use client'

import { useEffect, useState } from 'react'
import { Check, TriangleAlert, LoaderCircle } from 'lucide-react'
// import { releases, artists } from '@/lib/data'

export default function ManagePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [missingCovers, setMissingCovers] = useState([])
  const [missingArtistsData, setMissingArtistsData] = useState([])
  const [unusedArtistsData, setUnusedArtistsData] = useState([])
  const [unusedCoversData, setUnusedCoversData] = useState([])

  useEffect(() => {
    document.title = 'Manage library | Krater'

    const fetchHealtData = async () => {
      const response = await fetch('/krater/api/health')
      const data = await response.json()
      // Assuming the API response structure matches our expectations
      setMissingCovers(data?.issues?.missingCovers || [])
      setMissingArtistsData(data?.issues?.missingArtists || [])
      setUnusedArtistsData(data?.issues?.unusedArtists || [])
      setUnusedCoversData(data?.issues?.unusedCovers || [])
      setIsLoading(false)
    }
    setIsLoading(true)
    fetchHealtData()
  }, [])

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-8">
      {isLoading && (
        <p className="flex items-center gap-2 max-w-lg w-full">
          <LoaderCircle size={20} className="animate-spin" /> Fetching data...
        </p>
      )}
      {!isLoading && (
        <>
          <p className="flex items-center gap-2 max-w-lg w-full">
            {missingCovers.length ? (
              <>
                <TriangleAlert size={20} />
                {missingCovers.length} missing cover{missingCovers.length > 1 ? 's were ' : ' was '}
                detected
              </>
            ) : (
              <>
                <Check size={20} /> No missing covers were detected
              </>
            )}
          </p>
          <p className="flex items-center gap-2 max-w-lg w-full">
            {unusedCoversData.length ? (
              <>
                <TriangleAlert size={20} />
                {unusedCoversData.length} cover{missingCovers.length > 1 ? 's were ' : ' was '}
                detected without any release associated
              </>
            ) : (
              <>
                <Check size={20} /> No covers were detected without any release associated
              </>
            )}
          </p>
          <p className="flex items-center gap-2 max-w-lg w-full">
            {missingArtistsData.length ? (
              <>
                <TriangleAlert size={20} />
                {missingArtistsData.length} relese
                {missingArtistsData.length > 1 ? 's were ' : ' was '} detected with missing
                artist(s)
              </>
            ) : (
              <>
                <Check size={20} /> No releases were detected with missing artists
              </>
            )}
          </p>
          <p className="flex items-center gap-2 max-w-lg w-full">
            {unusedArtistsData.length ? (
              <>
                <TriangleAlert size={20} />
                {unusedArtistsData.length} artist
                {unusedArtistsData.length > 1 ? 's were ' : ' was '} detected without any release
              </>
            ) : (
              <>
                <Check size={20} /> No artists were detected without any release
              </>
            )}
          </p>
        </>
      )}
    </div>
  )
}
