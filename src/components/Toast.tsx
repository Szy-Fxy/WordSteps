import { useBoundStore } from '../store/boundStore';

export default function Toast() {
  const toastMsg = useBoundStore(s => s.toastMsg);
  if (!toastMsg) return null;
  return <div className="toast show">{toastMsg}</div>;
}
