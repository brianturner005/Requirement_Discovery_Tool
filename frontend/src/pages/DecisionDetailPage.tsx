import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Tag, Link2 } from 'lucide-react';
import { useState } from 'react';
import { useDecision, useDeleteDecision } from '../hooks/useDecisions';

const STATUS_COLORS: Record<string, string> = {
  Proposed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Accepted: 'bg-green-100 text-green-800 border-green-200',
  Superseded: 'bg-purple-100 text-purple-800 border-purple-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

export default function DecisionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: decision, isLoading } = useDecision(id ? Number(id) : null);
  const deleteMutation = useDeleteDecision();

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!decision) return <div className="p-6 text-gray-500">Decision not found.</div>;

  async function handleDelete() {
    await deleteMutation.mutateAsync(decision!.id);
    navigate('/decisions');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link to="/decisions" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Decisions
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[decision.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {decision.status}
              </span>
              {decision.decision_date && (
                <span className="text-xs text-gray-500">Decided: {decision.decision_date}</span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{decision.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/decisions/${decision.id}/edit`}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Pencil className="w-4 h-4" /> Edit
            </Link>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Description</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{decision.description}</p>
          </section>

          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Rationale</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{decision.rationale}</p>
          </section>

          {decision.alternatives_considered && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Alternatives Considered</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{decision.alternatives_considered}</p>
            </section>
          )}

          {decision.outcome && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Outcome</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{decision.outcome}</p>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Details</h2>
            <dl className="space-y-4">
              <Field label="Made By" value={decision.made_by?.name} />
              <Field label="System" value={decision.system?.name} />
              <Field label="Created" value={new Date(decision.created_at).toLocaleDateString()} />
              <Field label="Updated" value={new Date(decision.updated_at).toLocaleDateString()} />
            </dl>
          </section>

          {decision.tags.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {decision.tags.map(t => (
                  <span key={t.id} className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-200">
                    {t.name}
                  </span>
                ))}
              </div>
            </section>
          )}

          {decision.related_requirements.length > 0 && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Related Requirements
              </h2>
              <ul className="space-y-2">
                {decision.related_requirements.map(r => (
                  <li key={r.id}>
                    <Link to={`/requirements/${r.req_id}`} className="text-sm text-indigo-600 hover:underline">
                      {r.req_id}: {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Decision?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(false)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
