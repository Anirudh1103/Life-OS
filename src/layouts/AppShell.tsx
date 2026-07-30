import { type ElementType } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Activity,
  Users,
  Target,
  Heart,
  BookOpen,
  Trophy,
  Settings,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Planner', path: '/planner', icon: Calendar },
  { label: 'Fitness', path: '/fitness', icon: Activity, disabled: true },
  { label: 'Together', path: '/together', icon: Users, disabled: true },
  { label: 'Goals', path: '/goals', icon: Target, disabled: true },
  { label: 'Health', path: '/health', icon: Heart, disabled: true },
  { label: 'Journal', path: '/journal', icon: BookOpen, disabled: true },
  { label: 'Rewards', path: '/rewards', icon: Trophy, disabled: true },
  { label: 'Settings', path: '/settings', icon: Settings },
];

function NavItem({
  label,
  path,
  icon: Icon,
  disabled
}: {
  label: string;
  path: string;
  icon: ElementType;
  disabled?: boolean;
}) {
  if (disabled) {
    return (
      <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-400 cursor-not-allowed opacity-60">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
          isActive
            ? 'bg-indigo-600 text-white shadow-soft dark:bg-indigo-600 dark:text-white'
            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

function AppShell() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 transition-theme dark:bg-[#090a0f] dark:text-slate-100">
      {/* Desktop Left Sidebar */}
      <aside className="hidden w-64 h-screen sticky top-0 border-r border-slate-200 bg-white p-5 dark:border-slate-800/80 dark:bg-[#0b0c11] lg:flex flex-col justify-between z-30">
        <div className="space-y-6">
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-extrabold shadow-sm">O</span>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">Life OS</span>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavItem key={item.label} {...item} />
            ))}
          </nav>
        </div>

        {/* Sidebar Footer User Box */}
        <div className="space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800/60">
          {user?.role === 'admin' && (
            <NavLink to="/admin" className="block px-2">
              <Button size="xs" variant="secondary" className="w-full justify-start text-[11px] font-bold">
                Admin Panel
              </Button>
            </NavLink>
          )}
          <div className="flex items-center justify-between gap-2 px-2">
            <div className="flex items-center gap-3">
              <Avatar name={user?.name ?? 'Anirudh'} src={user?.photoURL} size="sm" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">{user?.name?.split(' ')[0] ?? 'Anirudh'}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-1.5 py-0.5 text-[8px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    👑 Premium
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Toggle checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              <button
                onClick={signOut}
                className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition p-1"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col min-h-screen">
        {/* Top Navbar - Mobile Only */}
        <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between border-b border-slate-200 bg-white/80 px-6 py-4 backdrop-blur-md dark:border-slate-800/60 dark:bg-[#090a0f]/80">
          <div className="flex items-center gap-4">
            <span className="h-5 w-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-bold">O</span>
            <span className="text-md font-bold tracking-tight text-slate-900 dark:text-white">Life OS</span>
          </div>
          <div className="flex items-center gap-3">
            <Toggle checked={theme === 'dark'} onCheckedChange={toggleTheme} />
            {user?.role === 'admin' && (
              <NavLink to="/admin">
                <Button size="xs" variant="secondary">
                  Admin
                </Button>
              </NavLink>
            )}
          </div>
        </header>

        {/* Main Content Wrapper */}
        <main className="flex-grow p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-20 block border-t border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur-md dark:border-slate-800/60 dark:bg-[#0b0c11]/95 lg:hidden">
        <div className="flex items-center justify-around gap-2">
          {navItems.slice(0, 4).map((item) => (
            <NavLink
              key={item.label}
              to={item.disabled ? '#' : item.path}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-semibold flex-1 ${
                  item.disabled
                    ? 'text-slate-400 cursor-not-allowed opacity-50'
                    : isActive
                    ? 'text-indigo-600 dark:text-indigo-400'
                    : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`
              }
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          ))}
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl py-1 text-[10px] font-semibold flex-1 ${
                isActive ? 'text-indigo-650 dark:text-indigo-400' : 'text-slate-400 hover:text-slate-800 dark:hover:text-white'
              }`
            }
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
}

export default AppShell;
