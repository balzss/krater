import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { MenuItem } from '@/components/menu-item'
import { Home, ArrowRight } from 'lucide-react'

describe('MenuItem', () => {
  it('should render as link when href provided', () => {
    render(<MenuItem href="/test">Test Link</MenuItem>)

    const link = screen.getByRole('link', { name: 'Test Link' })
    expect(link).toHaveAttribute('href', '/test')
  })

  it('should render as button when no href', () => {
    render(<MenuItem>Test Button</MenuItem>)

    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument()
  })

  it('should render children content', () => {
    render(<MenuItem>Test Content</MenuItem>)

    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should render start icon', () => {
    const { container } = render(<MenuItem startIcon={Home}>With Start Icon</MenuItem>)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveAttribute('width', '20')
  })

  it('should render end icon', () => {
    const { container } = render(<MenuItem endIcon={ArrowRight}>With End Icon</MenuItem>)

    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
    expect(svg).toHaveClass('ml-auto')
  })

  it('should render both start and end icons', () => {
    const { container } = render(
      <MenuItem startIcon={Home} endIcon={ArrowRight}>
        With Both Icons
      </MenuItem>
    )

    const svgs = container.querySelectorAll('svg')
    expect(svgs).toHaveLength(2)
  })

  it('should apply custom className', () => {
    render(<MenuItem className="custom-class">Test</MenuItem>)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should call onClick when clicked (button mode)', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()

    render(<MenuItem onClick={mockOnClick}>Click Me</MenuItem>)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should pass through button attributes', () => {
    render(
      <MenuItem disabled={true} type="submit">
        Submit Button
      </MenuItem>
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('type', 'submit')
  })
})
