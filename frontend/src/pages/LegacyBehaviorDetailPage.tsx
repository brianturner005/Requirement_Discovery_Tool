import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useLegacyBehavior, useDeleteLegacyBehavior } from '../hooks/useLegacyBehaviors';

const STATUS_COLORS: Record<string, string> = {
  Documented: 'bg-blue-100 text-blue-800 border-blue-200',
  Investigating: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Addressed: 'bg-green-100 text-green-800 border-green-200',
  'Accepted Risk': 'bg-purple-100 text-purple-800 border-purple-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800 border-red-200',
  High: 'bg-orange-100 text-orange-800 border-orange-200',
  Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Low: 'bg-blue-100 text-blue-800 border-blue-200',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

function TextBlock({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">{label}</h2>
      <p className="text-sm text-gray-700 whitespace-pre-wrap">{value}</p>
    </section>
  );
}

export default function LegacyBehaviorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: behavior, isLoading } = useLegacyBehavior(id ? Number(id) : null);
  const deleteMutation = useDeleteLegacyBehavior();

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!behavior) return <div className="p-6 text-gray-500">Behavior not found.</div>;

  async function handleDelete() {
    await deleteMutation.mutateAsync(behavior!.id);
    navigate('/legacy-behaviors');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/legacy-behaviors" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Legacy Behaviors
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">{behavior.behavior_type}</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[behavior.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                {behavior.severity}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[behavior.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {behavior.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{behavior.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link to={`/legacy-behaviors/${behavior.id}/edit`} className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <button onClick={() => setDeleteConfirm(true)} className="flex items-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50">
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{behavior.description}</p>
          </section>

          <TextBlock label="Steps to Reproduce" value={behavior.steps_to_reproduce} />
          <TextBlock label="Expected Behavior" value={behavior.expected_behavior} />
          <TextBlock label="Actual Behavior" value={behavior.actual_behavior} />
        </div>

        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Details</h2>
            <dl className="space-y-4">
              <Field label="System" value={behavior.system?.name} />
              {behavior.related_requirement && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Related Requirement</dt>
                  <dd>
                    <Link to={`/requirements/${behavior.related_requirement.req_id}`} className="text-sm text-indigo-600 hover:underline">
                      {behavior.related_requirement.req_id}: {behavior.related_requirement.title}
                    </Link>
                  </dd>
                </div>
              )}
              <Field label="Created" value={new Date(behavior.created_at).toLocaleDateString()} />
              <Field label="Updated" value={new Date(behavior.updated_at).toLocaleDateString()} />
            </dl>
          </section>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Behavior?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={handleDelete} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
