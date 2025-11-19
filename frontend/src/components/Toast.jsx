import { useEffect } from 'react';
import '../styles/Toast.css';

function Toast({ message, type = 'info', onClose, duration = 5000, onConfirm, onCancel, showActions = false }) {
  useEffect(() => {
    if (duration > 0 && !showActions) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose, showActions]);

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  return (
    <div className={`toast toast-${type} ${showActions ? 'toast-confirm' : ''}`}>
      <div className="toast-content">
        <span className="toast-message">{message}</span>
        {showActions ? (
          <div className="toast-confirm-actions">
            <button className="toast-btn toast-btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button className="toast-btn toast-btn-primary" onClick={handleConfirm}>
              Confirm
            </button>
          </div>
        ) : (
          <button className="toast-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export default Toast;

