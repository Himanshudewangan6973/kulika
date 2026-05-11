export type TreeDirection = 'TB' | 'BT' | 'LR' | 'RL';

export interface FamilyMember {
  id: string;
  firstName: string;
  lastName: string;
  nickname?: string | null;
  birthDate?: string | null;
  dateOfBirth?: string | null;
  dateOfDeath?: string | null;
  avatarUrl?: string | null;
  parent1Id?: string | null;
  parent2Id?: string | null;
  spouseIds: string[];
  generation: number;
  children_count?: number;
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
