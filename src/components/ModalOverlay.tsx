import { useBoundStore } from '../store/boundStore';

export default function ModalOverlay() {
  const modal = useBoundStore(s => s.modal);
  const hideModal = useBoundStore(s => s.hideModal);

  if (!modal) return null;

  return (
    <div className="modal-overlay show" onClick={hideModal}>
      <div className="modal-box" onClick={e => e.stopPropagation()}>
        <h3>{modal.title}</h3>
        <p>{modal.msg}</p>
        <div className="modal-btns">
          <button className="modal-btn-confirm" onClick={() => { modal.onConfirm?.(); hideModal(); }}>
            确认
          </button>
          <button className="modal-btn-cancel" onClick={hideModal}>取消</button>
        </div>
      </div>
    </div>
  );
}
