import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Link2 } from 'lucide-react';
import { useDefect, useDeleteDefect } from '../hooks/useDefects';

const STATUS_COLORS: Record<string, string> = {
  Open: 'bg-red-100 text-red-800 border-red-200',
  'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Resolved: 'bg-green-100 text-green-800 border-green-200',
  Closed: 'bg-gray-100 text-gray-700 border-gray-200',
  "Won't Fix": 'bg-purple-100 text-purple-800 border-purple-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-800',
  High: 'bg-orange-100 text-orange-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Low: 'bg-blue-100 text-blue-800',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

export default function DefectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: defect, isLoading } = useDefect(id ? Number(id) : 0);
  const deleteMutation = useDeleteDefect();

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!defect) return <div className="p-6 text-gray-500">Defect not found.</div>;

  async function handleDelete() {
    await deleteMutation.mutateAsync(defect!.id);
    navigate('/defects');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/defects" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Defects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[defect.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                {defect.severity}
              </span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[defect.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {defect.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{defect.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/defects/${defect.id}/edit`}
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
        <div className="lg:col-span-2 space-y-6">
          {defect.description && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.description}</p>
            </section>
          )}
          {defect.steps_to_reproduce && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Steps to Reproduce</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.steps_to_reproduce}</p>
            </section>
          )}
          {defect.environment && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Environment</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.environment}</p>
            </section>
          )}
          {defect.resolution_notes && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Resolution Notes</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{defect.resolution_notes}</p>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Details</h2>
            <dl className="space-y-4">
              <Field label="Severity" value={defect.severity} />
              <Field label="Status" value={defect.status} />
              <Field label="System" value={defect.system?.name} />
              <Field label="Created" value={new Date(defect.created_at).toLocaleDateString()} />
              <Field label="Updated" value={new Date(defect.updated_at).toLocaleDateString()} />
            </dl>
          </section>

          {defect.requirement && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Linked Requirement
              </h2>
              <Link to={`/requirements/${defect.requirement.req_id}`} className="text-sm text-indigo-600 hover:underline">
                {defect.requirement.req_id}: {defect.requirement.title}
              </Link>
            </section>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Defect?</h3>
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
