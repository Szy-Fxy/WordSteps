// statsSlice - 学习统计
import type { StateCreator } from 'zustand';
import type { DailyLog, LibState } from '../types';
import type { BoundStore } from './boundStore';

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function calcStreakDays(log: DailyLog): number {
  const dates = Object.keys(log).sort().reverse();
  if (!dates.length) return 0;
  let d = 1;
  const ms = 86400000;
  for (let i = 1; i < dates.length; i++) {
    if ((new Date(dates[i - 1]!).getTime() - new Date(dates[i]!).getTime()) / ms <= 1.5) d++;
    else break;
  }
  return d;
}

export interface StatsSlice {
  todayCount: number;
  correctCount: number;
  totalAttempts: number;
  spellCorrect: number;
  spellTotal: number;
  currentStreak: number;
  bestStreak: number;
  streakDays: number;
  dailyLog: DailyLog;
  libStates: Record<string, LibState>;

  incrementStats: (isCorrect: boolean) => void;
  resetStats: () => void;
  tickToday: () => void;
}

export const createStatsSlice: StateCreator<BoundStore, [], [], StatsSlice> = (set, get) => ({
  todayCount: 0,
  correctCount: 0,
  totalAttempts: 0,
  spellCorrect: 0,
  spellTotal: 0,
  currentStreak: 0,
  bestStreak: 0,
  streakDays: 0,
  dailyLog: {},
  libStates: {},

  incrementStats: (isCorrect) => {
    const today = todayKey();
    const { dailyLog } = get();
    const log = { ...dailyLog, [today]: (dailyLog[today] || 0) + 1 };
    set(s => ({
      todayCount: s.todayCount + 1,
      totalAttempts: s.totalAttempts + 1,
      correctCount: isCorrect ? s.correctCount + 1 : s.correctCount,
      spellTotal: s.spellTotal + 1,
      spellCorrect: isCorrect ? s.spellCorrect + 1 : s.spellCorrect,
      dailyLog: log,
      streakDays: calcStreakDays(log),
    }));
  },

  tickToday: () => {
    const today = todayKey();
    const { dailyLog } = get();
    const log = { ...dailyLog, [today]: (dailyLog[today] || 0) + 1 };
    set(s => ({
      todayCount: s.todayCount + 1,
      dailyLog: log,
      streakDays: calcStreakDays(log),
    }));
  },

  resetStats: () => set({
    todayCount: 0, correctCount: 0, totalAttempts: 0,
    spellCorrect: 0, spellTotal: 0, dailyLog: {},
  }),
});
