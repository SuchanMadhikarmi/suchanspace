import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee } from 'lucide-react';
import { db } from '../../../db/db';
import { useApp } from '../../../context/AppContext';

const WORK_DURATION = 25 * 60; // 25 min in seconds
const BREAK_DURATION = 5 * 60; // 5 min in seconds

const sendNotification = (title: string, body?: string) => {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body });
  }
};

interface FocusTimerProps {
  date?: string;
  sessionCount?: number;
  darkMode?: boolean;
}

export default function FocusTimer({ date, sessionCount = 0, darkMode = false }: FocusTimerProps) {
  const { showToast } = useApp();
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
  const [running, setRunning] = useState(false);
  const [sessions, setSessions] = useState(sessionCount);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(undefined);
  const sessionStartRef = useRef<Date | undefined>(undefined);

  const totalTime = mode === 'work' ? WORK_DURATION : BREAK_DURATION;
  const progress = ((totalTime - timeLeft) / totalTime) * 100;
  const size = 140;
  const strokeWidth = 8;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dashoffset = circumference - (progress / 100) * circumference;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleComplete = useCallback(async () => {
    setRunning(false);
    if (mode === 'work') {
      setSessions(s => s + 1);
      await db.focusSessions.add({
        date: date ?? new Date().toISOString().slice(0, 10),
        durationMinutes: 25,
        completed: true,
        createdAt: new Date().toISOString(),
      });
      showToast('🎉 Focus session complete! Take a 5-min break.', 'success');
      sendNotification('🎉 Focus complete!', 'Time for a 5-min break.');
      setMode('break');
      setTimeLeft(BREAK_DURATION);
    } else {
      showToast('Break over — back to work!', 'info');
      sendNotification('⏰ Break over!', 'Time to get back to work.');
      setMode('work');
      setTimeLeft(WORK_DURATION);
    }
  }, [mode, date, showToast]);

  useEffect(() => {
    if (running) {
      if (!sessionStartRef.current) sessionStartRef.current = new Date();
      intervalRef.current = setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) { handleComplete(); clearInterval(intervalRef.current); return 0; }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, handleComplete]);

  const handleReset = () => {
    setRunning(false);
    setTimeLeft(mode === 'work' ? WORK_DURATION : BREAK_DURATION);
    sessionStartRef.current = undefined;
  };

  const toggleMode = () => {
    setRunning(false);
    const next = mode === 'work' ? 'break' : 'work';
    setMode(next);
    setTimeLeft(next === 'work' ? WORK_DURATION : BREAK_DURATION);
  };

  const toggleTimer = async () => {
    if (!running && 'Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
    
    const nextRunning = !running;
    setRunning(nextRunning);
    
    if (nextRunning) {
      sendNotification(
        mode === 'work' ? '🚀 Focus Started' : '☕ Break Started', 
        mode === 'work' ? 'Time to focus for 25 minutes!' : 'Take a 5 minute break.'
      );
    }
  };

  const color = mode === 'work'
    ? (darkMode ? 'rgba(255,255,255,0.85)' : 'var(--green)')
    : (darkMode ? 'rgba(255,200,80,0.9)' : 'var(--amber)');
  const trackColor = 'var(--border)';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      {/* Circular timer */}
      <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg
          width={size}
          height={size}
          style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={strokeWidth} />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashoffset}
            style={{ transition: running ? 'stroke-dashoffset 1s linear' : 'none' }}
          />
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div className="font-mono" style={{ fontSize: 28, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
            {mode === 'work' ? 'Focus' : 'Break'}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary"
            onClick={toggleTimer}
            style={{ padding: '10px 20px', gap: 6 }}
          >
            {running ? <Pause size={15} /> : <Play size={15} />}
            {running ? 'Pause' : 'Start'}
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleReset}
            style={{ padding: '10px 12px' }}
            title="Reset"
          >
            <RotateCcw size={14} />
          </button>
          <button
            className="btn btn-secondary"
            onClick={toggleMode}
            style={{ padding: '10px 12px' }}
            title={mode === 'work' ? 'Switch to break' : 'Switch to work'}
          >
            <Coffee size={14} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: Math.max(sessions, 1) }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: i < sessions ? color : 'var(--border)',
                }}
              />
            ))}
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
            {sessions} {sessions === 1 ? 'session' : 'sessions'} today
          </span>
        </div>
      </div>
    </div>
  );
}
