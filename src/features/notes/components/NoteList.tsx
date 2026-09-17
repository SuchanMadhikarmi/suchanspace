import { format, isToday, isYesterday } from 'date-fns';
import { Plus, Search } from 'lucide-react';
import type { Note } from '../../../db/db';

interface NoteListProps {
  notes: Note[];
  activeNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  folderTitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export default function NoteList({
  notes,
  activeNoteId,
  onSelectNote,
  onNewNote,
  folderTitle,
  searchQuery,
  onSearchChange
}: NoteListProps) {

  const formatNoteDate = (timestamp: number) => {
    const d = new Date(timestamp);
    if (isToday(d)) return format(d, 'h:mm a');
    if (isYesterday(d)) return 'Yesterday';
    return format(d, 'MMM d');
  };

  return (
    <div className="w-80 flex flex-col h-full bg-white border-r flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
      <div className="p-4 border-b flex-shrink-0 flex items-center justify-between h-[3.75rem]" style={{ borderColor: 'var(--border)' }}>
        <h3 className="font-semibold text-gray-900">{folderTitle}</h3>
        <button 
          onClick={onNewNote}
          className="p-1.5 hover:bg-gray-100 rounded-md text-gray-500 transition-colors"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className="p-3 border-b border-gray-100 flex-shrink-0">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search notes or #tags..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border-none rounded-md text-sm outline-none focus:ring-2 focus:ring-blue-500/20 transition-all placeholder:text-gray-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No notes found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notes.sort((a, b) => b.updatedAt - a.updatedAt).map(note => (
              <button
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`w-full text-left p-4 hover:bg-gray-50 transition-colors block focus:outline-none
                  ${activeNoteId === note.id ? 'bg-blue-50 hover:bg-blue-50' : ''}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h4 className={`font-medium text-sm truncate pr-2 ${activeNoteId === note.id ? 'text-blue-900' : 'text-gray-900'}`}>
                    {note.title || 'Untitled Note'}
                  </h4>
                  <span className={`text-xs flex-shrink-0 ${activeNoteId === note.id ? 'text-blue-400' : 'text-gray-400'}`}>
                    {formatNoteDate(note.updatedAt)}
                  </span>
                </div>
                <p className={`text-xs line-clamp-2 ${activeNoteId === note.id ? 'text-blue-700/70' : 'text-gray-500'}`}>
                  {note.content.substring(0, 100) || 'No content...'}
                </p>
                {note.tags && note.tags.length > 0 && (
                  <div className="flex gap-1 mt-2.5 overflow-x-hidden">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        activeNoteId === note.id 
                          ? 'bg-blue-100/50 text-blue-700' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
