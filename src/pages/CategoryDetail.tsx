import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type Category, type Topic, type Flashcard } from '../services/supabase';
import { 
  ArrowLeft, 
  BookOpen,
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Circle, 
  ChevronDown, 
  ChevronUp, 
  Bookmark, 
  Calendar,
  FileText,
  X,
  HelpCircle,
  Code2,
  Terminal,
  Cpu,
  Database,
  Brain,
  Globe,
  Layers,
  GraduationCap
} from 'lucide-react';

const renderCategoryIcon = (icon: string) => {
  const iconClass = "h-6 w-6 text-accent";
  switch (icon) {
    case 'BookOpen':
      return <BookOpen className={iconClass} />;
    case 'Code2':
      return <Code2 className={iconClass} />;
    case 'Terminal':
      return <Terminal className={iconClass} />;
    case 'Cpu':
      return <Cpu className={iconClass} />;
    case 'Database':
      return <Database className={iconClass} />;
    case 'Brain':
      return <Brain className={iconClass} />;
    case 'Globe':
      return <Globe className={iconClass} />;
    case 'Layers':
      return <Layers className={iconClass} />;
    case 'GraduationCap':
      return <GraduationCap className={iconClass} />;
    default:
      return <span className="text-2xl select-none">{icon}</span>;
  }
};
import confetti from 'canvas-confetti';

