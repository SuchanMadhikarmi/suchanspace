import { useEffect, useRef } from 'react';
import { Sunrise, Flame, Target, BookOpen, Calendar, BookMarked, ChevronLeft, ChevronRight, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { format } from 'date-fns';
import { getDayOfYear, getYearProgress, formatBSDate } from '../../utils/dateUtils';

const NAV_ITEMS = [
  { id: 'today', label: 'Today', icon: Sunrise, shortcut: 'T' },
  { id: 'habits', label: 'Habits', icon: Flame, shortcut: 'H' },
  { id: 'goals', label: 'Goals & Projects', icon: Target, shortcut: 'G' },
  { id: 'journal', label: 'Journal', icon: BookOpen, shortcut: 'J' },
  { id: 'weekly', label: 'Weekly Review', icon: Calendar, shortcut: 'W' },
  { id: 'learning', label: 'Learning', icon: BookMarked, shortcut: 'L' },
];

export default function Sidebar() {
  const { activeSection, setActiveSection, sidebarCollapsed, setSidebarCollapsed } = useApp();
  const progressRef = useRef<HTMLDivElement>(null);

  const today = new Date();
  const dayOfYear = getDayOfYear(today);
  const yearProgress = getYearProgress(today);
  const bsDate = formatBSDate(today);

  // Animate progress bar
  useEffect(() => {
    if (progressRef.current) {
      setTimeout(() => {
        if (progressRef.current) {
          progressRef.current.style.width = `${yearProgress}%`;
        }
      }, 500);
    }
  }, [yearProgress]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const item = NAV_ITEMS.find(n => n.shortcut === e.key.toUpperCase());
      if (item) setActiveSection(item.id);
      if (e.key === '\\') setSidebarCollapsed(!sidebarCollapsed);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [setActiveSection, setSidebarCollapsed]);

  const width = sidebarCollapsed ? 64 : 240;

  return (
    <aside
      className="sidebar flex flex-col h-screen sticky top-0 flex-shrink-0 select-none"
      style={{ width, minWidth: width }}
    >
      {/* Logo / header */}
      <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: 'var(--border)', minHeight: 64 }}>
        {!sidebarCollapsed && (
          <div>
            <div className="font-serif font-bold text-lg leading-none" style={{ color: 'var(--green)' }}>
              SuchanSpace
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--muted)' }}>life OS</div>
          </div>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors ml-auto"
          style={{ color: 'var(--muted)' }}
          title="Toggle sidebar (\)"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map(({ id, label, icon: Icon, shortcut }) => {
          const active = activeSection === id;
          return (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              title={sidebarCollapsed ? `${label} (${shortcut})` : undefined}
              className="w-full flex items-center gap-3 px-4 py-2.5 transition-all duration-150 relative group"
              style={{
                background: active ? 'var(--highlight)' : 'transparent',
                color: active ? 'var(--green)' : 'var(--muted)',
                fontWeight: active ? 600 : 400,
              }}
            >
              {active && (
                <span
                  className="absolute left-0 top-1 bottom-1 rounded-r-full"
                  style={{ width: 3, background: 'var(--green)' }}
                />
              )}
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {!sidebarCollapsed && (
                <span className="text-sm font-sans">{label}</span>
              )}
              {!sidebarCollapsed && (
                <span
                  className="ml-auto text-xs font-mono opacity-0 group-hover:opacity-50 transition-opacity"
                  style={{ color: 'var(--muted)' }}
                >
                  {shortcut}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        className="border-t p-3"
        style={{ borderColor: 'var(--border)' }}
      >
        {!sidebarCollapsed ? (
          <>
            {/* Year progress bar */}
            <div className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  Day {dayOfYear} of 365
                </span>
                <span className="font-mono text-xs" style={{ color: 'var(--muted)' }}>
                  {yearProgress.toFixed(1)}%
                </span>
              </div>
              <div className="progress-bar" style={{ height: 4 }}>
                <div
                  ref={progressRef}
                  className="progress-bar-fill"
                  style={{ width: 0 }}
                />
              </div>
            </div>

            {/* Date info */}
            <div className="mb-2">
              <div className="font-mono text-xs" style={{ color: 'var(--text)' }}>
                {format(today, 'MMM d, yyyy')}
              </div>
              <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                {bsDate}
              </div>
            </div>

            {/* Made by */}
            <div className="font-mono text-xs text-center" style={{ color: 'var(--border)', marginBottom: 6, letterSpacing: '0.05em' }}>
              made by Suchan
            </div>

            {/* Settings */}
            <button
              onClick={() => setActiveSection('settings')}
              className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              <Settings size={15} />
              <span className="text-xs font-sans">Settings</span>
            </button>
          </>
        ) : (
          <button
            onClick={() => setActiveSection('settings')}
            className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
            style={{ color: 'var(--muted)' }}
            title="Settings"
          >
            <Settings size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}
