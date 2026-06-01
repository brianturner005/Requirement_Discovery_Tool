import { useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Download,
  Upload,
  X,
  Plus,
  AlertCircle,
  FileText,
  Link2,
  ChevronRight,
} from 'lucide-react';
import {
  useRequirement,
  useTransitionStatus,
  useRemoveRelation,
  useAddRelation,
  useDeleteRequirement,
} from '../hooks/useRequirements';
import { uploadEvidence, deleteEvidence, getEvidenceDownloadUrl } from '../api/requirements';
import { useQueryClient } from '@tanstack/react-query';
import { requirementKeys } from '../hooks/useRequirements';
import StatusBadge from '../components/requirements/StatusBadge';
import PriorityBadge from '../components/requirements/PriorityBadge';
import { formatDate, formatRelativeTime, formatFileSize, getValidTransitions, cn } from '../lib/utils';

const STATUS_TRANSITION_BUTTON_COLORS: Record<string, string> = {
  'Under Review': 'bg-yellow-500 hover:bg-yellow-600 text-white',
  Approved: 'bg-green-600 hover:bg-green-700 text-white',
  Rejected: 'bg-red-600 hover:bg-red-700 text-white',
  'In Progress': 'bg-blue-600 hover:bg-blue-700 text-white',
  Completed: 'bg-emerald-600 hover:bg-emerald-700 text-white',
  Deferred: 'bg-purple-600 hover:bg-purple-700 text-white',
  Draft: 'bg-slate-500 hover:bg-slate-600 text-white',
};

interface FieldProps {
  label: string;
  children: React.ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <div>
      <dt className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">{label}</dt>
      <dd className="text-sm text-slate-100">{children}</dd>
    </div>
  );
}

