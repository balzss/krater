import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AppLink } from '@/components/app-link'

describe('AppLink', () => {
  it('renders an app route as an anchor with its href', () => {
    render(<AppLink href="/browse">Browse</AppLink>)
    expect(screen.getByRole('link', { name: 'Browse' })).toHaveAttribute('href', '/browse')
  })

  it('keeps the query string on app routes', () => {
    render(<AppLink href="/browse?artist=radiohead">Radiohead</AppLink>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '/browse?artist=radiohead')
  })

  it('opens external links in a new tab without leaking the opener', () => {
    render(
      <AppLink href="https://open.spotify.com/album/test" target="_blank">
        Spotify
      </AppLink>
    )
    const link = screen.getByRole('link', { name: 'Spotify' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('treats a bare hash as a plain anchor', () => {
    render(<AppLink href="#">Nothing</AppLink>)
    expect(screen.getByRole('link')).toHaveAttribute('href', '#')
  })
})
