
// ============================================
// FAMILY SPACES
// ============================================

export interface FamilySpace {
  id: string;
  name: string;
  slug: string;
  description?: string;
  foundingAncestorId?: string;
  privacyLevel: 'public' | 'private';
  bannerImageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMemberWithFamily {
  id: string;
  familyId: string;
  fullName: string;
  nickname?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  dateOfDeath?: string;
  birthPlace?: string;
  visibilityScope: VisibilityScope;
  isSensitive: boolean;
  createdAt: string;
}

// ============================================
// ROLES & PERMISSIONS
// ============================================

export type FamilyRole = 
  | 'platform_admin'
  | 'family_owner'
  | 'family_admin'
  | 'branch_moderator'
  | 'verified_contributor'
  | 'public_contributor'
  | 'visitor';

export interface RolePermissions {
  manageFamily: boolean;
  approveMembers: boolean;
  approveMembersInBranch: boolean;
  moderateContent: boolean;
  assignRoles: boolean;
  viewSensitiveData: boolean;
  addMembers: boolean;
  editMembers: boolean;
  deleteMembers: boolean;
  mergeMemberRecords: boolean;
  undoChanges: boolean;
}

export interface FamilyMemberRole {
  memberId: string;
  familyId: string;
  role: FamilyRole;
  branchScope?: string; // For branch_moderator
  assignedBy: string;
  assignedAt: string;
}

// ============================================
// CLAIMS & EVIDENCE
// ============================================

export type VisibilityScope = 'public' | 'protected' | 'family' | 'branch' | 'private' | 'admin_only';

export type SourceType = 
  | 'oral_tradition'
  | 'document'
  | 'photo'
  | 'certificate'
  | 'interview'
  | 'family_bible'
  | 'government_record'
  | 'other';

export type EvidenceType =
  | 'document'
  | 'photo'
  | 'audio'
  | 'video'
  | 'transcript'
  | 'certificate'
  | 'other';

export interface Claim {
  id: string;
  familyId: string;
  subjectId: string;
  claimType: string; // 'birth_date', 'gotra', 'caste', etc.
  claimValue: string;
  claimedBy: string;
  claimedAt: string;
  confidenceScore: number; // 0.0 to 1.0
  sourceType: SourceType;
  sourceDescription?: string;
  status: 'proposed' | 'approved' | 'disputed' | 'archived';
  approvedBy?: string;
  approvedAt?: string;
  isCurrent: boolean;
  supersededBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  claimId: string;
  evidenceType: EvidenceType;
  title?: string;
  description?: string;
  fileUrl?: string;
  fileSizeMb?: number;
  uploadedBy: string;
  uploadedAt: string;
  trustScore: number; // 0.0 to 1.0
  verifiedBy?: string;
  createdAt: string;
}

export interface ClaimWithEvidence extends Claim {
  evidence: Evidence[];
  conflictingClaims?: Claim[];
  history?: Claim[];
}

// ============================================
// REVISIONS & AUDIT
// ============================================

export type EntityType = 'member' | 'story' | 'relationship' | 'claim' | 'evidence';

export interface Revision {
  id: string;
  familyId: string;
  entityType: EntityType;
  entityId: string;
  fieldName?: string;
  oldValue?: string;
  newValue?: string;
  changedBy: string;
  changedAt: string;
  changeReason?: string;
  canUndo: boolean;
  undoneBy?: string;
  undoneAt?: string;
  createdAt: string;
}

export interface AuditEntry extends Revision {
  changedByName?: string;
  undoneByName?: string;
}

// ============================================
// DUPLICATES & MERGES
// ============================================

export interface PotentialDuplicate {
  id: string;
  familyId: string;
  memberId1: string;
  memberId2: string;
  similarityScore: number; // 0.0 to 1.0
  nameMatch: boolean;
  parentMatch: boolean;
  spouseMatch: boolean;
  dateMatch: boolean;
  locationMatch: boolean;
  status: 'detected' | 'reviewing' | 'confirmed' | 'false_positive' | 'merged';
  detectedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  member1?: FamilyMemberWithFamily;
  member2?: FamilyMemberWithFamily;
}

export interface MergeOperation {
  id: string;
  familyId: string;
  memberIdPrimary: string;
  memberIdSecondary: string;
  mergedData: Record<string, any>;
  mergedBy: string;
  mergedAt: string;
  mergeReason?: string;
  status: 'active' | 'undone';
  undoneBy?: string;
  undoneAt?: string;
  createdAt: string;
}

// ============================================
// CULTURAL ATTRIBUTES
// ============================================

export interface AttributeType {
  id: string;
  familyId: string;
  name: string; // 'gotra', 'caste', 'religion', 'samaj', 'language'
  category: 'identity' | 'cultural' | 'linguistic';
  description?: string;
  createdAt: string;
}

export interface AttributeValue {
  id: string;
  attributeTypeId: string;
  value: string;
  description?: string;
  createdAt: string;
}

export interface MemberAttribute {
  id: string;
  memberId: string;
  attributeValueId: string;
  confidenceScore?: number;
  sourceType?: SourceType;
  claimedBy: string;
  createdAt: string;
  attributeType?: AttributeType;
  attributeValue?: AttributeValue;
}

// ============================================
// SENSITIVE INFORMATION
// ============================================

export interface SensitiveField {
  id: string;
  memberId: string;
  fieldName: string; // 'phone', 'email', 'address', 'medical', 'government_id'
  fieldValue: string; // ENCRYPTED
  visibilityScope: VisibilityScope;
  accessibleBy: string[]; // User IDs
  createdAt: string;
}

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
