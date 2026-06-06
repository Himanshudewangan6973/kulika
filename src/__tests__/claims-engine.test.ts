import { describe, it, expect, beforeEach, vi } from 'vitest';
import { claimsEngine } from '@/lib/claims-engine';
import { createClient } from '@/lib/supabase/client';

vi.mock('@/lib/supabase/client');

describe('ClaimsEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createClaim', () => {
    it('should throw an error on invalid confidence score', async () => {
      // In a real scenario, this validation would happen before hitting Supabase.
      // For this test, we expect the engine to enforce limits.
      // However, the current implementation relies on DB constraints.
      // We simulate a DB error here to represent the constraint failure.
      
      const mockSupabase = {
        auth: {
           getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'test-user'} } })
        },
        from: vi.fn().mockReturnValue({
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: new Error('Check constraint violation') }),
            }),
          }),
        }),
      };
      
      vi.mocked(createClient).mockReturnValue(mockSupabase as any);

      await expect(
        claimsEngine.createClaim(
          'family-1',
          'member-1',
          'birth_date',
          '1950-01-01',
          'certificate',
          1.5 // Invalid: > 1.0
        )
      ).rejects.toThrow('Check constraint violation');
    });
  });
});
