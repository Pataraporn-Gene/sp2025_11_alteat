import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import RecipeCard, { type Recipe } from '../RecipeCard'

const navigateMock = vi.hoisted(() => vi.fn())
const favoriteMocks = vi.hoisted(() => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getFavoriteIds: vi.fn(),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('../../lib/favorite', () => favoriteMocks)

vi.mock('../FavoriteButton', () => ({
  default: ({ onToggle, recipeId, isFavorite }: { onToggle: () => void; recipeId: number; isFavorite: boolean }) => (
    <button type="button" onClick={onToggle}>
      {`favorite-${recipeId}-${isFavorite ? 'on' : 'off'}`}
    </button>
  ),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('RecipeCard', () => {
  const recipes: Recipe[] = [
    { id: 1, title: 'Pad Thai', image: '/pad-thai.png', tags: ['noodles'] },
    { id: 2, title: 'Green Curry', image: '/curry.png', tags: ['spicy'] },
  ]

  beforeEach(() => {
    navigateMock.mockReset()
    favoriteMocks.addFavorite.mockReset()
    favoriteMocks.removeFavorite.mockReset()
    favoriteMocks.getFavoriteIds.mockReset()
  })

  it('loads favorites and toggles them', async () => {
    favoriteMocks.getFavoriteIds.mockResolvedValue([1])
    const user = userEvent.setup()

    render(<RecipeCard recipes={recipes} />)

    await waitFor(() => expect(favoriteMocks.getFavoriteIds).toHaveBeenCalled())

    expect(await screen.findByText('favorite-1-on')).toBeInTheDocument()

    await user.click(screen.getByText('favorite-1-on'))
    await user.click(screen.getByText('favorite-2-off'))

    expect(favoriteMocks.removeFavorite).toHaveBeenCalledWith(1)
    expect(favoriteMocks.addFavorite).toHaveBeenCalledWith(2)
  })

  it('navigates to recipe detail when clicking more', async () => {
    favoriteMocks.getFavoriteIds.mockResolvedValue([])
    const user = userEvent.setup()

    render(<RecipeCard recipes={recipes} />)

    await user.click(screen.getAllByRole('button', { name: 'more' })[0])

    expect(navigateMock).toHaveBeenCalledWith('/recipe/1')
  })
})
