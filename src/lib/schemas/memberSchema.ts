import { z } from 'zod'

/**
 * UNIFIED MEMBER SCHEMA
 * Single source of truth for member data across the entire application.
 * Uses camelCase consistently for all forms and submissions.
 * 
 * This schema is used for:
 * - Form validation in MemberSubmissionForm and AddRelativeModal
 * - Inbox raw_data normalization in approval routes
 * - Tree visualization data mapping in TreePageClient
 */

export const unifiedMemberSchema = z.object({
  // Core identity
  firstName: z.string().min(1, 'First name is required').trim(),
  lastName: z.string().min(1, 'Last name is required').trim(),
  
  // Personal info
  gender: z.enum(['Male', 'Female', 'Other']).default('Other'),
  dateOfBirth: z.string().optional().nullable(),
  birthPlace: z.string().optional().nullable(),
  
  // Status
  isDeceased: z.boolean().default(false),
  dateOfDeath: z.string().optional().nullable(),
  
  // Family info (optional, for context)
  parent1Id: z.string().optional().nullable(),
  parent2Id: z.string().optional().nullable(),
  lineage: z.enum(['Father', 'Mother', 'Both']).optional().nullable(),
  
  // Optional
  nickname: z.string().optional().nullable(),
  profilePhotoUrl: z.string().optional().nullable(),
})

export type UnifiedMember = z.infer<typeof unifiedMemberSchema>

/**
 * Schema for form submission data (includes metadata)
 */
export const submissionSchema = unifiedMemberSchema.extend({
  submitterName: z.string().min(2, 'Your name is required'),
  submitterEmail: z.string().email('Invalid email address'),
})

export type SubmissionData = z.infer<typeof submissionSchema>

/**
 * Helper function to normalize snake_case to camelCase
 * Used when migrating from old database format
 */
export function normalizeToUnified(data: any): UnifiedMember {
  return unifiedMemberSchema.parse({
    firstName: data.firstName || data.first_name || data.full_name?.split(' ')[0] || '',
    lastName: data.lastName || data.last_name || data.full_name?.split(' ').slice(1).join(' ') || '',
    gender: data.gender || 'Other',
    dateOfBirth: data.dateOfBirth || data.date_of_birth || null,
    birthPlace: data.birthPlace || data.birth_place || null,
    isDeceased: data.isDeceased || data.is_deceased || false,
    dateOfDeath: data.dateOfDeath || data.date_of_death || null,
    parent1Id: data.parent1Id || data.parent1_id || data.father_id || null,
    parent2Id: data.parent2Id || data.parent2_id || data.mother_id || null,
    lineage: data.lineage || null,
    nickname: data.nickname || null,
    profilePhotoUrl: data.profilePhotoUrl || data.profile_photo_url || null,
  })
}

/**
 * Helper function to convert unified member to database format (snake_case)
 * Used when inserting into family_members table
 */
export function unifiedToDatabase(member: UnifiedMember): Record<string, any> {
  return {
    full_name: `${member.firstName} ${member.lastName}`.trim(),
    first_name: member.firstName,
    last_name: member.lastName,
    gender: member.gender,
    date_of_birth: member.dateOfBirth,
    birth_place: member.birthPlace,
    is_deceased: member.isDeceased,
    date_of_death: member.dateOfDeath,
    parent1_id: member.parent1Id,
    parent2_id: member.parent2Id,
    lineage: member.lineage,
    nickname: member.nickname,
    profile_photo_url: member.profilePhotoUrl,
  }
}
