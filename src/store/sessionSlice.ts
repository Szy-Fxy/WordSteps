// sessionSlice - 当前学习会话
import type { StateCreator } from 'zustand';
import type { AppMode, ReviewItem } from '../types';
import type { BoundStore } from './boundStore';
import { REVIEW_WINDOW } from '../constants';

export interface SessionSlice {
  index: number;
  mode: AppMode;
  reviewQueue: ReviewItem[];
  masteredWords: Record<string, boolean>;
  favorites: Set<string>;
  spellPhase: 'input' | 'submitted' | 'retry';

  resetSession: (force?: boolean) => void;
  setMode: (mode: AppMode) => void;
  nextWord: () => void;
  markKnow: () => void;
  markDontKnow: () => void;
  submitSpell: (input: string) => boolean;
  skipSpell: () => void;
  retrySpell: () => void;
  toggleFavorite: (wordS: string) => void;
}

// computeDisplay 放这里避免循环引用（sessionSlice 和 useDisplay 都需要）
export function computeDisplay(state: {
  reviewQueue: ReviewItem[];
  words: { s: string; uk?: string; us?: string; p: string; ex?: { en: string; cn: string }; tags?: string[] }[];
  index: number;
  allWords: { s: string; uk?: string; us?: string; p: string; ex?: { en: string; cn: string }; tags?: string[] }[];
}): { word: { s: string; uk?: string; us?: string; p: string; ex?: { en: string; cn: string }; tags?: string[] }; isReview: boolean; reviewData?: ReviewItem } | null {
  const { reviewQueue, words, index, allWords } = state;

  const review = reviewQueue.find(r => r.insertAfter <= index && index - r.insertAfter < REVIEW_WINDOW);
  if (review) {
    const w = allWords.find(x => x.s === review.wordS);
    if (w) return { word: w, isReview: true, reviewData: review };
  }
  if (!words.length) return null;
  return { word: words[index % words.length]!, isReview: false };
}

export const createSessionSlice: StateCreator<BoundStore, [], [], SessionSlice> = (set, get) => ({
  index: 0,
  mode: 'browse',
  reviewQueue: [],
  masteredWords: {},
  favorites: new Set<string>(),
  spellPhase: 'input',

  resetSession: (force) => {
    const { libStates, lib } = get();
    const saved = force ? null : libStates[lib];
    set({
      index: 0,
      reviewQueue: saved?.reviewQueue ?? [],
      spellPhase: 'input',
    });
  },

  setMode: (mode) => set({ mode, spellPhase: 'input' }),

  nextWord: () => {
    get().tickToday();
    set(s => ({ index: s.index + 1, spellPhase: 'input' }));
  },

  markKnow: () => {
    const { index } = get();
    const display = computeDisplay(get());
    if (!display) return;

    const mastered = { ...get().masteredWords, [display.word.s]: true };
    const newStreak = get().currentStreak + 1;
    const best = Math.max(get().bestStreak, newStreak);

    get().incrementStats(true);
    set({
      index: index + 1,
      masteredWords: mastered,
      currentStreak: newStreak,
      bestStreak: best,
    });
  },

  markDontKnow: () => {
    const { index, reviewQueue } = get();
    const display = computeDisplay(get());
    if (!display) return;

    get().incrementStats(false);
    const q = reviewQueue.map(r => ({ ...r }));
    const idx = q.findIndex(r => r.wordS === display.word.s);
    if (idx >= 0) {
      const attempts = q[idx]!.attempts + 1;
      q[idx] = { wordS: display.word.s, attempts, insertAfter: index + 2 + attempts * 2 };
    } else {
      q.push({ wordS: display.word.s, attempts: 1, insertAfter: index + 4 });
    }
    set({
      index: index + 1,
      reviewQueue: q,
      currentStreak: 0,
    });
  },

  submitSpell: (input) => {
    const display = computeDisplay(get());
    if (!display) return false;
    const isCorrect = input.trim().toLowerCase() === display.word.s.toLowerCase();

    if (isCorrect) {
      const mastered = { ...get().masteredWords, [display.word.s]: true };
      const newStreak = get().currentStreak + 1;
      get().incrementStats(true);
      set({
        masteredWords: mastered,
        currentStreak: newStreak,
        bestStreak: Math.max(get().bestStreak, newStreak),
        spellPhase: 'submitted',
      });
    } else {
      const { reviewQueue: qRaw, index } = get();
      get().incrementStats(false);
      const q = qRaw.map(r => ({ ...r }));
      const idx = q.findIndex(r => r.wordS === display.word.s);
      if (idx >= 0) {
        q[idx] = { ...q[idx]!, attempts: q[idx]!.attempts + 1 };
      } else {
        q.push({ wordS: display.word.s, attempts: 1, insertAfter: index + 4 });
      }
      set({ reviewQueue: q, currentStreak: 0, spellPhase: 'submitted' });
    }
    return isCorrect;
  },

  skipSpell: () => set({ spellPhase: 'submitted' }),
  retrySpell: () => set({ spellPhase: 'input' }),

  toggleFavorite: (wordS) => {
    const favs = new Set(get().favorites);
    favs.has(wordS) ? favs.delete(wordS) : favs.add(wordS);
    set({ favorites: favs });
    get().showToast(favs.has(wordS) ? '⭐ 已收藏' : '已取消收藏');
  },
});
