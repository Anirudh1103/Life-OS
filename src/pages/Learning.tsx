import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dbService, type Category, type Topic, type Flashcard } from '../services/supabase';
import { FlashcardReview } from '../components/learning/FlashcardReview';
import { 
  Plus, 
  FolderPlus, 
  BookOpen, 
  Trash2, 
  MoreVertical, 
  Sparkles,
  BarChart3,
  Bookmark,
  CalendarDays,
  Code2,
  Terminal,
  Cpu,
  Database,
  Brain,
  Globe,
  Layers,
  GraduationCap,
  ChevronRight,
  Clock,
  X,
  Loader2
} from 'lucide-react';

export const renderCategoryIcon = (icon: string) => {
  const iconClass = "h-5 w-5 text-accent";
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
      return <span className="text-lg select-none">{icon}</span>;
  }
};

export const Learning: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'categories' | 'progress' | 'flashcards' | 'revision'>('categories');
  const [categories, setCategories] = useState<Category[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Review State
  const [isReviewActive, setIsReviewActive] = useState(false);
  const [studySessionCards, setStudySessionCards] = useState<Flashcard[]>([]);
  const [studySessionTopicName, setStudySessionTopicName] = useState('');

  // Quick Add Card Modal
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [selectedTopicIdForNewCard, setSelectedTopicIdForNewCard] = useState('');
  const [newCardQuestion, setNewCardQuestion] = useState('');
  const [newCardAnswer, setNewCardAnswer] = useState('');
  const [newCardDifficulty, setNewCardDifficulty] = useState<'easy' | 'medium' | 'hard'>('easy');
  const [isAddingCard, setIsAddingCard] = useState(false);

  // CRUD modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Modal forms state
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [catIcon, setCatIcon] = useState('📚');
  const [selectedCat, setSelectedCat] = useState<Category | null>(null);
  
  // Menu dropdown state
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const loadLearningData = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      await dbService.seedKotlinSyllabusIfEmpty(user.id);
      const [cats, tops, cards] = await Promise.all([
        dbService.getCategories(user.id),
        dbService.getTopics(user.id),
        dbService.getFlashcards(user.id)
      ]);
      setCategories(cats);
      setTopics(tops);
      setFlashcards(cards);
    } catch (err: any) {
      console.error('Failed to load learning data', err);
      setError('Unable to load categories. Please check connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLearningData();
  }, [user]);

  // Overall calculations
  const totalTopics = topics.length;
  const completedTopics = topics.filter(t => t.is_completed).length;
  const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  // Category progress calculation
  const getCategoryStats = (catId: string) => {
    const catTopics = topics.filter(t => t.category_id === catId);
    const total = catTopics.length;
    const completed = catTopics.filter(t => t.is_completed).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, progress };
  };

  // Group decks by topic containing cards
  const decks = useMemo(() => {
    const catMap = new Map(categories.map(c => [c.id, c.name]));
    return topics.map(topic => {
      const topicCards = flashcards.filter(c => c.topic_id === topic.id);
      const dueCards = topicCards.filter(c => {
        if (!c.next_review_at) return true;
        return new Date(c.next_review_at) <= new Date();
      });
      return {
        topic,
        categoryName: catMap.get(topic.category_id) || 'General',
        totalCards: topicCards.length,
        dueCount: dueCards.length,
        cards: topicCards,
        dueCards: dueCards
      };
    }).filter(deck => deck.totalCards > 0);
  }, [categories, topics, flashcards]);

  // Filter due cards across the library
  const allDueCards = useMemo(() => {
    return flashcards.filter(c => {
      if (!c.next_review_at) return true;
      return new Date(c.next_review_at) <= new Date();
    });
  }, [flashcards]);

  // Review callback handlers
  const handleReviewCard = async (cardId: string, rating: 'easy' | 'medium' | 'hard') => {
    if (!user) return;
    
    const now = new Date();
    const nextReview = new Date();
    
    if (rating === 'easy') {
      nextReview.setDate(now.getDate() + 4);
    } else if (rating === 'medium') {
      nextReview.setDate(now.getDate() + 1);
    } else { // 'hard'
      // Re-queues immediately locally, schedule db for 1 hour from now
      nextReview.setHours(now.getHours() + 1);
    }

    try {
      await dbService.updateFlashcard(user.id, cardId, {
        difficulty: rating,
        last_reviewed_at: now.toISOString(),
        next_review_at: nextReview.toISOString()
      });

      const card = flashcards.find(c => c.id === cardId);
      if (card) {
        await dbService.logActivity(user.id, card.topic_id, 'flashcard_reviewed');
      }

      // Refresh list silently
      const cards = await dbService.getFlashcards(user.id);
      setFlashcards(cards);
    } catch (err) {
      console.error('Failed to log flashcard review', err);
    }
  };

  const startReviewSession = (cardsToStudy: Flashcard[], name: string) => {
    setStudySessionCards(cardsToStudy);
    setStudySessionTopicName(name);
    setIsReviewActive(true);
  };

  // CRUD handlers
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !catName.trim()) return;

    try {
      await dbService.createCategory({
        user_id: user.id,
        name: catName.trim(),
        description: catDesc.trim() || null,
        icon: catIcon,
        sort_order: categories.length,
      });
      setCatName('');
      setCatDesc('');
      setCatIcon('📚');
      setIsCreateModalOpen(false);
      loadLearningData();
    } catch (err) {
      console.error(err);
      setError('Failed to create category.');
    }
  };

  const handleEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedCat || !catName.trim()) return;

    try {
      await dbService.updateCategory(user.id, selectedCat.id, {
        name: catName.trim(),
        description: catDesc.trim() || null,
        icon: catIcon,
      });
      setSelectedCat(null);
      setCatName('');
      setCatDesc('');
      setCatIcon('📚');
      setIsEditModalOpen(false);
      loadLearningData();
    } catch (err) {
      console.error(err);
      setError('Failed to update category.');
    }
  };

  const handleDeleteCategory = async () => {
    if (!user || !selectedCat) return;

    try {
      await dbService.deleteCategory(user.id, selectedCat.id);
      setSelectedCat(null);
      setIsDeleteModalOpen(false);
      loadLearningData();
    } catch (err) {
      console.error(err);
      setError('Failed to delete category.');
    }
  };

  const handleCreateFlashcard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedTopicIdForNewCard || !newCardQuestion.trim() || !newCardAnswer.trim()) return;

    setIsAddingCard(true);
    try {
      await dbService.createFlashcard({
        topic_id: selectedTopicIdForNewCard,
        user_id: user.id,
        question: newCardQuestion.trim(),
        answer: newCardAnswer.trim(),
        difficulty: newCardDifficulty,
        last_reviewed_at: null,
        next_review_at: null,
      });

      setNewCardQuestion('');
      setNewCardAnswer('');
      setNewCardDifficulty('easy');
      setIsAddCardOpen(false);
      loadLearningData();
    } catch (err) {
      console.error('Failed to create card', err);
    } finally {
      setIsAddingCard(false);
    }
  };

  const openAddCardModalForTopic = (topicId: string) => {
    setSelectedTopicIdForNewCard(topicId);
    setNewCardQuestion('');
    setNewCardAnswer('');
    setNewCardDifficulty('easy');
    setIsAddCardOpen(true);
  };

  const getDifficultyBadgeColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5';
      case 'medium': return 'text-amber-400 border-amber-500/25 bg-amber-500/5';
      case 'hard': return 'text-red-400 border-red-500/25 bg-red-500/5';
      default: return 'text-accent border-accent/25 bg-accent/5';
    }
  };

  const emojis = ['📚', '💻', '🎨', '🧪', '🧬', '🧠', '🌐', '📊', '📈', '🚀', '🔑', '🌍'];

  if (!user) return null;

  // Render Recall Study Overlay
  if (isReviewActive) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        <FlashcardReview
          cards={studySessionCards}
          topicName={studySessionTopicName}
          onReviewCard={handleReviewCard}
          onClose={() => {
            setIsReviewActive(false);
            loadLearningData(); // Sync counts after session
          }}
        />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-xs select-none">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/10 pb-5">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-accent">Learning Terminal</span>
          <h2 className="text-lg font-extrabold tracking-tight text-text-primary mt-0.5">Brain Workspace</h2>
        </div>

        {/* Navigation Switcher Bar */}
        <div className="flex items-center gap-1.5 bg-surface border border-border/10 p-1 rounded-2xl">
          {[
            { id: 'categories', label: 'Categories', icon: Layers },
            { id: 'progress', label: 'Progress', icon: BarChart3 },
            { id: 'flashcards', label: 'Flashcards', icon: Bookmark },
            { id: 'revision', label: 'Revision', icon: CalendarDays }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold uppercase tracking-wider text-[9px] active:scale-95 transition-all outline-none ${
                  isActive
                    ? 'bg-accent text-white shadow shadow-accent/15'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover/50'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/20 text-red-200 text-center max-w-md mx-auto">
          {error}
        </div>
      )}

      {/* ================= TAB CONTENT PANELS ================= */}

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4">
          <Loader2 className="h-9 w-9 animate-spin text-accent" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 animate-pulse">Syncing Learning Deck</span>
        </div>
      ) : (
        <div className="transition-all duration-300">
          
          {/* TAB 1: CATEGORIES GRID */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center px-1">
                <div>
                  <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Subject Categories</h3>
                  <p className="text-[10px] text-text-secondary/60 mt-0.5">Filter subjects & checklist items</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-1 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold transition-all active:scale-95 outline-none"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Category</span>
                </button>
              </div>

              {categories.length === 0 ? (
                <div className="border border-dashed border-border/20 rounded-2xl p-16 text-center text-text-secondary/50 font-bold select-none">
                  <FolderPlus className="h-10 w-10 mx-auto opacity-30 mb-3" />
                  <p>No learning categories created yet.</p>
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="mt-3 text-[10px] bg-accent text-white px-3.5 py-1.5 rounded-lg font-bold"
                  >
                    + Add Category
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {categories.map(cat => {
                    const stats = getCategoryStats(cat.id);
                    const isMenuOpen = activeMenuId === cat.id;

                    return (
                      <div 
                        key={cat.id}
                        onClick={() => navigate(`/learning/${cat.id}`)}
                        className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/10 hover:border-border/20 hover:bg-surface-hover/20 cursor-pointer transition-all relative group flex flex-col justify-between h-40"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/25 flex items-center justify-center text-lg select-none shadow-sm">
                              {renderCategoryIcon(cat.icon)}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-text-primary group-hover:text-accent transition-colors">{cat.name}</h4>
                              <p className="text-[10px] text-text-secondary/60 truncate max-w-[180px] font-medium mt-0.5">{cat.description || 'No description'}</p>
                            </div>
                          </div>

                          {/* Quick menu */}
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => setActiveMenuId(isMenuOpen ? null : cat.id)}
                              className="p-1 rounded hover:bg-surface-hover transition-colors focus:outline-none"
                            >
                              <MoreVertical className="h-4 w-4 text-text-secondary" />
                            </button>

                            {isMenuOpen && (
                              <div className="absolute right-0 mt-1 w-28 bg-surface border border-border/20 rounded-xl shadow-lg z-20 py-1 animate-scale-in">
                                <button
                                  onClick={() => {
                                    setSelectedCat(cat);
                                    setCatName(cat.name);
                                    setCatDesc(cat.description || '');
                                    setCatIcon(cat.icon);
                                    setIsEditModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-surface-hover/60 font-bold transition-colors"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedCat(cat);
                                    setIsDeleteModalOpen(true);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full text-left px-3 py-1.5 hover:bg-red-500/10 text-red-400 font-bold transition-colors"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Progress slider bar */}
                        <div className="space-y-1.5 font-bold text-[9px] text-text-secondary/60">
                          <div className="flex justify-between items-center">
                            <span>{stats.completed}/{stats.total} Topics</span>
                            <span className="text-text-primary">{stats.progress}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-surface/40 border border-border/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent rounded-full transition-all duration-300"
                              style={{ width: `${stats.progress}%` }}
                            />
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PERFORMANCE STATISTICS */}
          {activeTab === 'progress' && (
            <div className="glass-panel p-6 rounded-2xl space-y-6 border border-border/10">
              <div>
                <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Performance & Statistics</h3>
                <p className="text-[10px] text-text-secondary/60 mt-0.5">Core overview of learning activities</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-bold text-center">
                <div className="p-4 rounded-xl border border-border/10 bg-surface/20">
                  <span className="text-[8px] font-bold text-text-secondary/60 uppercase tracking-widest">Completion Rate</span>
                  <p className="text-2xl font-black text-text-primary mt-2">{overallProgress}%</p>
                  <p className="text-[9px] text-text-secondary/50 font-semibold mt-1">{completedTopics} of {totalTopics} topics finished</p>
                </div>
                <div className="p-4 rounded-xl border border-border/10 bg-surface/20">
                  <span className="text-[8px] font-bold text-text-secondary/60 uppercase tracking-widest">Active Subjects</span>
                  <p className="text-2xl font-black text-text-primary mt-2">{categories.length}</p>
                  <p className="text-[9px] text-text-secondary/50 font-semibold mt-1">Categories registered</p>
                </div>
                <div className="p-4 rounded-xl border border-border/10 bg-surface/20 flex flex-col justify-center">
                  <span className="text-[8px] font-bold text-text-secondary/60 uppercase tracking-widest">Achievements</span>
                  <div className="flex items-center justify-center gap-1 mt-2 text-indigo-400 text-sm font-black">
                    <Sparkles className="h-4.5 w-4.5" />
                    <span>{completedTopics >= 5 ? 'Novice Scholar' : 'New Scholar'}</span>
                  </div>
                  <p className="text-[9px] text-text-secondary/50 font-semibold mt-1">Earned via topic completions</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLASHCARDS DECK VIEW */}
          {activeTab === 'flashcards' && (
            <div className="space-y-6">
              
              {/* Central stats bar */}
              <div className="grid grid-cols-3 gap-4 bg-surface/20 border border-border/10 p-4.5 rounded-2xl font-bold text-center">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-text-secondary/50">Total Decks</p>
                  <p className="text-base font-black text-text-primary mt-1">{decks.length}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-text-secondary/50">Total Cards</p>
                  <p className="text-base font-black text-text-primary mt-1">{flashcards.length}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-text-secondary/50">Due Cards</p>
                  <p className="text-base font-black text-accent mt-1">{allDueCards.length}</p>
                </div>
              </div>

              {/* Decks Grid */}
              {decks.length === 0 ? (
                <div className="border border-dashed border-border/20 rounded-2xl p-16 text-center text-text-secondary/50 font-bold select-none">
                  <Bookmark className="h-10 w-10 mx-auto opacity-30 mb-3" />
                  <p>No flashcard decks created yet.</p>
                  <p className="text-[10px] text-text-secondary/40 mt-1">Navigate to a Subject Category page, select a Topic, and use the side drawer to compile cards.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {decks.map(deck => (
                    <div 
                      key={deck.topic.id}
                      className="glass-panel p-5 rounded-2xl border border-border/10 bg-surface/10 hover:border-border/15 transition-all flex flex-col justify-between h-44"
                    >
                      <div>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <h4 className="text-xs font-black text-text-primary line-clamp-1">{deck.topic.title}</h4>
                            <span className="text-[9px] font-bold text-text-secondary/50 uppercase tracking-wider">{deck.categoryName}</span>
                          </div>
                          <span className="px-2 py-0.5 border text-[8px] font-black rounded-lg uppercase tracking-wider bg-accent/15 border-accent/20 text-accent">
                            {deck.totalCards} cards
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-1.5 mt-3 text-[9.5px] font-bold text-text-secondary/60">
                          <Clock className="h-3.5 w-3.5 text-text-secondary/40" />
                          <span>{deck.dueCount > 0 ? `${deck.dueCount} cards due for review` : 'All caught up!'}</span>
                        </div>
                      </div>

                      {/* Study actions row */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startReviewSession(deck.cards, deck.topic.title)}
                          className="flex-1 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold uppercase tracking-wider text-[9px] transition-all outline-none"
                        >
                          Study Deck
                        </button>
                        <button
                          onClick={() => openAddCardModalForTopic(deck.topic.id)}
                          className="px-3.5 py-2 border border-border/20 hover:bg-surface-hover/50 text-text-primary rounded-xl font-bold text-[9px] uppercase tracking-wider transition-all outline-none"
                        >
                          + Card
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 4: REVISION TERMINAL */}
          {activeTab === 'revision' && (
            <div className="space-y-6">
              
              {allDueCards.length === 0 ? (
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center max-w-xl mx-auto border-dashed border-emerald-500/20 bg-emerald-500/5 animate-scale-in">
                  <CalendarDays className="h-10 w-10 text-emerald-400 mb-3 opacity-80" />
                  <h3 className="text-base font-black text-text-primary">🎉 All Caught Up!</h3>
                  <p className="text-xs text-text-secondary max-w-xs mt-1.5 leading-relaxed">
                    You have reviewed all active spaced repetition cards. Keep creating flashcards under category topics to build your recall library!
                  </p>
                  <button
                    onClick={() => {
                      if (flashcards.length > 0) {
                        startReviewSession(flashcards, 'Custom Recall Session (All Cards)');
                      } else {
                        alert('Create flashcards first under category topics!');
                      }
                    }}
                    className="mt-6 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-[9px] uppercase tracking-widest transition-all outline-none shadow-sm shadow-emerald-500/10"
                  >
                    Review All Cards Anyway
                  </button>
                </div>
              ) : (
                <div className="glass-panel p-6 rounded-2xl border border-border/10 space-y-6 max-w-xl mx-auto text-center animate-scale-in">
                  <div className="h-12 w-12 rounded-2xl bg-accent/15 border border-accent/25 text-accent flex items-center justify-center mx-auto shadow-inner animate-pulse">
                    <Brain className="h-6 w-6" />
                  </div>

                  <div className="space-y-1.5">
                    <h3 className="text-sm font-black text-text-primary uppercase tracking-wider">Active Recall Revision Terminal</h3>
                    <p className="text-xs text-text-secondary leading-relaxed max-w-md mx-auto">
                      You have <strong className="text-text-primary">{allDueCards.length} cards</strong> due for review. Study now to schedule spacing intervals and build long-term retention.
                    </p>
                  </div>

                  <button
                    onClick={() => startReviewSession(allDueCards, 'Daily Recall Review (All Due)')}
                    className="w-full max-w-xs mx-auto py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold uppercase tracking-wider text-[9px] active:scale-95 transition-all shadow focus:outline-none flex items-center justify-center gap-1.5"
                  >
                    <span>Start Review Session</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ================= CATEGORIES MODALS ================= */}

      {/* 1. Add Category Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
          <form 
            onSubmit={handleCreateCategory}
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-[420px] shadow-2xl relative z-10 animate-scale-in space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-text-primary">Add Category</h3>
              <p className="text-[11px] text-text-secondary">Create a new container to structure subject topics.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Category Name *</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Android Development"
                required
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/40 rounded-xl text-xs text-text-primary outline-none focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Description</label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="e.g. Jetpack Compose, state management..."
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/40 rounded-xl text-xs text-text-primary outline-none focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Category Icon / Emoji</label>
              <div className="flex gap-2 flex-wrap">
                {emojis.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setCatIcon(em)}
                    className={`h-9 w-9 rounded-xl border flex items-center justify-center text-lg transition-all ${
                      catIcon === em 
                        ? 'border-accent bg-accent/15 text-accent font-bold scale-105' 
                        : 'border-border/40 hover:bg-surface-hover text-text-secondary'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsCreateModalOpen(false);
                  setCatName('');
                  setCatDesc('');
                }}
                className="px-4 py-2 border border-border/40 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl shadow-md active:scale-[0.98] transition-all focus:outline-none"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Edit Category Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsEditModalOpen(false)} />
          <form 
            onSubmit={handleEditCategory}
            className="bg-surface border border-border rounded-2xl p-6 w-full max-w-[420px] shadow-2xl relative z-10 animate-scale-in space-y-4"
          >
            <div>
              <h3 className="text-base font-bold text-text-primary">Rename Category</h3>
              <p className="text-[11px] text-text-secondary">Modify container names and configurations.</p>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Category Name *</label>
              <input
                type="text"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                placeholder="e.g. Android Development"
                required
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/40 rounded-xl text-xs text-text-primary outline-none focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">Description</label>
              <input
                type="text"
                value={catDesc}
                onChange={(e) => setCatDesc(e.target.value)}
                placeholder="e.g. Jetpack Compose, state management..."
                className="w-full px-3 py-2 bg-surface-hover/20 border border-border/40 rounded-xl text-xs text-text-primary outline-none focus:border-accent transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-2">Category Icon / Emoji</label>
              <div className="flex gap-2 flex-wrap">
                {emojis.map(em => (
                  <button
                    key={em}
                    type="button"
                    onClick={() => setCatIcon(em)}
                    className={`h-9 w-9 rounded-xl border flex items-center justify-center text-lg transition-all ${
                      catIcon === em 
                        ? 'border-accent bg-accent/15 text-accent font-bold scale-105' 
                        : 'border-border/40 hover:bg-surface-hover text-text-secondary'
                    }`}
                  >
                    {em}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setSelectedCat(null);
                  setCatName('');
                  setCatDesc('');
                }}
                className="px-4 py-2 border border-border/40 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl shadow-md active:scale-[0.98] transition-all focus:outline-none"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 3. Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setIsDeleteModalOpen(false)} />
          <div className="bg-surface border border-border rounded-2xl p-6 w-full max-w-[380px] shadow-2xl relative z-10 animate-scale-in text-center select-none">
            <div className="h-10 w-10 rounded-full bg-danger/10 border border-danger/20 flex items-center justify-center text-danger mx-auto mb-4">
              <Trash2 className="h-5 w-5" />
            </div>
            
            <h3 className="text-base font-bold text-text-primary">Delete Category?</h3>
            
            <p className="text-xs text-text-secondary leading-relaxed mt-2">
              This will permanently remove the category <strong className="text-text-primary">"{selectedCat.name}"</strong> and all its associated topics. This action cannot be undone.
            </p>

            <div className="flex gap-2.5 mt-6 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setSelectedCat(null);
                }}
                className="flex-1 py-2.5 border border-border/40 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors focus:outline-none"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteCategory}
                className="flex-1 py-2.5 bg-danger hover:bg-danger-hover text-white rounded-xl shadow-md active:scale-[0.98] transition-all focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Quick Add Flashcard Modal */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-surface border border-border/20 rounded-2xl shadow-xl overflow-hidden animate-scale-in">
            
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/10 bg-surface/50 select-none">
              <h3 className="text-xs font-black text-text-primary uppercase tracking-wider">Quick Create Flashcard</h3>
              <button 
                type="button"
                onClick={() => setIsAddCardOpen(false)}
                className="p-1 rounded-lg hover:bg-surface-hover/80 text-text-secondary transition-colors focus:outline-none"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            <form onSubmit={handleCreateFlashcard} className="p-5 space-y-4 text-xs">
              
              {/* Optional Topic selector selector if creating centrally, or locked if topic already scoped */}
              <div>
                <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-1">Target Deck / Topic</label>
                <select
                  value={selectedTopicIdForNewCard}
                  onChange={(e) => setSelectedTopicIdForNewCard(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-lg px-2.5 py-1.5 text-text-primary font-bold focus:outline-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select Topic...</option>
                  {topics.map(t => (
                    <option key={t.id} value={t.id}>{t.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-1">Front: Question</label>
                <input
                  type="text"
                  placeholder="e.g. What is the difference between let and const in JS?"
                  value={newCardQuestion}
                  onChange={(e) => setNewCardQuestion(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-text-primary focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-1">Back: Answer / Details</label>
                <textarea
                  rows={3}
                  placeholder="e.g. let allows re-assignment, const does not. Both are block-scoped."
                  value={newCardAnswer}
                  onChange={(e) => setNewCardAnswer(e.target.value)}
                  className="w-full bg-surface-hover/30 border border-border/15 rounded-xl px-3 py-2 text-text-primary focus:outline-none resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-text-secondary/60 mb-2">Recall Difficulty</label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'hard'] as const).map(diff => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setNewCardDifficulty(diff)}
                      className={`flex-1 py-1.5 border rounded-lg font-bold capitalize transition-all text-[10px] outline-none ${
                        newCardDifficulty === diff
                          ? getDifficultyBadgeColor(diff) + ' scale-105 border-transparent shadow-sm'
                          : 'border-border/40 hover:bg-surface/50 text-text-secondary'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-border/10">
                <button
                  type="button"
                  onClick={() => setIsAddCardOpen(false)}
                  className="px-4 py-2 border border-border/20 text-text-secondary hover:text-text-primary hover:bg-surface-hover/40 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingCard || !newCardQuestion.trim() || !newCardAnswer.trim()}
                  className="flex items-center gap-1 px-4.5 py-2 bg-accent hover:bg-accent-hover disabled:opacity-40 text-white rounded-xl font-bold active:scale-95 transition-all outline-none"
                >
                  {isAddingCard ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  <span>Save Flashcard</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
