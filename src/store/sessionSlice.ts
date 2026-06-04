// sessionSlice - 当前学习会话
import type { StateCreator } from 'zustand';
import type { AppMode, ReviewItem } from '../types';
import type { BoundStore } from './boundStore';
import { REVIEW_WINDOW, MAX_REVIEW_ATTEMPTS, MAX_CONSECUTIVE_REVIEWS } from '../constants';

export interface SessionSlice {
  index: number;
  mode: AppMode;
  reviewQueue: ReviewItem[];
  masteredWords: Record<string, boolean>;
  favorites: Set<string>;
  spellPhase: 'input' | 'submitted' | 'retry';
  consecutiveReviews: number;
  todayWords: string[];
  todayWordsDate: string;

  resetSession: (force?: boolean) => void;
  setMode: (mode: AppMode) => void;
  nextWord: () => void;
  markKnow: () => void;
  markDontKnow: () => void;
  submitSpell: (input: string) => boolean;
  skipSpell: () => void;
  retrySpell: () => void;
  toggleFavorite: (wordS: string) => void;
  addTodayWord: (wordS: string) => void;
  clearTodayWords: () => void;
}

// 从 reviewQueue 中移除指定词的记录
function removeFromQueue(queue: ReviewItem[], wordS: string): ReviewItem[] {
  return queue.filter(r => r.wordS !== wordS);
}

// computeDisplay 放这里避免循环引用（sessionSlice 和 useDisplay 都需要）
export function computeDisplay(state: {
  reviewQueue: ReviewItem[];
  words: { s: string; uk?: string; us?: string; p: string; ex?: { en: string; cn: string }; tags?: string[] }[];
  index: number;
  allWords: { s: string; uk?: string; us?: string; p: string; ex?: { en: string; cn: string }; tags?: string[] }[];
  consecutiveReviews: number;
}): { word: { s: string; uk?: string; us?: string; p: string; ex?: { en: string; cn: string }; tags?: string[] }; isReview: boolean; reviewData?: ReviewItem } | null {
  const { reviewQueue, words, index, allWords, consecutiveReviews } = state;

  // 连续复习词超过上限时，跳过复习队列，展示新词
  if (consecutiveReviews < MAX_CONSECUTIVE_REVIEWS) {
    const review = reviewQueue.find(r => r.insertAfter <= index && index - r.insertAfter < REVIEW_WINDOW);
    if (review) {
      const w = allWords.find(x => x.s === review.wordS);
      if (w) return { word: w, isReview: true, reviewData: review };
    }
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

  consecutiveReviews: 0,
  todayWords: [],
  todayWordsDate: '',

  resetSession: (force) => {
    const { libStates, lib } = get();
    const saved = force ? null : libStates[lib];
    set({
      index: 0,
      reviewQueue: saved?.reviewQueue ?? [],
      spellPhase: 'input',
      consecutiveReviews: 0,
    });
  },

  setMode: (mode) => set({ mode, spellPhase: 'input' }),

  nextWord: () => {
    get().tickToday();
    set(s => ({ index: s.index + 1, spellPhase: 'input' }));
  },

  markKnow: () => {
    const { index, reviewQueue } = get();
    const display = computeDisplay(get());
    if (!display) return;

    get().addTodayWord(display.word.s);

    const mastered = { ...get().masteredWords, [display.word.s]: true };
    const newStreak = get().currentStreak + 1;
    const best = Math.max(get().bestStreak, newStreak);
    // 答对了就从 review 队列移除
    const q = removeFromQueue(reviewQueue, display.word.s);

    get().incrementStats(true);
    set({
      index: index + 1,
      masteredWords: mastered,
      currentStreak: newStreak,
      bestStreak: best,
      reviewQueue: q,
      consecutiveReviews: display.isReview ? get().consecutiveReviews + 1 : 0,
    });
  },

  markDontKnow: () => {
    const { index, reviewQueue } = get();
    const display = computeDisplay(get());
    if (!display) return;

    get().addTodayWord(display.word.s);
    get().incrementStats(false);
    let q = reviewQueue.map(r => ({ ...r }));
    const idx = q.findIndex(r => r.wordS === display.word.s);
    if (idx >= 0) {
      const attempts = q[idx]!.attempts + 1;
      if (attempts >= MAX_REVIEW_ATTEMPTS) {
        // 超过上限，放弃该词，不继续折磨用户
        q = removeFromQueue(q, display.word.s);
      } else {
        // 每次复习间隔放大：index + 5 + attempts * 5
        q[idx] = { wordS: display.word.s, attempts, insertAfter: index + 5 + attempts * 5 };
      }
    } else {
      q.push({ wordS: display.word.s, attempts: 1, insertAfter: index + 5 });
    }
    set({
      index: index + 1,
      reviewQueue: q,
      currentStreak: 0,
      consecutiveReviews: display.isReview ? get().consecutiveReviews + 1 : 0,
    });
  },

  submitSpell: (input) => {
    const display = computeDisplay(get());
    if (!display) return false;

    get().addTodayWord(display.word.s);
    const isCorrect = input.trim().toLowerCase() === display.word.s.toLowerCase();

    if (isCorrect) {
      const mastered = { ...get().masteredWords, [display.word.s]: true };
      const newStreak = get().currentStreak + 1;
      // 拼写正确也从 review 队列移除
      const q = removeFromQueue(get().reviewQueue, display.word.s);
      get().incrementStats(true);
      set({
        masteredWords: mastered,
        currentStreak: newStreak,
        bestStreak: Math.max(get().bestStreak, newStreak),
        reviewQueue: q,
        spellPhase: 'submitted',
        consecutiveReviews: display.isReview ? get().consecutiveReviews + 1 : 0,
      });
    } else {
      const { reviewQueue: qRaw, index } = get();
      get().incrementStats(false);
      let q = qRaw.map(r => ({ ...r }));
      const idx = q.findIndex(r => r.wordS === display.word.s);
      if (idx >= 0) {
        const attempts = q[idx]!.attempts + 1;
        if (attempts >= MAX_REVIEW_ATTEMPTS) {
          q = removeFromQueue(q, display.word.s);
        } else {
          q[idx] = { wordS: display.word.s, attempts, insertAfter: index + 5 + attempts * 5 };
        }
      } else {
        q.push({ wordS: display.word.s, attempts: 1, insertAfter: index + 5 });
      }
      set({
        reviewQueue: q,
        currentStreak: 0,
        spellPhase: 'submitted',
        consecutiveReviews: display.isReview ? get().consecutiveReviews + 1 : 0,
      });
    }
    return isCorrect;
  },

  skipSpell: () => set({ spellPhase: 'submitted' }),
  retrySpell: () => set({ spellPhase: 'input' }),

  addTodayWord: (wordS) => {
    set(s => {
      if (s.todayWords.includes(wordS)) return s;
      // 同时更新日期
      const dateStr = new Date().toISOString().slice(0, 10);
      return { todayWords: [...s.todayWords, wordS], todayWordsDate: dateStr };
    });
  },

  clearTodayWords: () => set({ todayWords: [], todayWordsDate: '' }),

  toggleFavorite: (wordS) => {
    const favs = new Set(get().favorites);
    favs.has(wordS) ? favs.delete(wordS) : favs.add(wordS);
    set({ favorites: favs });
    get().showToast(favs.has(wordS) ? '⭐ 已收藏' : '已取消收藏');
  },
});
