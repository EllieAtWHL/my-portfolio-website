import { describe, it, expect } from '@jest/globals';

describe('Supabase Utils', () => {
  it('should export supabase client', async () => {
    const { supabase } = await import('@/utils/supabase');
    expect(supabase).toBeDefined();
    expect(typeof supabase).toBe('object');
  });

  it('should export supabaseAdmin client', async () => {
    const { supabaseAdmin } = await import('@/utils/supabase');
    expect(supabaseAdmin).toBeDefined();
    expect(typeof supabaseAdmin).toBe('object');
  });
});
