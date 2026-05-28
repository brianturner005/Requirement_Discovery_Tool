export interface StakeholderRef {
  id: number;
  name: string;
  email: string | null;
}

export interface SystemRef {
  id: number;
  name: string;
}

export interface TagRef {
  id: number;
  name: string;
}

export interface RelatedRequirement {
  id: number;
  req_id: string;
  title: string;
  status: string;
  priority: string;
}

export interface Evidence {
  id: number;
  requirement_id: number;
  filename: string;
  content_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export interface Requirement {
  id: number;
  req_id: string;
  title: string;
  description: string;
  source: string;
  stakeholder: StakeholderRef | null;
  system: SystemRef | null;
  priority: string;
  confidence: string;
  business_impact: string | null;
  technical_impact: string | null;
  status: string;
  notes: string | null;
  tags: TagRef[];
  related_requirements: RelatedRequirement[];
  evidence: Evidence[];
  created_at: string;
  updated_at: string;
}

export interface Stakeholder {
  id: number;
  name: string;
  email: string | null;
  role: string | null;
  department: string | null;
  created_at: string;
  updated_at: string;
}

export interface System {
  id: number;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: number;
  name: string;
}

export interface DashboardStats {
  total_requirements: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
  by_source: Record<string, number>;
  recent_requirements: Requirement[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface RequirementsFilters {
  q?: string;
  status?: string;
  priority?: string;
  source?: string;
  system_id?: number;
  stakeholder_id?: number;
  tag?: string;
  confidence?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

export interface RequirementCreatePayload {
  title: string;
  description: string;
  source: string;
  priority: string;
  confidence: string;
  status?: string;
  stakeholder_id?: number | null;
  system_id?: number | null;
  business_impact?: string | null;
  technical_impact?: string | null;
  notes?: string | null;
  tags?: string[];
}

export type RequirementUpdatePayload = Partial<RequirementCreatePayload>;

export interface StakeholderPayload {
  name: string;
  email?: string | null;
  role?: string | null;
  department?: string | null;
}

export interface SystemPayload {
  name: string;
  description?: string | null;
}
