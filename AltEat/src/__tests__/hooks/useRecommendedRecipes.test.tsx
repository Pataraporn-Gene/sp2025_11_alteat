import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useRecommendedRecipes } from '../../hooks/useRecommendedRecipes'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('useRecommendedRecipes', () => {
  let selectMock: any;
  let neqMock: any;
  let orderMock: any;
  let limitMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    limitMock = vi.fn().mockResolvedValue({ data: [], error: null });
    orderMock = vi.fn().mockReturnValue({ limit: limitMock });
    neqMock = vi.fn().mockReturnValue({ order: orderMock });
    selectMock = vi.fn().mockReturnValue({ neq: neqMock });

    (supabase.from as any).mockReturnValue({
      select: selectMock,
    });
  })

  it('should not fetch if currentRecipeId or cuisinePath is missing', () => {
    const { result } = renderHook(() => useRecommendedRecipes(0, ''))

    expect(result.current.loading).toBe(true)
    expect(result.current.recipes).toEqual([])
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('should fetch and process recommended recipes based on cuisine path', async () => {
    const mockRecipes = [
      { id: 1, recipe_name: 'Current Recipe', cuisine_path: 'thai/curry', img_src: '', rating: 5.0 },
      { id: 2, recipe_name: 'Similar Recipe 1', cuisine_path: 'thai/curry', img_src: '', rating: 4.5 },
      { id: 3, recipe_name: 'Different Recipe', cuisine_path: 'italian/pasta', img_src: '', rating: 5.0 },
    ];
    
    limitMock.mockResolvedValue({ data: mockRecipes, error: null });

    const { result } = renderHook(() => useRecommendedRecipes(1, 'thai/curry/spicy'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.from).toHaveBeenCalledWith('recipes')
    expect(selectMock).toHaveBeenCalledWith('id, recipe_name, cuisine_path, img_src, rating')
    expect(neqMock).toHaveBeenCalledWith('id', 1)
    expect(result.current.recipes.some(recipe => recipe.id === 1)).toBe(false)
    
    // Check sorting logic
    // Similar Recipe 1 matches 2 categories ('thai', 'curry') + 0.45 = 2.45 score
    // Different Recipe matches 0 categories + 0.5 = 0.5 score
    expect(result.current.recipes[0].id).toBe(2)
    expect(result.current.recipes[1].id).toBe(3)
  })

  it('should handle fetch errors', async () => {
    limitMock.mockResolvedValue({ data: null, error: new Error('Database error') });

    const { result } = renderHook(() => useRecommendedRecipes(1, 'thai'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Database error')
    expect(result.current.recipes).toEqual([])
  })
})
