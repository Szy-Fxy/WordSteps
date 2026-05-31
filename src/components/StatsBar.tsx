import { useBoundStore } from '../store/boundStore';

export default function StatsBar() {
  const wordBanks = useBoundStore(s => s.wordBanks);
  const lib = useBoundStore(s => s.lib);
  const masteredWords = useBoundStore(s => s.masteredWords);
  const todayCount = useBoundStore(s => s.todayCount);
  const correctCount = useBoundStore(s => s.correctCount);
  const totalAttempts = useBoundStore(s => s.totalAttempts);
  const spellCorrect = useBoundStore(s => s.spellCorrect);
  const spellTotal = useBoundStore(s => s.spellTotal);
  const streakDays = useBoundStore(s => s.streakDays);
  const reviewQueue = useBoundStore(s => s.reviewQueue);

  if (!wordBanks) return null;

  const bank = wordBanks[lib];
  const mastered = bank?.words.filter(w => masteredWords[w.s]).length ?? 0;
  const total = bank?.words.length ?? 0;
  const pct = total ? Math.min(100, Math.round((mastered / total) * 100)) : 0;
  const accuracy = totalAttempts > 0 ? Math.round((correctCount / totalAttempts) * 100) + '%' : '--';
  const spellAccuracy = spellTotal > 0 ? Math.round((spellCorrect / spellTotal) * 100) + '%' : '--';

  return (
    <div className="stats-bar">
      <div className="stats-header">
        <span className="stats-bank-name">{bank?.label ?? lib}</span>
        <span className="stats-progress-text">{pct}%</span>
      </div>
      <div className="stats-progress">
        <div className="stats-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="stats-row stats-row-primary">
        <span className="stat-item">📅 今日 {todayCount}</span>
        <span className="stat-item">✅ {mastered}/{total}</span>
        <span className="stat-item">🔥 {streakDays}天</span>
      </div>
      <div className="stats-row stats-row-secondary">
        <span className="stat-item stat-sm">📝 待复习 {reviewQueue.length}</span>
        <span className="stat-item stat-sm">🎯 {accuracy}</span>
        <span className="stat-item stat-sm">✏️ {spellAccuracy}</span>
      </div>
    </div>
  );
}
