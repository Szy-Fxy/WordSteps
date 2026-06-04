import { useBoundStore } from '../store/boundStore';
import { useDisplay } from '../hooks/useDisplay';
import { useAudio } from '../hooks/useAudio';
import { SPELL_SKIP_DELAY } from '../constants';
import { useState, useRef, useEffect, useCallback } from 'react';

function buildSpellDiff(input: string, correct: string) {
  const maxLen = Math.max(input.length, correct.length);
  const your: string[] = [], match: boolean[] = [];
  for (let i = 0; i < maxLen; i++) {
    your.push(input[i] || '·');
    match.push((input[i] || '').toLowerCase() === (correct[i] || '').toLowerCase());
  }
  return { your, correct: correct.split(''), match };
}

export default function SpellArea() {
  const mode = useBoundStore(s => s.mode);
  const spellPhase = useBoundStore(s => s.spellPhase);
  const settings = useBoundStore(s => s.settings);
  const submitSpell = useBoundStore(s => s.submitSpell);
  const skipSpell = useBoundStore(s => s.skipSpell);
  const retrySpell = useBoundStore(s => s.retrySpell);
  const nextWord = useBoundStore(s => s.nextWord);
  const showToast = useBoundStore(s => s.showToast);

  const display = useDisplay();
  const { play } = useAudio();

  const [input, setInput] = useState('');
  const [result, setResult] = useState<ReturnType<typeof buildSpellDiff> | null>(null);
  const [feedback, setFeedback] = useState('');
  const [fbClass, setFbClass] = useState('');
  const [shakeInput, setShakeInput] = useState(false);
  const [hintLevel, setHintLevel] = useState(0);
  const [tried, setTried] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const skipTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const stateRef = useRef(useBoundStore.getState());
  stateRef.current = useBoundStore.getState();

  // 新词重置
  useEffect(() => {
    if (mode !== 'spell' || !display) return;
    setInput('');
    setResult(null);
    setFeedback('');
    setFbClass('');
    setHintLevel(0);
    setTried(false);
    if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [display?.word?.s, mode]);

  const advanceWord = useCallback(() => {
    nextWord();
    retrySpell();
  }, [nextWord, retrySpell]);

  const handleSubmit = useCallback(() => {
    const s = stateRef.current;
    if (s.spellPhase === 'submitted' || !display) return;

    const val = input.trim();
    if (!val) {
      setShakeInput(true);
      setTimeout(() => setShakeInput(false), 400);
      showToast('请输入单词');
      return;
    }

    const correct = display.word.s;
    const isCorrect = submitSpell(val);

    if (isCorrect) {
      setFeedback('✅ 正确！');
      setFbClass('correct');
      setResult(null);
      setHintLevel(0);
      // 成就检查
      const st = useBoundStore.getState();
      const total = st.wordBanks?.[st.lib]?.words.length ?? 0;
      st.checkAchievements({
        masteredCount: Object.keys(st.masteredWords).length,
        currentStreak: st.currentStreak,
        streakDays: st.streakDays,
        totalAttempts: st.totalAttempts,
        spellCorrect: st.spellCorrect,
        masteredTotal: total,
      });
      skipTimerRef.current = setTimeout(advanceWord, SPELL_SKIP_DELAY);
    } else {
      setFeedback('❌ 不对，看看哪里错了');
      setFbClass('wrong');
      setResult(buildSpellDiff(val, correct));
      setTried(true);
    }
  }, [input, advanceWord, display, submitSpell, showToast]);

  const handleRetry = useCallback(() => {
    setInput('');
    setResult(null);
    setFeedback('');
    setFbClass('');
    setTried(false);
    setHintLevel(0);
    retrySpell();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [retrySpell]);

  const handleHint = useCallback(() => {
    if (!display) return;
    const word = display.word.s;
    const next = hintLevel + 1;

    switch (next) {
      case 1:
        setFeedback(`💡 这个词有 ${word.length} 个字母`);
        setFbClass('hint');
        setHintLevel(1);
        break;
      case 2:
        setFeedback(`💡 以「${word[0]?.toUpperCase()}」开头`);
        setFbClass('hint');
        setHintLevel(2);
        break;
      case 3:
        play(word, settings.defaultAudioType);
        setFeedback('🔊 听发音');
        setFbClass('hint');
        setHintLevel(3);
        break;
      case 4:
        setInput(word);
        setFeedback(`正确答案：${word}`);
        setFbClass('correct');
        setHintLevel(4);
        skipSpell();
        skipTimerRef.current = setTimeout(advanceWord, SPELL_SKIP_DELAY);
        return;
    }
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [hintLevel, play, settings.defaultAudioType, advanceWord, display, skipSpell]);

  const handleSkip = useCallback(() => {
    if (!display) return;
    skipSpell();
    setInput(display.word.s);
    setFeedback(`正确答案：${display.word.s}`);
    setFbClass('correct');
    setResult(null);
    setHintLevel(4);
    skipTimerRef.current = setTimeout(advanceWord, SPELL_SKIP_DELAY);
  }, [advanceWord, display, skipSpell]);

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (stateRef.current.hidden) return;
    if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
    if (e.key === 'Escape') { e.preventDefault(); handleSkip(); }
  }, [handleSubmit, handleSkip]);

  const handleBodyClick = useCallback(() => {
    if (spellPhase === 'submitted') advanceWord();
  }, [spellPhase, advanceWord]);

  useEffect(() => {
    if (spellPhase === 'submitted') {
      document.addEventListener('click', handleBodyClick);
      return () => document.removeEventListener('click', handleBodyClick);
    }
  }, [spellPhase, handleBodyClick]);

  if (mode !== 'spell' || !display) return null;

  const word = display.word;
  const submitted = spellPhase === 'submitted';

  return (
    <div className="spell-area">
      <div className="spell-hint-bar">
        {hintLevel >= 1 && <span className="hint-tag">📏 {word.s.length}字母</span>}
        {hintLevel >= 2 && <span className="hint-tag">🔤 {word.s[0]?.toUpperCase()}...</span>}
      </div>

      <div className="spell-row">
        <input
          ref={inputRef}
          className={`spell-input ${fbClass} ${shakeInput ? 'shake' : ''}`}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="输入单词拼写..."
          autoFocus
          disabled={submitted}
        />
        {!tried ? (
          <button className="spell-submit" onClick={handleSubmit} disabled={submitted}>确定</button>
        ) : (
          <button className="spell-retry" onClick={handleRetry}>重试</button>
        )}
        <button className="spell-hint" onClick={handleHint} disabled={hintLevel >= 4}>
          {hintLevel === 0 ? '💡' : hintLevel === 1 ? '💡+' : hintLevel === 2 ? '🔊' : '👁'}
        </button>
        <button className="spell-skip" onClick={handleSkip} disabled={submitted && hintLevel < 4}>跳过</button>
      </div>

      {feedback && <div className={`spell-feedback ${fbClass}`}>{feedback}</div>}

      {result && (
        <div className="spell-diff">
          <div className="diff-row"><span className="diff-label">你的输入</span>
            {result.your.map((ch, i) => (
              <span key={i} className={`diff-char ${result.match[i] ? 'match' : 'mismatch'}`}>{ch}</span>
            ))}
          </div>
          <div className="diff-row"><span className="diff-label">正确拼写</span>
            {result.correct.map((ch, i) => (
              <span key={i} className="diff-char">{ch}</span>
            ))}
          </div>
        </div>
      )}

      {/* 释义 + 发音按钮在下方 */}
      <div className="spell-meaning-row">
        <span className="spell-meaning-text">{word.p}</span>
        <button className="spell-pronounce-btn" onClick={() => play(word.s, settings.defaultAudioType)} title="听发音">
          🔊
        </button>
      </div>
    </div>
  );
}
