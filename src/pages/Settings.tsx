import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Sun, Moon, Shield, Bell, Database, 
  Settings as SettingsIcon, LogOut, Check, ArrowDownToLine 
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { signOut } = useAuth();

  // Settings State
  const [defaultSpace, setDefaultSpace] = useState<'personal' | 'work'>('personal');
  const [notificationsEmail, setNotificationsEmail] = useState(true);
  const [notificationsPush, setNotificationsPush] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState(false);

  useEffect(() => {
    const savedSpace = localStorage.getItem('life_os_default_space') || 'personal';
    setDefaultSpace(savedSpace as any);
    
    const emailPref = localStorage.getItem('life_os_pref_email') !== 'false';
    const pushPref = localStorage.getItem('life_os_pref_push') === 'true';
    setNotificationsEmail(emailPref);
    setNotificationsPush(pushPref);
  }, []);

  const handleSpaceChange = (space: 'personal' | 'work') => {
    setDefaultSpace(space);
    localStorage.setItem('life_os_default_space', space);
  };

  const handleToggleEmail = () => {
    const nextVal = !notificationsEmail;
    setNotificationsEmail(nextVal);
    localStorage.setItem('life_os_pref_email', String(nextVal));
  };

  const handleTogglePush = () => {
    const nextVal = !notificationsPush;
    setNotificationsPush(nextVal);
    localStorage.setItem('life_os_pref_push', String(nextVal));
  };

  // Export mock DB cache to JSON file
  const handleExportBackup = () => {
    const backupObj: Record<string, any> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('life_os') || key.startsWith('supabase'))) {
        backupObj[key] = localStorage.getItem(key);
      }
    }

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupObj, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `life_os_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    setBackupSuccess(true);
    setTimeout(() => setBackupSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-left select-none max-w-xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary uppercase tracking-wider">
          System Settings
        </h1>
        <p className="text-[10px] text-text-secondary/70 font-semibold mt-0.5">
          Configure display, database backups, and notification preferences
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Theme Settings */}
        <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Sun className="h-4 w-4 text-accent" />
            <span>Display Theme</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
            <button
              onClick={() => theme === 'dark' && toggleTheme()}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2.5 transition-all duration-200 outline-none ${
                theme === 'light'
                  ? 'border-accent bg-accent/5 text-accent font-black shadow-sm'
                  : 'border-border/30 text-text-secondary/70 hover:bg-surface-hover/20'
              }`}
            >
              <Sun className="h-5 w-5" />
              <span>Light Theme</span>
            </button>
            
            <button
              onClick={() => theme === 'light' && toggleTheme()}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2.5 transition-all duration-200 outline-none ${
                theme === 'dark'
                  ? 'border-accent bg-accent/5 text-accent font-black shadow-sm'
                  : 'border-border/30 text-text-secondary/70 hover:bg-surface-hover/20'
              }`}
            >
              <Moon className="h-5 w-5" />
              <span>Dark Theme</span>
            </button>
          </div>
        </div>

        {/* Space Settings */}
        <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <SettingsIcon className="h-4 w-4 text-accent" />
            <span>Default Workspace</span>
          </h3>
          <div className="grid grid-cols-2 gap-3 text-[10px] font-bold">
            <button
              onClick={() => handleSpaceChange('personal')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 outline-none ${
                defaultSpace === 'personal'
                  ? 'border-accent bg-accent/5 text-accent font-black shadow-sm'
                  : 'border-border/30 text-text-secondary/70 hover:bg-surface-hover/20'
              }`}
            >
              <span>🏠</span>
              <span>Personal Space</span>
            </button>
            
            <button
              onClick={() => handleSpaceChange('work')}
              className={`p-3.5 rounded-xl border flex flex-col items-center gap-2 transition-all duration-200 outline-none ${
                defaultSpace === 'work'
                  ? 'border-accent bg-accent/5 text-accent font-black shadow-sm'
                  : 'border-border/30 text-text-secondary/70 hover:bg-surface-hover/20'
              }`}
            >
              <span>💼</span>
              <span>Work Space</span>
            </button>
          </div>
        </div>

        {/* Notifications Preference */}
        <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Bell className="h-4 w-4 text-accent" />
            <span>Notification Preferences</span>
          </h3>
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleToggleEmail}
              className="flex items-center justify-between w-full p-1 focus:outline-none"
            >
              <div className="text-left">
                <p className="text-xs font-bold text-text-primary">Email Digests</p>
                <p className="text-[9px] text-text-secondary/70 font-semibold mt-0.5">Receive daily task summary alerts</p>
              </div>
              <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${
                notificationsEmail ? 'border-accent bg-accent/15 text-accent' : 'border-border/40 hover:border-border/60'
              }`}>
                {notificationsEmail && <Check className="h-3 w-3" />}
              </div>
            </button>

            <button
              type="button"
              onClick={handleTogglePush}
              className="flex items-center justify-between w-full p-1 focus:outline-none"
            >
              <div className="text-left">
                <p className="text-xs font-bold text-text-primary">Push Alerts</p>
                <p className="text-[9px] text-text-secondary/70 font-semibold mt-0.5">Enable browser popups for active timers</p>
              </div>
              <div className={`h-5 w-5 rounded-lg border flex items-center justify-center transition-all ${
                notificationsPush ? 'border-accent bg-accent/15 text-accent' : 'border-border/40 hover:border-border/60'
              }`}>
                {notificationsPush && <Check className="h-3 w-3" />}
              </div>
            </button>
          </div>
        </div>

        {/* Data Backup */}
        <div className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/5 space-y-4">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4 text-accent" />
            <span>Local Database Backups</span>
          </h3>
          <p className="text-[10px] text-text-secondary/70 font-semibold leading-relaxed">
            Download your local workspaces configuration, databases logs, tasks checklists, and finance metrics as a portable JSON file.
          </p>
          <button
            onClick={handleExportBackup}
            className="w-full py-2.5 bg-surface-hover/30 hover:bg-surface-hover/60 border border-border/40 text-text-primary rounded-xl text-xs font-bold transition-all outline-none flex items-center justify-center gap-1.5"
          >
            {backupSuccess ? (
              <>
                <Check className="h-4 w-4 text-success" />
                <span className="text-success">Backup Saved!</span>
              </>
            ) : (
              <>
                <ArrowDownToLine className="h-4 w-4 text-text-secondary" />
                <span>Export Local Data Backup</span>
              </>
            )}
          </button>
        </div>

        {/* Log Out */}
        <div className="glass-panel p-5 rounded-2xl border border-danger/10 bg-surface/5 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-danger" />
              <span>Security &amp; Account</span>
            </h3>
            <p className="text-[9px] text-text-secondary/70 font-semibold mt-0.5">Disconnect session from current system</p>
          </div>
          <button
            onClick={signOut}
            className="py-2 px-4 bg-danger/10 hover:bg-danger/20 border border-danger/25 text-danger rounded-xl text-xs font-bold transition-all outline-none flex items-center gap-1.5"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </div>

    </div>
  );
};
