import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useSystems, useCreateSystem, useUpdateSystem, useDeleteSystem } from '../hooks/useSystems';
import { formatDate } from '../lib/utils';
import type { System } from '../types';

interface SystemForm {
  name: string;
  description: string;
  system_type: string;
}

const EMPTY_FORM: SystemForm = { name: '', description: '', system_type: '' };

export default function SystemsPage() {
  const { data: systems, isLoading } = useSystems();
  const createMutation = useCreateSystem();
  const updateMutation = useUpdateSystem();
  const deleteMutation = useDeleteSystem();

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<System | null>(null);
  const [form, setForm] = useState<SystemForm>(EMPTY_FORM);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [error, setError] = useState('');

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (s: System) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description ?? '', system_type: '' });
    setError('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
      };
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      setShowForm(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save';
      setError(msg);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteMutation.mutateAsync(id);
      setDeleteConfirm(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Cannot delete system';
      alert(msg);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Systems</h1>
          <p className="text-slate-500 mt-1 text-sm">{systems?.length ?? 0} system{(systems?.length ?? 0) !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add System
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : !systems || systems.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-slate-400 text-sm mb-2">No systems yet.</p>
            <button onClick={openCreate} className="text-indigo-600 text-sm hover:underline">Add your first system</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Description</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500">Added</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {systems.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-700">
                    <td className="px-4 py-3 font-medium text-slate-100">{s.name}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-sm">
                      <span className="line-clamp-2">{s.description ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{formatDate(s.created_at)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteConfirm(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-500/20 rounded transition-colors">
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
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-50">{editing ? 'Edit System' : 'Add System'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1 text-slate-400 hover:text-slate-300 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
            {error && <p className="text-sm text-red-600 mb-3 bg-red-500/20 px-3 py-2 rounded">{error}</p>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-900 text-slate-100 placeholder:text-slate-500" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full px-3 py-2 text-sm border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-slate-900 text-slate-100 placeholder:text-slate-500" />
              </div>
              <div className="flex gap-3 pt-2 justify-end">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700">Cancel</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-60">
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editing ? 'Save Changes' : 'Add System'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-base font-semibold text-slate-50 mb-2">Delete System</h3>
            <p className="text-sm text-slate-300 mb-4">This cannot be undone. Requirements linked to this system will be unlinked.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm text-slate-300 border border-slate-700 rounded-lg hover:bg-slate-700">Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-60">
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
