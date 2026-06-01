import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Users, Server, UserCog, LogOut } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/requirements', label: 'Requirements', icon: FileText },
  { to: '/stakeholders', label: 'Stakeholders', icon: Users },
  { to: '/systems', label: 'Systems', icon: Server },
  { to: '/users', label: 'Users', icon: UserCog, adminOnly: true },
];

export default function Sidebar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 text-slate-100 flex flex-col shadow-xl">
      {/* Logo / Brand */}
      <div className="px-6 py-5 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
            <FileText className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Req Discovery</p>
            <p className="text-xs text-slate-400 leading-tight">Traceability Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems
          .filter((item) => !item.adminOnly || isAdmin)
          .map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
      </nav>

      {/* User + Logout */}
      <div className="px-4 py-4 border-t border-slate-700 space-y-3">
        <div className="px-1">
          <p className="text-sm font-medium text-slate-200 truncate">{user?.full_name}</p>
          <p className="text-xs text-slate-500 truncate">{user?.email}</p>
          {isAdmin && (
            <span className="inline-block mt-1 text-xs text-indigo-400 font-medium">Admin</span>
          )}
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
