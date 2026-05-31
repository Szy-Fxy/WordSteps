// useKeyboard - 键盘快捷键
import { useEffect } from 'react';
import { useBoundStore } from '../store/boundStore';
import { computeDisplay } from '../store/sessionSlice';
import { useAudio } from './useAudio';

type ActionFn = (action: 'know' | 'dontknow' | 'next') => void;

export function useKeyboard(onAction: ActionFn) {
  const { play } = useAudio();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const state = useBoundStore.getState();

      if (e.target instanceof HTMLInputElement) {
        if (e.key === 'Escape' && state.hidden) {
          e.preventDefault();
          state.toggleHidden();
        }
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        if (state.hidden) {
          window.electronAPI?.invoke('window:show', undefined);
        } else {
          window.electronAPI?.invoke('window:hide', undefined);
        }
        state.toggleHidden();
        return;
      }

      if (state.hidden || state.isAnimating || state.modal) return;

      const display = computeDisplay(state);

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          if (state.mode !== 'spell' || state.spellPhase === 'submitted') onAction('dontknow');
          break;
        case 'ArrowDown':
          e.preventDefault();
          onAction('next');
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (state.mode !== 'spell' || state.spellPhase === 'submitted') onAction('know');
          break;
        case ' ':
          e.preventDefault();
          if (display) play(display.word.s, state.settings.defaultAudioType);
          break;
        case 'h': case 'H':
          state.toggleParaphrase();
          break;
        case 's': case 'S':
          if (display) state.toggleFavorite(display.word.s);
          break;
      }
    };

    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onAction, play]);
}
