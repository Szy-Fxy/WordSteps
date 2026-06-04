import { useEffect, useCallback, useState } from 'react';
import { useBoundStore } from './store/boundStore';
import { useDisplay } from './hooks/useDisplay';
import { useAnimation } from './hooks/useAnimation';
import { useKeyboard } from './hooks/useKeyboard';
import { usePersistence } from './hooks/usePersistence';
import { useAudio } from './hooks/useAudio';

import { computeDisplay } from './store/sessionSlice';
import ShortcutHints from './components/ShortcutHints';
import TitleBar from './components/TitleBar';
import BankSelector from './components/BankSelector';
import SearchBar from './components/SearchBar';
import ModeTabs from './components/ModeTabs';
import WordCard from './components/WordCard';
import SpellArea from './components/SpellArea';
import NavBar from './components/NavBar';
import StatsBar from './components/StatsBar';
import FeedbackBar from './components/FeedbackBar';
import FloatBall from './components/FloatBall';
import SettingsPanel from './components/SettingsPanel';
import ModalOverlay from './components/ModalOverlay';
import Toast from './components/Toast';
import AchievementPanel from './components/AchievementPanel';
import type { CharState } from './types';

function buildFeedback(
  charState: CharState,
  currentStreak: number,
  streakDays: number,
  todayCount: number,
): { msg: string; type: string } | null {
  if (charState === 'star') return { msg: `🔥 连续 ${currentStreak} 次正确，状态不错！`, type: 'streak' };
  if (charState === 'excited') return { msg: `😎 连续 ${currentStreak} 次正确，渐入佳境！`, type: 'streak' };
  if (charState === 'happy') return { msg: currentStreak === 1 ? '🎯 答对了！' : `🎯 连续 ${currentStreak} 次正确！`, type: 'correct' };
  if (charState === 'thinking') return { msg: '💪 没关系，多见几次就记住了。', type: 'wrong' };
  if (todayCount === 100) return { msg: '🏆 今天已学 100 词，你是卷王！', type: 'milestone' };
  if (todayCount === 50) return { msg: '🚀 今天已学 50 词，超额完成！', type: 'milestone' };
  if (todayCount === 20) return { msg: '📚 今天已学 20 词，保持节奏。', type: 'milestone' };
  if (streakDays >= 3 && todayCount === 1) return { msg: `🌟 连续 ${streakDays} 天打卡，你在变强。`, type: 'streak' };
  return null;
}

export default function App() {
  const darkTheme = useBoundStore(s => s.darkTheme);
  const hidden = useBoundStore(s => s.hidden);
  const mode = useBoundStore(s => s.mode);
  const loading = useBoundStore(s => s.loading);
  const error = useBoundStore(s => s.error);
  const settings = useBoundStore(s => s.settings);
  const paraphraseVisible = useBoundStore(s => s.paraphraseVisible);
  const currentStreak = useBoundStore(s => s.currentStreak);
  const streakDays = useBoundStore(s => s.streakDays);
  const todayCount = useBoundStore(s => s.todayCount);

  const loadBanks = useBoundStore(s => s.loadBanks);
  const setMode = useBoundStore(s => s.setMode);
  const setFeedback = useBoundStore(s => s.setFeedback);

  const display = useDisplay();
  const { isAnimating, animateThen } = useAnimation();
  const { play } = useAudio();

  usePersistence();

  // 加载词库
  useEffect(() => { loadBanks(); }, [loadBanks]);

  // 自动发音（预加载策略）
  useEffect(() => {
    if (!settings.autoAudio || !display) return;
    const word = display.word.s;
    const type = settings.defaultAudioType;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${type}`;
    const audio = new Audio(url);
    audio.preload = 'auto';
    const id = requestAnimationFrame(() => {
      audio.play().catch(() => {});
    });
    return () => {
      cancelAnimationFrame(id);
      audio.src = '';
    };
  }, [display, settings.autoAudio, settings.defaultAudioType]);

  // 回忆模式自动隐藏释义
  useEffect(() => {
    if (mode === 'recall' && paraphraseVisible) {
      useBoundStore.getState().toggleParaphrase();
    }
  }, [mode]);

  // 动作处理
  const handleAction = useCallback((action: 'know' | 'dontknow' | 'next') => {
    const store = useBoundStore.getState();
    if (action === 'know') {
      animateThen('right', () => {
        store.markKnow();
        const s = useBoundStore.getState();
        const cs: CharState = s.currentStreak >= 5 ? 'star' : s.currentStreak >= 3 ? 'excited' : 'happy';
        const fb = buildFeedback(cs, s.currentStreak, s.streakDays, s.todayCount);
        if (fb) setFeedback(fb.msg, fb.type);
        s.setCharState(cs);

        // 成就检查
        const total = s.wordBanks?.[s.lib]?.words.length ?? 0;
        s.checkAchievements({
          masteredCount: Object.keys(s.masteredWords).length,
          currentStreak: s.currentStreak,
          streakDays: s.streakDays,
          totalAttempts: s.totalAttempts,
          spellCorrect: s.spellCorrect,
          masteredTotal: total,
        });
      });
    } else if (action === 'dontknow') {
      animateThen('left', () => {
        store.markDontKnow();
        const s = useBoundStore.getState();
        const fb = buildFeedback('thinking', 0, s.streakDays, s.todayCount);
        if (fb) setFeedback(fb.msg, fb.type);
        s.setCharState('thinking');
      });
    } else {
      animateThen('down', () => {
        store.nextWord();
        useBoundStore.getState().resetCharToIdle();
      });
    }
  }, [animateThen, setFeedback]);

  useKeyboard(handleAction);

  // 双击发音
  const handleDoubleClick = useCallback(() => {
    if (display) play(display.word.s, settings.defaultAudioType);
  }, [display, play, settings.defaultAudioType]);

  if (loading) return <div className="loading">📖 加载词库中...</div>;
  if (error) return <div className="error">加载失败: {error}</div>;

  return (
    <div className="app-root">
      <div className={`app ${darkTheme ? 'dark' : ''} ${hidden ? 'hidden' : ''} mode-${mode}`}>
        <TitleBar />
        <div className="top-bar">
          <BankSelector />
          <SearchBar />
        </div>
        <ModeTabs />
        <main className="main-content" onDoubleClick={handleDoubleClick}>
          <div className={`word-card-wrap ${isAnimating ? 'swipe-out' : 'swipe-in'}`}>
                <WordCard />
                <SpellArea />
          </div>
          <ShortcutHints />
        </main>
        <FeedbackBar />
        <NavBar onAction={handleAction} />
        <StatsBar />
      </div>
      <FloatBall />
      <SettingsPanel />
      <ModalOverlay />
      <Toast />
      <AchievementPanel />
    </div>
  );
}
