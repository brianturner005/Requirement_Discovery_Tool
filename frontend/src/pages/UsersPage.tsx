import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserCog, Shield, User as UserIcon, Ban, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

interface UserRecord {
  id: number;
  email: string;
  full_name: string;
  role: 'admin' | 'analyst';
  is_active: boolean;
  created_at: string;
}

function RoleBadge({ role }: { role: string }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
      <Shield className="w-3 h-3" />
      Admin
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-slate-700 text-slate-400 border border-slate-600">
      <UserIcon className="w-3 h-3" />
      Analyst
    </span>
  );
}

export default function UsersPage() {
  const { isAdmin, user: currentUser } = useAuth();
  const qc = useQueryClient();
  const [error, setError] = useState('');

  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const { data: users = [], isLoading } = useQuery<UserRecord[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await apiClient.get('/users');
      return data;
    },
  });

  const roleMutation = useMutation({
    mutationFn: async ({ id, role }: { id: number; role: string }) => {
      const { data } = await apiClient.patch(`/users/${id}/role`, { role });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      const { data } = await apiClient.patch(`/users/${id}/deactivate`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setError('');
    },
    onError: (err: Error) => setError(err.message),
  });

  const toggleRole = (user: UserRecord) => {
    const next = user.role === 'admin' ? 'analyst' : 'admin';
    roleMutation.mutate({ id: user.id, role: next });
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
          <UserCog className="w-5 h-5 text-indigo-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-50">Users</h1>
          <p className="text-slate-500 text-sm mt-0.5">Manage team members and roles</p>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/20 border border-red-700 rounded-lg flex items-center gap-2 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="text-left px-4 py-3 font-medium text-slate-500">Name</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Email</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Role</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Status</th>
                <th className="text-left px-4 py-3 font-medium text-slate-500">Joined</th>
                <th className="px-4 py-3 font-medium text-slate-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-700/50 transition-colors">
                  <td className="px-4 py-3 text-slate-100 font-medium">
                    {u.full_name}
                    {u.id === currentUser?.id && (
                      <span className="ml-2 text-xs text-slate-500">(you)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-400">{u.email}</td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    {u.is_active ? (
                      <span className="text-xs text-emerald-400">Active</span>
                    ) : (
                      <span className="text-xs text-slate-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      {u.id !== currentUser?.id && u.is_active && (
                        <>
                          <button
                            onClick={() => toggleRole(u)}
                            disabled={roleMutation.isPending}
                            title={`Switch to ${u.role === 'admin' ? 'Analyst' : 'Admin'}`}
                            className="px-2.5 py-1 text-xs font-medium rounded text-slate-300 bg-slate-700 hover:bg-slate-600 transition-colors disabled:opacity-50"
                          >
                            Make {u.role === 'admin' ? 'Analyst' : 'Admin'}
                          </button>
                          <button
                            onClick={() => deactivateMutation.mutate(u.id)}
                            disabled={deactivateMutation.isPending}
                            title="Deactivate user"
                            className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/20 rounded transition-colors disabled:opacity-50"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
