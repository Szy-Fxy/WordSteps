// useAnimation - 动画状态机，与业务 state 解耦
import { useCallback, useRef } from 'react';
import { useBoundStore } from '../store/boundStore';
import { ANIM_OUT_DURATION, ANIM_IN_DURATION } from '../constants';

export function useAnimation() {
  const isAnimating = useBoundStore(s => s.isAnimating);
  const setAnimating = useBoundStore(s => s.setAnimating);
  const setAnimDir = useBoundStore(s => s.setAnimDir);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const animateThen = useCallback((dir: 'left' | 'right' | 'down', fn: () => void) => {
    if (useBoundStore.getState().isAnimating) return;

    setAnimating(true);
    setAnimDir(dir);

    timerRef.current = setTimeout(() => {
      fn();
      setAnimDir(null);

      timerRef.current = setTimeout(() => {
        setAnimating(false);
      }, ANIM_IN_DURATION);
    }, ANIM_OUT_DURATION);
  }, [setAnimating, setAnimDir]);

  return { isAnimating, animateThen };
}
