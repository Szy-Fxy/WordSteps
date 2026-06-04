// achievementSlice - 掌握度成就系统
import type { StateCreator } from 'zustand';
import type { AchievementDef, AchievementCategory, AchievementState } from '../types';
import type { BoundStore } from './boundStore';

// ─── 成就定义（静态配置） ───

export const ACHIEVEMENTS: AchievementDef[] = [
  // 📖 掌握量
  { id: 'mastered_10',    category: 'mastered',  label: '初识门径',   desc: '掌握 10 个单词',       icon: '🌱', check: s => s.masteredCount >= 10 },
  { id: 'mastered_50',    category: 'mastered',  label: '小有所成',   desc: '掌握 50 个单词',       icon: '🌿', check: s => s.masteredCount >= 50 },
  { id: 'mastered_100',   category: 'mastered',  label: '百词斩',     desc: '掌握 100 个单词',      icon: '🌳', check: s => s.masteredCount >= 100 },
  { id: 'mastered_200',   category: 'mastered',  label: '词汇猎手',   desc: '掌握 200 个单词',      icon: '🏹', check: s => s.masteredCount >= 200 },
  { id: 'mastered_500',   category: 'mastered',  label: '词汇达人',   desc: '掌握 500 个单词',      icon: '👑', check: s => s.masteredCount >= 500 },
  { id: 'mastered_1000',  category: 'mastered',  label: '词汇大师',   desc: '掌握 1000 个单词',     icon: '🏛', check: s => s.masteredCount >= 1000 },

  // 🔥 连击达人
  { id: 'streak_5',       category: 'streak',    label: '初露锋芒',   desc: '连续 5 次回答正确',    icon: '🔥', check: s => s.currentStreak >= 5 },
  { id: 'streak_10',      category: 'streak',    label: '势如破竹',   desc: '连续 10 次回答正确',   icon: '🔥', check: s => s.currentStreak >= 10 },
  { id: 'streak_20',      category: 'streak',    label: '锐不可当',   desc: '连续 20 次回答正确',   icon: '⚡', check: s => s.currentStreak >= 20 },
  { id: 'streak_30',      category: 'streak',    label: '心流状态',   desc: '连续 30 次回答正确',   icon: '🌀', check: s => s.currentStreak >= 30 },
  { id: 'streak_50',      category: 'streak',    label: '全神贯注',   desc: '连续 50 次回答正确',   icon: '🎯', check: s => s.currentStreak >= 50 },
  { id: 'streak_100',     category: 'streak',    label: '无懈可击',   desc: '连续 100 次回答正确',  icon: '💎', check: s => s.currentStreak >= 100 },

  // 🗓 打卡达人
  { id: 'days_7',         category: 'days',      label: '一周新手',   desc: '连续打卡 7 天',        icon: '📅', check: s => s.streakDays >= 7 },
  { id: 'days_14',        category: 'days',      label: '两周坚持',   desc: '连续打卡 14 天',       icon: '📅', check: s => s.streakDays >= 14 },
  { id: 'days_30',        category: 'days',      label: '月度之星',   desc: '连续打卡 30 天',       icon: '🌟', check: s => s.streakDays >= 30 },
  { id: 'days_60',        category: 'days',      label: '双月达人',   desc: '连续打卡 60 天',       icon: '🌟', check: s => s.streakDays >= 60 },
  { id: 'days_100',       category: 'days',      label: '百日坚持',   desc: '连续打卡 100 天',      icon: '💫', check: s => s.streakDays >= 100 },
  { id: 'days_365',       category: 'days',      label: '一年如一日', desc: '连续打卡 365 天',      icon: '🌞', check: s => s.streakDays >= 365 },

  // 📊 学习总量
  { id: 'volume_100',     category: 'volume',    label: '初识书海',   desc: '累计学习 100 次',       icon: '📖', check: s => s.totalAttempts >= 100 },
  { id: 'volume_250',     category: 'volume',    label: '积少成多',   desc: '累计学习 250 次',       icon: '📖', check: s => s.totalAttempts >= 250 },
  { id: 'volume_500',     category: 'volume',    label: '初入词海',   desc: '累计学习 500 次',      icon: '📚', check: s => s.totalAttempts >= 500 },
  { id: 'volume_1000',    category: 'volume',    label: '书山有路',   desc: '累计学习 1000 次',     icon: '📚', check: s => s.totalAttempts >= 1000 },
  { id: 'volume_5000',    category: 'volume',    label: '学富五车',   desc: '累计学习 5000 次',     icon: '📚', check: s => s.totalAttempts >= 5000 },
  { id: 'volume_10000',   category: 'volume',    label: '万词王',     desc: '累计学习 10000 次',    icon: '📚', check: s => s.totalAttempts >= 10000 },

  // ✏️ 拼写王
  { id: 'spell_10',       category: 'spell',     label: '拼写新手',   desc: '拼写正确 10 次',       icon: '✏️', check: s => s.spellCorrect >= 10 },
  { id: 'spell_50',       category: 'spell',     label: '拼写能手',   desc: '拼写正确 50 次',       icon: '✏️', check: s => s.spellCorrect >= 50 },
  { id: 'spell_100',      category: 'spell',     label: '拼写高手',   desc: '拼写正确 100 次',      icon: '✏️', check: s => s.spellCorrect >= 100 },
  { id: 'spell_200',      category: 'spell',     label: '拼写大师',   desc: '拼写正确 200 次',      icon: '✏️', check: s => s.spellCorrect >= 200 },
  { id: 'spell_500',      category: 'spell',     label: '拼写之神',   desc: '拼写正确 500 次',      icon: '✏️', check: s => s.spellCorrect >= 500 },

  // 🏅 词库征服者
  { id: 'bank_master',    category: 'bank_master', label: '词库征服者', desc: '任意词库掌握度达 100%', icon: '🏆', check: s => s.masteredTotal > 0 && s.masteredCount >= s.masteredTotal },
];

