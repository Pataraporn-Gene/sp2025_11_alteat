import { describe, expect, it, vi, beforeEach } from 'vitest'
import { addFavorite, removeFavorite, getFavoriteIds } from '../../lib/favorite'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    from: vi.fn(),
  },
}))

describe('favorite lib', () => {
  const mockUser = { id: 'user-123' };
  let upsertMock: any;
  let deleteMock: any;
  let eqMock1: any;
  let eqMock2: any;
  let selectMock: any;

  beforeEach(() => {
    vi.clearAllMocks();

    (supabase.auth.getUser as any).mockResolvedValue({
      data: { user: mockUser },
    });

    upsertMock = vi.fn().mockResolvedValue({ error: null });
    
    eqMock2 = vi.fn().mockResolvedValue({ error: null });
    eqMock1 = vi.fn().mockReturnValue({ eq: eqMock2 });
    deleteMock = vi.fn().mockReturnValue({ eq: eqMock1 });

    const selectEqMock = vi.fn().mockResolvedValue({ data: [{ recipe_id: 1 }, { recipe_id: 2 }], error: null });
    selectMock = vi.fn().mockReturnValue({ eq: selectEqMock });

    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'favorite') {
        return {
          upsert: upsertMock,
          delete: deleteMock,
          select: selectMock,
        }
      }
    });
  })

  describe('addFavorite', () => {
    it('should throw error if user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null } });
      await expect(addFavorite(1)).rejects.toThrow('Not authenticated');
    })

    it('should call upsert with correct params', async () => {
      await addFavorite(1);
      expect(supabase.from).toHaveBeenCalledWith('favorite');
      expect(upsertMock).toHaveBeenCalledWith(
        { user_id: mockUser.id, recipe_id: 1 },
        { onConflict: 'user_id,recipe_id' }
      );
    })

    it('should throw error if upsert fails', async () => {
      upsertMock.mockResolvedValueOnce({ error: new Error('Upsert failed') });
      await expect(addFavorite(1)).rejects.toThrow('Upsert failed');
    })
  })

  describe('removeFavorite', () => {
    it('should throw error if user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null } });
      await expect(removeFavorite(1)).rejects.toThrow('Not authenticated');
    })

    it('should call delete with correct params', async () => {
      await removeFavorite(1);
      expect(supabase.from).toHaveBeenCalledWith('favorite');
      expect(deleteMock).toHaveBeenCalled();
      expect(eqMock1).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(eqMock2).toHaveBeenCalledWith('recipe_id', 1);
    })
  })

  describe('getFavoriteIds', () => {
    it('should return empty array if user is not authenticated', async () => {
      (supabase.auth.getUser as any).mockResolvedValueOnce({ data: { user: null } });
      const ids = await getFavoriteIds();
      expect(ids).toEqual([]);
    })

    it('should return array of recipe ids', async () => {
      const ids = await getFavoriteIds();
      expect(supabase.from).toHaveBeenCalledWith('favorite');
      expect(selectMock).toHaveBeenCalledWith('recipe_id');
      expect(ids).toEqual([1, 2]);
    })
  })
})
