import React, { useState, useMemo, useEffect } from 'react';
import { dbService, type BodyMeasurement } from '../../services/supabase';
import { Loader2, Plus, Calendar, BarChart3, LineChart } from 'lucide-react';

interface BodyMetricsTabProps {
  measurements: BodyMeasurement[];
  userId: string;
  onRefreshMetrics: () => void;
}

type TimeFilter = '1W' | '1M' | '3M' | '6M' | '1Y';
type MetricTab = 'weight' | 'BMI' | 'body_fat' | 'muscle_mass';

export const BodyMetricsTab: React.FC<BodyMetricsTabProps> = ({
  measurements,
  userId,
  onRefreshMetrics
}) => {
  const [activeMetricTab, setActiveMetricTab] = useState<MetricTab>('weight');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('1M');
  const [showLogModal, setShowLogModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [weight, setWeight] = useState('');
  const [bmi, setBmi] = useState('');
  const [bodyFat, setBodyFat] = useState('');
  const [muscleMass, setMuscleMass] = useState('');
  const [water, setWater] = useState('');
  const [boneMass, setBoneMass] = useState('');
  const [visceralFat, setVisceralFat] = useState('');
  const [bmr, setBmr] = useState('');
  const [logDate, setLogDate] = useState('');

  useEffect(() => {
    setLogDate(new Date().toISOString().split('T')[0]);
  }, [showLogModal]);

  // 1. Get latest values for metrics overview cards
  const latestMetrics = useMemo(() => {
    const getLatest = (type: string) => {
      const filtered = measurements.filter(m => m.metric_type === type);
      if (filtered.length === 0) return null;
      // Sorted asc by recorded_at in supabase, so last item is latest
      return filtered[filtered.length - 1];
    };

    return {
      weight: getLatest('weight'),
      bmi: getLatest('BMI'),
      bodyFat: getLatest('body_fat'),
      muscleMass: getLatest('muscle_mass'),
      water: getLatest('water'),
      boneMass: getLatest('bone_mass'),
      visceralFat: getLatest('visceral_fat'),
      bmr: getLatest('BMR')
    };
  }, [measurements]);

  // 2. Filter historical data based on time range and active tab
  const filteredHistory = useMemo(() => {
    const activeData = measurements.filter(m => m.metric_type === activeMetricTab);
    if (activeData.length === 0) return [];

    const now = new Date();
    let cutoff = new Date();

    switch (timeFilter) {
      case '1W':
        cutoff.setDate(now.getDate() - 7);
        break;
      case '1M':
        cutoff.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        cutoff.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        cutoff.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        cutoff.setFullYear(now.getFullYear() - 1);
        break;
    }

    return activeData.filter(m => new Date(m.recorded_at) >= cutoff);
  }, [measurements, activeMetricTab, timeFilter]);

  // 3. SVG Coordinates calculation
  const chartCoordinates = useMemo(() => {
    if (filteredHistory.length < 2) return [];

    const width = 500;
    const height = 150;
    const padding = 20;

    const xRange = width - padding * 2;
    const yRange = height - padding * 2;

    const values = filteredHistory.map(h => h.value);
    const minVal = Math.max(Math.min(...values) - 1, 0);
    const maxVal = Math.max(...values) + 1;
    const vDelta = maxVal - minVal === 0 ? 1 : maxVal - minVal;

    return filteredHistory.map((h, idx) => {
      const x = padding + (idx / (filteredHistory.length - 1)) * xRange;
      const y = height - padding - ((h.value - minVal) / vDelta) * yRange;
      
      const dateLabel = new Date(h.recorded_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      return { x, y, value: h.value, date: dateLabel };
    });
  }, [filteredHistory]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return; // Weight is mandatory

    setIsSubmitting(true);
    try {
      const recordedAt = new Date(`${logDate}T12:00:00`).toISOString();
      const pushLog = async (type: string, val: string, unit: string) => {
        if (!val) return;
        await dbService.createBodyMeasurement({
          user_id: userId,
          recorded_at: recordedAt,
          metric_type: type,
          value: parseFloat(val),
          unit,
          source: 'cultfit_scale',
          notes: null
        });
      };

      await pushLog('weight', weight, 'kg');
      await pushLog('BMI', bmi, 'index');
      await pushLog('body_fat', bodyFat, '%');
      await pushLog('muscle_mass', muscleMass, 'kg');
      await pushLog('water', water, '%');
      await pushLog('bone_mass', boneMass, 'kg');
      await pushLog('visceral_fat', visceralFat, 'index');
      await pushLog('BMR', bmr, 'kcal/day');

      setWeight('');
      setBmi('');
      setBodyFat('');
      setMuscleMass('');
      setWater('');
      setBoneMass('');
      setVisceralFat('');
      setBmr('');
      
      onRefreshMetrics();
      setShowLogModal(false);
    } catch (err) {
      console.error('Failed to log metrics', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Status evaluators
  const getBmiStatus = (val?: number) => {
    if (!val) return '—';
    if (val < 18.5) return 'Underweight';
    if (val < 24.9) return 'Normal';
    if (val < 29.9) return 'Overweight';
    return 'Obese';
  };

  const getFatStatus = (val?: number) => {
    if (!val) return '—';
    if (val < 10) return 'Athletic';
    if (val < 18) return 'Good';
    if (val < 24) return 'Acceptable';
    return 'High';
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Body Metrics</h2>
          <p className="text-[10px] text-text-secondary/60 mt-0.5 font-medium">Track your body composition & health.</p>
        </div>
        
        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
        >
          <Plus className="h-4 w-4" />
          <span>Log Weight</span>
        </button>
      </div>

      {/* 1. TOP CARDS ROW */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Card 1: Weight */}
        <div className="glass-panel p-4.5 rounded-2xl border border-border/10">
          <p className="text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider">Weight</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-text-primary">
              {latestMetrics.weight ? latestMetrics.weight.value : '—'}
            </span>
            <span className="text-[10px] font-semibold text-text-secondary/70">kg</span>
          </div>
          <p className="text-[8px] font-bold text-text-secondary/40 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {latestMetrics.weight ? new Date(latestMetrics.weight.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No data'}
          </p>
        </div>

        {/* Card 2: BMI */}
        <div className="glass-panel p-4.5 rounded-2xl border border-border/10">
          <p className="text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider">BMI</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-text-primary">
              {latestMetrics.bmi ? latestMetrics.bmi.value : '—'}
            </span>
            {latestMetrics.bmi && (
              <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1 rounded ml-1 uppercase">
                {getBmiStatus(latestMetrics.bmi.value)}
              </span>
            )}
          </div>
          <p className="text-[8px] font-bold text-text-secondary/40 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {latestMetrics.bmi ? new Date(latestMetrics.bmi.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No data'}
          </p>
        </div>

        {/* Card 3: Body Fat */}
        <div className="glass-panel p-4.5 rounded-2xl border border-border/10">
          <p className="text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider">Body Fat</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-text-primary">
              {latestMetrics.bodyFat ? `${latestMetrics.bodyFat.value}%` : '—'}
            </span>
            {latestMetrics.bodyFat && (
              <span className="text-[9px] font-black text-purple-400 bg-purple-500/10 px-1 rounded ml-1 uppercase">
                {getFatStatus(latestMetrics.bodyFat.value)}
              </span>
            )}
          </div>
          <p className="text-[8px] font-bold text-text-secondary/40 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {latestMetrics.bodyFat ? new Date(latestMetrics.bodyFat.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No data'}
          </p>
        </div>

        {/* Card 4: Muscle Mass */}
        <div className="glass-panel p-4.5 rounded-2xl border border-border/10">
          <p className="text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider">Muscle Mass</p>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-xl font-black text-text-primary">
              {latestMetrics.muscleMass ? latestMetrics.muscleMass.value : '—'}
            </span>
            <span className="text-[10px] font-semibold text-text-secondary/70">kg</span>
          </div>
          <p className="text-[8px] font-bold text-text-secondary/40 mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {latestMetrics.muscleMass ? new Date(latestMetrics.muscleMass.recorded_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'No data'}
          </p>
        </div>

      </div>

      {/* 2. HISTORY GRAPH & SELECTION DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5">
        
        {/* Left Side: Historical Line Chart (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 rounded-2xl border border-border/10 space-y-5">
            
            {/* Filter controls */}
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              
              {/* Metric filter buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  { label: 'Weight', type: 'weight' },
                  { label: 'BMI', type: 'BMI' },
                  { label: 'Body Fat', type: 'body_fat' },
                  { label: 'Muscle Mass', type: 'muscle_mass' }
                ].map(tab => (
                  <button
                    key={tab.type}
                    onClick={() => setActiveMetricTab(tab.type as MetricTab)}
                    className={`px-3 py-1.5 border rounded-lg font-bold transition-all text-[9.5px] uppercase tracking-wider ${
                      activeMetricTab === tab.type
                        ? 'bg-accent/15 border-accent/25 text-accent'
                        : 'bg-surface hover:bg-surface-hover border-border/20 text-text-secondary'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Time window filters */}
              <div className="flex bg-surface rounded-lg p-0.5 border border-border/10 text-[9px] font-bold">
                {(['1W', '1M', '3M', '6M', '1Y'] as TimeFilter[]).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(tf)}
                    className={`px-2 py-1 rounded transition-all uppercase tracking-wider ${
                      timeFilter === tf
                        ? 'bg-accent text-white'
                        : 'text-text-secondary/60 hover:text-text-primary'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

            </div>

            {/* Line chart svg block */}
            {filteredHistory.length < 2 ? (
              <div className="border border-dashed border-border/25 rounded-2xl p-16 text-center text-text-secondary/50 font-bold select-none text-[10px] flex flex-col items-center justify-center gap-1">
                <LineChart className="h-6 w-6 text-text-secondary/35" />
                <p>Not enough historical data points available yet.</p>
                <p className="text-[9px] text-text-secondary/30 mt-0.5">Log a few daily measurements to unlock history trends.</p>
              </div>
            ) : (
              <div className="relative bg-surface-hover/10 rounded-xl p-3 border border-border/5 h-44">
                <svg className="w-full h-full text-accent" viewBox="0 0 500 150">
                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />
                  <line x1="20" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.05)" strokeDasharray="3" />

                  {/* Line Curve Path */}
                  <path
                    d={`M ${chartCoordinates.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Gradient shading */}
                  <path
                    d={`M ${chartCoordinates[0].x},130 L ${chartCoordinates.map(p => `${p.x},${p.y}`).join(' L ')} L ${chartCoordinates[chartCoordinates.length - 1].x},130 Z`}
                    fill="url(#bodyAreaGradient)"
                    opacity="0.1"
                  />

                  {/* Interactive Circles */}
                  {chartCoordinates.map((pt, idx) => (
                    <g key={idx} className="group/dot cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="4"
                        className="fill-surface stroke-accent"
                        strokeWidth="2.5"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="8"
                        className="fill-accent/20 opacity-0 group-hover/dot:opacity-100 transition-opacity"
                      />
                      <text
                        x={pt.x}
                        y={pt.y - 9}
                        textAnchor="middle"
                        className="text-[10px] font-black fill-text-primary"
                      >
                        {pt.value}
                      </text>
                    </g>
                  ))}

                  <defs>
                    <linearGradient id="bodyAreaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgb(167, 139, 250)" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Date Labels */}
                <div className="absolute bottom-1.5 left-5 right-5 flex justify-between text-[8px] font-bold text-text-secondary/40">
                  {chartCoordinates.map((pt, idx) => (
                    <span key={idx}>{pt.date}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Cultfit measurements table listing */}
        <div className="glass-panel p-5 rounded-2xl border border-border/10 flex flex-col space-y-4 justify-between">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5 border-b border-border/10 pb-2 flex items-center gap-1.5">
              <BarChart3 className="h-4.5 w-4.5 text-accent" />
              <span>Composition Breakdown</span>
            </h3>
            
            <div className="divide-y divide-border/10 text-xs">
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Weight</span>
                <span className="font-bold text-text-primary">{latestMetrics.weight ? `${latestMetrics.weight.value} kg` : '—'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">BMI</span>
                <span className="font-bold text-text-primary">{latestMetrics.bmi ? latestMetrics.bmi.value : '—'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Body Fat</span>
                <span className="font-bold text-text-primary">{latestMetrics.bodyFat ? `${latestMetrics.bodyFat.value} %` : '—'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Muscle Mass</span>
                <span className="font-bold text-text-primary">{latestMetrics.muscleMass ? `${latestMetrics.muscleMass.value} kg` : '—'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Body Water</span>
                <span className="font-bold text-text-primary">{latestMetrics.water ? `${latestMetrics.water.value} %` : '—'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Bone Mass</span>
                <span className="font-bold text-text-primary">{latestMetrics.boneMass ? `${latestMetrics.boneMass.value} kg` : '—'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Visceral Fat Index</span>
                <span className="font-bold text-text-primary">{latestMetrics.visceralFat ? latestMetrics.visceralFat.value : '—'}</span>
              </div>
              <div className="flex justify-between py-2.5">
                <span className="text-text-secondary font-medium">Basal Metabolic Rate (BMR)</span>
                <span className="font-bold text-text-primary">{latestMetrics.bmr ? `${latestMetrics.bmr.value} kcal` : '—'}</span>
              </div>
            </div>
          </div>

          <p className="text-[8px] font-bold text-text-secondary/40 italic text-center">
            Last updated: {latestMetrics.weight ? new Date(latestMetrics.weight.recorded_at).toLocaleDateString() : '—'}
          </p>
        </div>

      </div>

      {/* 3. LOG WEIGHT MODAL MODAL */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-surface border border-border/20 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 bg-surface/50">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Log Scale Measurements</h3>
              <button 
                onClick={() => setShowLogModal(false)}
                className="p-1 rounded-lg hover:bg-surface-hover/80 text-text-secondary transition-colors focus:outline-none"
              >
                Cancel
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="p-5 space-y-4 text-xs">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-1">Date</label>
                  <input
                    type="date"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max="300"
                    placeholder="e.g. 72.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-border/10 pt-3">
                <p className="text-[8px] font-extrabold uppercase text-accent/80 tracking-wider mb-2">Cultfit Scale Indicators (Optional)</p>
                
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[8px] font-bold text-text-secondary/60 mb-1">BMI</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="23.4"
                      value={bmi}
                      onChange={(e) => setBmi(e.target.value)}
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2 py-1 text-center text-text-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-text-secondary/60 mb-1">Body Fat %</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="16.2"
                      value={bodyFat}
                      onChange={(e) => setBodyFat(e.target.value)}
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2 py-1 text-center text-text-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-text-secondary/60 mb-1">Muscle (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="56.3"
                      value={muscleMass}
                      onChange={(e) => setMuscleMass(e.target.value)}
                      className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2 py-1 text-center text-text-primary focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[8px] font-bold text-text-secondary/60 mb-1">Water %</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="54.1"
                    value={water}
                    onChange={(e) => setWater(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2 py-1 text-center text-text-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-text-secondary/60 mb-1">Bone Mass (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2.8"
                    value={boneMass}
                    onChange={(e) => setBoneMass(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2 py-1 text-center text-text-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[8px] font-bold text-text-secondary/60 mb-1">Visceral Fat</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="7"
                    value={visceralFat}
                    onChange={(e) => setVisceralFat(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2 py-1 text-center text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-bold text-text-secondary/60 mb-1">BMR (kcal/day)</label>
                <input
                  type="number"
                  placeholder="1680"
                  value={bmr}
                  onChange={(e) => setBmr(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1 text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/10">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-border/20 text-text-secondary hover:text-text-primary hover:bg-surface-hover/40 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1 px-4.5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Save Measurements</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
