import { useCallback, useRef } from 'react';

export function useAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const play = useCallback((word: string, type: number = 1) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    const aType = type === 0 ? 0 : 1;
    const url = `https://dict.youdao.com/dictvoice?audio=${encodeURIComponent(word)}&type=${aType}`;
    const audio = new Audio(url);
    audioRef.current = audio;
    audio.play().catch(() => {});
  }, []);

  return { play };
}
