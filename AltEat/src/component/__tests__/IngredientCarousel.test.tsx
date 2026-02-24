import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import IngredientCarousel from '../IngredientCarousel'
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

describe('IngredientCarousel', () => {
  const baseIngredient: IngredientDetail = {
    ingredient_id: 1,
    img_src: 'https://via.placeholder.com/300',
    ingredient_name: 'Apple',
    type: 'Fruit',
    has_benefit: null,
    has_texture: null,
    has_color: null,
    has_shape: null,
    has_other_names: null,
    can_cook: null,
    has_mineral: null,
    has_flavor: null,
    has_vitamin: null,
    has_nutrient: null,
  }

  const ingredients = [
    baseIngredient,
    { ...baseIngredient, ingredient_id: 2, ingredient_name: 'Banana' },
    { ...baseIngredient, ingredient_id: 3, ingredient_name: 'Carrot' },
    { ...baseIngredient, ingredient_id: 4, ingredient_name: 'Date' },
  ]

  it('renders nothing when there are no ingredients', () => {
    const { container } = render(<IngredientCarousel ingredients={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows next navigation and indicator dots', () => {
    render(<IngredientCarousel ingredients={ingredients} />)

    expect(screen.getByRole('button', { name: 'Next ingredients' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /go to slide/i })).toHaveLength(2)
  })

  it('shows previous button after moving forward', async () => {
    const user = userEvent.setup()

    render(<IngredientCarousel ingredients={ingredients} />)

    await user.click(screen.getByRole('button', { name: 'Next ingredients' }))

    expect(screen.getByRole('button', { name: 'Previous ingredients' })).toBeInTheDocument()
  })

  it('opens the detail popup when clicking view detail', async () => {
    const user = userEvent.setup()

    render(<IngredientCarousel ingredients={ingredients} />)

    await user.click(screen.getAllByRole('button', { name: 'detail.moreDetail' })[0])

    expect(screen.getByTestId('ingredient-popup')).toHaveTextContent('Apple')
  })
})
