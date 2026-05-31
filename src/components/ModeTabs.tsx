import { useBoundStore } from '../store/boundStore';
import type { AppMode } from '../types';

const MODES: { key: AppMode; label: string }[] = [
  { key: 'browse', label: '📖 浏览' },
  { key: 'recall', label: '🧠 回忆' },
  { key: 'spell', label: '✏️ 拼写' },
];

export default function ModeTabs() {
  const mode = useBoundStore(s => s.mode);
  const setMode = useBoundStore(s => s.setMode);

  return (
    <div className="mode-tabs">
      {MODES.map(m => (
        <button
          key={m.key}
          className={`mode-btn ${mode === m.key ? 'active' : ''}`}
          onClick={() => setMode(m.key)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
