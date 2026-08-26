import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, AlertCircle, ChevronDown, Check, Scale } from 'lucide-react';

interface FitnessPlannerProps {
  onLogWeight?: (weight: number) => void;
  currentWeight?: number;
}

export const FitnessPlanner: React.FC<FitnessPlannerProps> = ({ 
  onLogWeight, 
  currentWeight = 75.4 
}) => {
  const [selectedRoutine, setSelectedRoutine] = useState('PPL Split');
  const [duration, setDuration] = useState<'week' | 'month'>('month');
  const [daysRemaining, setDaysRemaining] = useState(7); // default to 7 so banner shows on load
  const [inputWeight, setInputWeight] = useState('');
  const [showWeightInput, setShowWeightInput] = useState(false);

  // Expiration date (relative to local time)
  const expirationDateStr = new Date(Date.now() + daysRemaining * 24 * 3600 * 1000)
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleWeightSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const w = parseFloat(inputWeight);
    if (!isNaN(w) && w > 0 && onLogWeight) {
      onLogWeight(w);
      setInputWeight('');
      setShowWeightInput(false);
      alert(`Logged weight: ${w} kg. Progress saved!`);
    }
  };

  return (
    <div className="space-y-6 text-left text-xs font-semibold text-text-secondary select-none">
      
      {/* 1. WEEKLY ROUTINE PLANNER CARD */}
      <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] bg-white/[0.01] hover:border-accent/35 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] transition-all duration-300 space-y-5">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-4.5 w-4.5 text-accent animate-pulse" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Weekly Routine Planner</span>
          </div>
          
          {/* Days remaining slider simulation */}
          <div className="flex items-center gap-2 bg-surface/40 px-2.5 py-1 rounded-xl border border-border/10">
            <span className="text-[8px] font-black uppercase text-text-secondary/40">Simulate Days Left:</span>
            <input 
              type="range" 
              min="1" 
              max="15" 
              value={daysRemaining} 
              onChange={(e) => setDaysRemaining(parseInt(e.target.value))}
              className="w-16 h-1 bg-surface-hover/30 rounded-lg appearance-none cursor-pointer accent-accent"
            />
            <span className="text-[9px] font-black text-accent w-4 text-center">{daysRemaining}</span>
          </div>
        </div>

        {/* Dropdown & Slider switch row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          
          {/* Routine Dropdown */}
          <div className="relative">
            <select
              value={selectedRoutine}
              onChange={(e) => setSelectedRoutine(e.target.value)}
              className="w-full bg-surface/50 border border-border/20 rounded-2xl px-4.5 py-3 text-xs font-extrabold text-white outline-none cursor-pointer appearance-none hover:border-border/40 transition-colors"
            >
              <option value="PPL Split">🏋️ PPL Split</option>
              <option value="Upper/Lower">💪 Upper / Lower Split</option>
              <option value="Full Body">🏃 Full Body Progression</option>
              <option value="Create New">✨ Create a New Routine...</option>
            </select>
            <ChevronDown className="absolute right-4 top-3.5 h-4 w-4 text-text-secondary/40 pointer-events-none" />
          </div>

          {/* Duration toggle button group */}
          <div className="flex justify-between items-center bg-surface/30 border border-border/10 rounded-2xl p-1 w-full">
            <span className="text-[9px] font-black text-text-secondary/40 uppercase tracking-widest pl-3">Assign duration</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setDuration('week')}
                className={`px-4.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                  duration === 'week' 
                    ? 'bg-accent text-white font-extrabold shadow-md shadow-accent/20' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                1 Week
              </button>
              <button
                type="button"
                onClick={() => setDuration('month')}
                className={`px-4.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all ${
                  duration === 'month' 
                    ? 'bg-accent text-white font-extrabold shadow-md shadow-accent/20' 
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                1 Month
              </button>
            </div>
          </div>

        </div>

        {/* Dynamic Expiration Banner alert */}
        <AnimatePresence>
          {daysRemaining <= 7 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-[10.5px] text-rose-300 flex items-start gap-3"
            >
              <AlertCircle className="h-4.5 w-4.5 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
              <div className="space-y-1.5 leading-normal flex-1">
                <p className="font-extrabold text-white">
                  REMINDER: Your current routine ends on {expirationDateStr} (in {daysRemaining} days)!
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => alert("Creating routine scheduler workflow.")}
                    className="font-black text-accent hover:text-white uppercase text-[8.5px] tracking-wider transition-colors"
                  >
                    [Plan New Routine]
                  </button>
                  <button 
                    onClick={() => setDaysRemaining(30)}
                    className="font-black text-rose-300 hover:text-white uppercase text-[8.5px] tracking-wider transition-colors"
                  >
                    [Extend Current]
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* 2. SUNDAY WEIGHT LOG REMINDER CARD */}
      <div className="glass-panel p-6 rounded-3xl border border-white/[0.08] bg-white/[0.01] hover:border-indigo-500/35 hover:shadow-[0_0_25px_rgba(99,102,241,0.08)] transition-all duration-300 flex items-center justify-between gap-4">
        <div className="flex gap-3.5 items-center">
          <div className="h-10 w-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/10 flex items-center justify-center text-indigo-400 shrink-0">
            <Scale className="h-5 w-5" />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-white uppercase tracking-wider">Sunday Log Reminder</h4>
            <p className="text-[9.5px] text-text-secondary/50 font-bold mt-0.5">
              Sunday Check-in: Log your weekly body weight
            </p>
            <p className="text-[9px] text-accent font-extrabold mt-1">
              Avg. Weekly Weight: {currentWeight} kg
            </p>
          </div>
        </div>

        {/* Input dialog popup trigger */}
        <div className="relative shrink-0">
          {!showWeightInput ? (
            <button
              onClick={() => setShowWeightInput(true)}
              className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-2xl font-black uppercase text-[9px] tracking-wider transition-all shadow-md shadow-accent/15"
            >
              Log Weight
            </button>
          ) : (
            <form onSubmit={handleWeightSubmit} className="flex gap-1.5 items-center animate-scale-in">
              <input
                type="number"
                step="0.1"
                placeholder="75.0"
                value={inputWeight}
                onChange={(e) => setInputWeight(e.target.value)}
                required
                className="w-16 px-2.5 py-2 text-xs bg-surface/50 border border-border/30 rounded-xl text-white font-bold outline-none"
              />
              <button
                type="submit"
                className="h-8 w-8 bg-success hover:bg-success-hover text-white rounded-xl flex items-center justify-center transition-colors"
              >
                <Check className="h-4 w-4" />
              </button>
            </form>
          )}
        </div>
      </div>

    </div>
  );
};
