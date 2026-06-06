export type TreeDirection = 'TB' | 'BT' | 'LR' | 'RL';
export type LineageType = 'biological' | 'adopted' | 'step' | 'foster';

export interface FamilyMember {
  id: string;
  full_name: string;
  given_name?: string | null;
  middle_names?: string | null;
  surname?: string | null;
  preferred_display_name?: string | null;
  native_name?: string | null;
  gender?: 'Male' | 'Female' | 'Other' | null;

  // Advanced Performance & Relationship Modeling
  ancestor_ids?: string[]; // Materialized path for O(1) relationship checks
  lineage_type_p1?: LineageType;
  lineage_type_p2?: LineageType;

  community_id?: string | null;
  community_override?: string | null;
  name_notes?: string | null;
  bio?: string | null;
  birthDate?: string | null;
  dateOfBirth?: string | null;
  dateOfDeath?: string | null;
  avatarUrl?: string | null;
  profilePhotoUrl?: string | null;
  firstName?: string;
  lastName?: string;
  nickname?: string;
  parent1Id?: string | null;
  parent2Id?: string | null;
  spouseIds: string[];
  generation: number;
  children_count?: number;
  media_count?: number;
  stories_count?: number;
  status?: string;
  is_deceased?: boolean;
  visibility_scope?: 'public' | 'protected' | 'private';
  isTemporary?: boolean;
  isLocalPreview?: boolean;
}

export interface Point {
  x: number;
  y: number;
}

export interface LayoutNode extends Point {
  id: string;
  width: number;
  height: number;
  data: FamilyMember;
  collapsed: boolean;
  visible: boolean;
}

export type EdgeStyle = 'straight' | 'bezier' | 'orthogonal' | 'custom';

export interface BendPoint extends Point {
  id: string;
}

export type RelationshipType = 
  | 'parent' 
  | 'spouse' 
  | 'sibling' 
  | 'unknown' 
  | 'step-parent' 
  | 'adoptive-parent' 
  | 'guardian' 
  | 'foster' 
  | 'in-law' 
  | 'custom';

export interface LayoutEdge {
  id: string;
  sourceId: string;
  targetId: string;
  source: Point;
  target: Point;
  type: RelationshipType;
  style?: EdgeStyle;
  bendPoints: BendPoint[];
  notes?: string;
  customDescription?: string;
  isPending?: boolean;
}

export interface ViewportState {
  x: number;
  y: number;
  zoom: number;
}
