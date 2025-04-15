'use client'

import { MouseEvent, useEffect, useState } from 'react'
import { House, Check, TriangleAlert, LoaderCircle } from 'lucide-react'
import type { HealthIssues } from '../api/health/route'
import { ActionButton } from '@/components'

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '/'
const apiRoot = `${basePath}/api`

type CheckResultProps = {
  warningLabel: string
  successLabel: string
  warningItems: string[]
  onItemClick?: (e: MouseEvent<HTMLButtonElement>, itemIndex: number) => void
}

function CheckResult({ warningLabel, successLabel, warningItems, onItemClick }: CheckResultProps) {
  if (warningItems.length === 0) {
    return (
      <div className="max-w-lg w-full flex items-center gap-2">
        <Check size={20} /> {successLabel}
      </div>
    )
  }
  return (
    <div className="max-w-lg w-full">
      <span className="flex items-center gap-2">
        <TriangleAlert size={20} /> {warningLabel}
      </span>
      <ul className="ml-12">
        {warningItems.map((item, index) => (
          <li className="list-disc my-2 text-gray-400" key={item}>
            <button
              onClick={(e) => onItemClick?.(e, index)}
              className="hover:underline cursor-pointer block text-start"
            >
              {item}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function ManagePage() {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [missingCovers, setMissingCovers] = useState<HealthIssues['missingCovers']>([])
  const [missingArtistsData, setMissingArtistsData] = useState<HealthIssues['missingArtists']>([])
  const [unusedArtistsData, setUnusedArtistsData] = useState<HealthIssues['unusedArtists']>([])
  const [unusedCoversData, setUnusedCoversData] = useState<HealthIssues['unusedCovers']>([])

  const fetchHealtData = async () => {
    const response = await fetch('/krater/api/health')
    const data = await response.json()
    setMissingCovers(data?.issues?.missingCovers || [])
    setMissingArtistsData(data?.issues?.missingArtists || [])
    setUnusedArtistsData(data?.issues?.unusedArtists || [])
    setUnusedCoversData(data?.issues?.unusedCovers || [])
    setIsLoading(false)
  }

  useEffect(() => {
    document.title = 'Manage library | Krater'
    setIsLoading(true)
    fetchHealtData()
  }, [])

  const handleDeleteCover = async (filename: string) => {
    if (!window.confirm(`Do you want to remove the cover file "${filename}"`)) return
    setIsLoading(true)
    await fetch(`${apiRoot}/covers?filename=${filename}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    })
    await fetchHealtData()
  }

  const handleDeleteArtist = async (artistRymId: string, artistDisplayName: string) => {
    if (!window.confirm(`Do you want to remove artist "${artistDisplayName}"`)) return
    setIsLoading(true)
    await fetch(`${apiRoot}/artists?rymId=${artistRymId}`, {
      method: 'DELETE',
      headers: {
        Accept: 'application/json',
      },
    })
    await fetchHealtData()
  }

  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-8">
      <div className="flex items-center w-full max-w-lg gap-4 sm:gap-6 justify-end">
        <ActionButton href="/" size={40} icon={House} />
      </div>
      {isLoading && (
        <p className="flex items-center gap-2 max-w-lg w-full">
          <LoaderCircle size={20} className="animate-spin" /> Fetching data...
        </p>
      )}
      {!isLoading && (
        <>
          <CheckResult
            successLabel="No missing covers were detected"
            warningLabel={`${missingCovers.length} missing cover${missingCovers.length > 1 ? 's were' : ' was'} detected`}
            warningItems={missingCovers.map(
              (cover) => `${cover.releaseArtists} - ${cover.releaseTitle} (${cover.filename})`
            )}
            onItemClick={(_e, i) => console.log(missingCovers[i])}
          />

          <CheckResult
            successLabel="No unused covers were detected"
            warningLabel={`${unusedCoversData.length} unused cover${missingCovers.length > 1 ? 's were' : ' was'} detected`}
            warningItems={unusedCoversData}
            onItemClick={(_e, i) => handleDeleteCover(unusedCoversData[i])}
          />

          <CheckResult
            successLabel="No missing artists were detected"
            warningLabel={`${missingArtistsData.length} missing artist${missingArtistsData.length > 1 ? 's were ' : ' was '} detected`}
            warningItems={missingArtistsData.map(
              (missingArtist) => missingArtist.rymId + ' in release: ' + missingArtist.referencedIn
            )}
            onItemClick={(_e, i) => console.log(missingArtistsData[i])}
          />

          <CheckResult
            successLabel="No artists were detected without any release"
            warningLabel={`${unusedArtistsData.length} artist${unusedArtistsData.length > 1 ? 's were ' : ' was '} detected without any release`}
            warningItems={unusedArtistsData.map((artist) => artist.displayName)}
            onItemClick={(_e, i) =>
              handleDeleteArtist(unusedArtistsData[i].rymId, unusedArtistsData[i].displayName)
            }
          />
        </>
      )}
    </div>
  )
}
