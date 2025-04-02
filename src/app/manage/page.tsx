import { Check, TriangleAlert } from 'lucide-react'
// import { releases, artists } from '@/lib/data'

export default function ManagePage() {
  const missingCovers = []
  const releasesWithMissingArtists = []
  const artistsWithoutRelease = []
  return (
    <div className="flex items-center flex-col m-4 sm:my-12 sm:mx-16 gap-4 sm:gap-8">
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
        {releasesWithMissingArtists.length ? (
          <>
            <TriangleAlert size={20} />
            {releasesWithMissingArtists.length} relese
            {artistsWithoutRelease.length > 1 ? 's were ' : ' was '} detected with missing artist(s)
          </>
        ) : (
          <>
            <Check size={20} /> No releases were detected with missing artists
          </>
        )}
      </p>
      <p className="flex items-center gap-2 max-w-lg w-full">
        {artistsWithoutRelease.length ? (
          <>
            <TriangleAlert size={20} />
            {artistsWithoutRelease.length} artist
            {artistsWithoutRelease.length > 1 ? 's were ' : ' was '} detected without any release
          </>
        ) : (
          <>
            <Check size={20} /> No artists were detected without any release
          </>
        )}
      </p>
    </div>
  )
}
