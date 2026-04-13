import { renderHook, waitFor } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useSupabaseFetch } from '../../hooks/useSupabaseFetch'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

describe('useSupabaseFetch', () => {
  let selectMock: any;
  let eqMock: any;
  let singleMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    singleMock = vi.fn();
    eqMock = vi.fn().mockReturnValue({ single: singleMock });
    selectMock = vi.fn().mockReturnValue(Promise.resolve({ data: [{ id: 1, name: 'test' }], error: null }));
    
    // Add eq method to the promise returned by select for single fetching
    const selectReturn: any = selectMock();
    selectReturn.eq = eqMock;

    selectMock = vi.fn().mockReturnValue(selectReturn);

    (supabase.from as any).mockReturnValue({
      select: selectMock,
    });
  })

  it('should not fetch if enabled is false', () => {
    const { result } = renderHook(() => useSupabaseFetch('recipes', undefined, { enabled: false }))

    expect(result.current.loading).toBe(true)
    expect(result.current.data).toBeNull()
    expect(supabase.from).not.toHaveBeenCalled()
  })

  it('should fetch all data when no id is provided', async () => {
    const mockData = [{ id: 1, name: 'Recipe 1' }]
    const selectReturn: any = Promise.resolve({ data: mockData, error: null });
    selectReturn.eq = eqMock;
    selectMock.mockReturnValue(selectReturn);

    const { result } = renderHook(() => useSupabaseFetch('recipes'))

    expect(result.current.loading).toBe(true)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.from).toHaveBeenCalledWith('recipes')
    expect(selectMock).toHaveBeenCalledWith('*')
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should fetch single data when id is provided', async () => {
    const mockData = { id: 2, name: 'Recipe 2' }
    singleMock.mockResolvedValue({ data: mockData, error: null })

    const { result } = renderHook(() => useSupabaseFetch('recipes', 2))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(supabase.from).toHaveBeenCalledWith('recipes')
    expect(selectMock).toHaveBeenCalledWith('*')
    expect(eqMock).toHaveBeenCalledWith('id', 2)
    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
  })

  it('should handle fetch errors', async () => {
    const selectReturn: any = Promise.resolve({ data: null, error: new Error('Network error') });
    selectReturn.eq = eqMock;
    selectMock.mockReturnValue(selectReturn);

    const { result } = renderHook(() => useSupabaseFetch('recipes'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.data).toBeNull()
  })
})
