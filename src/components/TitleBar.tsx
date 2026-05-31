import { useBoundStore } from '../store/boundStore';
import { useState } from 'react';

const RATIOS = [
  { idx: 0, label: '9:16' },
  { idx: 1, label: '3:2' },
  { idx: 2, label: '1:1' },
  { idx: 3, label: '3:4' },
  { idx: 4, label: '2:3' },
  { idx: 5, label: '16:9' },
  { idx: -1, label: '自由' },
];

export default function TitleBar() {
  const hidden = useBoundStore(s => s.hidden);
  const ratioIdx = useBoundStore(s => s.ratioIdx);
  const toggleSettings = useBoundStore(s => s.toggleSettings);
  const toggleTheme = useBoundStore(s => s.toggleTheme);
  const toggleHidden = useBoundStore(s => s.toggleHidden);
  const [ratioOpen, setRatioOpen] = useState(false);

  const currentRatio = RATIOS.find(r => r.idx === ratioIdx)?.label ?? '2:3';

  return (
    <header className="titlebar">
      <div className="titlebar-icon">
        <span className="char-face">🐟</span>
      </div>
      <h1 className="titlebar-title">WordSteps</h1>
      <nav className="titlebar-actions">
        <div className="ratio-dropdown">
          <button className="titlebar-btn ratio-btn" onClick={() => setRatioOpen(!ratioOpen)}>
            {currentRatio}
          </button>
          {ratioOpen && (
            <div className="drop-menu ratio-menu">
              {RATIOS.map(r => (
                <div
                  key={r.idx}
                  className={`menu-item ${r.idx === ratioIdx ? 'active' : ''}`}
                  onClick={() => {
                    setRatioOpen(false);
                    useBoundStore.getState().setRatio(r.idx);
                    window.electronAPI?.invoke('window:set-ratio', { idx: r.idx });
                  }}
                >
                  {r.label}
                </div>
              ))}
            </div>
          )}
        </div>
        <button className="titlebar-btn settings-btn" onClick={() => toggleSettings()} title="设置">⚙️</button>
        <button className="titlebar-btn theme-toggle" onClick={toggleTheme} title="切换主题">
          {useBoundStore.getState().darkTheme ? '☀️' : '🌙'}
        </button>
        <button className="titlebar-btn" onClick={() => window.electronAPI?.invoke('window:minimize', undefined)} title="最小化">─</button>
        <button className="titlebar-btn close" onClick={() => window.electronAPI?.invoke('window:close', undefined)} title="关闭">✕</button>
      </nav>
    </header>
  );
}
