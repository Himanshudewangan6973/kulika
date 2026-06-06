import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMergeFlow } from '@/hooks/useMergeFlow';
import * as familySpaceStore from '@/store/familySpaceStore';
import * as supabaseModule from '@/lib/supabase';

vi.mock('@/store/familySpaceStore');
vi.mock('@/lib/supabase');

describe('useMergeFlow Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should merge two members', async () => {
    const mockFamily = {
      id: 'fam-1',
      name: 'Dewangan',
    };

    vi.mocked(familySpaceStore.useFamilySpaceStore).mockReturnValue({
      currentSpace: mockFamily as any,
      canMergeMembers: () => true,
    } as any);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ id: 'member-1' }] }),
        }),
        insert: vi.fn().mockResolvedValue({ data: [{ id: 'merge-1' }], error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      },
    };

    vi.mocked(supabaseModule.supabase).mockReturnValue(mockSupabase as any);

    const { result } = renderHook(() => useMergeFlow());

    let mergeResult;
    await act(async () => {
      mergeResult = await result.current.mergeMumbers(
        'member-1',
        'member-2',
        'Duplicate record'
      );
    });

    expect(mergeResult).toBeDefined();
    expect(result.current.loading).toBe(false);
  });

  it('should prevent merge without permissions', async () => {
    vi.mocked(familySpaceStore.useFamilySpaceStore).mockReturnValue({
      currentSpace: null,
      canMergeMembers: () => false,
    } as any);

    const { result } = renderHook(() => useMergeFlow());

    let mergeResult;
    await act(async () => {
      mergeResult = await result.current.mergeMumbers(
        'member-1',
        'member-2',
        'Test'
      );
    });

    expect(mergeResult).toBeNull();
    expect(result.current.error?.message).toBe('Permission denied');
  });

  it('should undo a merge', async () => {
    vi.mocked(familySpaceStore.useFamilySpaceStore).mockReturnValue({
      currentSpace: { id: 'fam-1' },
      canMergeMembers: () => true,
    } as any);

    const mockSupabase = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{
            id: 'merge-1',
            member_id_primary: 'mem-1',
            member_id_secondary: 'mem-2',
            merged_data: {},
          }],
        }),
        update: vi.fn().mockResolvedValue({ error: null }),
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1' } },
        }),
      },
    };

    vi.mocked(supabaseModule.supabase).mockReturnValue(mockSupabase as any);

    const { result } = renderHook(() => useMergeFlow());

    let undoResult;
    await act(async () => {
      undoResult = await result.current.undoMerge('merge-1');
    });

    expect(undoResult).toBe(true);
  });
});
