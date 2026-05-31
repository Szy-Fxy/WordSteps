import { useBoundStore } from '../store/boundStore';

export default function ShortcutHints() {
  const mode = useBoundStore(s => s.mode);
  const isSpell = mode === 'spell';

  return (
    <footer className="shortcuts">
      {!isSpell && <span><kbd>←</kbd> 不认识</span>}
      <span><kbd>↓</kbd> 下一个</span>
      {!isSpell && <span><kbd>→</kbd> 认识</span>}
      <span><kbd>Space</kbd> 发音</span>
      <span><kbd>H</kbd> 释义</span>
      <span><kbd>S</kbd> 收藏</span>
      <span><kbd>Esc</kbd> 隐藏</span>
    </footer>
  );
}
