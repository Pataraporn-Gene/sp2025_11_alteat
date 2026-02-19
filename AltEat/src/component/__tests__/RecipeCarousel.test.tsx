import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import RecipeCarousel from '../RecipeCarousel'

const navigateMock = vi.hoisted(() => vi.fn())

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

describe('RecipeCarousel', () => {
  const recipes = [
    { id: 1, name: 'Pad Thai', image: '/pad-thai.png' },
    { id: 2, name: 'Green Curry', image: '/curry.png' },
    { id: 3, name: 'Tom Yum', image: '/tom-yum.png' },
    { id: 4, name: 'Som Tum', image: '/som-tum.png' },
  ]

  it('renders nothing when recipes are empty', () => {
    const { container } = render(<RecipeCarousel recipes={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows navigation when there are more than three recipes', () => {
    render(<RecipeCarousel recipes={recipes} />)

    expect(screen.getByRole('button', { name: 'Next recipes' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /go to slide/i })).toHaveLength(2)
  })

  it('shows previous button after moving forward', async () => {
    const user = userEvent.setup()

    render(<RecipeCarousel recipes={recipes} />)

    await user.click(screen.getByRole('button', { name: 'Next recipes' }))

    expect(screen.getByRole('button', { name: 'Previous recipes' })).toBeInTheDocument()
  })

  it('navigates to recipe detail on view detail click', async () => {
    const user = userEvent.setup()

    render(<RecipeCarousel recipes={recipes} />)

    await user.click(screen.getAllByRole('button', { name: 'View Detail' })[0])

    expect(navigateMock).toHaveBeenCalledWith('/recipe/1')
  })
})
