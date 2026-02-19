import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import SearchSideBar from '../SearchSideBar'

vi.mock('../Filter', () => ({
  default: ({ title, category, items, onFilterChange }: { title: string; category: string; items: string[]; onFilterChange: (filterType: string, selectedItems: string[]) => void }) => (
    <div>
      <h3>{title}</h3>
      <button type="button" onClick={() => onFilterChange(title, items)}>
        {`apply-${category}`}
      </button>
    </div>
  ),
}))

describe('SearchSideBar', () => {
  it('renders a sidebar with filter titles', () => {
    const filters = [
      { title: 'Diet', category: 'diet', items: ['vegan', 'keto'] },
      { title: 'Cuisine', category: 'cuisine', items: ['thai'] },
    ]

    render(<SearchSideBar filter={filters} onFilterChange={() => {}} />)

    expect(screen.getByRole('complementary')).toBeInTheDocument()
    expect(screen.getByText('Diet')).toBeInTheDocument()
    expect(screen.getByText('Cuisine')).toBeInTheDocument()
  })

  it('forwards filter changes from child filters', () => {
    const onFilterChange = vi.fn()
    const filters = [
      { title: 'Diet', category: 'diet', items: ['vegan', 'keto'] },
      { title: 'Cuisine', category: 'cuisine', items: ['thai'] },
    ]

    render(<SearchSideBar filter={filters} onFilterChange={onFilterChange} />)

    fireEvent.click(screen.getByRole('button', { name: 'apply-diet' }))

    expect(onFilterChange).toHaveBeenCalledTimes(1)
    expect(onFilterChange).toHaveBeenCalledWith('Diet', ['vegan', 'keto'])
  })
})
