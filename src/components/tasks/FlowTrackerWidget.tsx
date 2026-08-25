import React, { useState, useEffect } from 'react';
import { dbService, type TaskFlow, type TaskFlowHistory } from '../../services/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  GitCommit, Trash2, ArrowRight, ArrowLeft, 
  History, Trash, Check, Loader2, ChevronUp, ChevronDown
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlowTrackerWidgetProps {
  taskId: string;
  taskTitle: string;
  onFlowChange: () => void;
}

export const FlowTrackerWidget: React.FC<FlowTrackerWidgetProps> = ({ taskId, taskTitle, onFlowChange }) => {
  const { user } = useAuth();
  const [flow, setFlow] = useState<TaskFlow | null>(null);
  const [history, setHistory] = useState<TaskFlowHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Flow creator state
  const [flowName, setFlowName] = useState('');
  const [editorStages, setEditorStages] = useState<string[]>([]);
  const [newStageName, setNewStageName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadFlow();
  }, [taskId]);

  const loadFlow = async () => {
    if (!user) return;
    try {
      setIsLoading(true);
      const data = await dbService.getTaskFlow(user.id, taskId);
      setFlow(data);
      if (data) {
        const hist = await dbService.getFlowHistory(user.id, data.id);
        setHistory(hist);
      }
    } catch (err) {
      console.error('Failed to load flow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartCreate = () => {
    setFlowName(`${taskTitle} Flow`);
    setEditorStages(['Open', 'Working', 'Created PR', 'Under Review', 'Approved', 'Queued', 'Merged']);
    setIsCreating(true);
  };

  const handleAddEditorStage = () => {
    if (!newStageName.trim()) return;
    setEditorStages(prev => [...prev, newStageName.trim()]);
    setNewStageName('');
  };

  const handleDeleteEditorStage = (idx: number) => {
    setEditorStages(prev => prev.filter((_, i) => i !== idx));
  };

  const handleMoveEditorStage = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === editorStages.length - 1) return;

    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    setEditorStages(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[swapIdx];
      copy[swapIdx] = temp;
      return copy;
    });
  };

  const handleSaveFlow = async () => {
    if (!user || !flowName.trim() || editorStages.length === 0 || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const newFlow = await dbService.createTaskFlow(user.id, taskId, flowName.trim(), editorStages);
      setFlow(newFlow);
      setIsCreating(false);
      onFlowChange();
      await loadFlow();
    } catch (err) {
      console.error('Failed to create flow:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransition = async (targetStageIndex: number) => {
    if (!user || !flow || !flow.stages) return;

    const currentStageIndex = flow.stages.findIndex(s => s.id === flow.current_stage_id);
    if (currentStageIndex === targetStageIndex) return;

    const fromStageId = flow.current_stage_id;
    const toStageId = flow.stages[targetStageIndex].id;

    // Calculate stage updates: mark all stages up to and including targetStageIndex as completed
    const updates = flow.stages.map((stage, idx) => {
      const isCompleted = idx <= targetStageIndex;
      return {
        id: stage.id,
        is_completed: isCompleted,
        completed_at: isCompleted ? (stage.completed_at || new Date().toISOString()) : null
      };
    });

    // Optimistically update UI
    setFlow(prev => {
      if (!prev || !prev.stages) return null;
      return {
        ...prev,
        current_stage_id: toStageId,
        is_completed: targetStageIndex === prev.stages.length - 1,
        stages: prev.stages.map((s, idx) => ({
          ...s,
          is_completed: idx <= targetStageIndex,
          completed_at: idx <= targetStageIndex ? (s.completed_at || new Date().toISOString()) : null
        }))
      };
    });

    try {
      await dbService.transitionFlowStage(user.id, flow.id, fromStageId, toStageId, updates);
      
      // Fire confetti if final stage reached!
      if (targetStageIndex === flow.stages.length - 1) {
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      }

      onFlowChange();
      const hist = await dbService.getFlowHistory(user.id, flow.id);
      setHistory(hist);
    } catch (err) {
      console.error('Failed to transition stage:', err);
      loadFlow(); // Revert on failure
    }
  };

  const handleDeleteFlow = async () => {
    if (!user || !flow) return;
    if (!window.confirm('Are you sure you want to remove the Workflow Tracker from this task? Current progress and history will be lost.')) return;

    try {
      setIsSubmitting(true);
      await dbService.deleteTaskFlow(user.id, flow.id);
      setFlow(null);
      setHistory([]);
      onFlowChange();
    } catch (err) {
      console.error('Failed to delete flow:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-xs text-text-secondary justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-accent" />
        <span>Loading workflow tracker...</span>
      </div>
    );
  }

  // Creator state
  if (isCreating) {
    return (
      <div className="glass-panel p-4.5 rounded-xl border border-border/10 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Configure Flow Tracker</h4>
          <button 
            onClick={() => setIsCreating(false)}
            className="text-[10px] text-text-secondary hover:text-text-primary font-semibold transition-colors"
          >
            Cancel
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] text-text-secondary font-bold uppercase">Flow Name</label>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              placeholder="e.g. Development Workflow"
              className="w-full bg-surface/20 border border-border/20 rounded-lg px-3 py-2 text-xs font-semibold text-text-primary focus:border-accent/40 focus:outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] text-text-secondary font-bold uppercase block">Workflow Stages</label>
            
            {/* Editor stage list */}
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {editorStages.map((st, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface/10 border border-border/5 text-xs font-semibold text-text-primary"
                >
                  <span className="flex-1 truncate">{idx + 1}. {st}</span>
                  <div className="flex items-center gap-0.5">
                    <button 
                      type="button" 
                      onClick={() => handleMoveEditorStage(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-surface rounded text-text-secondary hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleMoveEditorStage(idx, 'down')}
                      disabled={idx === editorStages.length - 1}
                      className="p-1 hover:bg-surface rounded text-text-secondary hover:text-text-primary disabled:opacity-30"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteEditorStage(idx)}
                      className="p-1 hover:bg-surface rounded text-text-secondary hover:text-danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new stage */}
            <div className="flex gap-1.5 mt-2">
              <input
                type="text"
                value={newStageName}
                onChange={(e) => setNewStageName(e.target.value)}
                placeholder="New stage name..."
                className="flex-1 bg-surface/20 border border-border/20 rounded-lg px-3 py-1.5 text-xs font-semibold text-text-primary focus:border-accent/40 focus:outline-none transition-all"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEditorStage();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddEditorStage}
                className="py-1.5 px-3 bg-surface border border-border/20 hover:bg-surface-hover hover:border-border/40 text-text-primary rounded-lg text-xs font-semibold transition-all"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveFlow}
          disabled={!flowName.trim() || editorStages.length === 0 || isSubmitting}
          className="w-full py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-40 disabled:hover:bg-accent transition-all active:scale-[0.98]"
        >
          {isSubmitting ? 'Creating Workflow...' : 'Initialize Workflow'}
        </button>
      </div>
    );
  }

  // Empty state
  if (!flow || !flow.stages) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-border/30 bg-surface/5 space-y-3.5 text-center select-none">
        <div className="h-8 w-8 rounded-lg bg-surface border border-border/10 flex items-center justify-center mx-auto text-text-secondary/70">
          <GitCommit className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-text-primary">Workflow Tracker</h4>
          <p className="text-[10px] text-text-secondary/40 font-semibold mt-0.5 max-w-[240px] mx-auto">
            Enable stage progress flows if this task goes through a multi-step sequence.
          </p>
        </div>
        <button
          onClick={handleStartCreate}
          className="py-1.5 px-3 bg-surface hover:bg-surface-hover/80 text-text-primary border border-border/20 hover:border-border/40 text-[10px] font-bold rounded-lg transition-all"
        >
          + Add Flow Tracker
        </button>
      </div>
    );
  }

  // Flow exists state
  const totalStages = flow.stages.length;
  const completedStages = flow.stages.filter(s => s.is_completed).length;
  const progressPct = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  
  const currentStageIndex = flow.stages.findIndex(s => s.id === flow.current_stage_id);
  const currentStage = flow.stages[currentStageIndex];

  return (
    <div className="space-y-4 select-none">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider">Flow: {flow.name}</h4>
          <p className="text-[10px] text-text-secondary mt-0.5 font-semibold">
            {completedStages} / {totalStages} Stages Completed ({progressPct}%)
          </p>
        </div>

        <button
          onClick={handleDeleteFlow}
          className="p-1.5 text-text-secondary hover:text-danger hover:bg-surface rounded-lg transition-all"
          title="Remove Workflow"
        >
          <Trash className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Progress timeline bar */}
      <div className="w-full h-1.5 bg-surface border border-border/5 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-accent to-purple-500 rounded-full transition-all duration-500"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* HORIZONTAL TIMELINE ON DESKTOP */}
      <div className="hidden md:flex items-center justify-between gap-1 py-4 px-2 overflow-x-auto relative">
        <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-border/20 -translate-y-1/2 -z-10" />
        {flow.stages.map((stage, idx) => {
          const isActive = stage.id === flow.current_stage_id;
          const isDone = stage.is_completed;
          
          return (
            <button
              key={stage.id}
              onClick={() => handleTransition(idx)}
              className="flex flex-col items-center gap-1.5 cursor-pointer group focus:outline-none flex-1 min-w-[50px]"
            >
              <div 
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border transition-all duration-300 ${
                  isActive 
                    ? 'bg-accent border-accent text-white scale-110 shadow-lg shadow-accent/20 animate-pulse'
                    : isDone
                      ? 'bg-success/20 border-success/40 text-success'
                      : 'bg-surface border-border/30 text-text-secondary hover:border-border/60'
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </div>
              <span className={`text-[8px] font-bold uppercase truncate max-w-[65px] text-center ${
                isActive 
                  ? 'text-accent font-extrabold'
                  : isDone
                    ? 'text-text-primary'
                    : 'text-text-secondary/50 group-hover:text-text-secondary'
              }`}>
                {stage.name}
              </span>
            </button>
          );
        })}
      </div>

      {/* VERTICAL TIMELINE ON MOBILE */}
      <div className="md:hidden space-y-3.5 py-2">
        {flow.stages.map((stage, idx) => {
          const isActive = stage.id === flow.current_stage_id;
          const isDone = stage.is_completed;

          return (
            <button
              key={stage.id}
              onClick={() => handleTransition(idx)}
              className="flex items-center gap-3.5 w-full text-left focus:outline-none"
            >
              <div 
                className={`h-5 w-5 rounded-full flex items-center justify-center text-[9px] font-bold border shrink-0 transition-all ${
                  isActive 
                    ? 'bg-accent border-accent text-white scale-105'
                    : isDone
                      ? 'bg-success/20 border-success/40 text-success'
                      : 'bg-surface border-border/30 text-text-secondary'
                }`}
              >
                {isDone ? <Check className="h-3 w-3" /> : idx + 1}
              </div>
              <div className="flex-1 min-w-0 border-b border-border/5 pb-2">
                <p className={`text-xs font-bold ${isActive ? 'text-accent' : 'text-text-primary'}`}>
                  {stage.name}
                </p>
                {stage.completed_at && (
                  <p className="text-[9px] text-text-secondary/50 mt-0.5">
                    Completed {new Date(stage.completed_at).toLocaleDateString()}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls for current step shifting */}
      <div className="flex justify-between items-center py-2 px-3 rounded-xl border border-border/10 bg-surface/10 text-xs">
        <span className="font-bold text-text-secondary text-[11px] uppercase">
          STAGE: <span className="text-text-primary ml-1">{currentStage?.name || 'Unknown'}</span>
        </span>
        
        <div className="flex gap-2">
          <button
            onClick={() => handleTransition(currentStageIndex - 1)}
            disabled={currentStageIndex <= 0}
            className="flex items-center gap-1 py-1.5 px-3 bg-surface hover:bg-surface-hover border border-border/25 disabled:opacity-30 disabled:hover:bg-surface rounded-lg font-semibold active:scale-95 transition-all focus:outline-none"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Prev</span>
          </button>
          <button
            onClick={() => handleTransition(currentStageIndex + 1)}
            disabled={currentStageIndex >= totalStages - 1}
            className="flex items-center gap-1 py-1.5 px-3 bg-accent hover:bg-accent-hover text-white disabled:opacity-30 disabled:hover:bg-accent rounded-lg font-bold active:scale-95 transition-all focus:outline-none"
          >
            <span>Next</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* History transition logs toggler */}
      <div className="space-y-2.5">
        <button
          onClick={() => setShowHistory(prev => !prev)}
          className="flex items-center gap-1 text-[10px] font-bold text-text-secondary hover:text-text-primary uppercase tracking-wider transition-colors cursor-pointer"
        >
          <History className="h-3.5 w-3.5" />
          <span>{showHistory ? 'Hide History Logs' : 'View History Logs'}</span>
        </button>

        {showHistory && (
          <div className="rounded-xl border border-border/10 bg-surface/5 p-3 space-y-2.5 max-h-36 overflow-y-auto">
            {history.length === 0 ? (
              <p className="text-[10px] text-text-secondary/35 text-center font-medium">No transitions logged yet</p>
            ) : (
              history.map(item => (
                <div key={item.id} className="flex justify-between items-start text-[10px] border-b border-border/5 pb-1.5 last:border-0 last:pb-0 font-medium">
                  <div className="text-text-primary">
                    <span className="font-semibold text-text-secondary/70">{item.from_stage_name}</span>
                    <span className="mx-1.5 text-text-secondary/40">→</span>
                    <span className="font-bold text-accent">{item.to_stage_name}</span>
                  </div>
                  <span className="text-[9px] text-text-secondary/50 font-semibold shrink-0">
                    {new Date(item.changed_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
