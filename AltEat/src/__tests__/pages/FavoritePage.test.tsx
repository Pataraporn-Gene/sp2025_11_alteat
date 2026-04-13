import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import FavoritePage from '../../pages/FavoritePage'
import { supabase } from '../../lib/supabase'

vi.mock('../../component/Navbar', () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}))

vi.mock('../../component/RecipeCard', () => ({
  default: ({ recipes }: { recipes: any[] }) => (
    <div data-testid="recipe-card-mock">
      {recipes.map(r => <div key={r.id}>{r.title}</div>)}
    </div>
  ),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _defaultValue?: string) => key,
  }),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      getUser: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(),
  },
}))

describe('FavoritePage', () => {
  let selectMock: any;
  let eqMock: any;
  let inMock: any;

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock auth
    const MOCK_SESSION = { session: null };
    (supabase.auth.getSession as any).mockResolvedValue({ data: MOCK_SESSION });
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });

    // Mock DB
    inMock = vi.fn().mockResolvedValue({ data: [], error: null });
    selectMock = vi.fn().mockReturnValue({ in: inMock });
    eqMock = vi.fn().mockResolvedValue({ data: [], error: null });
    const selectEqMock = vi.fn().mockReturnValue({ eq: eqMock });
    
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'favorite') return { select: selectEqMock };
      if (table === 'recipes') return { select: selectMock };
    });
    
  })

  it('renders unauthenticated state', async () => {
    render(
      <MemoryRouter>
        <FavoritePage />
      </MemoryRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('saveFavoritesTitle')).toBeInTheDocument()
      expect(screen.getByText('login')).toBeInTheDocument()
    })
  })

  it('renders authenticated state with no favorites', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '1' } } });
    (supabase.auth.onAuthStateChange as any).mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    
    // Explicitly call the listener to simulate React useEfect sequence correctly
    let authListener: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((listener: any) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    render(
      <MemoryRouter>
        <FavoritePage />
      </MemoryRouter>
    )

    // Trigger auth listener to set isLoggedIn state
    if (authListener) authListener('SIGNED_IN', { user: { id: '1' } });

    await waitFor(() => {
      expect(screen.getByText('noFavorites')).toBeInTheDocument()
      expect(screen.getByText('noFavoritesMessage')).toBeInTheDocument()
    })
  })

  it('renders authenticated state with favorites', async () => {
    (supabase.auth.getSession as any).mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    (supabase.auth.getUser as any).mockResolvedValue({ data: { user: { id: '1' } } });
    
    let authListener: any;
    (supabase.auth.onAuthStateChange as any).mockImplementation((listener: any) => {
      authListener = listener;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    eqMock.mockResolvedValue({ data: [{ recipe_id: 10 }], error: null });
    inMock.mockResolvedValue({
      data: [{ id: 10, recipe_name: 'Test Fav Recipe', img_src: '', cuisine_path: 'thai' }],
      error: null
    });

    render(
      <MemoryRouter>
        <FavoritePage />
      </MemoryRouter>
    )

    if (authListener) authListener('SIGNED_IN', { user: { id: '1' } });

    await waitFor(() => {
      expect(screen.getByTestId('recipe-card-mock')).toBeInTheDocument()
      expect(screen.getByText('Test Fav Recipe')).toBeInTheDocument()
    })
  })
})
