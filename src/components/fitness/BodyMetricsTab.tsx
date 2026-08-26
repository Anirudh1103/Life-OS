import React, { useState, useMemo, useEffect } from 'react';
import { dbService, type BodyMeasurement } from '../../services/supabase';
import { Loader2, Plus, Calendar, BarChart3, LineChart, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BodyMetricsTabProps {
  measurements: BodyMeasurement[];
  userId: string;
  onRefreshMetrics: () => void;
}

type TimeFilter = '1M' | '3M' | '6M' | '1Y' | 'All';
type MetricTab = 'weight' | 'BMI';

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
  const [logDate, setLogDate] = useState('');

  useEffect(() => {
    setLogDate(new Date().toISOString().split('T')[0]);
  }, [showLogModal]);

  // 1. Fetch latest weight & BMI
  const latestMetrics = useMemo(() => {
    const getLatest = (type: string) => {
      const filtered = measurements.filter(m => m.metric_type === type);
      if (filtered.length === 0) return null;
      return filtered[filtered.length - 1]; // last item is latest
    };

    return {
      weight: getLatest('weight'),
      bmi: getLatest('BMI')
    };
  }, [measurements]);

  // 2. Calculate monthly change metrics (change over last 30 days)
  const monthlyChanges = useMemo(() => {
    const getChange = (type: string) => {
      const filtered = measurements.filter(m => m.metric_type === type);
      if (filtered.length < 2) return { value: 0, direction: 'flat' as const };

      const latest = filtered[filtered.length - 1];
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Find the reading closest to 30 days ago
      let comparisonReading = filtered[0];
      let minDiff = Math.abs(new Date(comparisonReading.recorded_at).getTime() - thirtyDaysAgo.getTime());

      for (let i = 0; i < filtered.length - 1; i++) {
        const diff = Math.abs(new Date(filtered[i].recorded_at).getTime() - thirtyDaysAgo.getTime());
        if (diff < minDiff) {
          minDiff = diff;
          comparisonReading = filtered[i];
        }
      }

      const diffVal = latest.value - comparisonReading.value;
      
      return {
        value: Number(diffVal.toFixed(1)),
        direction: diffVal < 0 ? ('down' as const) : diffVal > 0 ? ('up' as const) : ('flat' as const)
      };
    };

    return {
      weight: getChange('weight'),
      bmi: getChange('BMI')
    };
  }, [measurements]);

  // 3. Filter history based on range
  const filteredHistory = useMemo(() => {
    const activeData = measurements.filter(m => m.metric_type === activeMetricTab);
    if (activeData.length === 0) return [];
    if (timeFilter === 'All') return activeData;

    const now = new Date();
    const cutoff = new Date();

    switch (timeFilter) {
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

  // 4. Chart coordinates
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
      
      const dateLabel = new Date(h.recorded_at).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric'
      });

      return { x, y, value: h.value, date: dateLabel };
    });
  }, [filteredHistory]);

  const handleLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weight) return;

    setIsSubmitting(true);
    try {
      const recordedAt = new Date(`${logDate}T12:00:00`).toISOString();
      
      // Save weight
      await dbService.createBodyMeasurement({
        user_id: userId,
        recorded_at: recordedAt,
        metric_type: 'weight',
        value: parseFloat(weight),
        unit: 'kg',
        source: 'cultfit_scale',
        notes: null
      });

      // Save BMI (if entered)
      if (bmi) {
        await dbService.createBodyMeasurement({
          user_id: userId,
          recorded_at: recordedAt,
          metric_type: 'BMI',
          value: parseFloat(bmi),
          unit: 'index',
          source: 'cultfit_scale',
          notes: null
        });
      }

      setWeight('');
      setBmi('');
      onRefreshMetrics();
      setShowLogModal(false);
      confetti({ particleCount: 40, spread: 30, origin: { y: 0.85 } });
    } catch (err) {
      console.error('Failed to log scale metrics:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getBmiStatus = (val?: number) => {
    if (!val) return '—';
    if (val < 18.5) return 'Underweight';
    if (val < 24.9) return 'Normal';
    if (val < 29.9) return 'Overweight';
    return 'Obese';
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-border/10 pb-4">
        <div>
          <h2 className="text-sm font-black text-text-primary uppercase tracking-wider">Body Composition Metrics</h2>
          <p className="text-[10px] text-text-secondary/60 mt-0.5 font-medium">Log body weight and BMI levels over time.</p>
        </div>
        
        <button
          onClick={() => setShowLogModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
        >
          <Plus className="h-4 w-4" />
          <span>Log Measurements</span>
        </button>
      </div>

      {/* 1. CARDS OVERVIEW ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Card 1: Weight */}
        <div className="glass-panel p-5 rounded-3xl border border-border/10 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-black text-text-secondary/60 tracking-wider">Current Weight</p>
            <h3 className="text-2xl font-black text-text-primary mt-1.5 flex items-baseline gap-1">
              <span>{latestMetrics.weight ? latestMetrics.weight.value : '—'}</span>
              <span className="text-xs font-semibold text-text-secondary">kg</span>
            </h3>
            <p className="text-[8px] font-bold text-text-secondary/40 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {latestMetrics.weight 
                  ? `Logged ${new Date(latestMetrics.weight.recorded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` 
                  : 'No measurements'}
              </span>
            </p>
          </div>

          <div className={`h-8 px-2 border rounded-xl flex items-center gap-1 text-[10px] font-black uppercase ${
            monthlyChanges.weight.direction === 'down' ? 'text-success bg-success/10 border-success/15' :
            monthlyChanges.weight.direction === 'up' ? 'text-warning bg-warning/10 border-warning/15' :
            'text-text-secondary bg-surface border-border/20'
          }`}>
            {monthlyChanges.weight.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            {monthlyChanges.weight.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {monthlyChanges.weight.direction === 'flat' && <Minus className="h-3.5 w-3.5" />}
            <span>{monthlyChanges.weight.value === 0 ? 'Flat' : `${Math.abs(monthlyChanges.weight.value)} kg`}</span>
          </div>
        </div>

        {/* Card 2: BMI */}
        <div className="glass-panel p-5 rounded-3xl border border-border/10 flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[9px] uppercase font-black text-text-secondary/60 tracking-wider">Current BMI</p>
            <h3 className="text-2xl font-black text-text-primary mt-1.5 flex items-baseline gap-1">
              <span>{latestMetrics.bmi ? latestMetrics.bmi.value : '—'}</span>
              {latestMetrics.bmi && (
                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded ml-1 uppercase">
                  {getBmiStatus(latestMetrics.bmi.value)}
                </span>
              )}
            </h3>
            <p className="text-[8px] font-bold text-text-secondary/40 mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>
                {latestMetrics.bmi 
                  ? `Logged ${new Date(latestMetrics.bmi.recorded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}` 
                  : 'No measurements'}
              </span>
            </p>
          </div>

          <div className={`h-8 px-2 border rounded-xl flex items-center gap-1 text-[10px] font-black uppercase ${
            monthlyChanges.bmi.direction === 'down' ? 'text-success bg-success/10 border-success/15' :
            monthlyChanges.bmi.direction === 'up' ? 'text-warning bg-warning/10 border-warning/15' :
            'text-text-secondary bg-surface border-border/20'
          }`}>
            {monthlyChanges.bmi.direction === 'down' && <TrendingDown className="h-3.5 w-3.5" />}
            {monthlyChanges.bmi.direction === 'up' && <TrendingUp className="h-3.5 w-3.5" />}
            {monthlyChanges.bmi.direction === 'flat' && <Minus className="h-3.5 w-3.5" />}
            <span>{monthlyChanges.bmi.value === 0 ? 'Flat' : `${Math.abs(monthlyChanges.bmi.value)}`}</span>
          </div>
        </div>

        {/* Card 3: Summary Progress info */}
        <div className="glass-panel p-5 rounded-3xl border border-border/10 bg-accent/[0.02] flex items-center gap-3">
          <div className="space-y-1">
            <span className="text-[8px] font-black uppercase tracking-wider text-accent">Monthly Trend Progress</span>
            <p className="text-[11px] font-medium text-text-primary leading-normal mt-1">
              {monthlyChanges.weight.direction === 'down' 
                ? `You have lost ${Math.abs(monthlyChanges.weight.value)} kg in weight over the last 30 days.`
                : monthlyChanges.weight.direction === 'up'
                  ? `Your weight increased by ${monthlyChanges.weight.value} kg in the last 30 days.`
                  : "Your weight has remained stable over the last 30 days."}
            </p>
          </div>
        </div>

      </div>

      {/* 2. HISTORY GRAPH & SELECTION DECK */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Historical Line Chart (Takes 2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-5 rounded-3xl border border-border/10 space-y-5">
            
            <div className="flex justify-between items-center border-b border-border/10 pb-4">
              
              {/* Metric filter buttons */}
              <div className="flex gap-2">
                {[
                  { label: 'Weight Progress', type: 'weight' },
                  { label: 'BMI Progress', type: 'BMI' }
                ].map(tab => (
                  <button
                    key={tab.type}
                    onClick={() => setActiveMetricTab(tab.type as MetricTab)}
                    className={`px-3 py-1.5 border rounded-xl font-bold transition-all text-[9px] uppercase tracking-wider ${
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
              <div className="flex bg-surface rounded-xl p-0.5 border border-border/10 text-[9px] font-bold">
                {(['1M', '3M', '6M', '1Y', 'All'] as TimeFilter[]).map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeFilter(tf)}
                    className={`px-2.5 py-1 rounded-lg transition-all uppercase tracking-wider ${
                      timeFilter === tf
                        ? 'bg-accent text-white'
                        : 'text-text-secondary/65 hover:text-text-primary'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

            </div>

            {/* Line chart svg block */}
            {filteredHistory.length < 2 ? (
              <div className="border border-dashed border-border/25 rounded-2xl p-16 text-center text-text-secondary/50 font-bold select-none text-[10px] flex flex-col items-center justify-center gap-1.5">
                <LineChart className="h-6 w-6 text-text-secondary/25" />
                <p>Not enough historical data points available yet.</p>
                <p className="text-[9px] text-text-secondary/35 mt-0.5">Log a few daily measurements to unlock history trends.</p>
              </div>
            ) : (
              <div className="relative bg-surface-hover/10 rounded-2xl p-3 border border-border/5 h-48">
                <svg className="w-full h-full text-accent" viewBox="0 0 500 150">
                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2="480" y2="20" stroke="rgba(255,255,255,0.03)" />
                  <line x1="20" y1="75" x2="480" y2="75" stroke="rgba(255,255,255,0.03)" />
                  <line x1="20" y1="130" x2="480" y2="130" stroke="rgba(255,255,255,0.03)" />

                  {/* Line Curve Path */}
                  <path
                    d={`M ${chartCoordinates.map(p => `${p.x},${p.y}`).join(' L ')}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Gradient shading */}
                  <path
                    d={`M ${chartCoordinates[0].x},130 L ${chartCoordinates.map(p => `${p.x},${p.y}`).join(' L ')} L ${chartCoordinates[chartCoordinates.length - 1].x},130 Z`}
                    fill="url(#bodyAreaGradient)"
                    opacity="0.12"
                  />

                  {/* Interactive Circles */}
                  {chartCoordinates.map((pt, idx) => (
                    <g key={idx} className="group/dot cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r="3.5"
                        className="fill-surface stroke-accent"
                        strokeWidth="2"
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
                        className="text-[9px] font-black fill-text-primary"
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
                <div className="absolute bottom-2 left-5 right-5 flex justify-between text-[8px] font-bold text-text-secondary/40">
                  {chartCoordinates.map((pt, idx) => (
                    <span key={idx}>{pt.date}</span>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Side: Measurements list */}
        <div className="glass-panel p-5 rounded-3xl border border-border/10 flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2.5 border-b border-border/10 pb-2 flex items-center gap-1.5">
              <BarChart3 className="h-4.5 w-4.5 text-accent" />
              <span>Measurements List</span>
            </h3>
            
            <div className="divide-y divide-border/10 text-xs max-h-64 overflow-y-auto pr-1">
              {measurements.filter(m => m.metric_type === activeMetricTab).slice().reverse().map(m => (
                <div key={m.id} className="flex justify-between py-2.5 font-semibold">
                  <span className="text-text-secondary font-medium">
                    {new Date(m.recorded_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  <span className="font-extrabold text-text-primary">{m.value} {m.unit}</span>
                </div>
              ))}
              {measurements.filter(m => m.metric_type === activeMetricTab).length === 0 && (
                <div className="text-center py-8 text-text-secondary/40 italic">
                  No measurements recorded.
                </div>
              )}
            </div>
          </div>

          <p className="text-[8px] font-bold text-text-secondary/40 italic text-center">
            Scale readings synchronized
          </p>
        </div>

      </div>

      {/* ========================================================
          MODAL: LOG SCALE WEIGHT / BMI MEASUREMENTS
          ======================================================== */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm select-none animate-fade-in text-xs">
          <div className="relative w-full max-w-sm bg-surface border border-border/20 rounded-3xl shadow-xl overflow-hidden animate-scale-in">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 bg-surface/50">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Log Scale Measurements</h3>
            </div>

            <form onSubmit={handleLogSubmit} className="p-5 space-y-4">
              
              <div className="space-y-1.5">
                <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider">Date</label>
                <input
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="10"
                    max="300"
                    placeholder="e.g. 72.5"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none font-bold"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[9px] uppercase font-bold text-text-secondary/60 tracking-wider">BMI (optional)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 22.4"
                    value={bmi}
                    onChange={(e) => setBmi(e.target.value)}
                    className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3.5 py-2.5 text-text-primary focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="flex-1 py-2.5 border border-border/30 hover:bg-surface-hover/30 text-text-secondary font-bold uppercase text-[10px] rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 bg-accent hover:bg-accent-hover text-white font-black uppercase text-[10px] rounded-xl transition-all shadow-md"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </span>
                  ) : (
                    <span>Save Log</span>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
