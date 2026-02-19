import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import Filter from '../Filter'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('Filter', () => {
  it('renders the title and first six items', () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g']

    render(
      <Filter
        title="Diet"
        category="diet"
        items={items}
        onFilterChange={() => {}}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Diet' })).toBeInTheDocument()
    expect(screen.getByText('filter:diet.a')).toBeInTheDocument()
    expect(screen.getByText('filter:diet.f')).toBeInTheDocument()
    expect(screen.getByText('filter:diet.g').closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByRole('button', { name: 'showMore' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'showLess' })).not.toBeInTheDocument()
  })

  it('expands to show remaining items', async () => {
    const items = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    const user = userEvent.setup()

    render(
      <Filter
        title="Diet"
        category="diet"
        items={items}
        onFilterChange={() => {}}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'showMore' }))

    expect(screen.getByText('filter:diet.g')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'showLess' })).toBeInTheDocument()
    expect(screen.getByText('filter:diet.g').closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false')
  })

  it('calls onFilterChange when an item is toggled', async () => {
    const onFilterChange = vi.fn()
    const user = userEvent.setup()

    render(
      <Filter
        title="Diet"
        category="diet"
        items={['a', 'b']}
        onFilterChange={onFilterChange}
      />,
    )

    await user.click(screen.getByText('filter:diet.a'))

    expect(onFilterChange).toHaveBeenCalledWith('Diet', ['a'])
  })
})
