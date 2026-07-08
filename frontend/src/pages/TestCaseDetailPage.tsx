import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2, Link2 } from 'lucide-react';
import { useTestCase, useDeleteTestCase } from '../hooks/useTestCases';

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-700 border-gray-200',
  Ready: 'bg-blue-100 text-blue-800 border-blue-200',
  Passed: 'bg-green-100 text-green-800 border-green-200',
  Failed: 'bg-red-100 text-red-800 border-red-200',
  Blocked: 'bg-orange-100 text-orange-800 border-orange-200',
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value ?? <span className="text-gray-400">—</span>}</dd>
    </div>
  );
}

export default function TestCaseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const { data: tc, isLoading } = useTestCase(id ? Number(id) : 0);
  const deleteMutation = useDeleteTestCase();

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>;
  if (!tc) return <div className="p-6 text-gray-500">Test case not found.</div>;

  async function handleDelete() {
    await deleteMutation.mutateAsync(tc!.id);
    navigate('/test-cases');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <Link to="/test-cases" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Test Cases
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[tc.status] ?? 'bg-gray-100 text-gray-600'}`}>
                {tc.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mt-2">{tc.title}</h1>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              to={`/test-cases/${tc.id}/edit`}
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
          {tc.description && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Description</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{tc.description}</p>
            </section>
          )}
          {tc.preconditions && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Preconditions</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{tc.preconditions}</p>
            </section>
          )}
          {tc.steps && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Test Steps</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{tc.steps}</p>
            </section>
          )}
          {tc.expected_result && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Expected Result</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{tc.expected_result}</p>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-4">Details</h2>
            <dl className="space-y-4">
              <Field label="Status" value={tc.status} />
              <Field label="Created" value={new Date(tc.created_at).toLocaleDateString()} />
              <Field label="Updated" value={new Date(tc.updated_at).toLocaleDateString()} />
            </dl>
          </section>

          {tc.requirement && (
            <section className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Link2 className="w-4 h-4" /> Linked Requirement
              </h2>
              <Link to={`/requirements/${tc.requirement.req_id}`} className="text-sm text-indigo-600 hover:underline">
                {tc.requirement.req_id}: {tc.requirement.title}
              </Link>
            </section>
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Test Case?</h3>
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
