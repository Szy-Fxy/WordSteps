# 03-Design：WordSteps 技术设计

> 日期：2026-05-31
> 需求级别：L3
> 阶段：L3-3
> 状态：通过

---

## 一、Store Slice 接口定义

### 1.1 wordbankSlice

```typescript
// src/store/wordbankSlice.ts
import type { StateCreator } from 'zustand';
import type { WordBank, WordEntry } from '../types';

export interface WordbankSlice {
  // State
  wordBanks: Record<string, WordBank> | null;  // null = 未加载
  loading: boolean;
  error: string;
  lib: string;                                  // 当前选中词库 key
  allWords: WordEntry[];                        // 当前词库全部单词（shuffled）
  words: WordEntry[];                           // 过滤后单词（搜索/正常）
  isSearching: boolean;

  // Actions
  loadBanks: () => Promise<void>;
  switchLib: (lib: string, force?: boolean) => void;
  switchMyBank: (key: string) => void;
  search: (query: string) => void;
  clearSearch: () => void;
}

export const createWordbankSlice: StateCreator<WordbankSlice & SessionSlice & UiSlice> = (set, get) => ({
  wordBanks: null,
  loading: true,
  error: '',
  lib: 'postgraduate',
  allWords: [],
  words: [],
  isSearching: false,

  loadBanks: async () => {
    try {
      const [builtin, custom] = await Promise.all([
        fetch('./wordbanks-enriched.json').then(r => r.json()),
        window.electronAPI?.listUserBanks?.() ?? Promise.resolve({}),
      ]);
      const banks = { ...builtin, ...custom };
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
    set({
      lib,
      allWords,
      words: allWords,
      isSearching: false,
    });
    // 重置 session
    get().resetSession(force);
  },

  switchMyBank: (key) => {
    const { wordBanks, favorites } = get();
    if (!wordBanks) return;
    const myWords: WordEntry[] = [];
    for (const k of Object.keys(wordBanks)) {
      myWords.push(...wordBanks[k].words.filter(w => favorites.has(w.s)));
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
    set({ words: results, isSearching: true });
  },

  clearSearch: () => set({ words: get().allWords, isSearching: false }),
});
```

### 1.2 sessionSlice

