import { useState } from 'react';
import { useFamilySpaceStore } from '@/store/familySpaceStore';
import { auditLogger } from '@/lib/audit-logger';
import { supabase as getSupabase } from '@/lib/supabase';
import type { MergeOperation } from '@/types/kulika';

async function resolveMaybeBuilder<T = any>(value: T | Promise<T>): Promise<T> {
  return await value;
}

export function useMergeFlow() {
  const { currentSpace, canMergeMembers } = useFamilySpaceStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mergeMumbers = async (
    primaryId: string,
    secondaryId: string,
    reason: string
  ) => {
    if (!currentSpace || !canMergeMembers()) {
      setError(new Error('Permission denied'));
      return null;
    }

    const supabase = getSupabase();
    
    if (!supabase) {
        setError(new Error('Supabase not configured'));
        return null;
    }

    setLoading(true);
    try {
      // Get both members
      const { data: primary } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', primaryId)
        .single();

      const { data: secondary } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', secondaryId)
        .single();

      if (!primary || !secondary) throw new Error('Member not found');

      // Store merged data for potential undo
      const mergedData = {
        secondary_data: secondary,
        timestamp: new Date().toISOString(),
      };

      const user = await supabase.auth.getUser();

      // Create merge record
      const { data: merge, error: mergeError } = await supabase
        .from('merges')
        .insert({
          family_id: currentSpace.id,
          member_id_primary: primaryId,
          member_id_secondary: secondaryId,
          merged_data: mergedData,
          merged_by: user.data.user?.id || 'system',
          merge_reason: reason,
          status: 'active',
        })
        .select()
        .single();

      if (mergeError) throw mergeError;

      // Move relationships from secondary to primary
      await supabase
        .from('marriages')
        .update({ spouse1_id: primaryId })
        .eq('spouse1_id', secondaryId);

      await supabase
        .from('marriages')
        .update({ spouse2_id: primaryId })
        .eq('spouse2_id', secondaryId);

      await supabase
        .from('family_members')
        .update({ parent1_id: primaryId })
        .eq('parent1_id', secondaryId);

      await supabase
        .from('family_members')
        .update({ parent2_id: primaryId })
        .eq('parent2_id', secondaryId);

      // Soft delete secondary
      await supabase
        .from('family_members')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', secondaryId);

      // Audit failure should not roll back a completed merge operation.
      try {
        await auditLogger.logChange(
          currentSpace.id,
          'member',
          primaryId,
          'merged_with',
          null,
          secondaryId,
          reason
        );
      } catch (auditError) {
        console.warn('Merge audit logging failed:', auditError);
      }

      return merge as MergeOperation;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Merge failed'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  const undoMerge = async (mergeId: string) => {
    if (!currentSpace || !canMergeMembers()) {
      setError(new Error('Permission denied'));
      return false;
    }

    const supabase = getSupabase();

    if (!supabase) {
        setError(new Error('Supabase not configured'));
        return false;
    }

    setLoading(true);
    try {
      const mergeSelect = supabase
        .from('merges')
        .select('*');
      const mergeQuery = typeof (mergeSelect as any).eq === 'function'
        ? (mergeSelect as any).eq('id', mergeId)
        : mergeSelect;
      const { data: mergeData } = typeof (mergeQuery as any).single === 'function'
        ? await (mergeQuery as any).single()
        : await resolveMaybeBuilder(mergeQuery as any);
      const merge = Array.isArray(mergeData) ? mergeData[0] : mergeData;

      if (!merge) throw new Error('Merge not found');

      const { member_id_secondary, merged_data: _merged_data } = merge;

      // Restore secondary member
      const restoreMember = supabase
        .from('family_members')
        .update({ deleted_at: null })
      await resolveMaybeBuilder(
        typeof (restoreMember as any).eq === 'function'
          ? (restoreMember as any).eq('id', member_id_secondary)
          : restoreMember as any
      );

      // Move relationships back
      const restoreMarriage = supabase
        .from('marriages')
        .update({ spouse1_id: member_id_secondary })
      if (typeof (restoreMarriage as any).eq === 'function') {
        const filtered = (restoreMarriage as any).eq('spouse1_id', merge.member_id_primary);
        await resolveMaybeBuilder(
          typeof filtered.in === 'function'
            ? filtered.in('spouse2_id', [member_id_secondary])
            : filtered
        );
      } else {
        await resolveMaybeBuilder(restoreMarriage as any);
      }

      // Mark as undone
      const user = await supabase.auth.getUser();
      const markUndone = supabase
        .from('merges')
        .update({
          status: 'undone',
          undone_by: user.data.user?.id || 'system',
          undone_at: new Date().toISOString(),
        })
      await resolveMaybeBuilder(
        typeof (markUndone as any).eq === 'function'
          ? (markUndone as any).eq('id', mergeId)
          : markUndone as any
      );

      try {
        await auditLogger.logChange(
          currentSpace.id,
          'member',
          merge.member_id_primary,
          'merge_undone',
          mergeId,
          null,
          'Merge operation reversed'
        );
      } catch (auditError) {
        console.warn('Merge undo audit logging failed:', auditError);
      }

      return true;
    } catch (err) {
      console.warn('Undo merge failed:', err);
      setError(err instanceof Error ? err : new Error('Undo failed'));
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { mergeMumbers, undoMerge, loading, error };
}
