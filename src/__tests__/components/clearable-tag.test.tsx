import { describe, it, expect } from 'vitest'
import { render, screen } from '../utils/test-utils'
import { ClearableTag } from '@/components/clearable-tag'

describe('ClearableTag', () => {
  const defaultProps = {
    tagLabel: 'Artist',
    tagValue: 'Radiohead',
    href: '/browse',
  }

  it('should render label and value', () => {
    render(<ClearableTag {...defaultProps} />)

    expect(screen.getByText('Artist: Radiohead')).toBeInTheDocument()
  })

  it('should render clear button', () => {
    render(<ClearableTag {...defaultProps} />)

    const clearButton = screen.getByRole('link')
    expect(clearButton).toBeInTheDocument()
  })

  it('should navigate when clear button clicked', () => {
    render(<ClearableTag {...defaultProps} />)

    const clearButton = screen.getByRole('link')
    expect(clearButton).toHaveAttribute('href', '/browse')
  })

  it('should render X icon', () => {
    const { container } = render(<ClearableTag {...defaultProps} />)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('should apply correct styles', () => {
    render(<ClearableTag {...defaultProps} />)

    const tag = screen.getByText('Artist: Radiohead').parentElement!
    expect(tag.className).toContain('inline-flex')
    expect(tag.className).toContain('items-center')
    expect(tag.className).toContain('rounded-lg')
  })

  it('should render with different tag labels and values', () => {
    render(<ClearableTag tagLabel="Genre" tagValue="Electronic" href="/browse" />)

    expect(screen.getByText('Genre: Electronic')).toBeInTheDocument()
  })

  it('should apply hover styles to clear button', () => {
    render(<ClearableTag {...defaultProps} />)

    const clearButton = screen.getByRole('link')
    expect(clearButton.className).toContain('hover:bg-gray-700')
  })
})
