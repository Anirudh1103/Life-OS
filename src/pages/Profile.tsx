import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dbService } from '../services/supabase';
import { Check, AlertCircle, Sparkles, User, Mail, Shield, LogOut, Camera } from 'lucide-react';
import confetti from 'canvas-confetti';

export const Profile: React.FC = () => {
  const { user, profile, refreshProfile, signOut } = useAuth();
  
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
      const cachedBio = localStorage.getItem(`life_os_bio_${profile.id}`) || 'Life-OS Power User';
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

      await dbService.updateProfile(user.id, {
        display_name: displayName.trim(),
        avatar_url: avatarUrl
      });

      localStorage.setItem(`life_os_bio_${user.id}`, bio.trim());
      await refreshProfile();

      setSuccessMsg('Profile changes saved successfully!');
      confetti({ particleCount: 40, spread: 45, origin: { y: 0.8 } });
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('System Error: Failed to update profile nodes.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto animate-fade-in px-4 pb-20 pt-8">
      
      {/* Page Header */}
      <div className="flex items-center justify-between mb-10">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl font-black text-text-primary tracking-tight">Identity & Account</h1>
          <p className="text-xs font-bold text-text-secondary/50 uppercase tracking-widest">Manage your neural link profile and settings</p>
        </div>
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
        >
          <LogOut className="h-3.5 w-3.5" />
          Terminate Session
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Avatar & Quick Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-8 rounded-[2.5rem] bg-surface/10 border border-white/5 text-center space-y-6">
            <div className="relative inline-block mx-auto group">
              <div className={`h-32 w-32 rounded-[2.5rem] bg-gradient-to-tr ${avatarUrl} flex items-center justify-center text-white text-4xl font-black shadow-2xl transition-all group-hover:scale-105 duration-500`}>
                {displayName.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-[#0B0F19] border border-white/10 flex items-center justify-center text-text-secondary shadow-lg">
                <Camera className="h-5 w-5" />
              </div>
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-black text-white">{displayName || 'Anonymous User'}</h2>
              <p className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">Premium Status Active</p>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[11px] text-text-secondary/70 leading-relaxed italic">
                "{bio || 'No bio set.'}"
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-3xl bg-surface/10 border border-white/5 space-y-4">
            <h3 className="text-[10px] font-black text-text-secondary/40 uppercase tracking-widest flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Security Overview
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-text-secondary/60">Authentication</span>
                <span className="text-emerald-400 font-black">SECURE</span>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-bold text-text-secondary/60">Encryption</span>
                <span className="text-accent font-black">AES-256</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Edit Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="glass-panel p-8 rounded-[2.5rem] bg-surface/10 border border-white/5 space-y-8">

            <section className="space-y-6 text-left">
              <h3 className="text-sm font-black text-text-primary uppercase tracking-widest flex items-center gap-2">
                <User className="h-4 w-4 text-accent" />
                Personal Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary/50 uppercase tracking-[0.15em]">Display Name</label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Anirudh"
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3.5 px-5 text-sm font-bold text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-text-secondary/50 uppercase tracking-[0.15em]">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary/30" />
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full bg-white/[0.01] border border-white/5 rounded-2xl py-3.5 pl-12 pr-5 text-sm font-bold text-text-secondary/40 cursor-not-allowed"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-text-secondary/50 uppercase tracking-[0.15em]">Bio & Identity</label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell Jarvis about yourself..."
                  className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-5 text-sm font-bold text-white focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 transition-all resize-none"
                />
              </div>
            </section>

            <section className="space-y-4 pt-4 border-t border-white/5 text-left">
              <h3 className="text-[10px] font-black text-text-secondary/40 uppercase tracking-widest">Interface Theme Nodes</h3>
              <div className="flex flex-wrap gap-4">
                {avatarGradients.map(grad => (
                  <button
                    key={grad}
                    type="button"
                    onClick={() => setAvatarUrl(grad)}
                    className={`h-10 w-10 rounded-2xl bg-gradient-to-tr ${grad} border-2 transition-all flex items-center justify-center ${
                      avatarUrl === grad ? 'border-white scale-110 shadow-lg shadow-white/5' : 'border-transparent opacity-40 hover:opacity-100'
                    }`}
                  >
                    {avatarUrl === grad && <Check className="h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </section>

            {/* Feedback Alerts */}
            {(successMsg || errorMsg) && (
              <div className={`flex items-center gap-3 p-4 rounded-2xl text-xs font-bold animate-slide-up ${
                successMsg ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
              }`}>
                {successMsg ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                <span>{successMsg || errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !displayName.trim()}
              className="w-full py-4 bg-accent hover:bg-accent-hover disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-xl shadow-accent/20 flex items-center justify-center gap-2 group active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span className="animate-spin h-5 w-5 border-3 border-white border-t-transparent rounded-full" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4 group-hover:animate-pulse" />
                  Update Neural Profile
                </>
              )}
            </button>

          </form>
        </div>

      </div>

    </div>
  );
};
