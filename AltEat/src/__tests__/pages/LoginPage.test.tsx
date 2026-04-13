import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import LoginPage from '../../pages/LoginPage'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
    },
  },
}))

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

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form correctly', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('login.title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('login.email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('login.password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'login.button' })).toBeInTheDocument()
  })

  it('shows chatbot redirect notice if navigating from chatbot', () => {
    render(
      <MemoryRouter initialEntries={['/login?redirect=/chatbot&message=hello']}>
        <LoginPage />
      </MemoryRouter>
    )

    expect(screen.getByText('chatbotNotice.title')).toBeInTheDocument()
    expect(screen.getByText('chatbotNotice.message')).toBeInTheDocument()
    expect(screen.getByText(/hello/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'login.loginAndContinue' })).toBeInTheDocument()
  })

  it('handles successful login and redirects to profile by default', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { user: { id: 1 } }, error: null })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('login.email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('login.password'), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: 'login.button' }))

    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      })
    })

    expect(mockedNavigate).toHaveBeenCalledWith('/profile')
  })

  it('handles successful login and redirects to specified redirect param', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({ data: { user: { id: 1 } }, error: null })

    render(
      <MemoryRouter initialEntries={['/login?redirect=/recipe/1']}>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('login.email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('login.password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.button' }))

    await waitFor(() => {
      expect(mockedNavigate).toHaveBeenCalledWith('/recipe/1')
    })
  })

  it('handles login error', async () => {
    (supabase.auth.signInWithPassword as any).mockResolvedValue({ error: { message: 'Invalid credentials' } })

    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('login.email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('login.password'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: 'login.button' }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})
