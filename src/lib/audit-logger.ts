/**
 * @file src/lib/audit-logger.ts
 * @description Utility for logging data changes and system events for audit trails.
 * Requirement: Tracks all modifications to family records for transparency and reversal capabilities.
 */

import { createClient } from '@/lib/supabase/client';
import type { EntityType } from '@/types/kulika';

export class AuditLogger {
  private getSupabase() {
    return createClient();
  }
  
  /**
   * Log any change to the system
   */
  async logChange(
    familyId: string,
    entityType: EntityType,
    entityId: string,
    fieldName: string,
    oldValue: any,
    newValue: any,
    reason?: string
  ): Promise<void> {
    const supabase = this.getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const user = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from('revisions')
      .insert({
        family_id: familyId,
        entity_type: entityType,
        entity_id: entityId,
        field_name: fieldName,
        old_value: JSON.stringify(oldValue),
        new_value: JSON.stringify(newValue),
        changed_by: user.data.user?.id || 'system',
        change_reason: reason,
        can_undo: true,
      });
    
    if (error) throw error;
  }
  
  /**
   * Get audit trail for an entity
   */
  async getAuditTrail(
    familyId: string,
    entityType: EntityType,
    entityId: string
  ) {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('revisions')
      .select('*')
      .eq('family_id', familyId)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('changed_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Undo a change (reversibility)
   */
  async undoChange(revisionId: string): Promise<void> {
    const supabase = this.getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const user = await supabase.auth.getUser();
    
    // Get the revision
    const { data: revision, error: fetchError } = await supabase
      .from('revisions')
      .select('*')
      .eq('id', revisionId)
      .single();
    
    if (fetchError) throw fetchError;
    if (!revision.can_undo) throw new Error('This change cannot be undone');
    
    // Revert the data
    const table = this.getTableName(revision.entity_type);
    const { error: updateError } = await supabase
      .from(table)
      .update({
        [revision.field_name]: JSON.parse(revision.old_value)
      })
      .eq('id', revision.entity_id);
    
    if (updateError) throw updateError;
    
    // Mark revision as undone
    const { error: undoError } = await supabase
      .from('revisions')
      .update({
        undone_by: user.data.user?.id || 'system',
        undone_at: new Date().toISOString(),
      })
      .eq('id', revisionId);
    
    if (undoError) throw undoError;
  }
  
  private getTableName(entityType: EntityType): string {
    const map: Record<EntityType, string> = {
      member: 'family_members',
      story: 'stories',
      relationship: 'marriages',
      claim: 'claims',
      evidence: 'evidence',
    };
    return map[entityType];
  }
}

export const auditLogger = new AuditLogger();
