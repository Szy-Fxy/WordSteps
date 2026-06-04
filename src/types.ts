export interface WordEntry {
  s: string;
  uk?: string;
  us?: string;
  p: string;
  ex?: { en: string; cn: string };
  tags?: string[];
}

export interface WordBank {
  label: string;
  key: string;
  words: WordEntry[];
}

export interface WordBanks {
  [key: string]: WordBank;
}

export type AppMode = 'browse' | 'recall' | 'spell';
export type CharState = 'idle' | 'happy' | 'excited' | 'thinking' | 'star';

export interface ReviewItem {
  wordS: string;
  attempts: number;
  insertAfter: number;
}

export interface DisplayData {
  word: WordEntry;
  isReview: boolean;
  reviewData?: ReviewItem;
}

export interface LibState {
  todayCount: number;
  correctCount: number;
  totalAttempts: number;
  spellCorrect: number;
  spellTotal: number;
  reviewQueue: ReviewItem[];
}

export interface AppSettings {
  autoAudio: boolean;
  defaultAudioType: number;
}

export interface DailyLog {
  [date: string]: number;
}

export interface Ratio {
  w: number;
  h: number;
  label: string;
}

// 成就系统
export interface AchievementDef {
  id: string;
  category: AchievementCategory;
  label: string;
  desc: string;
  icon: string;
  check: (state: { masteredCount: number; currentStreak: number; streakDays: number; totalAttempts: number; spellCorrect: number; masteredTotal: number }) => boolean;
}

export type AchievementCategory = 'mastered' | 'streak' | 'days' | 'volume' | 'spell' | 'bank_master';

export const ACHIEVEMENT_CATEGORY_LABELS: Record<AchievementCategory, string> = {
  mastered: '📖 掌握量',
  streak: '🔥 连击达人',
  days: '🗓 打卡达人',
  volume: '📊 学习总量',
  spell: '✏️ 拼写王',
  bank_master: '🏅 词库征服者',
};

export interface AchievementState {
  unlocked: Record<string, boolean>;
}
