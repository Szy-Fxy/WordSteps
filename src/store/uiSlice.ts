// uiSlice - 主题/窗口/设置/角色/反馈/动画
import type { StateCreator } from 'zustand';
import type { CharState, AppSettings } from '../types';
import type { BoundStore } from './boundStore';
import { BANK_PREFIX_ENABLED_DEFAULT } from '../constants';

export interface UiSlice {
  darkTheme: boolean;
  hidden: boolean;
  winW: number;
  winH: number;
  ratioIdx: number;
  showSettings: boolean;
  settings: AppSettings;
  showBankNumber: boolean;
  charState: CharState;
  feedbackMsg: string;
  feedbackType: string;
  toastMsg: string;
  modal: { title: string; msg: string; onConfirm: (() => void) | null } | null;
  isAnimating: boolean;
  animDir: 'left' | 'right' | 'down' | null;
  paraphraseVisible: boolean;

  toggleTheme: () => void;
  toggleHidden: () => void;
  setRatio: (idx: number) => void;
  resize: (w: number, h: number) => void;
  toggleSettings: (v?: boolean) => void;
  setSettings: (s: Partial<AppSettings>) => void;
  toggleAutoAudio: () => void;
  toggleBankNumber: () => void;
  toggleParaphrase: () => void;
  setCharState: (cs: CharState) => void;
  resetCharToIdle: () => void;
  setFeedback: (msg: string, ftype: string) => void;
  clearFeedback: () => void;
  showToast: (msg: string) => void;
  showModal: (title: string, msg: string, onConfirm?: (() => void) | null) => void;
  hideModal: () => void;
  setAnimating: (v: boolean) => void;
  setAnimDir: (dir: 'left' | 'right' | 'down' | null) => void;
}

export const createUiSlice: StateCreator<BoundStore, [], [], UiSlice> = (set) => ({
  darkTheme: false,
  hidden: false,
  winW: 480,
  winH: 720,
  ratioIdx: 0,
  showSettings: false,
  settings: { autoAudio: false, defaultAudioType: 1 },
  showBankNumber: BANK_PREFIX_ENABLED_DEFAULT,
  charState: 'idle' as CharState,
  feedbackMsg: '',
  feedbackType: '',
  toastMsg: '',
  modal: null,
  isAnimating: false,
  animDir: null,
  paraphraseVisible: true,

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
  toggleParaphrase: () => set(s => ({ paraphraseVisible: !s.paraphraseVisible })),
  setCharState: (cs) => set({ charState: cs }),
  resetCharToIdle: () => set({ charState: 'idle' }),
  setFeedback: (msg, ftype) => set({ feedbackMsg: msg, feedbackType: ftype }),
  clearFeedback: () => set({ feedbackMsg: '', feedbackType: '' }),
  showToast: (msg) => set({ toastMsg: msg }),
  showModal: (title, msg, onConfirm) => set({ modal: { title, msg, onConfirm: onConfirm ?? null } }),
  hideModal: () => set({ modal: null }),
  setAnimating: (v) => set({ isAnimating: v }),
  setAnimDir: (dir) => set({ animDir: dir }),
});
