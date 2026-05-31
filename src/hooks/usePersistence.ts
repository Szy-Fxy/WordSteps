// usePersistence - 监听 store 变化自动写 electron-store + 启动时迁移
import { useEffect, useRef } from 'react';
import { useBoundStore } from '../store/boundStore';
import { storageService } from '../services/storageService';

export function usePersistence() {
  const mountRef = useRef(true);

  // 启动时：迁移旧 localStorage 并恢复数据
  useEffect(() => {
    const migrated = storageService.migrateFromLocalStorage();
    const saved = storageService.load() ?? migrated;

    if (saved) {
      const state = useBoundStore.getState();
      if (saved.masteredWords) useBoundStore.setState({ masteredWords: saved.masteredWords });
      if (saved.favorites) useBoundStore.setState({ favorites: new Set(saved.favorites) });
      if (saved.settings) useBoundStore.setState({ settings: saved.settings });
      if (saved.libStates) useBoundStore.setState({ libStates: saved.libStates as Record<string, import('../types').LibState> });
      if (saved.dailyLog) useBoundStore.setState({ dailyLog: saved.dailyLog });
      if (saved.darkTheme !== undefined) useBoundStore.setState({ darkTheme: saved.darkTheme });
      if (saved.winW) useBoundStore.setState({ winW: saved.winW });
      if (saved.winH) useBoundStore.setState({ winH: saved.winH });
      if (saved.bestStreak) useBoundStore.setState({ bestStreak: saved.bestStreak });
    }
  }, []);

  // 运行时自动保存
  useEffect(() => {
    if (mountRef.current) { mountRef.current = false; return; }
    const unsub = useBoundStore.subscribe((state) => {
      storageService.save({
        masteredWords: state.masteredWords,
        favorites: [...state.favorites],
        settings: state.settings,
        libStates: state.libStates,
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
