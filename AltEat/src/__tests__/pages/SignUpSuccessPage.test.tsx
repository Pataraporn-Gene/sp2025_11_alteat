import { render, screen, fireEvent } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SignUpSuccessPage from '../../pages/SignUpSuccessPage'

vi.mock('../../component/Navbar.tsx', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

const mockedNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  }
})

describe('SignUpSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders correctly', () => {
    render(
      <MemoryRouter>
        <SignUpSuccessPage />
      </MemoryRouter>
    )

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('success.title')).toBeInTheDocument()
    expect(screen.getByText('success.message')).toBeInTheDocument()
    expect(screen.getByText('success.subtitle')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'success.button' })).toBeInTheDocument()
  })

  it('navigates to home when button is clicked', () => {
    render(
      <MemoryRouter>
        <SignUpSuccessPage />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('button', { name: 'success.button' }))

    expect(mockedNavigate).toHaveBeenCalledWith('/')
  })
})
