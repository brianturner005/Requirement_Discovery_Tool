import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useDecisions, useDeleteDecision } from '../hooks/useDecisions';
import type { DecisionsFilters } from '../types';

const STATUS_OPTIONS = ['Proposed', 'Accepted', 'Superseded', 'Rejected'];

const STATUS_COLORS: Record<string, string> = {
  Proposed: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  Accepted: 'bg-green-100 text-green-800 border-green-200',
  Superseded: 'bg-purple-100 text-purple-800 border-purple-200',
  Rejected: 'bg-red-100 text-red-800 border-red-200',
};

type SortField = 'title' | 'status' | 'decision_date' | 'updated_at';

function SortIcon({ field, active, dir }: { field: string; active: string; dir: 'asc' | 'desc' }) {
  if (field !== active) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />;
  return dir === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />;
}

export default function DecisionsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);

  let searchTimeout: ReturnType<typeof setTimeout>;
  function handleSearch(v: string) {
    setSearch(v);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => { setDebouncedSearch(v); setPage(1); }, 400);
  }

  function handleSort(field: SortField) {
    if (field === sortBy) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortDir('asc'); }
    setPage(1);
  }

  const filters: DecisionsFilters = {
    q: debouncedSearch || undefined,
    status: status || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
    page,
    page_size: 25,
  };

  const { data, isLoading } = useDecisions(filters);
  const deleteMutation = useDeleteDecision();

  async function handleDelete(id: number) {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Decision Log</h1>
          <p className="text-sm text-gray-500 mt-1">Track architectural and design decisions</p>
        </div>
        <Link
          to="/decisions/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Decision
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search decisions..."
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
        />
        <select
          value={status}
          onChange={e => { setStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { label: 'Title', field: 'title' as SortField },
                { label: 'Status', field: 'status' as SortField },
                { label: 'Decision Date', field: 'decision_date' as SortField },
                { label: 'Made By', field: null },
                { label: 'Updated', field: 'updated_at' as SortField },
                { label: '', field: null },
              ].map(({ label, field }) => (
                <th
                  key={label}
                  className={`px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${field ? 'cursor-pointer hover:text-gray-700 select-none' : ''}`}
                  onClick={() => field && handleSort(field)}
                >
                  <div className="flex items-center gap-1">
                    {label}
                    {field && <SortIcon field={field} active={sortBy} dir={sortDir} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No decisions found</td></tr>
            ) : data.items.map(d => (
              <tr
                key={d.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/decisions/${d.id}`)}
              >
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{d.title}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[d.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{d.decision_date ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{d.made_by?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(d.updated_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(d.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>{data.total} total</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 border rounded disabled:opacity-40">Previous</button>
            <span className="px-3 py-1">Page {page} of {data.pages}</span>
            <button disabled={page >= data.pages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 border rounded disabled:opacity-40">Next</button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Decision?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
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