// ─── Slice ───

export interface AchievementSlice {
  unlocked: Record<string, boolean>;
  pendingAchievements: string[];

  /** 检查所有未解锁成就，有新的则加入 pending */
  checkAchievements: (stateSnapshot: {
    masteredCount: number;
    currentStreak: number;
    streakDays: number;
    totalAttempts: number;
    spellCorrect: number;
    masteredTotal: number;
  }) => void;
  /** 消费掉 pending 中的第一条 */
  popPending: () => string | null;
  /** 清空所有 pending（如用户关闭成就弹窗） */
  clearPending: () => void;
  /** 重置成就数据（用于测试/调试） */
  resetAchievements: () => void;
}

export const createAchievementSlice: StateCreator<BoundStore, [], [], AchievementSlice> = (set, get) => ({
  unlocked: {},
  pendingAchievements: [],

  checkAchievements: (snapshot) => {
    const { unlocked } = get();
    const newlyUnlocked: string[] = [];

    for (const ach of ACHIEVEMENTS) {
      if (unlocked[ach.id]) continue;
      if (ach.check(snapshot)) {
        newlyUnlocked.push(ach.id);
      }
    }

    if (newlyUnlocked.length === 0) return;

    // 更新 unlocked 同时把新成就追加到 pending
    const newUnlocked = { ...unlocked };
    for (const id of newlyUnlocked) {
      newUnlocked[id] = true;
    }

    set(s => ({
      unlocked: newUnlocked,
      pendingAchievements: [...s.pendingAchievements, ...newlyUnlocked],
    }));
  },

  popPending: () => {
    const { pendingAchievements } = get();
    if (pendingAchievements.length === 0) return null;
    const [first, ...rest] = pendingAchievements;
    set({ pendingAchievements: rest });
    return first;
  },

  clearPending: () => set({ pendingAchievements: [] }),

  resetAchievements: () => set({ unlocked: {}, pendingAchievements: [] }),
});
