import { useEffect, useState } from 'react';

interface CircularProgressProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  animate?: boolean;
}

export default function CircularProgress({
  value,
  size = 120,
  strokeWidth = 8,
  color,
  trackColor = 'var(--border)',
  label,
  sublabel,
  animate = true,
}: CircularProgressProps) {
  const [displayValue, setDisplayValue] = useState(animate ? 0 : value);
  
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const progress = (displayValue / 100) * circumference;
  const dashoffset = circumference - progress;

  // Color by value
  const autoColor = value >= 70 ? 'var(--sage)' : value >= 40 ? 'var(--gold)' : 'var(--danger)';
  const strokeColor = color || autoColor;

  useEffect(() => {
    if (!animate) { setDisplayValue(value); return; }
    let start: number;
    let raf: number;
    const duration = 800;

    function step(ts: number) {
      if (!start) start = ts;
      const elapsed = ts - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) raf = requestAnimationFrame(step);
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)', position: 'absolute', top: 0, left: 0 }}
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: 'stroke-dashoffset 50ms ease' }}
        />
      </svg>
      <div style={{ textAlign: 'center', zIndex: 1 }}>
        {label !== undefined && (
          <div className="font-mono" style={{ fontSize: size > 80 ? 22 : 14, fontWeight: 600, color: 'var(--text)', lineHeight: 1 }}>
            {label ?? displayValue}
          </div>
        )}
        {label === undefined && (
          <div className="font-mono" style={{ fontSize: size > 80 ? 22 : 14, fontWeight: 600, color: strokeColor, lineHeight: 1 }}>
            {displayValue}
          </div>
        )}
        {sublabel && (
          <div className="font-sans" style={{ fontSize: 10, color: 'var(--muted)', marginTop: 2 }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
}
