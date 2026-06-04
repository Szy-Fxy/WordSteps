// wordbankSlice - 词库数据
import type { StateCreator } from 'zustand';
import type { WordBanks, WordEntry } from '../types';
import type { BoundStore } from './boundStore';
import { shuffle } from '../services/wordbankLoader';

export interface WordbankSlice {
  wordBanks: WordBanks | null;
  loading: boolean;
  error: string;
  lib: string;
  allWords: WordEntry[];
  words: WordEntry[];
  isSearching: boolean;
  favoritesCount: number;

  loadBanks: () => Promise<void>;
  switchLib: (lib: string, force?: boolean) => void;
  switchMyBank: (key: string) => void;
  search: (query: string) => void;
  clearSearch: () => void;
}

export const createWordbankSlice: StateCreator<BoundStore, [], [], WordbankSlice> = (set, get) => ({
  wordBanks: null,
  loading: true,
  error: '',
  lib: 'postgraduate',
  allWords: [],
  words: [],
  isSearching: false,
  favoritesCount: 0,

  loadBanks: async () => {
    try {
      const { loadAllWordbanks } = await import('../services/wordbankLoader');
      const banks = await loadAllWordbanks();
      set({ wordBanks: banks, loading: false });
      get().switchLib(get().lib, true);
    } catch (e) {
      set({ error: (e as Error).message, loading: false });
    }
  },

  switchLib: (lib, force) => {
    const { wordBanks } = get();
    if (!wordBanks) return;
    const bank = wordBanks[lib];
    if (!bank) return;

    const allWords = shuffle([...bank.words]);
    const saved = force ? null : get().libStates[lib];

    set({
      lib,
      allWords,
      words: allWords,
      isSearching: false,
    });
    get().resetSession(force);

    if (saved) {
      set({
        todayCount: saved.todayCount,
        correctCount: saved.correctCount,
        totalAttempts: saved.totalAttempts,
        spellCorrect: saved.spellCorrect,
        spellTotal: saved.spellTotal,
      });
    }
  },

  switchMyBank: (key) => {
    const { wordBanks, favorites, todayWords } = get();
    if (!wordBanks) return;

    // 今日所学：跨天检测
    if (key === 'my-today') {
      const todayDate = new Date().toISOString().slice(0, 10);
      const { todayWordsDate } = get();
      // 日期变化时清空
      if (todayWordsDate && todayWordsDate !== todayDate) {
        get().clearTodayWords();
      }

      const myWords: WordEntry[] = [];
      const twSet = new Set(get().todayWords);
      if (twSet.size === 0) {
        get().showToast('📅 今天还没有学过的词');
        return;
      }
      const seen = new Set<string>();
      for (const k of Object.keys(wordBanks)) {
        for (const w of wordBanks[k]!.words) {
          if (twSet.has(w.s) && !seen.has(w.s)) {
            myWords.push(w);
            seen.add(w.s);
          }
        }
      }
      if (myWords.length === 0) {
        get().showToast('📅 今天还没有学过的词');
        return;
      }
      set({
        lib: key,
        allWords: myWords,
        words: myWords,
        isSearching: false,
      });
      get().resetSession(true);
      get().showToast(`已切换到今日所学 (${myWords.length}词)`);
      return;
    }

    // 全部收藏
    const myWords: WordEntry[] = [];
    for (const k of Object.keys(wordBanks)) {
      myWords.push(...wordBanks[k]!.words.filter(w => favorites.has(w.s)));
    }
    if (myWords.length === 0) {
      get().showToast('收藏列表为空');
      return;
    }
    set({
      lib: key,
      allWords: shuffle(myWords),
      words: shuffle(myWords),
      isSearching: false,
    });
    get().resetSession(true);
    get().showToast(`已切换到全部收藏 (${myWords.length}词)`);
  },

  search: (query) => {
    const { allWords } = get();
    const q = query.trim().toLowerCase();
    if (!q) {
      set({ words: allWords, isSearching: false });
      return;
    }
    const results = allWords.filter(w =>
      w.s.toLowerCase().includes(q) || w.p.toLowerCase().includes(q)
    );
    if (!results.length) {
      get().showToast('未找到匹配单词');
    } else {
      get().showToast(`找到 ${results.length} 个匹配`);
    }
    set({ words: results, isSearching: true, index: 0 });
  },

  clearSearch: () => set({ words: get().allWords, isSearching: false, index: 0 }),
});