```typescript
// src/store/sessionSlice.ts
export interface SessionSlice {
  // State
  index: number;
  mode: AppMode;
  reviewQueue: ReviewItem[];
  masteredWords: Record<string, boolean>;
  favorites: Set<string>;

  // 拼写子状态（从 SpellArea 抽出来）
  spellPhase: 'input' | 'submitted' | 'retry';

  // Actions
  resetSession: (force?: boolean) => void;
  nextWord: () => void;
  markKnow: () => void;
  markDontKnow: () => void;
  submitSpell: (input: string) => SpellResult;
  skipSpell: () => void;
  retrySpell: () => void;
  toggleFavorite: () => void;
  toggleMastered: (wordS: string) => void;
}

export const createSessionSlice: StateCreator<WordbankSlice & SessionSlice & StatsSlice & UiSlice> = (set, get) => ({
  index: 0,
  mode: 'browse',
  reviewQueue: [],
  masteredWords: {},
  favorites: new Set(),
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

  nextWord: () => {
    const { index, dailyLog } = get();
    const today = todayKey();
    const log = { ...dailyLog, [today]: (dailyLog[today] || 0) + 1 };
    set({
      index: index + 1,
      dailyLog: log,
      streakDays: calcStreakDays(log),
    });
  },

  markKnow: () => {
    const { index, masteredWords, dailyLog, currentStreak } = get();
    const display = computeDisplay(get());
    if (!display) return;
    const today = todayKey();
    const log = { ...dailyLog, [today]: (dailyLog[today] || 0) + 1 };
    const mastered = { ...masteredWords, [display.word.s]: true };
    const newStreak = currentStreak + 1;
    const bestStreak = Math.max(get().bestStreak, newStreak);
    set({
      index: index + 1,
      masteredWords: mastered,
      dailyLog: log,
      streakDays: calcStreakDays(log),
      currentStreak: newStreak,
      bestStreak,
    });
    // 反馈由 useFeedback hook 派生，不在这里 set
  },

  markDontKnow: () => {
    const { index, reviewQueue, dailyLog } = get();
    const display = computeDisplay(get());
    if (!display) return;
    const today = todayKey();
    const log = { ...dailyLog, [today]: (dailyLog[today] || 0) + 1 };
    const q = reviewQueue.map(r => ({ ...r }));
    const idx = q.findIndex(r => r.wordS === display.word.s);
    if (idx >= 0) {
      const attempts = q[idx].attempts + 1;
      q[idx] = { wordS: display.word.s, attempts, insertAfter: index + 2 + attempts * 2 };
    } else {
      q.push({ wordS: display.word.s, attempts: 1, insertAfter: index + 4 });
    }
    set({
      index: index + 1,
      reviewQueue: q,
      dailyLog: log,
      streakDays: calcStreakDays(log),
      currentStreak: 0,
    });
  },

  submitSpell: (input) => {
    const display = computeDisplay(get());
    if (!display) return { correct: false, reason: 'no_display' };
    const isCorrect = input.trim().toLowerCase() === display.word.s.toLowerCase();
    if (isCorrect) {
      const mastered = { ...get().masteredWords, [display.word.s]: true };
      const newStreak = get().currentStreak + 1;
      set({
        masteredWords: mastered,
        currentStreak: newStreak,
        bestStreak: Math.max(get().bestStreak, newStreak),
        spellPhase: 'submitted',
      });
      get().incrementStats(true);
      return { correct: true };
    } else {
      const { reviewQueue, index } = get();
      const q = reviewQueue.map(r => ({ ...r }));
      const idx = q.findIndex(r => r.wordS === display.word.s);
      if (idx >= 0) {
        q[idx] = { ...q[idx], attempts: q[idx].attempts + 1 };
      } else {
        q.push({ wordS: display.word.s, attempts: 1, insertAfter: index + 4 });
      }
      set({ reviewQueue: q, currentStreak: 0, spellPhase: 'submitted' });
      get().incrementStats(false);
      return { correct: false };
    }
  },

  skipSpell: () => set({ spellPhase: 'submitted' }),
  retrySpell: () => set({ spellPhase: 'input' }),

  toggleFavorite: () => {
    const display = computeDisplay(get());
    if (!display) return;
    const favs = new Set(get().favorites);
    favs.has(display.word.s) ? favs.delete(display.word.s) : favs.add(display.word.s);
    set({ favorites: favs });
    get().showToast(favs.has(display.word.s) ? '⭐ 已收藏' : '已取消收藏');
  },

  toggleMastered: (wordS) => {
    const mastered = { ...get().masteredWords };
    mastered[wordS] = !mastered[wordS];
    set({ masteredWords: mastered });
  },
});
```

### 1.3 statsSlice

```typescript
// src/store/statsSlice.ts
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
}

export const createStatsSlice: StateCreator<SessionSlice & StatsSlice & UiSlice> = (set, get) => ({
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

  resetStats: () => set({
    todayCount: 0, correctCount: 0, totalAttempts: 0,
    spellCorrect: 0, spellTotal: 0, dailyLog: {},
  }),
});
```

### 1.4 uiSlice

