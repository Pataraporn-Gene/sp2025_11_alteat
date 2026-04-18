import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import RecipeSearchPage from '../../pages/RecipeSearchPage'
import { supabase } from '../../lib/supabase'

vi.mock('../../component/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

vi.mock('../../component/RecipeCard', () => ({
  default: ({ recipes }: { recipes: Array<{ id: number; title: string }> }) => (
    <div data-testid="recipe-card-mock">
      {recipes.map((r) => (
        <div key={r.id}>{r.title}</div>
      ))}
    </div>
  ),
}))

vi.mock('../../component/SearchSideBar', () => ({
  default: ({ onFilterChange }: { onFilterChange: (filterType: string, selectedItems: string[]) => void }) => (
    <div>
      <button
        type="button"
        onClick={() => onFilterChange('recipe:filters.ingredient', ['Chicken'])}
      >
        apply-ingredient-filter
      </button>
    </div>
  ),
}))

vi.mock('../../lib/translateQuery', () => ({
  translateToEnglish: vi.fn(async (value: string) => value),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { count?: number }) =>
      options?.count !== undefined ? `${key}:${options.count}` : key,
  }),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('RecipeSearchPage', () => {
  let queryBuilder: any
  let orMock: any
  let rangeMock: any
  let normalizePayload: any[]

  beforeEach(() => {
    vi.clearAllMocks()

    normalizePayload = [
      {
        id: 101,
        recipe_name: 'Chicken Soup',
        img_src: '/chicken.jpg',
        cuisine_path: '/thai/soup',
      },
    ]

    rangeMock = vi.fn().mockResolvedValue({
      data: normalizePayload,
      error: null,
      count: normalizePayload.length,
    })

    orMock = vi.fn()

    queryBuilder = {
      select: vi.fn().mockReturnThis(),
      or: orMock.mockImplementation(() => queryBuilder),
      range: rangeMock,
    }

    ;(supabase.from as any).mockReturnValue(queryBuilder)
  })

  it('applies ingredient filter in recipe page context and renders filtered result cards', async () => {
    const user = userEvent.setup()

    render(<RecipeSearchPage />)

    await user.click(screen.getByRole('button', { name: 'apply-ingredient-filter' }))

    await waitFor(() => {
      expect(orMock).toHaveBeenCalledWith('ingredients.ilike.%Chicken%')
    })

    await waitFor(() => {
      expect(screen.getByTestId('recipe-card-mock')).toBeInTheDocument()
      expect(screen.getByText('Chicken Soup')).toBeInTheDocument()
      expect(screen.getByText('recipe:search.youCanMake:1')).toBeInTheDocument()
    })
  })
})
