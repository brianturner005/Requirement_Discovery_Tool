import { Link } from 'react-router-dom';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { FileText, Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { useDashboardStats } from '../hooks/useDashboard';
import StatusBadge from '../components/requirements/StatusBadge';
import PriorityBadge from '../components/requirements/PriorityBadge';
import { formatRelativeTime } from '../lib/utils';

const STATUS_BAR_COLORS: Record<string, string> = {
  Draft: '#94a3b8',
  'Under Review': '#facc15',
  Approved: '#4ade80',
  Rejected: '#f87171',
  'In Progress': '#60a5fa',
  Completed: '#34d399',
  Deferred: '#c084fc',
};

const PRIORITY_BAR_COLORS: Record<string, string> = {
  Critical: '#f87171',
  High: '#fb923c',
  Medium: '#facc15',
  Low: '#60a5fa',
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
}

function StatCard({ title, value, icon: Icon, iconBg, iconColor }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="text-3xl font-bold text-slate-50 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading, isError } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (isError || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-slate-300">Failed to load dashboard stats.</p>
        </div>
      </div>
    );
  }

  const statusChartData = Object.entries(stats.by_status).map(([name, value]) => ({
    name,
    value,
  }));

  const priorityChartData = Object.entries(stats.by_priority).map(([name, value]) => ({
    name,
    value,
  }));

  const draftCount = stats.by_status['Draft'] ?? 0;
  const underReviewCount = stats.by_status['Under Review'] ?? 0;
  const approvedCount = stats.by_status['Approved'] ?? 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-50">Dashboard</h1>
        <p className="text-slate-500 mt-1">Overview of your requirements discovery process</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Requirements"
          value={stats.total_requirements}
          icon={FileText}
          iconBg="bg-indigo-500/20"
          iconColor="text-indigo-600"
        />
        <StatCard
          title="Draft"
          value={draftCount}
          icon={Clock}
          iconBg="bg-slate-700"
          iconColor="text-slate-200"
        />
        <StatCard
          title="Under Review"
          value={underReviewCount}
          icon={TrendingUp}
          iconBg="bg-yellow-500/20"
          iconColor="text-yellow-600"
        />
        <StatCard
          title="Approved"
          value={approvedCount}
          icon={CheckCircle}
          iconBg="bg-green-500/20"
          iconColor="text-green-600"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Status */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Requirements by Status</h2>
          {statusChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusChartData} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4)',
                  }}
                />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {statusChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={STATUS_BAR_COLORS[entry.name] ?? '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* By Priority */}
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-slate-100 mb-4">Requirements by Priority</h2>
          {priorityChartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={priorityChartData} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    background: '#1e293b',
                    border: '1px solid #334155',
                    color: '#e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.4)',
                  }}
                />
                <Bar dataKey="value" name="Count" radius={[4, 4, 0, 0]}>
                  {priorityChartData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={PRIORITY_BAR_COLORS[entry.name] ?? '#94a3b8'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Requirements */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-100">Recent Requirements</h2>
          <Link
            to="/requirements"
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            View all
          </Link>
        </div>
        {stats.recent_requirements.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-400 text-sm">
            No requirements yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-700">
                  <th className="text-left px-6 py-3 font-medium text-slate-500">ID</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">Title</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">Status</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">Priority</th>
                  <th className="text-left px-6 py-3 font-medium text-slate-500">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {stats.recent_requirements.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-700 transition-colors">
                    <td className="px-6 py-3">
                      <Link
                        to={`/requirements/${req.req_id}`}
                        className="font-mono text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        {req.req_id}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <Link
                        to={`/requirements/${req.req_id}`}
                        className="text-slate-100 hover:text-indigo-700 font-medium line-clamp-1"
                      >
                        {req.title}
                      </Link>
                    </td>
                    <td className="px-6 py-3">
                      <StatusBadge status={req.status} />
                    </td>
                    <td className="px-6 py-3">
                      <PriorityBadge priority={req.priority} />
                    </td>
                    <td className="px-6 py-3 text-slate-500 text-xs">
                      {formatRelativeTime(req.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