```typescript
// src/store/uiSlice.ts
export interface UiSlice {
  // 主题 & 窗口
  darkTheme: boolean;
  hidden: boolean;
  winW: number;
  winH: number;
  ratioIdx: number;

  // 设置
  showSettings: boolean;
  settings: AppSettings;
  showBankNumber: boolean;  // 新增：是否显示词库编号前缀

  // 角色 & 反馈
  charState: CharState;
  feedbackMsg: string;
  feedbackType: string;

  // 提示
  toastMsg: string;
  modal: { title: string; msg: string; onConfirm: (() => void) | null } | null;

  // 动画（独立于业务数据）
  isAnimating: boolean;
  animDir: 'left' | 'right' | 'down' | null;

  // Actions
  toggleTheme: () => void;
  toggleHidden: () => void;
  setRatio: (idx: number) => void;
  resize: (w: number, h: number) => void;
  toggleSettings: (v?: boolean) => void;
  setSettings: (s: Partial<AppSettings>) => void;
  toggleAutoAudio: () => void;
  toggleBankNumber: () => void;
  setCharState: (cs: CharState) => void;
  setFeedback: (msg: string, ftype: string) => void;
  clearFeedback: () => void;
  showToast: (msg: string) => void;
  showModal: (title: string, msg: string, onConfirm?: (() => void) | null) => void;
  hideModal: () => void;
  setAnimating: (v: boolean) => void;
  setAnimDir: (dir: 'left' | 'right' | 'down' | null) => void;
}

export const createUiSlice: StateCreator<UiSlice> = (set) => ({
  darkTheme: false,
  hidden: false,
  winW: 480,
  winH: 720,
  ratioIdx: 0,
  showSettings: false,
  settings: { autoAudio: false, defaultAudioType: 1 },
  showBankNumber: true,
  charState: 'idle',
  feedbackMsg: '',
  feedbackType: '',
  toastMsg: '',
  modal: null,
  isAnimating: false,
  animDir: null,

  toggleTheme: () => set(s => ({ darkTheme: !s.darkTheme })),
  toggleHidden: () => set(s => ({ hidden: !s.hidden })),
  setRatio: (idx) => set({ ratioIdx: idx }),
  resize: (w, h) => set({ winW: w, winH: h }),
  toggleSettings: (v) => set(s => ({ showSettings: v ?? !s.showSettings })),
  setSettings: (s) => set(state => ({ settings: { ...state.settings, ...s } })),
  toggleAutoAudio: () => set(s => {
    const autoAudio = !s.settings.autoAudio;
    s.showToast(autoAudio ? '🔊 自动发音已开启' : '🔇 自动发音已关闭');
    return { settings: { ...s.settings, autoAudio } };
  }),
  toggleBankNumber: () => set(s => ({ showBankNumber: !s.showBankNumber })),
  setCharState: (cs) => set({ charState: cs }),
  setFeedback: (msg, ftype) => set({ feedbackMsg: msg, feedbackType: ftype }),
  clearFeedback: () => set({ feedbackMsg: '', feedbackType: '' }),
  showToast: (msg) => set({ toastMsg: msg }),
  showModal: (title, msg, onConfirm) => set({ modal: { title, msg, onConfirm: onConfirm ?? null } }),
  hideModal: () => set({ modal: null }),
  setAnimating: (v) => set({ isAnimating: v }),
  setAnimDir: (dir) => set({ animDir: dir }),
});
```

---

## 二、Bound Store 组合

```typescript
// src/store/boundStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createWordbankSlice, type WordbankSlice } from './wordbankSlice';
import { createSessionSlice, type SessionSlice } from './sessionSlice';
import { createStatsSlice, type StatsSlice } from './statsSlice';
import { createUiSlice, type UiSlice } from './uiSlice';

export type BoundStore = WordbankSlice & SessionSlice & StatsSlice & UiSlice;

export const useBoundStore = create<BoundStore>()(
  persist(
    (...a) => ({
      ...createWordbankSlice(...a),
      ...createSessionSlice(...a),
      ...createStatsSlice(...a),
      ...createUiSlice(...a),
    }),
    {
      name: 'wordsteps-state',
      partialize: (state) => ({
        // 只持久化需要跨 session 保留的
        masteredWords: state.masteredWords,
        favorites: [...state.favorites],
        settings: state.settings,
        libStates: state.libStates,
        dailyLog: state.dailyLog,
        darkTheme: state.darkTheme,
        winW: state.winW,
        winH: state.winH,
        ratioIdx: state.ratioIdx,
        bestStreak: state.bestStreak,
      }),
      storage: createElectronStoreStorage(), // 见第五节
    }
  )
);
```

