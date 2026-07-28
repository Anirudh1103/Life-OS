import { type ElementType, useMemo } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { LogOut, Settings2, ShieldAlert, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { Toggle } from '@/components/ui/Toggle';

const navItems = [
  { label: 'Dashboard', path: '/dashboard', icon: Sparkles },
  { label: 'Profile', path: '/profile', icon: User },
  { label: 'Settings', path: '/settings', icon: Settings2 },
];

const adminItems = [
  { label: 'Admin', path: '/admin', icon: ShieldAlert },
  { label: 'Users', path: '/admin/users', icon: User },
  { label: 'Exercises', path: '/admin/exercises', icon: Sparkles },
];

function NavItem({ label, path, icon: Icon }: { label: string; path: string; icon: ElementType }) {
  return (
    <NavLink
      to={path}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
          isActive ? 'bg-slate-100 text-slate-950 shadow-soft dark:bg-slate-800 dark:text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
        }`
      }
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </NavLink>
  );
}

function AppShell() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const pageTitle = useMemo(() => {
    if (location.pathname.startsWith('/admin')) {
      return 'Admin Console';
    }
    if (location.pathname.startsWith('/settings')) {
      return 'Settings';
    }
    if (location.pathname.startsWith('/profile')) {
      return 'Profile';
    }
    return 'Dashboard';
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-theme dark:bg-slate-950 dark:text-slate-100">
      <div className="container mx-auto flex min-h-screen flex-col gap-6 px-4 py-5 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-slate-200 bg-white/80 p-4 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/70">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Life OS</p>
              <h1 className="text-2xl font-semibold text-slate-950 dark:text-white">{pageTitle}</h1>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Toggle checked={theme === 'dark'} onCheckedChange={toggleTheme} label="Theme" />
              <Button variant="secondary" size="sm" icon={LogOut} onClick={signOut}>
                Logout
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            <div>
              <p className="text-slate-500">Signed in as</p>
              <p className="font-medium text-slate-900 dark:text-white">{user?.name ?? user?.email ?? 'Guest'}</p>
            </div>
            <div className="flex items-center gap-3">
              <Avatar name={user?.name ?? 'Guest'} src={user?.photoURL} size="sm" />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs uppercase tracking-[0.18em] text-slate-600 dark:bg-slate-800 dark:text-slate-300">{user?.role ?? 'user'}</span>
            </div>
          </div>
        </header>
        <div className="grid flex-1 gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="hidden rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 lg:block">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <NavItem key={item.path} {...item} />
              ))}
            </nav>
            {user?.role === 'admin' && (
              <div className="mt-8 space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Admin tools</p>
                {adminItems.map((item) => (
                  <NavItem key={item.path} {...item} />
                ))}
              </div>
            )}
          </aside>
          <main className="rounded-[2rem] border border-slate-200 bg-white/90 p-5 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
            <Outlet />
          </main>
        </div>
        <footer className="rounded-[2rem] border border-slate-200 bg-white/80 p-4 text-center text-sm text-slate-500 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-400">
          Built for premium workflows with future-ready structure.
        </footer>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-20 block bg-slate-50/90 p-3 shadow-soft backdrop-blur-xl dark:bg-slate-950/90 lg:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex-1 rounded-3xl bg-slate-100 px-3 py-3 text-center text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              <item.icon className="mx-auto mb-1 h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

export default AppShell;
