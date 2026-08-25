import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { Check, AlertCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Built-in premium gradient colors to choose as avatar background
  const avatarGradients = [
    'from-indigo-500 to-violet-600',
    'from-pink-500 to-rose-600',
    'from-emerald-400 to-teal-600',
    'from-amber-400 to-orange-500',
    'from-cyan-400 to-blue-600',
    'from-purple-500 to-indigo-700'
  ];

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || avatarGradients[0]);
      // Load custom bio from metadata if stored, or fallback
      const cachedBio = localStorage.getItem(`life_os_bio_${profile.id}`) || 'Life-OS Premium Subscriber';
      setBio(cachedBio);
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setIsSubmitting(true);
      setSuccessMsg('');
      setErrorMsg('');

      // Save profile updates to database
      await dbService.updateProfile(user.id, {
        display_name: displayName.trim(),
        avatar_url: avatarUrl
      });

      // Save custom bio locally
      localStorage.setItem(`life_os_bio_${user.id}`, bio.trim());

      // Refresh global authentication profile state
      await refreshProfile();

      setSuccessMsg('Profile updated successfully!');
      confetti({ particleCount: 35, spread: 35, colors: ['#6366F1', '#10B981'] });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in text-left select-none max-w-xl mx-auto">
      
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-text-primary uppercase tracking-wider">
          Profile Settings
        </h1>
        <p className="text-[10px] text-text-secondary/70 font-semibold mt-0.5">
          Customize your public presence and account settings
        </p>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="glass-panel p-6 rounded-2xl border border-border/10 bg-surface/5 space-y-6">
        
        {/* Avatar Section */}
        <div className="flex flex-col sm:flex-row items-center gap-5">
          {/* Active Preview */}
          <div className={`h-16 w-16 rounded-full bg-gradient-to-tr ${avatarUrl} flex items-center justify-center text-white text-xl font-black shadow-lg shadow-indigo-500/10 shrink-0`}>
            {displayName.charAt(0).toUpperCase() || 'A'}
          </div>

          <div className="space-y-2 w-full">
            <label className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest block">Choose Avatar Style</label>
            <div className="flex flex-wrap gap-2.5">
              {avatarGradients.map(grad => (
                <button
                  key={grad}
                  type="button"
                  onClick={() => setAvatarUrl(grad)}
                  className={`h-7 w-7 rounded-full bg-gradient-to-tr ${grad} border-2 transition-all flex items-center justify-center ${
                    avatarUrl === grad ? 'border-text-primary scale-110 shadow' : 'border-transparent hover:scale-105'
                  }`}
                >
                  {avatarUrl === grad && <Check className="h-3 w-3 text-white" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Form fields */}
        <div className="space-y-4">
          {/* Display name */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest block">Display Name</label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full bg-surface/20 border border-border/20 rounded-xl px-4 py-2.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent/40"
            />
          </div>

          {/* Email (Readonly) */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-text-secondary/50 uppercase tracking-widest block">Email Address (Readonly)</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full bg-surface/10 border border-border/10 rounded-xl px-4 py-2.5 text-xs font-semibold text-text-secondary/50 cursor-not-allowed select-none"
            />
          </div>

          {/* Bio / Status */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-extrabold text-text-secondary uppercase tracking-widest block">Bio &amp; Status</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full bg-surface/20 border border-border/20 rounded-xl px-4 py-2.5 text-xs font-semibold text-text-primary focus:outline-none focus:border-accent/40 resize-none"
            />
          </div>
        </div>

        {/* Feedback alerts */}
        {successMsg && (
          <div className="flex items-center gap-2 p-3 bg-success/10 border border-success/20 rounded-xl text-success text-[10px] font-bold">
            <Check className="h-4 w-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/20 rounded-xl text-danger text-[10px] font-bold">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting || !displayName.trim()}
          className="w-full py-3 bg-accent hover:bg-accent-hover disabled:opacity-50 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all outline-none flex items-center justify-center gap-1.5"
        >
          {isSubmitting ? (
            <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5" />
              <span>Save Changes</span>
            </>
          )}
        </button>

      </form>

    </div>
  );
};
