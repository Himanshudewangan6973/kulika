/**
 * @file src/lib/schemas/memberSchema.ts
 * @description Unified schema definitions and validation logic for family member data.
 * Requirement: Centralizes Zod schemas for forms, database normalization, and inbox validation.
 */

import { z, ZodError } from 'zod'

/**
 * UNIFIED MEMBER SCHEMA
 * Single source of truth for member data across the entire application.
 * Uses camelCase consistently for all forms and submissions.
 */
export const unifiedMemberSchema = z.object({
  // Core identity - full_name is canonical and required
  full_name: z.string().min(1, 'Full name is required').trim(),
  
  // Structured name fields (optional helpers)
  given_name: z.string().optional().nullable(),
  middle_names: z.string().optional().nullable(),
  surname: z.string().optional().nullable(),
  preferred_display_name: z.string().optional().nullable(),
  native_name: z.string().optional().nullable(),
  
  // Community info
  community_id: z.string({
    required_error: 'Please select a community for this member',
  }).min(1, 'Please select a community for this member'),
  community_override: z.string().optional().nullable(),
  
  // Notes and bio
  name_notes: z.string().optional().nullable(),
  bio: z.string().optional().nullable(),
  
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
  lineage_type_p1: z.enum(['biological', 'adopted', 'step', 'foster']).default('biological'),
  lineage_type_p2: z.enum(['biological', 'adopted', 'step', 'foster']).default('biological'),
  
  // Privacy & Access
  visibility_scope: z.enum(['public', 'protected', 'family', 'branch', 'private', 'admin_only']).default('protected'),
  
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
 * Helper function to normalize various input formats to unified schema
 */
export function normalizeToUnified(data: any): UnifiedMember {
  return unifiedMemberSchema.parse({
    full_name: data.full_name || data.fullName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || '',
    given_name: data.given_name || data.givenName || null,
    middle_names: data.middle_names || data.middleNames || null,
    surname: data.surname || null,
    preferred_display_name: data.preferred_display_name || data.preferredDisplayName || null,
    native_name: data.native_name || data.nativeName || null,
    community_id: data.community_id || data.communityId || null,
    community_override: data.community_override || data.communityOverride || null,
    name_notes: data.name_notes || data.nameNotes || null,
    bio: data.bio || null,
    gender: data.gender || 'Other',
    dateOfBirth: data.dateOfBirth || data.date_of_birth || null,
    birthPlace: data.birthPlace || data.birth_place || null,
    isDeceased: data.isDeceased || data.is_deceased || false,
    dateOfDeath: data.dateOfDeath || data.date_of_death || null,
    parent1Id: data.parent1Id || data.parent1_id || data.father_id || null,
    parent2Id: data.parent2Id || data.parent2_id || data.mother_id || null,
    lineage: data.lineage || null,
    lineage_type_p1: data.lineage_type_p1 || 'biological',
    lineage_type_p2: data.lineage_type_p2 || 'biological',
    visibility_scope: data.visibility_scope || 'protected',
    nickname: data.nickname || null,
    profilePhotoUrl: data.profilePhotoUrl || data.profile_photo_url || null,
  })
}

/**
 * Helper function to convert unified member to database format (snake_case)
 */
export function unifiedToDatabase(member: UnifiedMember): Record<string, any> {
  return {
    full_name: member.full_name,
    given_name: member.given_name,
    middle_names: member.middle_names,
    surname: member.surname,
    preferred_display_name: member.preferred_display_name,
    native_name: member.native_name,
    community_id: member.community_id,
    community_override: member.community_override,
    name_notes: member.name_notes,
    bio: member.bio,
    gender: member.gender,
    date_of_birth: member.dateOfBirth,
    birth_place: member.birthPlace,
    is_deceased: member.isDeceased,
    date_of_death: member.dateOfDeath,
    parent1_id: member.parent1Id,
    parent2_id: member.parent2Id,
    lineage: member.lineage,
    lineage_type_p1: member.lineage_type_p1,
    lineage_type_p2: member.lineage_type_p2,
    visibility_scope: member.visibility_scope,
    nickname: member.nickname,
    profile_photo_url: member.profilePhotoUrl,
  }
}

/**
 * Validates inbox submission data
 */
export function validateInboxSubmission(submission: any) {
  const { submission_type, raw_data } = submission

  try {
    if (submission_type === 'New Member') {
      const validated = raw_data?.submitterName && raw_data?.submitterEmail
        ? submissionSchema.parse(raw_data)
        : unifiedMemberSchema.parse(raw_data)

      return { valid: true, data: validated }
    } else {
      return { valid: false, errors: [`Unknown submission type: ${submission_type}`] }
    }
  } catch (error) {
    if (error instanceof ZodError) {
      const errors = error.errors.map(e => {
        const path = e.path.join('.')
        return `${path}: ${e.message}`
      })
      return { valid: false, errors }
    }
    return { valid: false, errors: ['Unknown validation error'] }
  }
}

/**
 * Formats validation errors for user-friendly display
 */
export function formatValidationErrors(errors: string[]): string {
  return errors.join('\n• ')
}
