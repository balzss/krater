import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { ActionButton } from '@/components/action-button'
import { Home } from 'lucide-react'

describe('ActionButton', () => {
  it('should render as link when href provided', () => {
    render(<ActionButton icon={Home} href="/test" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
  })

  it('should render as button when no href', () => {
    render(<ActionButton icon={Home} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should call onClick when clicked (button mode)', async () => {
    const user = userEvent.setup()
    const mockOnClick = vi.fn()

    render(<ActionButton icon={Home} onClick={mockOnClick} />)

    const button = screen.getByRole('button')
    await user.click(button)

    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })

  it('should navigate when clicked (link mode)', () => {
    render(<ActionButton icon={Home} href="/home" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/home')
  })

  it('should render icon with correct size', () => {
    const { container } = render(<ActionButton icon={Home} size={48} />)

    const svg = container.querySelector('svg')
    expect(svg).toHaveAttribute('width', '48')
    expect(svg).toHaveAttribute('height', '48')
  })

  it('should apply custom className', () => {
    render(<ActionButton icon={Home} className="custom-class" />)

    const button = screen.getByRole('button')
    expect(button).toHaveClass('custom-class')
  })

  it('should disable button when disabled prop set', () => {
    render(<ActionButton icon={Home} disabled={true} />)

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveClass('disabled:cursor-not-allowed')
  })

  it('should open in new tab when target="_blank"', () => {
    render(<ActionButton icon={Home} href="/external" target="_blank" />)

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
