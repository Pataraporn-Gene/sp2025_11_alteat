import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useAuth } from '../../hooks/useAuth'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
    },
  },
}))

const mockAuthError = (message: string) => new Error(message) as any

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useAuth())

    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should successfully sign up a user', async () => {
    const mockData = { user: null, session: null }
    let resolveSignUp: (value: { data: typeof mockData; error: null }) => void
    const signUpPromise = new Promise<{ data: typeof mockData; error: null }>((resolve) => {
      resolveSignUp = resolve
    })
    vi.mocked(supabase.auth.signUp).mockImplementationOnce(() => signUpPromise)

    const { result } = renderHook(() => useAuth())

    let signupResultPromise: ReturnType<typeof result.current.signUp>
    act(() => {
      signupResultPromise = result.current.signUp('test@test.com', 'password123', 'testuser')
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(true)
    })

    resolveSignUp!({ data: mockData, error: null })

    let signupResult
    await act(async () => {
      signupResult = await signupResultPromise!
    })

    expect(supabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test@test.com',
      password: 'password123',
      options: {
        data: {
          username: 'testuser',
        },
      },
    })
    expect(signupResult).toEqual(mockData)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
  })

  it('should handle already registered error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: { user: null, session: null }, error: mockAuthError('User already registered') })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signUp('test@test.com', 'password123', 'testuser')
    })

    expect(result.current.error).toBe('An account with this email already exists')
    expect(result.current.loading).toBe(false)
  })

  it('should handle short password error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: { user: null, session: null }, error: mockAuthError('Password should be at least 6 characters') })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signUp('test@test.com', '123', 'testuser')
    })

    expect(result.current.error).toBe('Password must be at least 6 characters')
    expect(result.current.loading).toBe(false)
  })

  it('should handle generic sign up error', async () => {
    vi.mocked(supabase.auth.signUp).mockResolvedValueOnce({ data: { user: null, session: null }, error: mockAuthError('Some random error') })

    const { result } = renderHook(() => useAuth())

    await act(async () => {
      await result.current.signUp('test@test.com', 'password123', 'testuser')
    })

    expect(result.current.error).toBe('Sign up failed. Please try again')
    expect(result.current.loading).toBe(false)
  })
})
