import React from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, Search, Bell } from 'lucide-react';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex justify-between items-center py-4 px-8 bg-transparent sticky top-0 z-40 select-none">
      {/* Search Bar */}
      <div className="flex-1 max-w-md relative group">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-text-secondary/50 group-focus-within:text-accent transition-colors">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full bg-surface/30 border border-border/10 rounded-xl py-2 pl-10 pr-12 text-sm focus:outline-none focus:ring-1 focus:ring-accent/50 focus:border-accent/50 transition-all placeholder:text-text-secondary/40"
        />
        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
          <span className="text-[10px] font-bold text-text-secondary/30 bg-surface/50 border border-border/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
            <span className="text-[8px]">⌘</span> K
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 text-text-secondary hover:text-text-primary transition-colors focus:outline-none"
        >
          {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>

        {/* Notifications */}
        <button className="p-1.5 text-text-secondary hover:text-text-primary transition-colors focus:outline-none">
          <Bell className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
};