---

## 三、派生层：Hooks

### 3.1 useDisplay（单一数据源）

```typescript
// src/hooks/useDisplay.ts
import { useBoundStore } from '../store/boundStore';
import { useMemo } from 'react';
import type { DisplayData } from '../types';

export function computeDisplay(state: Pick<BoundStore, 'reviewQueue' | 'words' | 'index' | 'allWords'>): DisplayData | null {
  const { reviewQueue, words, index, allWords } = state;

  // 复习队列检查：insertAfter 在 [index-5, index] 范围内才出队
  const review = reviewQueue.find(r => r.insertAfter <= index && index - r.insertAfter < 10);
  if (review) {
    const w = allWords.find(x => x.s === review.wordS);
    if (w) return { word: w, isReview: true, reviewData: review };
  }
  if (!words.length) return null;
  return { word: words[index % words.length], isReview: false };
}

export function useDisplay(): DisplayData | null {
  const reviewQueue = useBoundStore(s => s.reviewQueue);
  const words = useBoundStore(s => s.words);
  const index = useBoundStore(s => s.index);
  const allWords = useBoundStore(s => s.allWords);

  return useMemo(
    () => computeDisplay({ reviewQueue, words, index, allWords }),
    [reviewQueue, words, index, allWords]
  );
}
```

### 3.2 useAnimation

```typescript
// src/hooks/useAnimation.ts
import { useBoundStore } from '../store/boundStore';
import { useCallback, useRef } from 'react';

export function useAnimation() {
  const isAnimating = useBoundStore(s => s.isAnimating);
  const setAnimating = useBoundStore(s => s.setAnimating);
  const setAnimDir = useBoundStore(s => s.setAnimDir);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const animateThen = useCallback((dir: 'left' | 'right' | 'down', fn: () => void) => {
    if (useBoundStore.getState().isAnimating) return;

    setAnimating(true);
    setAnimDir(dir);

    timerRef.current = setTimeout(() => {
      fn(); // 只执行业务 action，不再手动算 display
      setAnimDir(null);

      timerRef.current = setTimeout(() => {
        setAnimating(false);
      }, 350);
    }, 250);
  }, [setAnimating, setAnimDir]);

  return { isAnimating, animateThen };
}
```

### 3.3 usePersistence（electron-store 持久化）

```typescript
// src/hooks/usePersistence.ts
import { useEffect, useRef } from 'react';
import { useBoundStore } from '../store/boundStore';
import { storageService } from '../services/storageService';

export function usePersistence() {
  const mountRef = useRef(true);

  // 启动时：从 electron-store 恢复数据，写入 store
  useEffect(() => {
    const saved = storageService.load();
    if (saved) {
      const state = useBoundStore.getState();
      if (saved.masteredWords) useBoundStore.setState({ masteredWords: saved.masteredWords });
      if (saved.favorites) useBoundStore.setState({ favorites: new Set(saved.favorites) });
      if (saved.settings) useBoundStore.setState({ settings: saved.settings });
      if (saved.darkTheme !== undefined) useBoundStore.setState({ darkTheme: saved.darkTheme });
      // ... 其余持久化字段
    }
  }, []);

  // 运行时：store 变化时自动写 electron-store
  useEffect(() => {
    if (mountRef.current) { mountRef.current = false; return; }
    const unsub = useBoundStore.subscribe((state) => {
      storageService.save({
        masteredWords: state.masteredWords,
        favorites: [...state.favorites],
        settings: state.settings,
        dailyLog: state.dailyLog,
        darkTheme: state.darkTheme,
        winW: state.winW,
        winH: state.winH,
        bestStreak: state.bestStreak,
      });
    });
    return unsub;
  }, []);
}
```

