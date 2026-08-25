import React, { useState, useEffect } from 'react';
import { type Flashcard } from '../../services/supabase';
import { X, HelpCircle as HelpIcon, RotateCw, Loader2, Trophy } from 'lucide-react';
import confetti from 'canvas-confetti';

interface FlashcardReviewProps {
  cards: Flashcard[];
  topicName: string;
  onReviewCard: (cardId: string, rating: 'easy' | 'medium' | 'hard') => Promise<void>;
  onClose: () => void;
}

export const FlashcardReview: React.FC<FlashcardReviewProps> = ({
  cards: initialCards,
  topicName,
  onReviewCard,
  onClose
}) => {
  const [activeSessionCards, setActiveSessionCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Session Stats
  const [startTime] = useState<number>(Date.now());
  const [sessionStats, setSessionStats] = useState({
    easy: 0,
    medium: 0,
    hard: 0,
    totalReviewed: 0
  });

  const [isSessionCompleted, setIsSessionCompleted] = useState(false);

  // Initialize session cards
  useEffect(() => {
    if (initialCards && initialCards.length > 0) {
      setActiveSessionCards([...initialCards]);
    }
  }, [initialCards]);

  const currentCard = activeSessionCards[currentIndex];

  const handleRateCard = async (rating: 'easy' | 'medium' | 'hard') => {
    if (!currentCard || isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 1. Trigger service update
      await onReviewCard(currentCard.id, rating);

      // 2. Adjust stats
      setSessionStats(prev => ({
        ...prev,
        [rating]: prev[rating] + 1,
        totalReviewed: prev.totalReviewed + 1
      }));

      // 3. Handle Spaced Repetition logic (Hard cards re-queue at the end)
      if (rating === 'hard') {
        setActiveSessionCards(prev => [...prev, currentCard]);
      }

      // 4. Advance or complete session
      if (currentIndex + 1 < activeSessionCards.length) {
        setIsFlipped(false);
        // Delay slightly for flipping animation back before showing next question
        setTimeout(() => {
          setCurrentIndex(prev => prev + 1);
          setIsSubmitting(false);
        }, 150);
      } else {
        // Complete review session
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 }
        });
        setIsSessionCompleted(true);
        setIsSubmitting(false);
      }

    } catch (err) {
      console.error('Failed to submit card review', err);
      setIsSubmitting(false);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-emerald-400 border-emerald-500/25 bg-emerald-500/5';
      case 'medium': return 'text-amber-400 border-amber-500/25 bg-amber-500/5';
      case 'hard': return 'text-red-400 border-red-500/25 bg-red-500/5';
      default: return 'text-accent border-accent/25 bg-accent/5';
    }
  };

  // Duration formatting (e.g. 1m 24s)
  const getSessionDuration = () => {
    const deltaMs = Date.now() - startTime;
    const totalSecs = Math.floor(deltaMs / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  if (activeSessionCards.length === 0) {
    return (
      <div className="glass-panel p-8 rounded-2xl max-w-md mx-auto text-center border-border/10 space-y-4 text-xs select-none">
        <Loader2 className="h-7 w-7 animate-spin text-accent mx-auto" />
        <p className="text-text-secondary/70 font-bold uppercase tracking-wider">Compiling Question Deck</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 text-xs select-none animate-fade-in">
      
      {/* Header session tracking */}
      <div className="flex justify-between items-center px-1">
        <div>
          <span className="text-[10px] uppercase font-black text-accent tracking-widest bg-accent/15 border border-accent/25 px-2.5 py-0.5 rounded-full">
            Recall Session
          </span>
          <h3 className="text-sm font-black text-text-primary mt-1.5">{topicName}</h3>
        </div>

        <button
          onClick={onClose}
          className="p-2 border border-border/20 hover:border-red-500/20 hover:bg-red-500/10 text-text-secondary hover:text-red-400 rounded-xl transition-all focus:outline-none"
          title="End Session"
        >
          <X className="h-4.5 w-4.5" />
        </button>
      </div>

      {isSessionCompleted ? (
        /* Summary Scoreboard Widget */
        <div className="glass-panel p-6 rounded-2xl border border-border/15 bg-surface/20 space-y-5 text-center max-w-md mx-auto animate-scale-in">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto shadow-inner">
            <Trophy className="h-6 w-6" />
          </div>
          
          <div className="space-y-1">
            <h4 className="text-sm font-black text-text-primary uppercase tracking-wider">Session Complete!</h4>
            <p className="text-[10px] text-text-secondary/60 font-semibold">Active recall cards solidifies retention memory.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 py-1 text-center font-bold">
            <div className="bg-surface-hover/10 border border-border/5 p-2 rounded-xl">
              <p className="text-[8px] uppercase text-text-secondary/60">Duration</p>
              <p className="text-xs font-black text-text-primary mt-0.5">{getSessionDuration()}</p>
            </div>
            <div className="bg-surface-hover/10 border border-border/5 p-2 rounded-xl">
              <p className="text-[8px] uppercase text-text-secondary/60">Reviewed</p>
              <p className="text-xs font-black text-text-primary mt-0.5">{sessionStats.totalReviewed} cards</p>
            </div>
          </div>

          <div className="border-t border-border/10 pt-4 space-y-2 text-[10px]">
            <p className="text-[8px] font-black text-text-secondary/40 uppercase tracking-widest text-left pl-1">SRS Difficulty Ratings</p>
            <div className="divide-y divide-border/5">
              <div className="flex justify-between py-2">
                <span className="text-text-secondary font-bold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> Easy</span>
                <span className="font-extrabold text-text-primary">{sessionStats.easy} cards</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary font-bold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-amber-400" /> Good (Medium)</span>
                <span className="font-extrabold text-text-primary">{sessionStats.medium} cards</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-text-secondary font-bold flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-400" /> Hard (Re-queued)</span>
                <span className="font-extrabold text-text-primary">{sessionStats.hard} cards</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold uppercase tracking-wider text-[9px] active:scale-95 transition-all shadow focus:outline-none"
          >
            Return to Decks
          </button>
        </div>
      ) : (
        /* Study Flipping Screen */
        <div className="space-y-6 max-w-md mx-auto">
          {/* Progress gauge */}
          <div className="flex justify-between items-center text-[10px] font-bold text-text-secondary/50 px-1 select-none">
            <span>Progress: {currentIndex + 1} / {activeSessionCards.length}</span>
            <span>{Math.round(((currentIndex + 1) / activeSessionCards.length) * 100)}%</span>
          </div>

          <div className="w-full bg-surface-hover/30 border border-border/5 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-accent rounded-full transition-all duration-300"
              style={{ width: `${((currentIndex + 1) / activeSessionCards.length) * 100}%` }}
            />
          </div>

          {/* 3D Card Flip Layout Container */}
          <div 
            onClick={() => setIsFlipped(prev => !prev)}
            className="w-full h-80 relative cursor-pointer select-none group"
            style={{ perspective: '1000px' }}
          >
            <div 
              className="w-full h-full relative"
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)'
              }}
            >
              {/* CARD FRONT: QUESTION */}
              <div 
                className="absolute inset-0 w-full h-full rounded-2xl glass-panel border border-border/10 p-6 flex flex-col justify-between bg-surface/20 shadow-md group-hover:border-border/20 transition-colors"
                style={{ backfaceVisibility: 'hidden' }}
              >
                <div className="flex justify-between items-center text-[8px] font-bold text-text-secondary/40 uppercase tracking-widest select-none">
                  <span>Front: Question Card</span>
                  <span className={`px-1.5 py-0.5 border rounded uppercase ${getDifficultyColor(currentCard.difficulty)}`}>
                    {currentCard.difficulty}
                  </span>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center text-center p-2">
                  <HelpIcon className="h-8 w-8 text-accent/20 mb-3" />
                  <p className="text-sm font-black text-text-primary tracking-wide leading-relaxed max-w-sm">
                    {currentCard.question}
                  </p>
                </div>

                <div className="text-center text-[9px] font-extrabold text-accent/50 uppercase tracking-wider flex items-center justify-center gap-1">
                  <RotateCw className="h-3 w-3 animate-spin-slow" />
                  <span>Tap to reveal answer</span>
                </div>
              </div>

              {/* CARD BACK: ANSWER */}
              <div 
                className="absolute inset-0 w-full h-full rounded-2xl glass-panel border border-border/15 p-6 flex flex-col justify-between bg-surface/25 shadow-lg"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)'
                }}
              >
                <div className="flex justify-between items-center text-[8px] font-bold text-text-secondary/40 uppercase tracking-widest select-none border-b border-border/5 pb-2">
                  <span>Back: Recall Answer</span>
                  <span className="text-emerald-400">Reveal</span>
                </div>

                <div className="flex-1 overflow-y-auto py-4 px-1 my-1">
                  <p className="text-xs font-medium text-text-secondary whitespace-pre-wrap leading-relaxed tracking-wide">
                    {currentCard.answer}
                  </p>
                </div>

                <div className="text-center text-[9px] font-extrabold text-accent/40 uppercase tracking-wider select-none border-t border-border/5 pt-2">
                  <span>Click card body to review question</span>
                </div>
              </div>

            </div>
          </div>

          {/* Rating controller row (Only active when card is flipped to reveal answer) */}
          <div className="transition-all duration-300">
            {isFlipped ? (
              <div className="space-y-2 animate-fade-in">
                <p className="text-center text-[9.5px] font-extrabold text-text-secondary/50 uppercase tracking-widest select-none">How well did you recall this?</p>
                <div className="flex gap-3 text-[10px] font-bold uppercase">
                  {/* AGAIN (HARD) */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateCard('hard');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 hover:border-transparent rounded-xl transition-all active:scale-95 flex flex-col items-center gap-0.5 outline-none font-bold"
                  >
                    <span>Again</span>
                    <span className="text-[7.5px] opacity-75 font-semibold">Immediate</span>
                  </button>

                  {/* GOOD */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateCard('medium');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-amber-600/10 hover:bg-amber-600 text-amber-400 hover:text-white border border-amber-500/20 hover:border-transparent rounded-xl transition-all active:scale-95 flex flex-col items-center gap-0.5 outline-none font-bold"
                  >
                    <span>Good</span>
                    <span className="text-[7.5px] opacity-75 font-semibold">1 Day</span>
                  </button>

                  {/* EASY */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRateCard('easy');
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 hover:border-transparent rounded-xl transition-all active:scale-95 flex flex-col items-center gap-0.5 outline-none font-bold"
                  >
                    <span>Easy</span>
                    <span className="text-[7.5px] opacity-75 font-semibold">4 Days</span>
                  </button>
                </div>
              </div>
            ) : (
              <div 
                onClick={() => setIsFlipped(true)}
                className="py-3 bg-accent hover:bg-accent-hover text-white rounded-xl font-bold uppercase tracking-wider text-[10px] text-center active:scale-95 cursor-pointer shadow transition-all duration-200 select-none"
              >
                Reveal Answer
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};
