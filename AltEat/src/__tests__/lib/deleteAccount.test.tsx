import { describe, expect, it, vi } from 'vitest'
import { deleteAccount } from '../../lib/deleteAccount'
import { supabase } from '../../lib/supabase'

vi.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}))

describe('deleteAccount', () => {
  it('should call supabase functions invoke with correct params', async () => {
    (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: null });

    const userId = 'user-123';
    await deleteAccount(userId);

    expect(supabase.functions.invoke).toHaveBeenCalledWith('delete-user', {
      body: { user_id: userId },
    });
  })
})
