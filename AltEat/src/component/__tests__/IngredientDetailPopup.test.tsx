import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import IngredientDetailPopup, { type IngredientDetail } from '../IngredientDetailPopup'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

vi.mock('reactjs-popup', () => ({
  default: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="popup">{children}</div> : null,
}))

describe('IngredientDetailPopup', () => {
  const ingredient: IngredientDetail = {
    ingredient_id: 1,
    ingredient_name: 'Apple',
    type: 'Fruit',
    has_benefit: null,
    has_texture: null,
    has_color: null,
    has_shape: null,
    has_other_names: ['Malus domestica'],
    can_cook: null,
    has_mineral: null,
    has_flavor: ['Sweet'],
    has_vitamin: null,
    has_nutrient: null,
  }

  it('renders nothing when ingredient is missing', () => {
    const { container } = render(
      <IngredientDetailPopup ingredient={null} tags={[]} isOpen onClose={() => {}} />,
    )

    expect(container).toBeEmptyDOMElement()
  })

  it('renders content when open', () => {
    render(
      <IngredientDetailPopup ingredient={ingredient} tags={['Crisp']} isOpen onClose={() => {}} />,
    )

    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(screen.getByText('Apple')).toBeInTheDocument()
    expect(screen.getByText('Crisp')).toBeInTheDocument()
    expect(screen.getByText('detail.otherNames:')).toBeInTheDocument()
    expect(screen.getByText('detail.flavors:')).toBeInTheDocument()
  })

  it('calls onClose when close button is clicked', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()

    render(
      <IngredientDetailPopup ingredient={ingredient} tags={[]} isOpen onClose={onClose} />,
    )

    await user.click(screen.getByRole('button'))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
