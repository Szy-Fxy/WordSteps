import { useBoundStore } from '../store/boundStore';

interface NavBarProps {
  onAction: (action: 'know' | 'dontknow' | 'next') => void;
}

export default function NavBar({ onAction }: NavBarProps) {
  const mode = useBoundStore(s => s.mode);
  const spellPhase = useBoundStore(s => s.spellPhase);
  const isSpell = mode === 'spell';
  const spellSubmitted = isSpell && spellPhase === 'submitted';

  return (
    <div className="nav-bar">
      <button
        className="nav-btn"
        disabled={isSpell && !spellSubmitted}
        onClick={() => onAction('dontknow')}
      >
        ← 不认识
      </button>
      <button className="nav-btn" onClick={() => onAction('next')}>
        {spellSubmitted ? '→ 下一个词' : '↓ 下一个'}
      </button>
      <button
        className="nav-btn"
        disabled={isSpell && !spellSubmitted}
        onClick={() => onAction('know')}
      >
        → 认识
      </button>
    </div>
  );
}
