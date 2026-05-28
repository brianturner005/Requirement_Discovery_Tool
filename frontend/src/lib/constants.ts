export const STATUS_OPTIONS = [
  'Draft',
  'Under Review',
  'Approved',
  'Rejected',
  'In Progress',
  'Completed',
  'Deferred',
] as const;

export const PRIORITY_OPTIONS = [
  'Critical',
  'High',
  'Medium',
  'Low',
] as const;

export const SOURCE_OPTIONS = [
  'SME Interview',
  'Existing Documentation',
  'Production Observation',
  'Legacy Code Analysis',
  'Operational Workflow',
  'Incident Investigation',
  'User Request',
  'Assumption',
  'Reverse Engineering',
] as const;

export const CONFIDENCE_OPTIONS = [
  'High',
  'Medium',
  'Low',
  'Unknown',
] as const;

export const STATUS_COLORS: Record<string, string> = {
  'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
  'Under Review': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Approved': 'bg-green-100 text-green-800 border-green-200',
  'Rejected': 'bg-red-100 text-red-800 border-red-200',
  'In Progress': 'bg-blue-100 text-blue-800 border-blue-200',
  'Completed': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Deferred': 'bg-purple-100 text-purple-800 border-purple-200',
};

export const PRIORITY_COLORS: Record<string, string> = {
  'Critical': 'bg-red-100 text-red-800 border-red-200',
  'High': 'bg-orange-100 text-orange-800 border-orange-200',
  'Medium': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'Low': 'bg-blue-100 text-blue-800 border-blue-200',
};

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  'Draft': ['Under Review'],
  'Under Review': ['Approved', 'Rejected', 'Draft'],
  'Approved': ['In Progress', 'Deferred'],
  'Rejected': ['Draft'],
  'In Progress': ['Completed', 'Deferred'],
  'Completed': [],
  'Deferred': ['Draft', 'Under Review'],
};
