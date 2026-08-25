import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ShieldCheck, X } from 'lucide-react';

export const AppShell: React.FC = () => {
  const [activePlaceholder, setActivePlaceholder] = useState<string | null>(null);

  const handlePlaceholderClick = (name: string) => {
    setActivePlaceholder(name);
  };

  const closePlaceholderModal = () => {
    setActivePlaceholder(null);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-text-primary transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar onPlaceholderClick={handlePlaceholderClick} />

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden relative pb-16 md:pb-0">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6 relative">
          <Outlet />
        </main>
      </div>

      {/* Coming Soon Placeholder Modal overlay */}
      {activePlaceholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity"
            onClick={closePlaceholderModal}
          />
          
          {/* Modal Card */}
          <div className="bg-surface border border-border/80 rounded-2xl p-6 w-full max-w-[400px] shadow-2xl relative z-10 animate-scale-in">
            <button 
              onClick={closePlaceholderModal}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover/50 transition-colors focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2 select-none">
              <div className="h-12 w-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-4">
                <ShieldCheck className="h-6 w-6" />
              </div>
              
              <h2 className="text-xl font-bold tracking-tight text-text-primary mb-2">
                {activePlaceholder} Module
              </h2>
              
              <p className="text-sm text-text-secondary leading-relaxed px-2">
                This area is currently a visual placeholder for Phase 1. Complete functionality will be developed and integrated incrementally in future phases of Life-OS.
              </p>
              
              <button
                onClick={closePlaceholderModal}
                className="w-full mt-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold shadow-md active:scale-[0.98] transition-all outline-none"
              >
                Got it, thanks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
