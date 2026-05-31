import { useBoundStore } from '../store/boundStore';
import { useEffect, useRef } from 'react';

export default function FeedbackBar() {
  const feedbackMsg = useBoundStore(s => s.feedbackMsg);
  const feedbackType = useBoundStore(s => s.feedbackType);
  const clearFeedback = useBoundStore(s => s.clearFeedback);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    if (!feedbackMsg) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => clearFeedback(), 2500);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [feedbackMsg, clearFeedback]);

  if (!feedbackMsg) return <div className="feedback-bar" />;
  return <div className={`feedback-bar show ${feedbackType}`}>{feedbackMsg}</div>;
}
