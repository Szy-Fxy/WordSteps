import { useBoundStore } from '../store/boundStore';
import type { CharState } from '../types';

const CHAR_FACES: Record<CharState, string> = {
  idle: '🐟', happy: '😊', excited: '😎', thinking: '💪', star: '🎉',
};

export default function CharacterFace() {
  const charState = useBoundStore(s => s.charState);
  return (
    <div className="titlebar-icon" title="学习伙伴">
      <span className="char-face">{CHAR_FACES[charState]}</span>
    </div>
  );
}
