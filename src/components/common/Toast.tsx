import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useApp, type Toast } from '../../context/AppContext';

const ICONS = {
  success: <CheckCircle size={16} />,
  error: <AlertCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const COLORS = {
  success: { bg: '#1A3C2E', text: '#fff' },
  error: { bg: '#C0392B', text: '#fff' },
  warning: { bg: '#D97706', text: '#fff' },
  info: { bg: '#1C1917', text: '#fff' },
};

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useApp();
  const colors = COLORS[toast.type];

  return (
    <div
      className={toast.exiting ? 'toast-out' : 'toast-in'}
      style={{
        background: colors.bg,
        color: colors.text,
        borderRadius: 12,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: 'min(380px, calc(100vw - 32px))',
        boxShadow: '0 8px 32px rgba(0,0,0,0.24)',
        cursor: 'pointer',
      }}
      onClick={() => removeToast(toast.id)}
    >
      <span style={{ opacity: 0.9 }}>{ICONS[toast.type]}</span>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, flex: 1 }}>
        {toast.message}
      </span>
      <button style={{ opacity: 0.6, background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}>
        <X size={14} />
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const { toasts } = useApp();

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(16px + env(safe-area-inset-bottom))',
        right: 16,
        left: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 10,
        zIndex: 9998,
      }}
    >
      {toasts.map(toast => <ToastItem key={toast.id} toast={toast} />)}
    </div>
  );
}