---

## 四、IPC Channel 映射表

```typescript
// src/types/ipc-channels.ts
export const IPC_CHANNELS = {
  'window:minimize':    { req: void 0 as void,              res: void 0 as void },
  'window:close':       { req: void 0 as void,              res: void 0 as void },
  'window:hide':        { req: void 0 as void,              res: void 0 as void },
  'window:show':        { req: void 0 as void,              res: void 0 as void },
  'window:set-ratio':   { req: { idx: number },             res: void 0 as void },
  'window:get-ratio':   { req: void 0 as void,              res: number },
  'bank:list-user':     { req: void 0 as void,              res: Record<string, WordBank> },
  'bank:open-folder':   { req: void 0 as void,              res: void 0 as void },
} as const;

export type IpcChannel = keyof typeof IPC_CHANNELS;
export type IpcReq<K extends IpcChannel> = (typeof IPC_CHANNELS)[K]['req'];
export type IpcRes<K extends IpcChannel> = (typeof IPC_CHANNELS)[K]['res'];
```

```typescript
// src/types/electron.d.ts
import type { IPC_CHANNELS, IpcReq, IpcRes, IpcChannel } from './ipc-channels';

declare global {
  interface Window {
    electronAPI: {
      invoke: <K extends IpcChannel>(channel: K, req: IpcReq<K>) => Promise<IpcRes<K>>;
    };
  }
}
```

---

## 五、Services

### 5.1 storageService

```typescript
// src/services/storageService.ts
export const storageService = {
  save(data: PersistedState) {
    window.electronAPI?.invoke('storage:save', data);
  },
  load(): PersistedState | null {
    // 启动时同步读取（preload 暴露同步接口）
    return (window as any).__INITIAL_STATE__ ?? null;
  },
  // 迁移旧 localStorage 数据
  migrateFromLocalStorage() {
    const keys = ['wordsteps_mastered', 'wordsteps_favorites', 'wordsteps_settings',
                  'wordsteps_libstate', 'wordsteps_dailylog', 'wordsteps_winsize', 'wordsteps_theme'];
    const old: Record<string, any> = {};
    for (const k of keys) {
      try {
        const v = localStorage.getItem(k);
        if (v) old[k] = JSON.parse(v);
        localStorage.removeItem(k); // 迁移后清理
      } catch {}
    }
    return old;
  },
};
```

### 5.2 wordbankLoader

```typescript
// src/services/wordbankLoader.ts
import type { WordBank, WordBanks } from '../types';
import type { WordbankTreeNode } from '../types';

export async function loadAllWordbanks(): Promise<WordBanks> {
  // 1. 加载内置词库
  const builtin = await fetch('./wordbanks-enriched.json').then(r => r.json());

  // 2. 扫描用户词库（Electron 主进程负责文件系统操作）
  const userBanks = await window.electronAPI?.invoke('bank:list-user', undefined) ?? {};

  return { ...builtin, ...userBanks };
}

export function buildTree(banks: WordBanks, keyPrefix: string): WordbankTreeNode[] {
  // 根据 key 前缀（如 'E-W001-'）分组，构建父子层级
  // 详见 L3-4 spec 中的完整算法
}
```

---

## 六、Component-Store 订阅矩阵

