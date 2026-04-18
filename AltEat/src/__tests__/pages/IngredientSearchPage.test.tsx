import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import IngredientSearchpage from '../../pages/IngredientSearchPage'
import { supabase } from '../../lib/supabase'

vi.mock('../../component/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

vi.mock('../../component/IngredientCard', () => ({
  default: ({ ingredients }: { ingredients: Array<{ ingredient_id: number; ingredient_name: string }> }) => (
    <div data-testid="ingredient-card-mock">
      {ingredients.map((ingredient) => (
        <div key={ingredient.ingredient_id}>{ingredient.ingredient_name}</div>
      ))}
    </div>
  ),
}))

vi.mock('../../component/SearchSideBar', () => ({
  default: ({ onFilterChange }: { onFilterChange: (filterType: string, selectedItems: string[]) => void }) => (
    <div>
      <button
        type="button"
        onClick={() => onFilterChange('ingredient:filters.color', ['Red'])}
      >
        apply-color-filter
      </button>
    </div>
  ),
}))

vi.mock('../../lib/translateQuery', () => ({
  translateToEnglish: vi.fn(async (value: string) => value),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

describe('IngredientSearchPage', () => {
  const allIngredients = [
    {
      ingredient_id: 1,
      ingredient_name: 'Red Chili',
      has_color: ['Red'],
      has_flavor: ['Spicy'],
      has_texture: ['Crispy'],
      has_shape: ['Long'],
    },
    {
      ingredient_id: 2,
      ingredient_name: 'Green Apple',
      has_color: ['Green'],
      has_flavor: ['Sweet'],
      has_texture: ['Crunchy'],
      has_shape: ['Round'],
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()

    ;(supabase.rpc as any).mockResolvedValue({ data: [], error: null })

    ;(supabase.from as any).mockImplementation((table: string) => {
      if (table === 'ingredients') {
        return {
          select: vi.fn().mockResolvedValue({ data: allIngredients, error: null }),
        }
      }
      return { select: vi.fn() }
    })
  })

  it('filters ingredient results by selected color within ingredient page flow', async () => {
    const user = userEvent.setup()

    render(<IngredientSearchpage />)

    await user.click(screen.getByRole('button', { name: 'apply-color-filter' }))

    await waitFor(() => {
      expect(screen.getByTestId('ingredient-card-mock')).toBeInTheDocument()
      expect(screen.getByText('Red Chili')).toBeInTheDocument()
      expect(screen.queryByText('Green Apple')).not.toBeInTheDocument()
    })
  })
})
