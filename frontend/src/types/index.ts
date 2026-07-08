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

// ── Audit Log ────────────────────────────────────────────────────────────────

export interface UserSummary {
  id: number;
  full_name: string;
  email: string;
}

export interface AuditLogEntry {
  id: number;
  requirement_id: number;
  changed_by: UserSummary | null;
  from_status: string | null;
  to_status: string;
  changed_at: string;
}

// ── Decision Log ─────────────────────────────────────────────────────────────

export interface StakeholderSummary {
  id: number;
  name: string;
}

export interface SystemSummary {
  id: number;
  name: string;
}

export interface RequirementSummary {
  id: number;
  req_id: string;
  title: string;
}

export interface Decision {
  id: number;
  title: string;
  description: string;
  status: string;
  decision_date: string | null;
  rationale: string;
  alternatives_considered: string | null;
  outcome: string | null;
  made_by: StakeholderSummary | null;
  system: SystemSummary | null;
  tags: TagRef[];
  related_requirements: RequirementSummary[];
  created_at: string;
  updated_at: string;
}

export interface DecisionCreatePayload {
  title: string;
  description: string;
  rationale: string;
  status?: string;
  decision_date?: string | null;
  alternatives_considered?: string | null;
  outcome?: string | null;
  made_by_id?: number | null;
  system_id?: number | null;
  tag_names?: string[];
  related_requirement_ids?: number[];
}

export type DecisionUpdatePayload = Partial<DecisionCreatePayload>;

export interface DecisionsFilters {
  q?: string;
  status?: string;
  system_id?: number;
  tag?: string;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ── Assumptions & Unknowns ───────────────────────────────────────────────────

export interface Assumption {
  id: number;
  title: string;
  description: string;
  category: string;
  status: string;
  priority: string;
  owner: StakeholderSummary | null;
  related_requirement: RequirementSummary | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssumptionCreatePayload {
  title: string;
  description: string;
  category: string;
  status?: string;
  priority?: string;
  owner_id?: number | null;
  related_requirement_id?: number | null;
  resolution_notes?: string | null;
}

export type AssumptionUpdatePayload = Partial<AssumptionCreatePayload>;

export interface AssumptionsFilters {
  q?: string;
  category?: string;
  status?: string;
  priority?: string;
  owner_id?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ── Legacy Behavior Catalog ──────────────────────────────────────────────────

export interface LegacyBehavior {
  id: number;
  title: string;
  description: string;
  behavior_type: string;
  severity: string;
  status: string;
  system: SystemSummary | null;
  related_requirement: RequirementSummary | null;
  steps_to_reproduce: string | null;
  expected_behavior: string | null;
  actual_behavior: string | null;
  created_at: string;
  updated_at: string;
}

export interface LegacyBehaviorCreatePayload {
  title: string;
  description: string;
  behavior_type: string;
  severity?: string;
  status?: string;
  system_id?: number | null;
  related_requirement_id?: number | null;
  steps_to_reproduce?: string | null;
  expected_behavior?: string | null;
  actual_behavior?: string | null;
}

export type LegacyBehaviorUpdatePayload = Partial<LegacyBehaviorCreatePayload>;

export interface LegacyBehaviorsFilters {
  q?: string;
  behavior_type?: string;
  status?: string;
  severity?: string;
  system_id?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ── Test Cases ────────────────────────────────────────────────────────────────

export interface TestCase {
  id: number;
  title: string;
  description: string | null;
  preconditions: string | null;
  steps: string | null;
  expected_result: string | null;
  status: string;
  requirement_id: number | null;
  requirement: RequirementSummary | null;
  created_at: string;
  updated_at: string;
}

export interface TestCaseCreatePayload {
  title: string;
  description?: string | null;
  preconditions?: string | null;
  steps?: string | null;
  expected_result?: string | null;
  status?: string;
  requirement_id?: number | null;
}

export type TestCaseUpdatePayload = Partial<TestCaseCreatePayload>;

export interface TestCasesFilters {
  q?: string;
  status?: string[];
  requirement_id?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ── Defects ───────────────────────────────────────────────────────────────────

export interface Defect {
  id: number;
  title: string;
  description: string | null;
  severity: string;
  status: string;
  requirement_id: number | null;
  requirement: RequirementSummary | null;
  system_id: number | null;
  system: SystemSummary | null;
  steps_to_reproduce: string | null;
  environment: string | null;
  resolution_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DefectCreatePayload {
  title: string;
  description?: string | null;
  severity?: string;
  status?: string;
  requirement_id?: number | null;
  system_id?: number | null;
  steps_to_reproduce?: string | null;
  environment?: string | null;
  resolution_notes?: string | null;
}

export type DefectUpdatePayload = Partial<DefectCreatePayload>;

export interface DefectsFilters {
  q?: string;
  status?: string[];
  severity?: string[];
  requirement_id?: number;
  system_id?: number[];
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// ── System Dependency ─────────────────────────────────────────────────────────

export interface SystemDependency {
  id: number;
  source_system_id: number;
  target_system_id: number;
  source_system: SystemRef;
  target_system: SystemRef;
  dependency_type: string;
  notes: string | null;
  created_at: string;
}

export interface SystemDependencyCreatePayload {
  source_system_id: number;
  target_system_id: number;
  dependency_type: string;
  notes?: string | null;
}

export type SystemDependencyUpdatePayload = Partial<SystemDependencyCreatePayload>;

// ── Comments ──────────────────────────────────────────────────────────────────

export interface RequirementComment {
  id: number;
  requirement_id: number;
  author: UserSummary | null;
  body: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

// ── Versions ──────────────────────────────────────────────────────────────────

export interface RequirementVersion {
  id: number;
  requirement_id: number;
  changed_by: UserSummary | null;
  version_num: number;
  snapshot: Record<string, unknown>;
  changed_at: string;
}

// ── AI Analysis ───────────────────────────────────────────────────────────────

export interface AIAnalysisResult {
  summary: string;
  risks: string[];
  suggestions: string[];
  duplicate_candidates: string[];
}

export interface AIRiskFlag {
  req_id: string;
  risk_level: 'High' | 'Medium' | 'Low';
  reason: string;
}
