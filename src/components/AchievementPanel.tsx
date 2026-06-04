import { useBoundStore } from '../store/boundStore';
import { ACHIEVEMENTS } from '../store/achievementSlice';
import type { AchievementCategory } from '../types';
import { ACHIEVEMENT_CATEGORY_LABELS } from '../types';

function computeProgress(
  category: AchievementCategory,
  state: ReturnType<typeof useBoundStore.getState>,
): [number, number] {
  // [当前值, 目标值] 用于显示进度
  const catAchs = ACHIEVEMENTS.filter(a => a.category === category);
  const nextLocked = catAchs.find(a => !state.unlocked[a.id]);
  if (!nextLocked) return [1, 1]; // 全部解锁

  const total = state.wordBanks?.[state.lib]?.words.length ?? 0;
  const masteredCount = Object.keys(state.masteredWords).length;

  // 找下一个待解锁成就的目标值
  const thresholdMatch = nextLocked.desc.match(/(\d+)/);
  const threshold = thresholdMatch ? parseInt(thresholdMatch[1], 10) : 0;

  switch (category) {
    case 'mastered': return [masteredCount, threshold];
    case 'streak':   return [state.currentStreak, threshold];
    case 'days':     return [state.streakDays, threshold];
    case 'volume':   return [state.totalAttempts, threshold];
    case 'spell':    return [state.spellCorrect, threshold];
    case 'bank_master': return [total > 0 ? Math.min(100, Math.round((masteredCount / total) * 100)) : 0, 100];
  }
}

export default function AchievementPanel() {
  const unlocked = useBoundStore(s => s.unlocked);
  const showAchievementPanel = useBoundStore(s => s.showAchievementPanel);
  const toggleAchievementPanel = useBoundStore(s => s.toggleAchievementPanel);

  const storeState = useBoundStore.getState();
  const total = ACHIEVEMENTS.length;
  const earned = Object.keys(unlocked).length;

  // 按分类分组
  const grouped = ACHIEVEMENTS.reduce<Record<AchievementCategory, typeof ACHIEVEMENTS>>((acc, a) => {
    if (!acc[a.category]) acc[a.category] = [];
    acc[a.category].push(a);
    return acc;
  }, {} as Record<AchievementCategory, typeof ACHIEVEMENTS>);

  if (!showAchievementPanel) return null;

  return (
    <div className="achievement-overlay" onClick={toggleAchievementPanel}>
      <div className="achievement-panel" onClick={e => e.stopPropagation()}>
        <div className="achievement-header">
          <h2>🏆 成就系统</h2>
          <span className="achievement-summary">{earned} / {total} 已解锁</span>
          <button className="achievement-close" onClick={toggleAchievementPanel}>✕</button>
        </div>

        <div className="achievement-body">
          {(Object.keys(grouped) as AchievementCategory[]).map(cat => {
            const [cur, goal] = computeProgress(cat, storeState);
            const catEarned = grouped[cat].filter(a => unlocked[a.id]).length;
            const catTotal = grouped[cat].length;

            return (
              <div key={cat} className="achievement-category">
                <div className="achievement-cat-header">
                  <span>{ACHIEVEMENT_CATEGORY_LABELS[cat]}</span>
                  <span className="achievement-cat-count">{catEarned}/{catTotal}</span>
                </div>

                <div className="achievement-list">
                  {grouped[cat].map(ach => {
                    const isUnlocked = unlocked[ach.id];
                    return (
                      <div
                        key={ach.id}
                        className={`achievement-item ${isUnlocked ? 'unlocked' : 'locked'}`}
                      >
                        <span className="achievement-icon">{isUnlocked ? ach.icon : '🔒'}</span>
                        <div className="achievement-info">
                          <span className="achievement-label">
                            {isUnlocked ? ach.label : '???'}
                          </span>
                          <span className="achievement-desc">
                            {isUnlocked ? ach.desc : '尚未解锁'}
                          </span>
                        </div>
                        {isUnlocked ? (
                          <span className="achievement-badge">✅</span>
                        ) : (
                          <div className="achievement-progress-wrap">
                            <div className="achievement-progress-bar">
                              <div
                                className="achievement-progress-fill"
                                style={{ width: `${Math.min(100, Math.round((cur / goal) * 100))}%` }}
                              />
                            </div>
                            <span className="achievement-progress-text">{cur}/{goal}</span>
                           </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