export default function RequirementDetailPage() {
  const { reqId } = useParams<{ reqId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: requirement, isLoading, isError } = useRequirement(reqId ?? '');
  const transitionMutation = useTransitionStatus();
  const removeRelationMutation = useRemoveRelation();
  const addRelationMutation = useAddRelation();
  const deleteReqMutation = useDeleteRequirement();

  const [uploadingEvidence, setUploadingEvidence] = useState(false);
  const [evidenceError, setEvidenceError] = useState<string | null>(null);
  const [deleteEvidenceId, setDeleteEvidenceId] = useState<number | null>(null);
  const [deletingEvidenceId, setDeletingEvidenceId] = useState<number | null>(null);
  const [addRelationInput, setAddRelationInput] = useState('');
  const [addRelationError, setAddRelationError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (isError || !requirement) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-300">Requirement not found.</p>
          <Link to="/requirements" className="text-sm text-indigo-600 hover:underline mt-2 inline-block">
            Back to list
          </Link>
        </div>
      </div>
    );
  }

  const validTransitions = getValidTransitions(requirement.status);

  const handleTransition = async (newStatus: string) => {
    await transitionMutation.mutateAsync({ reqId: requirement.req_id, status: newStatus });
  };

  const handleEvidenceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingEvidence(true);
    setEvidenceError(null);
    try {
      await uploadEvidence(requirement.req_id, file);
      await queryClient.invalidateQueries({
        queryKey: requirementKeys.detail(requirement.req_id),
      });
    } catch (err) {
      setEvidenceError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingEvidence(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteEvidence = async (evidenceId: number) => {
    setDeletingEvidenceId(evidenceId);
    try {
      await deleteEvidence(evidenceId);
      await queryClient.invalidateQueries({
        queryKey: requirementKeys.detail(requirement.req_id),
      });
    } finally {
      setDeletingEvidenceId(null);
      setDeleteEvidenceId(null);
    }
  };

  const handleAddRelation = async () => {
    if (!addRelationInput.trim()) return;
    setAddRelationError(null);
    try {
      await addRelationMutation.mutateAsync({
        reqId: requirement.req_id,
        targetReqId: addRelationInput.trim(),
      });
      setAddRelationInput('');
    } catch (err) {
      setAddRelationError(err instanceof Error ? err.message : 'Failed to add relation');
    }
  };

  const handleDeleteReq = async () => {
    await deleteReqMutation.mutateAsync(requirement.req_id);
    navigate('/requirements');
  };

  return (
    <div className="p-8 space-y-6 max-w-5xl">
      {/* Breadcrumb + Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link to="/requirements" className="hover:text-indigo-600 flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" />
            Requirements
          </Link>
          <ChevronRight className="w-3 h-3" />
          <span className="font-mono font-medium text-slate-200">{requirement.req_id}</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/requirements/${requirement.req_id}/edit`}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-200 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors shadow-sm"
          >
            <Edit className="w-3.5 h-3.5" />
            Edit
          </Link>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-slate-800 border border-red-700 rounded-lg hover:bg-red-500/20 transition-colors shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Title + Status */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-mono text-sm text-indigo-600 font-semibold">{requirement.req_id}</span>
            </div>
            <h1 className="text-xl font-bold text-slate-50 leading-snug">{requirement.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={requirement.status} />
            <PriorityBadge priority={requirement.priority} />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Description</p>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
            {requirement.description}
          </p>
        </div>

        {/* Status Workflow */}
        {validTransitions.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-3">
              Workflow Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {validTransitions.map((target) => (
                <button
                  key={target}
                  onClick={() => handleTransition(target)}
                  disabled={transitionMutation.isPending}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50',
                    STATUS_TRANSITION_BUTTON_COLORS[target] ?? 'bg-slate-500 hover:bg-slate-600 text-white'
                  )}
                >
                  {transitionMutation.isPending ? 'Updating...' : `→ ${target}`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Details Grid */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-100 mb-4">Details</h2>
        <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-5">
          <Field label="Source">{requirement.source}</Field>
          <Field label="Confidence">
            <span className="capitalize">{requirement.confidence}</span>
          </Field>
          <Field label="Stakeholder">
            {requirement.stakeholder ? (
              <span>{requirement.stakeholder.name}</span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </Field>
          <Field label="System">
            {requirement.system ? (
              <span>{requirement.system.name}</span>
            ) : (
              <span className="text-slate-300">—</span>
            )}
          </Field>
          <Field label="Created">{formatDate(requirement.created_at)}</Field>
          <Field label="Updated">{formatRelativeTime(requirement.updated_at)}</Field>

          {requirement.business_impact && (
            <div className="col-span-2 sm:col-span-3">
              <Field label="Business Impact">{requirement.business_impact}</Field>
            </div>
          )}
          {requirement.technical_impact && (
            <div className="col-span-2 sm:col-span-3">
              <Field label="Technical Impact">{requirement.technical_impact}</Field>
            </div>
          )}
          {requirement.notes && (
            <div className="col-span-2 sm:col-span-3">
              <Field label="Notes">
                <span className="whitespace-pre-wrap">{requirement.notes}</span>
              </Field>
            </div>
          )}
        </dl>

        {/* Tags */}
        {requirement.tags.length > 0 && (
          <div className="mt-5 pt-4 border-t border-slate-700">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Tags</p>
            <div className="flex flex-wrap gap-1.5">
              {requirement.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="px-2 py-0.5 bg-indigo-500/20 text-indigo-700 text-xs rounded-full font-medium border border-indigo-100"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Related Requirements */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6">
        <h2 className="text-sm font-semibold text-slate-100 mb-4 flex items-center gap-2">
          <Link2 className="w-4 h-4 text-slate-400" />
          Related Requirements
          <span className="text-xs font-normal text-slate-400">
            ({requirement.related_requirements.length})
          </span>
        </h2>

        {requirement.related_requirements.length > 0 ? (
          <div className="space-y-2 mb-4">
            {requirement.related_requirements.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Link
                    to={`/requirements/${rel.req_id}`}
                    className="font-mono text-xs text-indigo-600 hover:text-indigo-800 font-semibold flex-shrink-0"
                  >
                    {rel.req_id}
                  </Link>
                  <span className="text-sm text-slate-200 truncate">{rel.title}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                  <StatusBadge status={rel.status} />
                  <button
                    onClick={() =>
                      removeRelationMutation.mutate({
                        reqId: requirement.req_id,
                        targetReqId: rel.req_id,
                      })
                    }
                    disabled={removeRelationMutation.isPending}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                    title="Remove relation"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400 mb-4">No related requirements.</p>
        )}

        {/* Add relation */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Enter REQ-XXX ID..."
            value={addRelationInput}
            onChange={(e) => setAddRelationInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddRelation()}
            className="flex-1 px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-900 text-slate-100 placeholder:text-slate-500"
          />
          <button
            onClick={handleAddRelation}
            disabled={addRelationMutation.isPending || !addRelationInput.trim()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
        {addRelationError && (
          <p className="text-xs text-red-500 mt-2">{addRelationError}</p>
        )}
      </div>

      {/* Evidence */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-400" />
            Evidence Files
            <span className="text-xs font-normal text-slate-400">
              ({requirement.evidence.length})
            </span>
          </h2>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingEvidence}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50"
          >
            <Upload className="w-3 h-3" />
            {uploadingEvidence ? 'Uploading...' : 'Upload File'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleEvidenceUpload}
          />
        </div>

        {evidenceError && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-700 rounded-lg text-xs text-red-600">
            {evidenceError}
          </div>
        )}

        {requirement.evidence.length === 0 ? (
          <p className="text-sm text-slate-400">No evidence files uploaded.</p>
        ) : (
          <div className="space-y-2">
            {requirement.evidence.map((ev) => (
              <div
                key={ev.id}
                className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">{ev.filename}</p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(ev.file_size)} · {formatRelativeTime(ev.uploaded_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0 ml-3">
                  <a
                    href={getEvidenceDownloadUrl(ev.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/20 rounded transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                  <button
                    onClick={() => setDeleteEvidenceId(ev.id)}
                    disabled={deletingEvidenceId === ev.id}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Evidence Confirm */}
      {deleteEvidenceId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-slate-50 mb-2">Delete Evidence File</h3>
            <p className="text-sm text-slate-500 mb-5">
              Are you sure you want to delete this file? This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteEvidenceId(null)}
                className="px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteEvidence(deleteEvidenceId)}
                disabled={deletingEvidenceId !== null}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deletingEvidenceId !== null ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Requirement Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50">Delete Requirement</h3>
                <p className="text-sm text-slate-500">
                  Delete <span className="font-mono font-medium">{requirement.req_id}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteReq}
                disabled={deleteReqMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteReqMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