| 组件 | 订阅的 store slice | 选择器 |
|------|-------------------|--------|
| `App.tsx` | uiSlice | `darkTheme`, `hidden`, `mode` (via sessionSlice) |
| `WordCard` | wordbankSlice + sessionSlice | `allWords`, `index`, `words`, `reviewQueue`, `mode`, `favorites` |
| `SpellArea` | sessionSlice + uiSlice | `spellPhase`, `settings` |
| `NavBar` | sessionSlice + uiSlice | `mode`, `isAnimating` |
| `BankSelector` | wordbankSlice + sessionSlice | `wordBanks`, `lib`, `favorites` |
| `ModeTabs` | sessionSlice | `mode` |
| `SearchBar` | wordbankSlice | `isSearching` |
| `StatsBar` | wordbankSlice + sessionSlice + statsSlice | `lib`, `masteredWords`, `todayCount`, `correctCount`, `totalAttempts`, `streakDays`, `reviewQueue` |
| `FeedbackBar` | uiSlice | `feedbackMsg`, `feedbackType` |
| `CharacterFace` | uiSlice | `charState` |
| `SettingsPanel` | uiSlice | `settings`, `showSettings`, `darkTheme`, `showBankNumber` |
| `TitleBar` | uiSlice | `hidden`, `ratioIdx` |
| `FloatBall` | uiSlice | `hidden` |
| `Toast` | uiSlice | `toastMsg` |
| `ModalOverlay` | uiSlice | `modal` |
| `ShortcutHints` | sessionSlice | `mode` |

---

## 七、关键场景数据流

### 7.1 点击"下一个"

```
用户点击 "↓ 下一个"
  → NavBar.onClick
    → useAnimation().animateThen('down', () => useBoundStore.getState().nextWord())
      → setAnimating(true) + setAnimDir('down')
        → 250ms 后:
          → nextWord() → index++
          → setAnimDir(null)
          → 350ms 后: setAnimating(false)
    // animateThen 内部不再调用 computeDisplay
  → React 检测到 index 变化
    → useDisplay() 自动重新计算
    → WordCard 收到新的 display，重渲染
```

### 7.2 拼写模式提交正确

```
用户输入 → 点击"确定"
  → SpellArea.handleSubmit()
    → submitSpell(input)
      → 拼写正确: masteredWords 更新, spellPhase = 'submitted'
    → 显示 "✅ 正确！"
  → 2000ms 后自动调用 advanceWord()，或任意点击触发
    → advanceWord()
      → nextWord()
      → retrySpell() → spellPhase = 'input'
```

### 7.3 自动发音预加载

```
useEffect 检测到 display 变化
  → 立即创建 Audio 对象: new Audio(url)
  → audio.preload = 'auto'
  → 等待渲染完成（requestAnimationFrame）
  → audio.play()
  // 消除 400ms setTimeout 延迟
```

---

## 八、CSS 变量体系

```css
:root {
  /* 核心色板 */
  --bg-primary: #ffffff;
  --bg-secondary: #f5f5f5;
  --bg-card: #ffffff;
  --text-primary: #1a1a2e;
  --text-secondary: #555;
  --text-tertiary: #999;
  --border: #e0e0e0;
  --accent: #6366f1;
  --accent-hover: #4f46e5;

  /* 反馈色 */
  --success: #22c55e;
  --warning: #f59e0b;
  --danger: #ef4444;

  /* 尺寸（基于比例） */
  --card-padding: clamp(12px, 3vw, 24px);
  --font-xl: clamp(24px, 5vw, 36px);
  --font-lg: clamp(16px, 3vw, 20px);
  --font-md: clamp(14px, 2.5vw, 16px);
  --font-sm: clamp(12px, 2vw, 14px);
}

.dark {
  --bg-primary: #0f0f23;
  --bg-secondary: #1a1a2e;
  --bg-card: #1e1e36;        /* 修复 .modal-box */
  --text-primary: #e4e4e4;
  --text-secondary: #aaa;
  --text-tertiary: #666;
  --border: #2a2a4a;
  --accent: #818cf8;
  --accent-hover: #6366f1;
}

/* 模态弹窗继承 */
.modal-box,
.settings-box {
  background: var(--bg-card);  /* 深色: #1e1e36, 浅色: #fff */
  color: var(--text-primary);  /* 深色: #e4e4e4 */
  border: 1px solid var(--border);
}
```

