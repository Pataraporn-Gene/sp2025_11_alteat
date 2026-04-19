import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { usePersonalizedRecommendations } from '../../hooks/usePersonalizedRecommendations'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}))

describe('usePersonalizedRecommendations', () => {
  let selectMock: any;
  let eqMock: any;
  let singleMock: any;
  let orMock: any;
  let limitMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(Math, 'random').mockReturnValue(0);

    // Mock auth
    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: { id: 'user-123' } },
    });

    // Mock profiles fetch
    singleMock = vi.fn().mockResolvedValue({
      data: {
        cuisine_preferences: ['thai'],
        skill_level: 'beginner',
        avoid_ingredients: ['peanut'],
      },
      error: null,
    });
    eqMock = vi.fn().mockReturnValue({ single: singleMock });

    // Mock recipes fetch
    limitMock = vi.fn().mockResolvedValue({
      data: [
        { id: 1, recipe_name: 'Thai Green Curry', cuisine_path: 'thai', ingredients: 'chicken, coconut milk', img_src: '', rating: 4.5 },
        { id: 2, recipe_name: 'Peanut Chicken', cuisine_path: 'thai', ingredients: 'chicken, peanut', img_src: '', rating: 4.0 }, // Contains avoided ingredient
        { id: 3, recipe_name: 'Pasta', cuisine_path: 'italian', ingredients: 'pasta, tomato', img_src: '', rating: 3.5 },
      ],
      error: null,
    });
    orMock = vi.fn().mockReturnValue({ limit: limitMock });
    selectMock = vi.fn().mockImplementation((columns) => {
      if (columns === 'cuisine_preferences, skill_level, avoid_ingredients') {
        return { eq: eqMock };
      }
      return { or: orMock, limit: limitMock };
    });

    (supabase.from as any).mockReturnValue({
      select: selectMock,
    });

    // Mock rpc
    (supabase.rpc as any).mockResolvedValue({
      data: [{ id: 4, recipe_name: 'Random Recipe', cuisine_path: 'random', ingredients: 'beef', img_src: '', rating: 4.0 }],
      error: null,
    });
  })

  afterEach(() => {
    vi.restoreAllMocks();
  })

  it('should fetch and filter personalized recipes', async () => {
    const { result } = renderHook(() => usePersonalizedRecommendations(2))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.auth.getUser).toHaveBeenCalled()
    expect(supabase.from).toHaveBeenCalledWith('profiles')
    expect(supabase.from).toHaveBeenCalledWith('recipes')
    
    // Thai recipe should rank ahead of non-matching cuisine recipes
    expect(result.current.recipes[0].title).toBe('Thai Green Curry')

    // Peanut Chicken should be filtered out because of 'peanut' in avoid_ingredients
    expect(result.current.recipes.some(r => r.id === 2)).toBe(false)
    // Should get up to 2 recipes due to limit
    expect(result.current.recipes.length).toBeLessThanOrEqual(2)
  })

  it('should fallback to random recipes on error', async () => {
    (supabase.auth.getUser as any).mockRejectedValueOnce(new Error('Auth error'));
    
    limitMock.mockResolvedValueOnce({
      data: [
        { id: 5, recipe_name: 'Fallback Recipe', cuisine_path: 'fallback', ingredients: 'water', img_src: '', rating: 5.0 },
      ],
      error: null,
    });

    const { result } = renderHook(() => usePersonalizedRecommendations(3))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Auth error')
    expect(result.current.recipes[0].id).toBe(5)
  })
  
  it('should skip profile fetch and return recipes when user is not authenticated', async () => {
    (supabase.auth.getUser as any).mockResolvedValueOnce({
      data: { user: null },
    })

    const { result } = renderHook(() => usePersonalizedRecommendations(3))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Should never query profiles
    expect(supabase.from).not.toHaveBeenCalledWith('profiles')

    // Should still return recipes from rpc fallback
    expect(result.current.recipes.length).toBeGreaterThan(0)
    expect(result.current.error).toBeNull()
  })

  it('should deduplicate recipes returned from multiple sources', async () => {
    const duplicateRecipe = {
      id: 4,
      recipe_name: 'Random Recipe',
      cuisine_path: 'random',
      ingredients: 'beef',
      img_src: '',
      rating: 4.0,
    }

    // Both cuisine query and rpc return the same recipe
    limitMock.mockResolvedValue({ data: [duplicateRecipe], error: null })
    ;(supabase.rpc as any).mockResolvedValue({ data: [duplicateRecipe], error: null })

    const { result } = renderHook(() => usePersonalizedRecommendations(5))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const ids = result.current.recipes.map(r => r.id)
    const uniqueIds = new Set(ids)
    expect(ids.length).toBe(uniqueIds.size)
  })
})
