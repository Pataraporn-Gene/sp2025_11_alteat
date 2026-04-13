import { render, screen, act, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { ProfileProvider, useProfile } from '../../context/ProfileContext'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

// Test component to consume the context
const TestConsumer = () => {
  const { profile, refreshProfile } = useProfile()
  return (
    <div>
      <div data-testid="profile-data">
        {profile ? profile.username : 'No Profile'}
      </div>
      <button onClick={() => refreshProfile()}>Refresh</button>
    </div>
  )
}

describe('ProfileContext', () => {
  let selectMock: any;
  let eqMock: any;
  let singleMock: any;

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock onAuthStateChange
    ;(supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    singleMock = vi.fn().mockResolvedValue({
      data: {
        user_id: '1',
        username: 'testuser',
        avatar_url: null,
        languages: [],
        cuisine_preferences: [],
        skill_level: 'beginner',
        avoid_ingredients: []
      }
    });

    eqMock = vi.fn().mockReturnValue({ single: singleMock });
    selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    
    ;(supabase.from as any).mockReturnValue({ select: selectMock });
  })

  it('throws error when useProfile is used outside of ProfileProvider', () => {
    // Suppress console.error for expected React error boundary throw
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => render(<TestConsumer />)).toThrow('useProfile must be used inside ProfileProvider');
    
    consoleSpy.mockRestore();
  })

  it('provides null profile when user is not authenticated', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } })

    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('profile-data')).toHaveTextContent('No Profile')
    })
  })

  it('provides profile data when user is authenticated', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '1' } } })

    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('profile-data')).toHaveTextContent('testuser')
    })
    
    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(eqMock).toHaveBeenCalledWith('user_id', '1')
  })

  it('refreshes profile on auth state change', async () => {
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '1' } } })
    
    let authListener: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((listener: any) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <ProfileProvider>
        <TestConsumer />
      </ProfileProvider>
    )

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledTimes(1)
    })

    // Trigger auth state change
    await act(async () => {
      authListener()
    })

    expect(supabase.from).toHaveBeenCalledTimes(2)
  })
})
