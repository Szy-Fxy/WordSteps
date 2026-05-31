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
