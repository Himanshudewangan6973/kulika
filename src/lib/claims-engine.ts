/**
 * @file src/lib/claims-engine.ts
 * @description Logic engine for managing evidence-backed claims about family members.
 * Requirement: Evaluates confidence scores and maintains the current truth state for member attributes.
 */

import { createClient } from '@/lib/supabase/client';
import type { Claim } from '@/types/kulika';
import { KULIKA_CONFIG } from '@/config/kulika.config';

export class ClaimsEngine {
  private getSupabase() {
    return createClient();
  }
  
  /**
   * Create a new claim instead of overwriting data
   */
  async createClaim(
    familyId: string,
    subjectId: string,
    claimType: string,
    claimValue: string,
    sourceType: string,
    confidence: number = KULIKA_CONFIG.claims.defaultConfidence
  ): Promise<Claim> {
    const supabase = this.getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { data: userData } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('claims')
      .insert({
        family_id: familyId,
        subject_id: subjectId,
        claim_type: claimType,
        claim_value: claimValue,
        source_type: sourceType,
        confidence_score: confidence,
        claimed_by: userData.user?.id || 'system',
        status: 'proposed',
      })
      .select()
      .single();
    
    if (error) throw error;
    return this.mapClaim(data);
  }
  
  /**
   * Get all claims for a member
   */
  async getClaimsForMember(
    familyId: string,
    memberId: string
  ): Promise<Claim[]> {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('family_id', familyId)
      .eq('subject_id', memberId)
      .eq('is_current', true)
      .order('confidence_score', { ascending: false });
    
    if (error) {
      console.warn('Error fetching claims:', error);
      return [];
    }
    return data?.map((c: any) => this.mapClaim(c)) || [];
  }
  
  /**
   * Get claim history (all versions)
   */
  async getClaimHistory(
    familyId: string,
    memberId: string,
    claimType: string
  ): Promise<Claim[]> {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('claims')
      .select('*')
      .eq('family_id', familyId)
      .eq('subject_id', memberId)
      .eq('claim_type', claimType)
      .order('claimed_at', { ascending: false });
    
    if (error) throw error;
    return data?.map((c: any) => this.mapClaim(c)) || [];
  }
  
  /**
   * Approve a claim (admin only)
   */
  async approveClaim(claimId: string): Promise<void> {
    const supabase = this.getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { data: userData } = await supabase.auth.getUser();

    const { error } = await supabase
      .from('claims')
      .update({
        status: 'approved',
        approved_by: userData.user?.id,
        approved_at: new Date().toISOString(),
      })
      .eq('id', claimId);
    
    if (error) throw error;
  }
  
  /**
   * Supersede old claim with new one (creates revision history)
   */
  async supersedeClaim(
    oldClaimId: string,
    newClaimId: string
  ): Promise<void> {
    const supabase = this.getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('claims')
      .update({
        is_current: false,
        superseded_by: newClaimId,
      })
      .eq('id', oldClaimId);
    
    if (error) throw error;
  }
  
  private mapClaim(data: any): Claim {
    return {
      id: data.id,
      familyId: data.family_id,
      subjectId: data.subject_id,
      claimType: data.claim_type,
      claimValue: data.claim_value,
      confidenceScore: data.confidence_score,
      sourceType: data.source_type,
      sourceDescription: data.source_description,
      status: data.status,
      claimedBy: data.claimed_by,
      claimedAt: data.claimed_at,
      isCurrent: data.is_current,
      supersededBy: data.superseded_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

export const claimsEngine = new ClaimsEngine();
