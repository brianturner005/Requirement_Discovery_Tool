import { useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Trash2,
  Eye,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { useRequirements, useDeleteRequirement, useBulkTransitionStatus } from '../hooks/useRequirements';
import StatusBadge from '../components/requirements/StatusBadge';
import PriorityBadge from '../components/requirements/PriorityBadge';
import { formatRelativeTime } from '../lib/utils';
import { STATUS_OPTIONS, PRIORITY_OPTIONS, SOURCE_OPTIONS } from '../lib/constants';
import type { RequirementsFilters } from '../types';
import apiClient from '../api/client';

type SortField = 'req_id' | 'title' | 'status' | 'priority' | 'source' | 'updated_at';

function SortIcon({ field, sortBy, sortDir }: { field: string; sortBy: string; sortDir: string }) {
  if (sortBy !== field) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400" />;
  return sortDir === 'asc'
    ? <ChevronUp className="w-3.5 h-3.5 text-indigo-600" />
    : <ChevronDown className="w-3.5 h-3.5 text-indigo-600" />;
}

export default function RequirementsListPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [source, setSource] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('updated_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ created: string[]; errors: string[] } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkError, setBulkError] = useState('');

  const filters: RequirementsFilters = {
    q: debouncedSearch || undefined,
    status: status || undefined,
    priority: priority || undefined,
    source: source || undefined,
    sort_by: sortBy,
    sort_dir: sortDir,
    page,
    page_size: 20,
  };

  const { data, isLoading, isError } = useRequirements(filters);
  const deleteMutation = useDeleteRequirement();
  const bulkMutation = useBulkTransitionStatus();

  const handleSearch = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimeout) clearTimeout(searchTimeout);
      const t = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      setSearchTimeout(t);
    },
    [searchTimeout]
  );

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('asc');
    }
    setPage(1);
  };

  const handleFilterChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setter(e.target.value);
    setPage(1);
  };

  const handleDelete = async (reqId: string) => {
    await deleteMutation.mutateAsync(reqId);
    setDeleteConfirm(null);
  };

  const buildExportParams = () => {
    const params = new URLSearchParams();
    if (debouncedSearch) params.set('q', debouncedSearch);
    if (status) params.set('status', status);
    if (priority) params.set('priority', priority);
    if (source) params.set('source', source);
    return params.toString();
  };

  const handleExport = async (format: 'csv' | 'xlsx' | 'docx' | 'pdf') => {
    const qs = buildExportParams();
    const endpoints: Record<string, string> = {
      csv: `/requirements/export`,
      xlsx: `/requirements/export/xlsx`,
      docx: `/requirements/export/docx`,
      pdf: `/requirements/export/pdf`,
    };
    const exts: Record<string, string> = { csv: 'csv', xlsx: 'xlsx', docx: 'docx', pdf: 'pdf' };
    const url = `${endpoints[format]}${qs ? `?${qs}` : ''}`;
    const { data } = await apiClient.get(url, { responseType: 'blob' });
    const blobUrl = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `requirements-${new Date().toISOString().slice(0, 10)}.${exts[format]}`;
    a.click();
    URL.revokeObjectURL(blobUrl);
  };

  const toggleSelect = (reqId: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(reqId)) next.delete(reqId); else next.add(reqId);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === requirements.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(requirements.map(r => r.req_id)));
    }
  };

  const handleBulkStatus = async () => {
    if (!bulkStatus || selected.size === 0) return;
    setBulkError('');
    try {
      await bulkMutation.mutateAsync({ reqIds: Array.from(selected), status: bulkStatus });
      setSelected(new Set());
      setBulkStatus('');
    } catch (err: unknown) {
      setBulkError((err as any)?.response?.data?.detail ?? 'Some transitions failed');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await apiClient.post('/requirements/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setImportResult(data);
      if (importRef.current) importRef.current.value = '';
    } catch (err: unknown) {
      const detail = (err as any)?.response?.data?.detail ?? 'Import failed';
      setImportResult({ created: [], errors: [detail] });
    }
  };

  const requirements = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Requirements</h1>
          <p className="text-slate-500 mt-1">
            {total > 0 ? `${total} requirement${total !== 1 ? 's' : ''}` : 'No requirements yet'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport('csv')}
            title="Export CSV"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={() => handleExport('xlsx')}
            title="Export Excel"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </button>
          <button
            onClick={() => handleExport('docx')}
            title="Export Word Document"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            Word
          </button>
          <button
            onClick={() => handleExport('pdf')}
            title="Export PDF"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <FileText className="w-4 h-4" />
            PDF
          </button>
          <label
            title="Import CSV or Excel"
            className="inline-flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm cursor-pointer"
          >
            <Upload className="w-4 h-4" />
            Import
            <input ref={importRef} type="file" accept=".csv,.xlsx" className="sr-only" onChange={handleImport} />
          </label>
          <Link
            to="/requirements/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Requirement
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm p-4">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search requirements..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-900 text-slate-100 placeholder:text-slate-500"
            />
          </div>

          {/* Status filter */}
          <select
            value={status}
            onChange={handleFilterChange(setStatus)}
            className="px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-200"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={handleFilterChange(setPriority)}
            className="px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-200"
          >
            <option value="">All Priorities</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          {/* Source filter */}
          <select
            value={source}
            onChange={handleFilterChange(setSource)}
            className="px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-800 text-slate-200"
          >
            <option value="">All Sources</option>
            {SOURCE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-indigo-600/10 border border-indigo-500/30 rounded-xl">
          <span className="text-sm text-indigo-300 font-medium">{selected.size} selected</span>
          <div className="flex items-center gap-2 ml-auto">
            {bulkError && <span className="text-xs text-red-400">{bulkError}</span>}
            <select
              value={bulkStatus}
              onChange={e => setBulkStatus(e.target.value)}
              className="px-3 py-1.5 text-sm border border-slate-600 rounded-lg bg-slate-800 text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Change status to…</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <button
              onClick={handleBulkStatus}
              disabled={!bulkStatus || bulkMutation.isPending}
              className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 font-medium"
            >
              {bulkMutation.isPending ? 'Updating…' : 'Apply'}
            </button>
            <button onClick={() => setSelected(new Set())} className="px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200">
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-48 gap-3 text-red-500">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">Failed to load requirements.</span>
          </div>
        ) : requirements.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <p className="text-sm">No requirements found.</p>
            {(search || status || priority || source) && (
              <p className="text-xs mt-1">Try adjusting your filters.</p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="px-4 py-3 w-10">
                    <input
                      type="checkbox"
                      checked={requirements.length > 0 && selected.size === requirements.length}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  {(
                    [
                      { field: 'req_id' as SortField, label: 'ID' },
                      { field: 'title' as SortField, label: 'Title' },
                      { field: 'status' as SortField, label: 'Status' },
                      { field: 'priority' as SortField, label: 'Priority' },
                      { field: 'source' as SortField, label: 'Source' },
                    ] as { field: SortField; label: string }[]
                  ).map(({ field, label }) => (
                    <th
                      key={field}
                      className="text-left px-4 py-3 font-medium text-slate-500 cursor-pointer select-none hover:text-slate-200"
                      onClick={() => handleSort(field)}
                    >
                      <span className="inline-flex items-center gap-1">
                        {label}
                        <SortIcon field={field} sortBy={sortBy} sortDir={sortDir} />
                      </span>
                    </th>
                  ))}
                  <th className="text-left px-4 py-3 font-medium text-slate-500">System</th>
                  <th
                    className="text-left px-4 py-3 font-medium text-slate-500 cursor-pointer select-none hover:text-slate-200"
                    onClick={() => handleSort('updated_at')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Updated
                      <SortIcon field="updated_at" sortBy={sortBy} sortDir={sortDir} />
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {requirements.map((req) => (
                  <tr key={req.id} className={`hover:bg-slate-700 transition-colors group ${selected.has(req.req_id) ? 'bg-indigo-600/5' : ''}`}>
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={selected.has(req.req_id)}
                        onChange={() => toggleSelect(req.req_id)}
                        className="rounded border-slate-600 bg-slate-700 text-indigo-600 focus:ring-indigo-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        to={`/requirements/${req.req_id}`}
                        className="font-mono text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        {req.req_id}
                      </Link>
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <Link
                        to={`/requirements/${req.req_id}`}
                        className="text-slate-100 hover:text-indigo-700 font-medium line-clamp-1"
                      >
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-4 py-3">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{req.source}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">
                      {req.system?.name ?? <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {formatRelativeTime(req.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/requirements/${req.req_id}`)}
                          title="View"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-500/20 rounded transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(req.req_id)}
                          title="Delete"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-500/20 rounded transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Page {page} of {pages} ({total} total)
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded text-slate-500 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(pages - 4, page - 2)) + i;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-7 h-7 text-xs rounded font-medium transition-colors ${
                      page === pageNum
                        ? 'bg-indigo-600 text-white'
                        : 'text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-1.5 rounded text-slate-500 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Result Modal */}
      {importResult && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full">
            <h3 className="font-semibold text-slate-50 mb-3">Import Complete</h3>
            {importResult.created.length > 0 && (
              <p className="text-sm text-green-400 mb-2">{importResult.created.length} requirement{importResult.created.length !== 1 ? 's' : ''} created: {importResult.created.join(', ')}</p>
            )}
            {importResult.errors.length > 0 && (
              <div className="text-sm text-red-400 mb-2">
                <p className="font-medium mb-1">{importResult.errors.length} error{importResult.errors.length !== 1 ? 's' : ''}:</p>
                <ul className="list-disc list-inside space-y-1 max-h-40 overflow-y-auto">
                  {importResult.errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <button onClick={() => setImportResult(null)} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-50">Delete Requirement</h3>
                <p className="text-sm text-slate-500">
                  Are you sure you want to delete <span className="font-mono font-medium">{deleteConfirm}</span>? This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