export const CategoryDetail: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // CRUD modals state
  const [isTopicModalOpen, setIsTopicModalOpen] = useState(false);
  const [topicModalMode, setTopicModalMode] = useState<'create' | 'edit'>('create');
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Forms state
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [topicNotes, setTopicNotes] = useState('');

  // Flashcards drawer state
  const [activeFlashcardTopic, setActiveFlashcardTopic] = useState<Topic | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [fcQuestion, setFcQuestion] = useState('');
  const [fcAnswer, setFcAnswer] = useState('');
  const [fcDifficulty, setFcDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [isFcLoading, setIsFcLoading] = useState(false);

  const loadData = async () => {
    if (!user || !categoryId) return;
    setIsLoading(true);
    setError(null);
    try {
      const cats = await dbService.getCategories(user.id);
      const matched = cats.find(c => c.id === categoryId);
      if (!matched) {
        setError('Category not found.');
        return;
      }
      setCategory(matched);

      const allTopics = await dbService.getTopics(user.id);
      const catTopics = allTopics.filter(t => t.category_id === categoryId);
      setTopics(catTopics);
    } catch (err: any) {
      console.error('Error fetching category details', err);
      setError('Unable to load category details.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, categoryId]);

  // Calculations
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.is_completed).length;
  const progressPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Topic Completion toggling
  const handleToggleComplete = async (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;

    const newStatus = !topic.is_completed;
    
    // Optimistic UI update
    setTopics(prev => prev.map(t => t.id === topic.id ? { ...t, is_completed: newStatus } : t));

    try {
      await dbService.updateTopic(user.id, topic.id, { is_completed: newStatus });
      
      if (newStatus) {
        // Fire confetti!
        confetti({
          particleCount: 60,
          spread: 40,
          origin: { y: 0.8 },
          colors: ['#6366F1', '#8B5CF6', '#10B981'],
        });

        // If this completion makes it 100%, trigger a grand shower!
        const willBeCompletedCount = topics.filter(t => t.is_completed).length + (topic.is_completed ? -1 : 1);
        if (willBeCompletedCount === totalTopics) {
          setTimeout(() => {
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 },
              colors: ['#6366F1', '#8B5CF6', '#10B981', '#F59E0B'],
            });
          }, 400);
        }
      }
      
      // Reload in background to update completed timestamps and activity feed
      const allTopics = await dbService.getTopics(user.id);
      const catTopics = allTopics.filter(t => t.category_id === categoryId);
      setTopics(catTopics);
    } catch (err) {
      console.error(err);
      // Rollback
      loadData();
    }
  };

  // Topic CRUD operations
  const openCreateTopicModal = () => {
    setTopicModalMode('create');
    setTopicTitle('');
    setTopicDesc('');
    setTopicNotes('');
    setIsTopicModalOpen(true);
  };

  const openEditTopicModal = (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTopic(topic);
    setTopicModalMode('edit');
    setTopicTitle(topic.title);
    setTopicDesc(topic.description || '');
    setTopicNotes(topic.notes || '');
    setIsTopicModalOpen(true);
  };

  const openDeleteConfirm = (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTopic(topic);
    setIsDeleteConfirmOpen(true);
  };

  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !categoryId || !topicTitle.trim()) return;

    try {
      if (topicModalMode === 'create') {
        await dbService.createTopic({
          category_id: categoryId,
          user_id: user.id,
          title: topicTitle.trim(),
          description: topicDesc.trim() || null,
          notes: topicNotes.trim() || null,
          is_completed: false,
          completed_at: null,
          sort_order: topics.length,
        });
      } else if (topicModalMode === 'edit' && selectedTopic) {
        await dbService.updateTopic(user.id, selectedTopic.id, {
          title: topicTitle.trim(),
          description: topicDesc.trim() || null,
          notes: topicNotes.trim() || null,
        });
      }
      setIsTopicModalOpen(false);
      setSelectedTopic(null);
      setTopicTitle('');
      setTopicDesc('');
      setTopicNotes('');
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to save topic.');
    }
  };

  const handleDeleteTopic = async () => {
    if (!user || !selectedTopic) return;
    try {
      await dbService.deleteTopic(user.id, selectedTopic.id);
      setIsDeleteConfirmOpen(false);
      setSelectedTopic(null);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete topic.');
    }
  };

  // Flashcard drawer methods
  const openFlashcardDrawer = async (topic: Topic, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveFlashcardTopic(topic);
    setIsFcLoading(true);
    setFcQuestion('');
    setFcAnswer('');
    setFcDifficulty('easy');

    try {
      const cards = await dbService.getFlashcards(user!.id, topic.id);
      setFlashcards(cards);
    } catch (err) {
      console.error(err);
    } finally {
      setIsFcLoading(false);
    }
  };

  const handleAddFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeFlashcardTopic || !fcQuestion.trim() || !fcAnswer.trim()) return;

    try {
      const newCard = await dbService.createFlashcard({
        topic_id: activeFlashcardTopic.id,
        user_id: user.id,
        question: fcQuestion.trim(),
        answer: fcAnswer.trim(),
        difficulty: fcDifficulty,
        last_reviewed_at: null,
        next_review_at: null,
      });

      setFlashcards(prev => [...prev, newCard]);
      setFcQuestion('');
      setFcAnswer('');
      setFcDifficulty('easy');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFlashcard = async (id: string) => {
    if (!user) return;
    try {
      await dbService.deleteFlashcard(user.id, id);
      setFlashcards(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-success bg-success/10 border-success/20';
      case 'medium': return 'text-warning bg-warning/10 border-warning/20';
      case 'hard': return 'text-danger bg-danger/10 border-danger/20';
      default: return 'text-text-secondary bg-surface-hover/30';
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl mx-auto animate-fade-in select-none relative">
      
      {/* Top navbar links */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/learning')}
          className="p-2 rounded-xl border border-border/30 bg-surface/20 text-text-secondary hover:text-text-primary hover:bg-surface-hover/30 transition-all focus:outline-none"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-semibold text-text-secondary">Back to Categories</span>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-950/20 border border-red-500/20 text-red-200 text-xs flex justify-between items-center">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 font-bold hover:text-red-300">Dismiss</button>
        </div>
      )}

      {/* Main Category Header details */}
      {category && (
        <div className="glass-panel p-6 rounded-2xl space-y-4 animate-scale-in">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-surface border border-border/20 flex items-center justify-center text-3xl select-none shadow-sm">
                {renderCategoryIcon(category.icon || '📚')}
              </div>
              <div>
                <h2 className="text-xl font-extrabold tracking-tight text-text-primary">
                  {category.name}
                </h2>
                <p className="text-xs text-text-secondary mt-0.5">
                  {category.description || 'Structuring your subject knowledge path'}
                </p>
              </div>
            </div>

            <button
              onClick={openCreateTopicModal}
              className="flex items-center gap-1.5 py-2 px-4 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold shadow-lg shadow-accent/10 active:scale-[0.98] transition-all outline-none"
            >
              <Plus className="h-4 w-4" />
              <span>Add Topic</span>
            </button>
          </div>

          {/* Progress Bar details */}
          <div className="pt-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary mb-2">
              <span>PROGRESS OVERVIEW</span>
              <span className="text-text-primary">{completedTopics} / {totalTopics} Topics Completed ({progressPct}%)</span>
            </div>
            <div className="w-full h-2.5 bg-surface border border-border/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Topics List details */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider px-1">
          Topic List
        </h3>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-panel p-4 rounded-xl h-14 animate-pulse flex items-center gap-3">
                <div className="h-5 w-5 bg-surface-hover rounded-full" />
                <div className="h-4 w-48 bg-surface-hover rounded" />
              </div>
            ))}
          </div>
        ) : topics.length === 0 ? (
          <div className="glass-panel py-12 rounded-2xl flex flex-col items-center justify-center text-center max-w-md mx-auto border-dashed">
            <FileText className="h-10 w-10 text-text-secondary/40 mb-2" />
            <h4 className="text-xs font-bold text-text-primary">No Topics Found</h4>
            <p className="text-[11px] text-text-secondary mt-1">
              Add individual learning topics to start studying.
            </p>
            <button
              onClick={openCreateTopicModal}
              className="mt-4 py-2 px-4 bg-accent/10 border border-accent/20 hover:bg-accent/20 text-accent rounded-xl text-[11px] font-semibold active:scale-[0.98] transition-all outline-none"
            >
              Add First Topic
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topics.map(topic => {
              const isExpanded = expandedTopicId === topic.id;
              
              return (
                <div 
                  key={topic.id}
                  onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                  className={`glass-panel rounded-xl overflow-hidden transition-all duration-200 ${
                    topic.is_completed ? 'bg-surface/10 border-border/10' : 'bg-surface/30'
                  }`}
                >
                  
                  {/* Topic Row Header */}
                  <div className="p-4 flex items-center gap-3.5 cursor-pointer select-none">
                    <button
                      onClick={(e) => handleToggleComplete(topic, e)}
                      title={topic.is_completed ? "Mark Incomplete" : "Mark Complete"}
                      className="shrink-0 text-text-secondary hover:text-accent transition-colors focus:outline-none"
                    >
                      {topic.is_completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success animate-fade-in" />
                      ) : (
                        <Circle className="h-5 w-5 hover:scale-105" />
                      )}
                    </button>

                    <div className="min-w-0 flex-1">
                      <h4 className={`text-xs font-bold leading-tight tracking-wide ${
                        topic.is_completed ? 'line-through text-text-secondary' : 'text-text-primary'
                      }`}>
                        {topic.title}
                      </h4>
                      {topic.description && !isExpanded && (
                        <p className="text-[10px] text-text-secondary/80 mt-0.5 truncate">
                          {topic.description}
                        </p>
                      )}
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => openEditTopicModal(topic, e)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                          title="Edit Topic"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => openDeleteConfirm(topic, e)}
                          className="p-1.5 rounded-lg text-text-secondary hover:text-danger hover:bg-danger/10 transition-colors"
                          title="Delete Topic"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="p-1.5 text-text-secondary">
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </div>
                  </div>

                  {/* Topic Collapsed Details Panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4.5 pt-1.5 border-t border-border/10 bg-surface-hover/10 space-y-4 animate-slide-up text-xs">
                      
                      {/* Description */}
                      {topic.description && (
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Description</span>
                          <p className="text-text-primary font-medium tracking-wide leading-relaxed">{topic.description}</p>
                        </div>
                      )}

                      {/* Study Notes */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Study Notes</span>
                        <p className="text-text-primary font-medium tracking-wide leading-relaxed whitespace-pre-wrap">
                          {topic.notes || 'No study notes recorded yet. Edit the topic to add notes.'}
                        </p>
                      </div>

                      {/* Footer Info & Flashcard Trigger */}
                      <div className="pt-3 border-t border-border/10 flex flex-wrap gap-4 items-center justify-between text-[10px] font-semibold text-text-secondary select-none">
                        
                        <div className="flex gap-4">
                          {topic.completed_at && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5 opacity-60" />
                              <span>Completed {new Date(topic.completed_at).toLocaleDateString()}</span>
                            </span>
                          )}
                        </div>

                        <button
                          onClick={(e) => openFlashcardDrawer(topic, e)}
                          className="flex items-center gap-1.5 py-1.5 px-3 bg-surface hover:bg-surface-hover border border-border/40 text-text-primary hover:text-accent rounded-lg transition-colors focus:outline-none"
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                          <span>Flashcards drawer</span>
                        </button>

                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODALS & DRAWERS ================= */}

      {/* 1. Add / Edit Topic Modal */}
      {isTopicModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsTopicModalOpen(false)} />
          <form 
            onSubmit={handleSaveTopic}
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-[460px] shadow-2xl relative z-10 animate-scale-in space-y-4 text-xs"
          >
            <div>
              <h3 className="text-sm font-bold text-text-primary">{topicModalMode === 'create' ? 'Add Topic' : 'Edit Topic'}</h3>
              <p className="text-[10px] text-text-secondary">Structure detailed tasks or notes inside this subject.</p>
            </div>

            <div>
              <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Topic Title *</label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="e.g. Collections & List Operators"
                required
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/40 rounded-xl text-text-primary outline-none focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Short Description</label>
              <input
                type="text"
                value={topicDesc}
                onChange={(e) => setTopicDesc(e.target.value)}
                placeholder="e.g. Map operations, transformations and lookups..."
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/40 rounded-xl text-text-primary outline-none focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Study Notes / Content</label>
              <textarea
                value={topicNotes}
                onChange={(e) => setTopicNotes(e.target.value)}
                placeholder="Type your study summaries, key mechanics, code snippets or documentation links..."
                rows={5}
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/40 rounded-xl text-text-primary outline-none focus:border-accent transition-all resize-y"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsTopicModalOpen(false);
                  setSelectedTopic(null);
                }}
                className="px-4 py-2 border border-border/40 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl shadow-md active:scale-[0.98] transition-all focus:outline-none"
              >
                {topicModalMode === 'create' ? 'Add' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Delete Topic Confirmation Modal */}
      {isDeleteConfirmOpen && selectedTopic && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsDeleteConfirmOpen(false)} />
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-[360px] shadow-2xl relative z-10 animate-scale-in text-center text-xs">
            <div className="h-10 w-10 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mx-auto mb-3.5">
              <Trash2 className="h-4.5 w-4.5" />
            </div>
            
            <h3 className="text-sm font-bold text-text-primary">Delete Topic?</h3>
            <p className="text-text-secondary mt-1.5 leading-relaxed">
              This will permanently delete <strong className="text-text-primary">"{selectedTopic.title}"</strong> and all its associated flashcard records.
            </p>

            <div className="flex gap-2.5 mt-5 font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  setSelectedTopic(null);
                }}
                className="flex-1 py-2.5 border border-border/40 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTopic}
                className="flex-1 py-2.5 bg-danger hover:bg-danger-hover text-white rounded-xl shadow-md active:scale-[0.98] transition-all focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Flashcards Drawer Slide-Over Panel */}
      {activeFlashcardTopic && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Drawer Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-background/60 backdrop-blur-xs transition-opacity"
            onClick={() => setActiveFlashcardTopic(null)}
          />

          {/* Drawer Main Panel */}
          <div className="relative w-full max-w-lg bg-surface border-l border-border h-full shadow-2xl flex flex-col z-10 animate-fade-in select-none">
            
            {/* Drawer Header */}
            <div className="p-5 border-b border-border/20 flex items-center justify-between">
              <div className="flex items-center gap-2.5 text-text-primary">
                <Bookmark className="h-4.5 w-4.5 text-violet-400" />
                <div>
                  <h3 className="text-sm font-bold tracking-tight">Flashcard Deck</h3>
                  <span className="text-[9px] uppercase font-bold text-text-secondary block tracking-wider truncate max-w-xs">{activeFlashcardTopic.title}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveFlashcardTopic(null)}
                className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Drawer Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Form to Add Flashcard */}
              <form onSubmit={handleAddFlashcard} className="p-4 rounded-xl bg-surface-hover/20 border border-border/30 space-y-4.5 text-xs">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  <span>Create Flashcard</span>
                </h4>

                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Front: Question</label>
                  <input
                    type="text"
                    value={fcQuestion}
                    onChange={(e) => setFcQuestion(e.target.value)}
                    placeholder="e.g. What is val in Kotlin?"
                    required
                    className="w-full px-3 py-2 bg-surface border border-border/40 rounded-xl text-text-primary outline-none focus:border-accent transition-all text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Back: Answer / Details</label>
                  <textarea
                    value={fcAnswer}
                    onChange={(e) => setFcAnswer(e.target.value)}
                    placeholder="e.g. Declares a read-only local variable (evaluated once)..."
                    required
                    rows={2}
                    className="w-full px-3 py-2 bg-surface border border-border/40 rounded-xl text-text-primary outline-none focus:border-accent transition-all text-xs resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-bold text-text-secondary uppercase tracking-wider mb-2">Recall Difficulty</label>
                  <div className="flex gap-2">
                    {(['easy', 'medium', 'hard'] as const).map(diff => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setFcDifficulty(diff)}
                        className={`flex-1 py-1.5 border rounded-lg font-bold capitalize transition-all text-[10px] ${
                          fcDifficulty === diff
                            ? getDifficultyBadgeColor(diff) + ' scale-105 border-transparent shadow-sm'
                            : 'border-border/40 hover:bg-surface/50 text-text-secondary'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!fcQuestion.trim() || !fcAnswer.trim()}
                  className="w-full py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-semibold shadow-md transition-all active:scale-[0.98] focus:outline-none disabled:opacity-40 disabled:scale-100 flex items-center justify-center gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Card</span>
                </button>
              </form>

              {/* Flashcard list */}
              <div className="space-y-3.5">
                <h4 className="text-[10px] font-bold text-text-secondary uppercase tracking-wider px-1">
                  Topic Cards ({flashcards.length})
                </h4>

                {isFcLoading ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2].map(i => (
                      <div key={i} className="h-20 bg-surface-hover/30 rounded-xl" />
                    ))}
                  </div>
                ) : flashcards.length === 0 ? (
                  <div className="py-10 text-center text-text-secondary/60 flex flex-col items-center justify-center border border-dashed border-border/50 rounded-xl">
                    <HelpCircle className="h-8 w-8 opacity-30 mb-1.5" />
                    <p className="text-[11px] font-semibold">No flashcards created</p>
                    <p className="text-[10px] opacity-75 mt-0.5">Add cards above to compile testing decks.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {flashcards.map(card => (
                      <div 
                        key={card.id}
                        className="p-3.5 rounded-xl border border-border/30 bg-surface-hover/10 space-y-2 group relative"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <span className={`px-2 py-0.5 border text-[8px] font-extrabold uppercase rounded-md tracking-wider ${getDifficultyBadgeColor(card.difficulty)}`}>
                            {card.difficulty}
                          </span>
                          
                          <button
                            onClick={() => handleDeleteFlashcard(card.id)}
                            className="p-1 rounded-md text-text-secondary hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-opacity focus:outline-none"
                            title="Delete Card"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="space-y-1.5 text-[11px]">
                          <div>
                            <span className="text-[8px] font-bold text-text-secondary/60 uppercase tracking-wider">Q:</span>
                            <p className="text-text-primary font-bold tracking-wide leading-relaxed">{card.question}</p>
                          </div>
                          <div className="pt-1.5 border-t border-border/5">
                            <span className="text-[8px] font-bold text-text-secondary/60 uppercase tracking-wider">A:</span>
                            <p className="text-text-secondary font-medium tracking-wide leading-relaxed">{card.answer}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
