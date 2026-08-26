import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  Dumbbell, 
  Coins, 
  Book, 
  Sparkles,
  ChevronRight,
  Layers
} from 'lucide-react';

interface SidebarProps {
  onPlaceholderClick: (name: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onPlaceholderClick }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const mainNavItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard, isPlaceholder: false },
    { name: 'Tasks', path: '/tasks', icon: CheckSquare, isPlaceholder: false },
    { name: 'Learning', path: '/learning', icon: BookOpen, isPlaceholder: false },
    { name: 'Fitness', path: '/fitness', icon: Dumbbell, isPlaceholder: false },
    { name: 'Finance', path: '/finance', icon: Coins, isPlaceholder: false },
    { name: 'Journal', path: '/journal', icon: Book, isPlaceholder: true },
  ];

  const renderLink = (item: typeof mainNavItems[0]) => {
    const Icon = item.icon;
    const commonClasses = "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 select-none cursor-pointer mb-1 w-full text-left outline-none";
    
    if (item.isPlaceholder) {
      return (
        <button
          key={item.name}
          onClick={() => onPlaceholderClick(item.name)}
          className={`${commonClasses} text-text-secondary/60 hover:text-text-primary hover:bg-surface-hover/30`}
        >
          <Icon className="h-4.5 w-4.5 shrink-0 text-text-secondary/50" />
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
            isActive 
              ? 'bg-accent/15 text-accent font-bold shadow-sm shadow-accent/5'
              : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/30'
          }`
        }
      >
        <Icon className="h-4.5 w-4.5 shrink-0" />
        <span>{item.name}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 bg-[#0B0F19] border-r border-border/10 h-screen sticky top-0 p-6 overflow-y-auto select-none">
        
        {/* Logo Section */}
        <div className="flex items-center gap-2.5 px-2 mb-8 cursor-pointer active:scale-98 transition-all" onClick={() => navigate('/')}>
          <div className="h-8.5 w-8.5 rounded-xl bg-gradient-to-tr from-accent to-purple-600 flex items-center justify-center shadow-lg shadow-accent/20">
            <Layers className="h-4 w-4 text-white" />
          </div>
          <span className="font-black tracking-tight text-base text-white uppercase">
            LifeOS
          </span>
        </div>

        {/* Main Navigation Links */}
        <nav className="space-y-0.5">
          {mainNavItems.map(item => renderLink(item))}
        </nav>

        {/* Quote Card (glowing illustration block) */}
        <div className="mt-6 mb-6 p-4 rounded-2xl bg-gradient-to-br from-accent/10 to-purple-900/10 border border-accent/10 relative overflow-hidden text-left">
          <div className="absolute -right-6 -bottom-6 h-16 w-16 bg-accent/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="h-6 w-6 rounded-lg bg-accent/20 flex items-center justify-center mb-2.5">
            <Sparkles className="h-3.5 w-3.5 text-accent animate-pulse" />
          </div>
          <p className="text-[10px] font-bold text-text-primary leading-normal">
            "Small consistent steps create massive results over time."
          </p>
        </div>

        {/* Bottom Profile Row */}
        <div 
          onClick={() => navigate('/profile')}
          className="mt-auto pt-4 border-t border-border/10 flex items-center justify-between cursor-pointer hover:bg-surface-hover/20 p-2 rounded-2xl transition-all"
        >
          <div className="flex items-center gap-3">
            {user?.avatar_url?.startsWith('from-') ? (
              <div className={`h-9 w-9 rounded-xl bg-gradient-to-tr ${user.avatar_url} flex items-center justify-center text-white text-[10px] font-black shadow-lg border border-white/10`}>
                {(user.display_name || 'A').charAt(0).toUpperCase()}
              </div>
            ) : (
              <img
                src={user?.avatar_url || 'https://ui-avatars.com/api/?name=Anirudh&background=6366F1&color=fff'}
                alt="Anirudh"
                className="h-9 w-9 rounded-xl object-cover border border-border/20 shadow-inner"
              />
            )}
            <div className="text-left">
              <h4 className="font-extrabold text-[11px] text-text-primary uppercase tracking-wide">
                {user?.display_name || 'Anirudh'}
              </h4>
              <p className="text-[8px] font-bold text-text-secondary/55 uppercase tracking-widest mt-0.5">
                View Profile
              </p>
            </div>
          </div>
          <ChevronRight className="h-4.5 w-4.5 text-text-secondary/40" />
        </div>

      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0B0F19]/90 backdrop-blur-lg border-t border-border/10 px-3 py-1 flex justify-around items-center h-16 safe-bottom">
        {mainNavItems.slice(0, 5).map(item => {
          const Icon = item.icon;
          const commonClasses = "flex flex-col items-center justify-center flex-1 py-1 text-[9px] font-bold uppercase tracking-wider transition-colors";
          
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) => 
                `${commonClasses} ${
                  isActive ? 'text-accent font-black' : 'text-text-secondary/60'
                }`
              }
            >
              <Icon className="h-4.5 w-4.5 mb-1" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
