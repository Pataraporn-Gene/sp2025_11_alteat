import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import RecipeCarousel from '../../component/RecipeCarousel'
import { addFavorite, removeFavorite, getFavoriteIds } from '../../lib/favorite'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../lib/favorite', () => ({
  addFavorite: vi.fn(),
  removeFavorite: vi.fn(),
  getFavoriteIds: vi.fn(),
}))

describe('RecipeCarousel', () => {
  const recipes = [
    { id: 1, name: 'Pad Thai', image: '/pad-thai.png' },
    { id: 2, name: 'Green Curry', image: '/curry.png' },
    { id: 3, name: 'Tom Yum', image: '/tom-yum.png' },
    { id: 4, name: 'Som Tum', image: '/som-tum.png' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getFavoriteIds).mockResolvedValue([])
    vi.mocked(addFavorite).mockResolvedValue()
    vi.mocked(removeFavorite).mockResolvedValue()
  })

  it('renders nothing when recipes are empty', () => {
    const { container } = render(<RecipeCarousel recipes={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows navigation when there are more than three recipes', async () => {
    render(<RecipeCarousel recipes={recipes} />)
    
    await waitFor(() => {
       expect(screen.getByRole('button', { name: 'Next recipes' })).toBeInTheDocument()
    })
    
    expect(screen.getAllByRole('button', { name: /go to slide/i })).toHaveLength(2)
  })

  it('shows previous button after moving forward', async () => {
    const user = userEvent.setup()

    render(<RecipeCarousel recipes={recipes} />)

    await user.click(await screen.findByRole('button', { name: 'Next recipes' }))

    expect(screen.getByRole('button', { name: 'Previous recipes' })).toBeInTheDocument()
  })

  it('navigates to recipe detail on view detail click', async () => {
    const user = userEvent.setup()

    render(<RecipeCarousel recipes={recipes} />)

    const buttons = await screen.findAllByRole('button', { name: /viewDetail/i });
    await user.click(buttons[0])

    expect(navigateMock).toHaveBeenCalledWith('/recipe/1')
  })

  it('loads favorite recipe ids on mount', async () => {
    vi.mocked(getFavoriteIds).mockResolvedValue([1, 3])

    render(<RecipeCarousel recipes={recipes} />)

    await waitFor(() => {
      expect(getFavoriteIds).toHaveBeenCalled();
    })

    const favoriteButtons = screen.getAllByRole('button', { name: /favorite|unfavorite/i })
    expect(favoriteButtons[0]).toHaveAttribute('aria-label', 'Toggle favorite')
    expect(favoriteButtons[1]).toHaveAttribute('aria-label', 'Toggle favorite')
    expect(favoriteButtons[2]).toHaveAttribute('aria-label', 'Toggle favorite')
  })

  it('toggles favorite on and off when clicking favorite button', async () => {
    const user = userEvent.setup()
    vi.mocked(getFavoriteIds).mockResolvedValue([1]) // First recipe is favorited
    
    render(<RecipeCarousel recipes={recipes} />)

    await waitFor(() => {
      expect(getFavoriteIds).toHaveBeenCalled();
    })

    const buttons = screen.getAllByRole('button', { name: /favorite|unfavorite/i })
    
    // Toggle off (unfavorite recipe 1)
    await user.click(buttons[0])
    expect(removeFavorite).toHaveBeenCalledWith(1)
    
    // Toggle on (favorite recipe 2)
    await user.click(buttons[1])
    expect(addFavorite).toHaveBeenCalledWith(2)
  })
})
