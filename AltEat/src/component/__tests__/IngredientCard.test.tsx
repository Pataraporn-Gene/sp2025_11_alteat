import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import IngredientCard from '../IngredientCard'
import type { IngredientDetail } from '../IngredientDetailPopup'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('../IngredientDetailPopup', () => ({
  default: ({ ingredient, isOpen }: { ingredient: IngredientDetail | null; isOpen: boolean }) =>
    isOpen && ingredient ? <div data-testid="ingredient-popup">{ingredient.ingredient_name}</div> : null,
}))

describe('IngredientCard', () => {
  const ingredient: IngredientDetail = {
    ingredient_id: 1,
    img_src: 'https://via.placeholder.com/300',
    ingredient_name: 'Apple',
    type: 'Fruit',
    has_benefit: null,
    has_texture: ['Crunchy'],
    has_color: ['Red'],
    has_shape: null,
    has_other_names: null,
    can_cook: null,
    has_mineral: null,
    has_flavor: ['Sweet', 'Tart'],
    has_vitamin: null,
    has_nutrient: null,
  }

  it('renders ingredient info and tags', () => {
    render(<IngredientCard ingredients={[ingredient]} />)

    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Fruit')).toBeInTheDocument()
    expect(screen.getByText('Sweet')).toBeInTheDocument()
    expect(screen.getByText('Tart')).toBeInTheDocument()
    expect(screen.getByText('Crunchy')).toBeInTheDocument()
    expect(screen.getByText('Red')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'detail.moreDetail' })).toBeInTheDocument()
  })

  it('opens the detail popup when clicking more detail', async () => {
    const user = userEvent.setup()

    render(<IngredientCard ingredients={[ingredient]} />)

    await user.click(screen.getByRole('button', { name: 'detail.moreDetail' }))

    expect(screen.getByTestId('ingredient-popup')).toHaveTextContent('Apple')
  })
})
