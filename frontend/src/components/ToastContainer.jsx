import Toast from './Toast';
import '../styles/Toast.css';

function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          duration={toast.duration}
          onConfirm={toast.onConfirm}
          onCancel={toast.onCancel}
          showActions={toast.showActions}
        />
      ))}
    </div>
  );
}

export default ToastContainer;

