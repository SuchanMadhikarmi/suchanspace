import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { format } from 'date-fns';
import FocusTimer from './sections/Today/FocusTimer';
import { useApp } from '../context/AppContext';
import { X } from 'lucide-react';

export default function FocusModeOverlay() {
  const { setFocusMode } = useApp();
  const today = format(new Date(), 'yyyy-MM-dd');
  const entry = useLiveQuery(() => db.dailyEntries.where('date').equals(today).first(), [today]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocusMode(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [setFocusMode]);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0A0A0A',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 40,
    }}>
      {/* Close */}
      <button
        onClick={() => setFocusMode(false)}
        style={{
          position: 'absolute',
          top: 24,
          right: 24,
          background: 'rgba(255,255,255,0.08)',
          border: 'none',
          borderRadius: 10,
          padding: '8px 14px',
          cursor: 'pointer',
          color: 'rgba(255,255,255,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          transition: 'background 150ms ease',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
      >
        <X size={14} /> Exit Focus (Esc)
      </button>

      {/* MIT (Most Important Task) */}
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
          Today's Focus
        </div>
        <div className="font-serif" style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.92)', lineHeight: 1.3 }}>
          {entry?.morningMIT || 'What is the one thing that will make today great?'}
        </div>
      </div>

      {/* Focus Timer (dark themed) */}
      <div style={{ transform: 'scale(1.1)' }}>
        <FocusTimer darkMode />
      </div>
    </div>
  );
}
