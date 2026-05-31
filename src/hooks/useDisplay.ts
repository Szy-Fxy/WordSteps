// useDisplay - 从 store 派生当前显示的单词（单一数据源）
import { useBoundStore } from '../store/boundStore';
import { computeDisplay } from '../store/sessionSlice';
import { useMemo } from 'react';
import type { DisplayData } from '../types';

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

export { computeDisplay };
