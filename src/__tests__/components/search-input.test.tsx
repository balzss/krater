import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import { SearchInput } from '@/components/search-input'

describe('SearchInput', () => {
  const mockOnQueryChange = vi.fn()

  beforeEach(() => {
    mockOnQueryChange.mockClear()
  })

  it('should render with placeholder', () => {
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} placeholder="Search..." />)

    expect(screen.getByPlaceholderText('Search...')).toBeInTheDocument()
  })

  it('should call onQueryChange when typing', async () => {
    const user = userEvent.setup()
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} debounceMs={0} />)

    const input = screen.getByRole('searchbox')
    await user.type(input, 't')

    expect(mockOnQueryChange).toHaveBeenCalled()
    expect(mockOnQueryChange).toHaveBeenLastCalledWith('t')
  })

  it('should display current query value', () => {
    render(<SearchInput query="existing query" onQueryChange={mockOnQueryChange} />)

    expect(screen.getByDisplayValue('existing query')).toBeInTheDocument()
  })

  it('should show clear button when query is not empty', () => {
    render(<SearchInput query="test" onQueryChange={mockOnQueryChange} />)

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('should hide clear button when query is empty', () => {
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('should clear query when clear button clicked', async () => {
    const user = userEvent.setup()
    render(<SearchInput query="test" onQueryChange={mockOnQueryChange} />)

    const clearButton = screen.getByRole('button')
    await user.click(clearButton)

    expect(mockOnQueryChange).toHaveBeenCalledWith('')
  })

  it('should clear query when Escape key pressed', async () => {
    const user = userEvent.setup()
    render(<SearchInput query="test" onQueryChange={mockOnQueryChange} />)

    const input = screen.getByRole('searchbox')
    await user.type(input, '{Escape}')

    expect(mockOnQueryChange).toHaveBeenCalledWith('')
  })

  it('should render search icon', () => {
    const { container } = render(<SearchInput query="" onQueryChange={mockOnQueryChange} />)

    // Lucide icons render as SVG
    const searchIcon = container.querySelector('svg')
    expect(searchIcon).toBeInTheDocument()
  })

  it('should apply custom className', () => {
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} className="custom-class" />)

    const input = screen.getByRole('searchbox')
    const wrapper = input.parentElement!
    expect(wrapper.className).toContain('custom-class')
  })

  it('should pass through additional HTML attributes', () => {
    render(<SearchInput query="" onQueryChange={mockOnQueryChange} aria-label="Custom search" />)

    expect(screen.getByLabelText('Custom search')).toBeInTheDocument()
  })
})
