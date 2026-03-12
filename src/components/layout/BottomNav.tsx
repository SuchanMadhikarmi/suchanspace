import { Sunrise, Flame, Target, BookOpen, Calendar, BookMarked, Settings } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const NAV_ITEMS = [
  { id: 'today',    icon: Sunrise,    label: 'Today'    },
  { id: 'habits',   icon: Flame,      label: 'Habits'   },
  { id: 'goals',    icon: Target,     label: 'Goals'    },
  { id: 'journal',  icon: BookOpen,   label: 'Journal'  },
  { id: 'weekly',   icon: Calendar,   label: 'Review'   },
  { id: 'learning', icon: BookMarked, label: 'Learn'    },
  { id: 'settings', icon: Settings,   label: 'Settings' },
];

export default function BottomNav() {
  const { activeSection, setActiveSection } = useApp();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        background: 'var(--white)',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'stretch',
        height: 60,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -4px 20px rgba(28,25,23,0.08)',
      }}
    >
      {NAV_ITEMS.map(({ id, icon: Icon, label }) => {
        const active = activeSection === id;
        return (
          <button
            key={id}
            onClick={() => setActiveSection(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: active ? 'var(--green)' : 'var(--muted)',
              padding: '6px 2px',
              position: 'relative',
              transition: 'color 150ms ease',
              minWidth: 0,
            }}
            aria-label={label}
          >
            {active && (
              <span
                style={{
                  position: 'absolute',
                  top: 0,
                  left: '20%',
                  right: '20%',
                  height: 2.5,
                  background: 'var(--green)',
                  borderRadius: '0 0 3px 3px',
                }}
              />
            )}
            <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
            <span
              style={{
                fontSize: 9,
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: active ? 600 : 400,
                lineHeight: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
