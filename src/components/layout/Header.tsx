import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Moon, LogOut, Calendar } from 'lucide-react';

export const Header: React.FC = () => {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [greeting, setGreeting] = useState('');
  const [dateString, setDateString] = useState('');

  // Update greeting and date
  useEffect(() => {
    const updateTimeStrings = () => {
      const now = new Date();
      let hour = now.getHours();
      
      try {
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (tz) {
          const formatter = new Intl.DateTimeFormat('en-US', {
            hour: 'numeric',
            hour12: false,
            timeZone: tz
          });
          hour = parseInt(formatter.format(now), 10);
        }
      } catch (e) {
        console.warn('Failed to detect timezone, falling back to system time:', e);
      }
      
      // Dynamic Greeting
      if (hour >= 5 && hour < 12) {
        setGreeting('Good morning');
      } else if (hour >= 12 && hour < 16) {
        setGreeting('Good afternoon');
      } else if (hour >= 16 && hour < 22) {
        setGreeting('Good evening');
      } else {
        setGreeting('Good night');
      }

      // Format Date: Thursday · August 20, 2026
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      };
      const formatted = now.toLocaleDateString('en-US', options);
      // Replace the first comma with a middot "·"
      const withMiddleDot = formatted.replace(',', ' ·');
      setDateString(withMiddleDot);
    };

    updateTimeStrings();
    // Update every minute to keep greeting correct on transitions
    const interval = setInterval(updateTimeStrings, 60000);
    return () => clearInterval(interval);
  }, []);

  const displayName = profile?.display_name || 'Anirudh';

  return (
    <header className="flex justify-between items-center py-5 px-6 border-b border-border/20 backdrop-blur-md bg-background/30 sticky top-0 z-40 select-none">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-1.5 md:text-2xl">
          {greeting}, {displayName} <span className="animate-bounce origin-bottom-right inline-block">👋</span>
        </h1>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-secondary font-medium">
          <Calendar className="h-3.5 w-3.5 opacity-60" />
          <span>{dateString}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Theme Switcher Toggle */}
        <button
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          className="p-2.5 rounded-xl border border-border/30 bg-surface/30 text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 hover:border-border transition-all duration-200 focus:outline-none"
        >
          {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Log Out Button */}
        <button
          onClick={signOut}
          title="Sign Out"
          className="p-2.5 rounded-xl border border-border/30 bg-surface/30 text-text-secondary hover:text-danger hover:bg-danger/10 hover:border-danger/30 transition-all duration-200 focus:outline-none"
        >
          <LogOut className="h-4.5 w-4.5" />
        </button>
      </div>
    </header>
  );
};
