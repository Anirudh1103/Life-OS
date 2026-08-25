import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  BookOpen, 
  Dumbbell, 
  Coins, 
  CheckSquare, 
  Book, 
  Settings, 
  User,
  Layers
} from 'lucide-react';

interface SidebarProps {
  onPlaceholderClick: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onPlaceholderClick }) => {
  const { profile } = useAuth();
  const mainNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, isPlaceholder: false },
    { name: 'Learning', path: '/learning', icon: BookOpen, isPlaceholder: false },
    { name: 'Fitness', path: '/fitness', icon: Dumbbell, isPlaceholder: false },
    { name: 'Finance', path: '/finance', icon: Coins, isPlaceholder: false },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, isPlaceholder: false },
    { name: 'Journal', path: '/journal', icon: Book, isPlaceholder: true },
  ];

  const bottomNavItems = [
    { name: 'Settings', path: '/settings', icon: Settings, isPlaceholder: true },
    { name: 'Profile', path: '/profile', icon: User, isPlaceholder: true },
  ];

  const renderLink = (item: typeof mainNavItems[0]) => {
    const Icon = item.icon;
    const commonClasses = "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 select-none cursor-pointer";
    
    if (item.isPlaceholder) {
      return (
        <button
          key={item.name}
          onClick={() => onPlaceholderClick(item.name)}
          className={`${commonClasses} w-full text-text-secondary/70 hover:text-text-primary hover:bg-surface-hover/40`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span>{item.name}</span>
          <span className="ml-auto text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-surface border border-border/40 scale-90 opacity-40">Soon</span>
        </button>
      );
    }

    return (
      <NavLink
        key={item.name}
        to={item.path}
        className={({ isActive }) => 
          `${commonClasses} ${
            isActive 
              ? 'bg-accent/10 text-accent font-semibold border-l-2 border-accent pl-[14px]' 
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/40'
          }`
        }
      >
        {({ isActive }) => (
          <>
            <div className="relative flex items-center justify-center">
              {isActive && <div className="absolute -left-1 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />}
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'translate-x-1' : ''} transition-transform`} />
            </div>
            <span className={`${isActive ? 'translate-x-1' : ''} transition-transform`}>{item.name}</span>
          </>
        )}
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-surface/20 border-r border-border/30 h-screen sticky top-0 backdrop-blur-xl p-6 overflow-y-auto">
        {/* Logo Section */}
        <div className="flex items-center gap-3 px-2 mb-8 select-none">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-500/10">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-lg bg-gradient-to-r from-text-primary to-text-primary/70 bg-clip-text text-transparent">
            Life-OS
          </span>
        </div>

        {/* Main Navigation Links */}
        <nav className="flex-1 space-y-1">
          {mainNavItems.map(item => renderLink(item))}
        </nav>

        {/* Separator */}
        <div className="my-6 border-t border-border/20" />

        {/* Bottom Navigation Links */}
        <nav className="space-y-1">
          {bottomNavItems.map(item => renderLink(item))}
        </nav>

        {/* Separator */}
        <div className="my-5 border-t border-border/20" />

        {/* Profile Footer */}
        <div className="flex items-center gap-3 px-2 py-1 select-none mt-auto">
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {profile?.display_name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-text-primary truncate">
              {profile?.display_name || 'Anirudh'}
            </p>
            <p className="text-[10px] text-text-secondary/70 font-semibold truncate">
              Premium Plan
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border/30 px-3 py-1 flex justify-around items-center h-16 safe-bottom">
        {mainNavItems.slice(0, 4).map(item => {
          const Icon = item.icon;
          const commonClasses = "flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium transition-colors";
          
          if (item.isPlaceholder) {
            return (
              <button
                key={item.name}
                onClick={() => onPlaceholderClick(item.name)}
                className={`${commonClasses} text-text-secondary/50`}
              >
                <Icon className="h-5 w-5 mb-0.5" />
                <span>{item.name}</span>
              </button>
            );
          }

          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `${commonClasses} ${
                  isActive ? 'text-accent font-semibold' : 'text-text-secondary'
                }`
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
        {/* Menu button for settings/profile placeholder on mobile */}
        <button
          onClick={() => onPlaceholderClick('Profile & Settings')}
          className="flex flex-col items-center justify-center flex-1 py-1 text-[10px] font-medium text-text-secondary"
        >
          <User className="h-5 w-5 mb-0.5" />
          <span>Profile</span>
        </button>
      </nav>
    </>
  );
};
