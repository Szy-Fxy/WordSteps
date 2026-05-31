import { useBoundStore } from '../store/boundStore';

export default function FloatBall() {
  const hidden = useBoundStore(s => s.hidden);
  const toggleHidden = useBoundStore(s => s.toggleHidden);

  if (!hidden) return null;

  return (
    <div className="float-ball" onClick={() => {
      window.electronAPI?.invoke('window:show', undefined);
      toggleHidden();
    }}>
      <span className="float-ball-face">🐟</span>
      <span className="float-ball-hint">摸鱼中...</span>
      <span className="float-ball-esc-hint">按 <b>Esc</b> 或 <b>Ctrl+Alt+W</b> 恢复</span>
    </div>
  );
}
