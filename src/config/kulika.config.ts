import type { FamilyRole } from '@/types/kulika';

export const KULIKA_CONFIG = {
  // Family space settings
  familySpace: {
    maxNameLength: 100,
    maxDescriptionLength: 500,
    maxMembersPerSpace: 10000,
  },

  // Claims settings
  claims: {
    minConfidenceScore: 0.0,
    maxConfidenceScore: 1.0,
    defaultConfidence: 0.5,
    claimTypes: [
      'birth_date',
      'birth_place',
      'death_date',
      'death_place',
      'gotra',
      'caste',
      'religion',
      'samaj',
      'language',
      'occupation',
      'education',
      'address',
      'relationship_status',
      'other',
    ],
  },

  // Evidence settings
  evidence: {
    maxFileSize: 100 * 1024 * 1024, // 100MB
    allowedTypes: [
      'document',
      'photo',
      'audio',
      'video',
      'transcript',
      'certificate',
      'other',
    ],
    minTrustScore: 0.0,
    maxTrustScore: 1.0,
  },

  // Duplicate detection
  duplicates: {
    nameSimilarityThreshold: 0.7,
    minSimilarityScore: 0.6,
    maxFuzzyDistance: 2,
  },

  // Roles & Permissions
  roles: {
    defaultRole: 'visitor' as FamilyRole,
    maxRolesPerUser: 10,
  },

  // Audit & Revision
  audit: {
    retentionDays: 2555, // 7 years
    enableFullHistory: true,
  },

  // Privacy
  privacy: {
    sensitiveFields: [
      'phone',
      'email',
      'address',
      'medical_info',
      'government_id',
      'financial_info',
    ],
    defaultVisibilityScope: 'private' as const,
  },
};
