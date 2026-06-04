import { useEffect, useRef, useState } from 'react';
import { useBoundStore } from '../store/boundStore';
import { ACHIEVEMENTS } from '../store/achievementSlice';

/** 成就解锁通知的展示时长（ms） */
const ACHIEVEMENT_DISPLAY_DURATION = 3500;

const TOAST_DURATION = 2500;

export default function Toast() {
  const toastMsg = useBoundStore(s => s.toastMsg);
  const pendingAchievements = useBoundStore(s => s.pendingAchievements);
  const popPending = useBoundStore(s => s.popPending);

  // 成就解锁通知（从 pending 中逐个消费）
  const [currentAch, setCurrentAch] = useState<{ id: string; label: string; icon: string; desc: string } | null>(null);

  // 从 pending 队列中取出下一个成就展示
  useEffect(() => {
    if (currentAch) return;
    if (pendingAchievements.length === 0) return;

    const id = popPending();
    if (!id) return;

    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return;

    setCurrentAch({ id: def.id, label: def.label, icon: def.icon, desc: def.desc });
  }, [currentAch, pendingAchievements, popPending]);

  // 单独管理定时器：避免 StrictMode 下 cleanup 误清 timer
  useEffect(() => {
    if (!currentAch) return;

    const timer = setTimeout(() => {
      setCurrentAch(null);
    }, ACHIEVEMENT_DISPLAY_DURATION);

    return () => clearTimeout(timer);
  }, [currentAch]);

  // 普通 toast 自动消失
  useEffect(() => {
    if (!toastMsg || currentAch) return;
    const timer = setTimeout(() => {
      useBoundStore.setState({ toastMsg: '' });
    }, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [toastMsg, currentAch]);

  // 成就解锁通知优先于普通 toast
  if (currentAch) {
    return (
      <div className="toast show achievement">
        <span className="toast-ach-icon">{currentAch.icon}</span>
        <span className="toast-ach-body">
          <span className="toast-ach-label">🏅 {currentAch.label}</span>
          <span className="toast-ach-desc">{currentAch.desc}</span>
        </span>
      </div>
    );
  }

  if (!toastMsg) return null;
  return <div className="toast show">{toastMsg}</div>;
}
