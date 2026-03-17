import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  width?: number | string;
  size?: 'sm' | 'md' | 'lg';
  footer?: ReactNode;
}

const SIZE_MAP = { sm: 400, md: 560, lg: 720 };

export default function Modal({ isOpen, onClose, title, children, width, size = 'md', footer }: ModalProps) {
  const w = width ?? SIZE_MAP[size] ?? 560;
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        padding: '0 8px env(safe-area-inset-bottom) 8px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(28,25,23,0.5)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal content */}
      <div
        className="modal-content"
        style={{
          position: 'relative',
          background: 'var(--white)',
          borderRadius: '20px 20px 0 0',
          padding: 0,
          width: '100%',
          maxWidth: w,
          boxSizing: 'border-box',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -8px 48px rgba(28,25,23,0.16)',
          margin: '0 auto',
        }}
      >
        {/* Header */}
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '20px 24px 16px',
              borderBottom: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            <h2 className="font-serif" style={{ fontSize: 20, fontWeight: 600, color: 'var(--text)', margin: 0 }}>
              {title}
            </h2>
            <button
              onClick={onClose}
              style={{
                background: 'var(--bg)',
                border: 'none',
                borderRadius: 8,
                padding: 6,
                cursor: 'pointer',
                color: 'var(--muted)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: 10,
              justifyContent: 'flex-end',
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