对比度验证（深色模式）：
- `#e4e4e4` 在 `#1e1e36` 上：对比度 11.2:1 ✅（远超 WCAG AA 4.5:1）

---

## 九、SpellArea 布局重设计

```
┌─────────────────────────────────────────┐
│  📏 7字母  🔤 I...          ← 提示行    │
│                                         │
│  _ _ _ _ _ _ _              ← 拼写空位  │
│                                         │
│  ┌──────────────────┐ ┌────┐           │
│  │ 输入单词拼写...    │ │确定│ ← 同行    │
│  └──────────────────┘ └────┘           │
│                                         │
│  🔊 听发音  │  跳过  │  💡 提示        │
│  ↑ 移到释义右侧，按钮统一样式           │
│                                         │
│  ❌ 不对，看看哪里错了（反馈区）          │
│                                         │
│  n. 面试；访问  🔊       ← 释义+发音   │
│  ↑ 拼写模式下释义始终可见               │
└─────────────────────────────────────────┘
```

变更：
1. 发音按钮从独立位置移到释义右侧
2. 输入框和确定按钮同高（36px）
3. 辅助按钮（发音/跳过/提示）统一样式，放在第二行
4. 拼写模式下移除"隐藏释义"按钮（死控件消除）
5. 快捷键提示中移除拼写模式下不适用项

---

## 十、保留清单（防御性）

| 保留项 | 原因 |
|--------|------|
| `computeDisplay` 算法核心逻辑 | 逻辑正确，问题出在调用方双写 |
| `buildSpellDiff` | 纯函数，无副作用，值保留 |
| `buildFeedback` | 纯函数，重写文案但保留签名 |
| `useAudio` hook 架构 | 接口稳定，只需加预加载 |
| `components/CharacterFace` | UI 纯展示组件，不变 |
| `components/Toast` | 逻辑简单，不动 |
| `components/ShortcutHints` | 只改显示条件，不动结构 |
| `electron/main.ts` 窗口管理 | 修复 `will-resize`，保留基础框架 |
| `vite.config.ts` | 不动 |

---

## 十一、依赖关系图

```
main.ts (Electron 主进程)
  ├── IPC handlers
  │     ├── window:set-ratio
  │     ├── window:get-ratio
  │     ├── bank:list-user
  │     └── bank:open-folder
  └── preload.ts
        └── contextBridge.exposeInMainWorld('electronAPI', ...)

boundStore.ts (Zustand)
  ├── wordbankSlice ← wordbankLoader
  ├── sessionSlice ← computeDisplay (hook)
  ├── statsSlice
  └── uiSlice

App.tsx
  ├── usePersistence() → storageService → electron-store
  ├── useAnimation() → uiSlice.isAnimating
  ├── useDisplay() → sessionSlice + wordbankSlice
  ├── useKeyboard() → 快捷键映射
  └── useAudio() → Audio API

Components (只读 store，不写)
  ├── WordCard ← useDisplay()
  ├── SpellArea ← sessionSlice.spellPhase
  ├── NavBar ← sessionSlice.mode
  ├── BankSelector ← wordbankSlice.lib
  └── ...
```

---

## 十二、迁移计划

### 12.1 localStorage → electron-store

```
启动时执行：
1. storageService.migrateFromLocalStorage()
   → 读取所有 wordsteps_* key
   → 写入 electron-store
   → 清除 localStorage 中的旧 key
2. storageService.load()
   → 从 electron-store 恢复数据
   → 写入 Zustand store
```

### 12.2 旧原型归档

```
D:/OH-WorkSpace/wordsteps/
├── archive/            ← 移动旧原型文件
│   ├── index.html
│   ├── js/
│   └── css/
└── electron/           ← 唯一主版本
```

---

> **下一阶段**：L3-4 需求规格（`04-spec.md`），细化每个组件的验收场景、边界条件和交互规范。
