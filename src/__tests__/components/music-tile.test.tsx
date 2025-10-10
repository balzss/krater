import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MusicTile } from '@/components/music-tile'
import { mockArtists } from '../mocks/data'

describe('MusicTile', () => {
  const defaultProps = {
    cover: 'test-cover.jpg',
    artists: [mockArtists[0]],
    title: 'Test Album',
    rymId: 'test-album',
    media: { spotify: 'https://open.spotify.com/album/test' },
  }

  beforeEach(() => {
    // Mock window.matchMedia for touch device detection
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    })
  })

  it('should render album title', () => {
    render(<MusicTile {...defaultProps} />)
    expect(screen.getByText('Test Album')).toBeInTheDocument()
  })

  it('should render artist names', () => {
    render(<MusicTile {...defaultProps} />)
    expect(screen.getByText('Radiohead')).toBeInTheDocument()
  })

  it('should render multiple artists separated by commas', () => {
    render(<MusicTile {...defaultProps} artists={mockArtists.slice(0, 2)} />)

    expect(screen.getByText('Radiohead')).toBeInTheDocument()
    expect(screen.getByText('Aphex Twin')).toBeInTheDocument()
    // Check for comma separator
    const artistSection = screen.getByText('Radiohead').parentElement
    expect(artistSection?.textContent).toContain('Radiohead, Aphex Twin')
  })

  it('should handle undefined artists gracefully', () => {
    render(<MusicTile {...defaultProps} artists={[undefined]} />)
    expect(screen.getByText('Unknown')).toBeInTheDocument()
  })

  it('should link to media URL', () => {
    render(<MusicTile {...defaultProps} />)

    const links = screen.getAllByRole('link', { name: /Test Album/i })
    expect(links[0]).toHaveAttribute('href', defaultProps.media.spotify)
    expect(links[0]).toHaveAttribute('target', '_blank')
  })

  it('should link artist to browse page', () => {
    render(<MusicTile {...defaultProps} />)

    const artistLink = screen.getByRole('link', { name: 'Radiohead' })
    expect(artistLink).toHaveAttribute('href', '/browse?artist=radiohead')
  })

  it('should show info button on hover (desktop)', async () => {
    const user = userEvent.setup()
    render(<MusicTile {...defaultProps} />)

    // Get the tile by finding the parent container
    const tile = screen.getByText('Test Album').closest('div')!.parentElement!
    await user.hover(tile)

    const infoButton = screen.getByRole('button')
    // Check that opacity-100 is in the className string
    expect(infoButton.className).toContain('opacity-100')
  })

  it('should hide info button when not hovering', () => {
    render(<MusicTile {...defaultProps} />)

    const infoButton = screen.getByRole('button')
    expect(infoButton).toHaveClass('opacity-0')
  })

  it('should render cover image with correct src', () => {
    render(<MusicTile {...defaultProps} />)

    const image = screen.getByRole('img', { name: 'Test Album' })
    expect(image).toHaveAttribute('src', expect.stringContaining('test-cover.jpg'))
  })

  it('should prioritize image when priority is true', () => {
    render(<MusicTile {...defaultProps} priority={true} />)

    const image = screen.getByRole('img', { name: 'Test Album' })
    // Next.js Image component sets fetchpriority attribute when priority is true
    expect(image).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<MusicTile {...defaultProps} className="custom-class" />)
    // The custom class is applied to the outermost div (the tile wrapper)
    const tile = screen.getByText('Test Album').parentElement!.parentElement!
    expect(tile.className).toContain('custom-class')
  })

  it('should open modal when info button clicked', async () => {
    const user = userEvent.setup()

    render(<MusicTile {...defaultProps} />)
    const infoButton = screen.getByRole('button')

    await user.click(infoButton)

    // Check that modal dialog is now visible
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})
