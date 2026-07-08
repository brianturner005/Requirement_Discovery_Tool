import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { useLegacyBehaviors, useDeleteLegacyBehavior } from '../hooks/useLegacyBehaviors';
import type { LegacyBehaviorsFilters } from '../types';

const BEHAVIOR_TYPE_OPTIONS = ['Edge Case', 'Workaround', 'Undocumented Behavior', 'Known Bug', 'Manual Process'];
const STATUS_OPTIONS = ['Documented', 'Investigating', 'Addressed', 'Accepted Risk'];
const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low'];

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

type SortField = 'title' | 'status' | 'severity' | 'behavior_type' | 'updated_at';

function SortIcon({ field, active, dir }: { field: string; active: string; dir: 'asc' | 'desc' }) {
  if (field !== active) return <ChevronsUpDown className="w-3 h-3 text-gray-400" />;
  return dir === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />;
}

export default function LegacyBehaviorsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState('');
  const [behaviorType, setBehaviorType] = useState('');
  const [severity, setSeverity] = useState('');
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

  const filters: LegacyBehaviorsFilters = {
    q: debouncedSearch || undefined,
    status: status || undefined,
    behavior_type: behaviorType || undefined,
    severity: severity || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
    page,
    page_size: 25,
  };

  const { data, isLoading } = useLegacyBehaviors(filters);
  const deleteMutation = useDeleteLegacyBehavior();

  async function handleDelete(id: number) {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Legacy Behavior Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Document edge cases, workarounds, and undocumented behaviors</p>
        </div>
        <Link
          to="/legacy-behaviors/new"
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Behavior
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="text"
          placeholder="Search behaviors…"
          value={search}
          onChange={e => handleSearch(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
        />
        <select value={behaviorType} onChange={e => { setBehaviorType(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All types</option>
          {BEHAVIOR_TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={severity} onChange={e => { setSeverity(e.target.value); setPage(1); }} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All severities</option>
          {SEVERITY_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {[
                { label: 'Title', field: 'title' as SortField },
                { label: 'Type', field: 'behavior_type' as SortField },
                { label: 'Severity', field: 'severity' as SortField },
                { label: 'Status', field: 'status' as SortField },
                { label: 'System', field: null },
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
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            ) : !data?.items.length ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No behaviors found</td></tr>
            ) : data.items.map(b => (
              <tr key={b.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/legacy-behaviors/${b.id}`)}>
                <td className="px-4 py-3 font-medium text-gray-900 max-w-xs truncate">{b.title}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{b.behavior_type}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${SEVERITY_COLORS[b.severity] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.severity}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                    {b.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{b.system?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(b.updated_at).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={e => { e.stopPropagation(); setDeleteConfirm(b.id); }}
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

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Behavior?</h3>
            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleteMutation.isPending} className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
