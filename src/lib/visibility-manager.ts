import { createClient } from '@/lib/supabase/client';
import type { VisibilityScope } from '@/types/kulika';

export class VisibilityManager {
  private getSupabase() {
    return createClient();
  }

  /**
   * Redacts sensitive data from a member record based on the viewer's relationship
   * and the member's status (Living vs Deceased).
   */
  redactSensitiveData(member: any, viewerDegrees: number | null): any {
    const isLiving = !member.is_deceased && !member.date_of_death;
    const scope = member.visibility_scope || 'protected';

    // 1. Private members are fully redacted unless it's self or admin (handled by canView)
    if (scope === 'private' && (viewerDegrees === null || viewerDegrees > 0)) {
      return { id: member.id, full_name: 'Private Member', visibility_scope: 'private' };
    }

    // 2. Protected Living Members: Redact details unless within 2 degrees of separation
    if (isLiving && scope === 'protected') {
      if (viewerDegrees === null || viewerDegrees > 2) {
        return {
          ...member,
          birthDate: null,
          dateOfBirth: null,
          birthPlace: null,
          birth_place: null,
          name_notes: null,
          bio: 'Details protected for living member',
          profile_photo_url: null,
          avatarUrl: null
        };
      }
    }

    return member;
  }
  
  /**
   * Check if user can see this member
   */
  async canViewMember(
    memberId: string,
    userRole: string,
    familyId: string
  ): Promise<boolean> {
    const supabase = this.getSupabase();
    if (!supabase) return false;

    // Get member visibility
    const { data: member, error } = await supabase
      .from('family_members')
      .select('visibility_scope, family_id')
      .eq('id', memberId)
      .single();
    
    if (error || !member) return false;
    
    return this.checkVisibility(
      member.visibility_scope,
      userRole,
      familyId,
      member.family_id
    );
  }
  
  /**
   * Get filtered members based on visibility
   */
  async getVisibleMembers(
    familyId: string,
    userRole: string
  ) {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    let query = supabase
      .from('family_members')
      .select('id, full_name, visibility_scope');
    
    // Filter based on role
    if (userRole === 'visitor') {
      query = query.eq('visibility_scope', 'public');
    } else if (userRole === 'public_contributor') {
      query = query.in('visibility_scope', ['public', 'family']);
    } else if (['family_admin', 'family_owner'].includes(userRole)) {
      // Admins see everything
      query = query;
    }
    
    const { data, error } = await query.eq('family_id', familyId);
    
    if (error) throw error;
    return data || [];
  }
  
  /**
   * Update visibility for a member
   */
  async setMemberVisibility(
    memberId: string,
    scope: VisibilityScope
  ): Promise<void> {
    const supabase = this.getSupabase();
    if (!supabase) throw new Error('Supabase not configured');

    const { error } = await supabase
      .from('family_members')
      .update({ visibility_scope: scope })
      .eq('id', memberId);
    
    if (error) throw error;
  }
  
  private checkVisibility(
    scope: VisibilityScope,
    userRole: string,
    requestingFamilyId: string,
    memberFamilyId: string
  ): boolean {
    // Public - anyone can see
    if (scope === 'public') return true;
    
    // Protected - anyone in the same family space
    if (scope === 'protected') return requestingFamilyId === memberFamilyId;

    // Must be in same family for anything else
    if (requestingFamilyId !== memberFamilyId) return false;
    
    // Family - logged in users
    if (scope === 'family') return userRole !== 'visitor';
    
    // Private - owner only
    if (scope === 'private') return ['family_owner', 'family_admin'].includes(userRole);
    
    // Admin only
    if (scope === 'admin_only') return userRole === 'family_owner';
    
    return false;
  }
}

export const visibilityManager = new VisibilityManager();
