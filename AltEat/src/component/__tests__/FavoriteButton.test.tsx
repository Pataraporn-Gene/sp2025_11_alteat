import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import FavoriteButton from '../FavoriteButton'

describe('FavoriteButton', () => {
  it('renders a toggle button with accessible label', () => {
    render(
      <FavoriteButton
        recipeId={1}
        isFavorite={false}
        onToggle={() => {}}
      />,
    )

    expect(screen.getByRole('button', { name: /toggle favorite/i })).toBeInTheDocument()
  })

  it('calls onToggle when clicked', async () => {
    const onToggle = vi.fn()
    const user = userEvent.setup()

    render(
      <FavoriteButton
        recipeId={1}
        isFavorite={false}
        onToggle={onToggle}
      />,
    )

    await user.click(screen.getByRole('button', { name: /toggle favorite/i }))

    expect(onToggle).toHaveBeenCalledTimes(1)
  })

  it('shows a filled heart when favorite', () => {
    const { container } = render(
      <FavoriteButton
        recipeId={1}
        isFavorite
        onToggle={() => {}}
        size={6}
      />,
    )

    const icon = container.querySelector('svg')
    expect(icon).toBeTruthy()
    expect(icon?.getAttribute('class')).toContain('fill-red-500')
  })

  it('shows an unfilled heart when not favorite', () => {
    const { container } = render(
      <FavoriteButton
        recipeId={1}
        isFavorite={false}
        onToggle={() => {}}
        size={6}
      />,
    )

    const icon = container.querySelector('svg')
    expect(icon).toBeTruthy()
    expect(icon?.getAttribute('class')).toContain('fill-white')
  })
})
