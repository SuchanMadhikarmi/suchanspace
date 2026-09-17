import { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { useApp } from '../../context/AppContext';
import { 
  Calendar, CheckSquare, Target, Book, FileText, Settings, Sun, 
  Zap
} from 'lucide-react';
import './CommandPalette.css';

export default function CommandPalette() {
  const { setActiveSection, setFocusMode, focusMode, showToast } = useApp();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // cmd+k or ctrl+k
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const navigateTo = (section: string) => {
    setActiveSection(section);
    setOpen(false);
  };

  const handleAction = (action: string) => {
    setOpen(false);
    if (action === 'focus') {
        const nextMode = !focusMode;
        setFocusMode(nextMode);
        showToast(nextMode ? 'Focus mode enabled' : 'Focus mode disabled', 'info');
    }
  };

  if (!open) return null;

  return (
    <div className="cmd-backdrop" onClick={() => setOpen(false)}>
      <div onClick={(e) => e.stopPropagation()}>
        <Command.Dialog 
          open={open} 
          onOpenChange={setOpen} 
          label="Global Command Menu"
          shouldFilter={true}
        >
          <Command.Input placeholder="Type a command or search..." autoFocus/>
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>

            <Command.Group heading="Navigation">
              <Command.Item onSelect={() => navigateTo('today')}><Sun size={14}/> Today</Command.Item>
              <Command.Item onSelect={() => navigateTo('habits')}><CheckSquare size={14}/> Habits</Command.Item>
              <Command.Item onSelect={() => navigateTo('goals')}><Target size={14}/> Goals & Projects</Command.Item>
              <Command.Item onSelect={() => navigateTo('notes')}><FileText size={14}/> Notes</Command.Item>
              <Command.Item onSelect={() => navigateTo('calendar')}><Calendar size={14}/> Calendar</Command.Item>
              <Command.Item onSelect={() => navigateTo('journal')}><Book size={14}/> Journal</Command.Item>
              <Command.Item onSelect={() => navigateTo('settings')}><Settings size={14}/> Settings</Command.Item>
            </Command.Group>

            <Command.Group heading="Actions">
              <Command.Item onSelect={() => handleAction('focus')}><Zap size={14}/> Toggle Focus Mode</Command.Item>
            </Command.Group>
          </Command.List>
        </Command.Dialog>
      </div>
    </div>
  );
}
