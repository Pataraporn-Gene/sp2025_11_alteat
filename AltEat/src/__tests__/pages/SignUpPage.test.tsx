import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import SignUpPage from '../../pages/SignUpPage'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
    from: vi.fn(),
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

describe('SignUpPage', () => {
  let selectMock: any;
  let eqMock: any;
  let maybeSingleMock: any;

  beforeEach(() => {
    vi.clearAllMocks()

    maybeSingleMock = vi.fn().mockResolvedValue({ data: null })
    eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
    selectMock = vi.fn().mockReturnValue({ eq: eqMock })
    
    ;(supabase.from as any).mockReturnValue({ select: selectMock })
  })

  it('renders signup form correctly', () => {
    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    )

    expect(screen.getByTestId('navbar')).toBeInTheDocument()
    expect(screen.getByText('signup.title')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('signup.username')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('signup.email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('signup.password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'signup.button' })).toBeInTheDocument()
  })

  it('shows error if username is already taken', async () => {
    maybeSingleMock.mockResolvedValue({ data: { user_id: '1' } })

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('signup.username'), { target: { value: 'existingUser' } })
    fireEvent.change(screen.getByPlaceholderText('signup.email'), { target: { value: 'existing@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('signup.password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: 'signup.button' }))

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles')
      expect(screen.getByText('Username already taken')).toBeInTheDocument()
    })

    expect(supabase.auth.signUp).not.toHaveBeenCalled()
  })

  it('handles successful signup and redirects to success page', async () => {
    (supabase.auth.signUp as any).mockResolvedValue({ data: { user: { id: 1 } }, error: null })

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('signup.username'), { target: { value: 'newUser' } })
    fireEvent.change(screen.getByPlaceholderText('signup.email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('signup.password'), { target: { value: 'password123' } })
    
    fireEvent.click(screen.getByRole('button', { name: 'signup.button' }))

    await waitFor(() => {
      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          emailRedirectTo: "https://sp2025-11-alteat.vercel.app/profile",
          data: { username: 'newUser' },
        },
      })
    })

    expect(mockedNavigate).toHaveBeenCalledWith('/signupsuccess')
  })

  it('handles auth signup error properly', async () => {
    (supabase.auth.signUp as any).mockResolvedValue({ error: { message: 'Password should be at least 6 characters' } })

    render(
      <MemoryRouter>
        <SignUpPage />
      </MemoryRouter>
    )

    fireEvent.change(screen.getByPlaceholderText('signup.username'), { target: { value: 'newUser' } })
    fireEvent.change(screen.getByPlaceholderText('signup.email'), { target: { value: 'test@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('signup.password'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'signup.button' }))

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })
})
