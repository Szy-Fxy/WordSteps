// 持久化服务 - electron-store 封装 + localStorage 迁移
import { LS_KEYS } from '../constants';

interface PersistedState {
  masteredWords: Record<string, boolean>;
  favorites: string[];
  settings: { autoAudio: boolean; defaultAudioType: number };
  libStates: Record<string, unknown>;
  dailyLog: Record<string, number>;
  darkTheme: boolean;
  winW: number;
  winH: number;
  bestStreak: number;
  unlocked: Record<string, boolean>;
}

export const storageService = {
  save(data: PersistedState) {
    window.electronAPI?.invoke('storage:save', data as unknown as Record<string, unknown>);
  },

  load(): PersistedState | null {
    return (window as unknown as { __INITIAL_STATE__?: PersistedState }).__INITIAL_STATE__ ?? null;
  },

  /** 迁移旧 localStorage 数据到新存储，迁移后清除旧 key */
  migrateFromLocalStorage(): Partial<PersistedState> | null {
    const old: Record<string, unknown> = {};
    let hasData = false;

    for (const key of Object.values(LS_KEYS)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          old[key] = JSON.parse(raw);
          hasData = true;
        }
        localStorage.removeItem(key);
      } catch {
        // 损坏数据跳过
      }
    }

    if (!hasData) return null;

    // 合并多个 localStorage key 到统一结构
    return {
      masteredWords: (old[LS_KEYS.mastered] as Record<string, boolean>) ?? {},
      favorites: (old[LS_KEYS.favorites] as string[]) ?? [],
      settings: (old[LS_KEYS.settings] as PersistedState['settings']) ?? { autoAudio: false, defaultAudioType: 1 },
      libStates: (old[LS_KEYS.libState] as Record<string, unknown>) ?? {},
      dailyLog: (old[LS_KEYS.dailylog] as Record<string, number>) ?? {},
      darkTheme: old[LS_KEYS.theme] === 'dark',
      winW: (old[LS_KEYS.winsize] as { w?: number })?.w ?? 480,
      winH: (old[LS_KEYS.winsize] as { h?: number })?.h ?? 720,
      bestStreak: 0,
      unlocked: {},
    };
  },
};
