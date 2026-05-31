import { useBoundStore } from '../store/boundStore';
import { useDisplay } from '../hooks/useDisplay';
import { useAudio } from '../hooks/useAudio';

export default function WordCard() {
  const mode = useBoundStore(s => s.mode);
  const favorites = useBoundStore(s => s.favorites);
  const paraphraseVisible = useBoundStore(s => s.paraphraseVisible);
  const settings = useBoundStore(s => s.settings);
  const toggleParaphrase = useBoundStore(s => s.toggleParaphrase);
  const toggleFavorite = useBoundStore(s => s.toggleFavorite);

  const display = useDisplay();
  const { play } = useAudio();

  if (!display) {
    return (
      <div className="word-card empty-card">
        <div className="word-spelling">😕</div>
        <div className="word-para">没有匹配的单词</div>
      </div>
    );
  }

  const w = display.word;
  const isFav = favorites.has(w.s);
  const showEx = w.ex && mode === 'browse';
  const isSpell = mode === 'spell';

  return (
    <div
      className={`word-card ${display.isReview ? 'review-badge' : ''}`}
      onDoubleClick={() => play(w.s, settings.defaultAudioType)}
    >
      <div className="word-spelling spell-hidden">
        {isSpell
          ? w.s.split('').map((_, i) => <span key={i} className="spell-letter-blank">_</span>)
          : w.s
        }
      </div>

      <div className="word-phonetics">
        {!isSpell && w.uk && <span className="phonetic uk" onClick={() => play(w.s, 1)}>英 {w.uk} 🔊</span>}
        {!isSpell && w.us && <span className="phonetic us" onClick={() => play(w.s, 0)}>美 {w.us} 🔊</span>}
      </div>

      <div
        className={`word-para ${!paraphraseVisible && !isSpell ? 'blurred' : ''}`}
        onClick={() => { if (!paraphraseVisible) toggleParaphrase(); }}
      >
        {w.p}
      </div>

      {showEx && (
        <div className="word-example">
          <p className="ex-en" dangerouslySetInnerHTML={{ __html: w.ex!.en }} />
          <p className="ex-cn">{w.ex!.cn}</p>
        </div>
      )}

      {w.tags && w.tags.length > 0 && (
        <div className="word-tags">
          {w.tags.map(t => <span key={t} className="tag">{t}</span>)}
        </div>
      )}

      {!isSpell && (
        <div className="word-actions">
          <button className={`action-btn ${isFav ? 'fav-active' : ''}`} onClick={() => toggleFavorite(w.s)}>
            {isFav ? '⭐ 已收藏' : '☆ 收藏'}
          </button>
          <button className="action-btn" onClick={toggleParaphrase}>
            {paraphraseVisible ? '👁 隐藏释义' : '👁 显示释义'}
          </button>
        </div>
      )}
    </div>
  );
}
