/**
 * @file src/lib/duplicate-detector.ts
 * @description heuristic engine for identifying potential duplicate members in the family tree.
 * Requirement: Reduces data redundancy by flagging similar records for moderator review.
 */

import { createClient } from '@/lib/supabase/client';
import Fuse from 'fuse.js';

export class DuplicateDetector {
  private getSupabase() {
    return createClient();
  }
  
  /**
   * Detect potential duplicates when new member is added
   */
  async detectDuplicates(
    familyId: string,
    newMember: {
      id?: string;
      full_name: string;
      date_of_birth?: string;
      parent1_id?: string;
      parent2_id?: string;
      birth_place?: string;
    }
  ) {
    const supabase = this.getSupabase();
    if (!supabase) return;

    // Get all existing members in family
    const { data: existingMembers, error } = await supabase
      .from('family_members')
      .select('*')
      .eq('family_id', familyId);
    
    if (error) throw error;
    if (!existingMembers || existingMembers.length === 0) return;
    
    // Use fuzzy search for name matches
    const fuse = new Fuse(existingMembers, {
      keys: ['full_name'],
      threshold: 0.3, // 70% match or better
    });
    
    const nameMatches = fuse.search(newMember.full_name);
    
    // Score each match
    const potentialDuplicates = nameMatches.map(async (match) => {
      const existingMember = match.item as any;
      // Skip self comparison if ID is present
      if (newMember.id && existingMember.id === newMember.id) return;

      const similarity = this.calculateSimilarity(newMember, existingMember);
      
      // Store in database
      await supabase
        .from('potential_duplicates')
        .insert({
          family_id: familyId,
          member_id_1: newMember.id || 'pending-temp-id', // Assuming it's already inserted with temp ID
          member_id_2: existingMember.id,
          similarity_score: similarity,
          name_match: this.namesMatch(newMember.full_name, existingMember.full_name),
          parent_match: newMember.parent1_id === existingMember.parent1_id,
          date_match: newMember.date_of_birth === existingMember.date_of_birth,
          status: 'detected',
        });
    });
    
    await Promise.all(potentialDuplicates);
  }
  
  /**
   * Get potential duplicates for review
   */
  async getPotentialDuplicates(familyId: string) {
    const supabase = this.getSupabase();
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('potential_duplicates')
      .select('*, member_1:member_id_1(full_name, date_of_birth), member_2:member_id_2(full_name, date_of_birth)')
      .eq('family_id', familyId)
      .eq('status', 'detected')
      .order('similarity_score', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }
  
  private calculateSimilarity(member1: any, member2: any): number {
    let score = 0;
    let factors = 0;
    
    // Name similarity (0-30 points)
    if (this.namesMatch(member1.full_name, member2.full_name)) {
      score += 30;
    }
    factors += 30;
    
    // Parent match (0-30 points)
    if (member1.parent1_id === member2.parent1_id || member1.parent2_id === member2.parent2_id) {
      score += 30;
    }
    factors += 30;
    
    // Date match (0-20 points)
    if (member1.date_of_birth === member2.date_of_birth) {
      score += 20;
    } else if (member1.date_of_birth && member2.date_of_birth) {
      const date1 = new Date(member1.date_of_birth);
      const date2 = new Date(member2.date_of_birth);
      const daysDiff = Math.abs((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff < 365) score += 10; // Within a year
    }
    factors += 20;
    
    // Location match (0-20 points)
    if (member1.birth_place === member2.birth_place) {
      score += 20;
    }
    factors += 20;
    
    // Prevent division by zero
    if (factors === 0) return 0;
    return score / factors;
  }
  
  private namesMatch(name1: string, name2: string): boolean {
    if (!name1 || !name2) return false;
    const clean1 = name1.toLowerCase().split(/\s+/);
    const clean2 = name2.toLowerCase().split(/\s+/);
    
    // At least 80% of words match
    const matching = clean1.filter(word => clean2.includes(word)).length;
    return matching / Math.max(clean1.length, clean2.length) > 0.8;
  }
}

export const duplicateDetector = new DuplicateDetector();
