import { useState, useEffect, useRef } from 'react';
import { parseNLP } from '../utils/nlpParser';
import { format } from 'date-fns';
import { Sparkles, CalendarPlus } from 'lucide-react';

interface QuickAddProps {
  onSave: (event: any) => void;
}

export default function QuickAdd({ onSave }: QuickAddProps) {
  const [input, setInput] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global shortcut to open Quick Add (CMD+K or floating +)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Let's use 'q' for quick add on calendar page when not focusing inputs
      if (
        (e.key === 'q' || e.key === 'Q') &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        e.preventDefault();
        setIsOpen(true);
      }
      
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        setInput('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const parsed = parseNLP(input);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    onSave({
      title: parsed.title,
      startTime: parsed.startTime || Date.now(),
      endTime: parsed.endTime || Date.now() + (parsed.durationMinutes || 60) * 60000,
    });

    setInput('');
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-6 right-6 p-4 rounded-full shadow-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center justify-center group z-30"
        title="Quick Add Event (Q)"
      >
        <CalendarPlus size={24} />
      </button>
    );
  }

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg z-50 bg-white rounded-xl shadow-2xl border flex flex-col pt-3 pb-3 px-4" style={{ borderColor: 'var(--border)' }}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Meeting tomorrow at 3pm for 1 hour..."
          className="w-full text-lg outline-none bg-transparent font-medium"
        />
        
        {/* Preview line */}
        {input.trim() && (
          <div className="flex items-center gap-2 text-sm text-blue-600 mt-2 bg-blue-50 px-3 py-2 rounded-md">
            <Sparkles size={14} className="flex-shrink-0" />
            <span className="font-semibold truncate max-w-[50%]">{parsed.title}</span>
            <span className="text-blue-400">&bull;</span>
            <span className="truncate">
                {parsed.startTime 
                    ? format(parsed.startTime, 'MMM d, h:mm a') 
                    : 'Today, Now'}
            </span>
          </div>
        )}
      </form>
      <div className="text-xs text-gray-400 mt-2 font-mono flex justify-between px-1">
        <span>Enter to save</span>
        <span>Esc to cancel</span>
      </div>
    </div>
  );
}