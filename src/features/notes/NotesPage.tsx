import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/db';
import type { Note } from '../../db/db';
import NoteSidebar from './components/NoteSidebar';
import NoteList from './components/NoteList';
import NoteEditor from './components/NoteEditor';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';

export default function NotesPage() {
  const [activeFolderId, setActiveFolderId] = useState<string>('all');
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const folders = useLiveQuery(() => db.folders.toArray()) || [];
  
  const notes = useLiveQuery(async () => {
    const query = db.notes.orderBy('updatedAt').reverse();
    
    if (activeFolderId === 'daily') {
      return await query.filter(n => n.type === 'daily' && (searchQuery ? (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()) || Boolean(n.tags?.find(t => t.toLowerCase().includes(searchQuery.toLowerCase())))) : true)).toArray();
    } else if (activeFolderId === 'favorites') {
      return await query.filter(n => n.isFavorite === true && (searchQuery ? (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()) || Boolean(n.tags?.find(t => t.toLowerCase().includes(searchQuery.toLowerCase())))) : true)).toArray();
    } else if (activeFolderId === 'archive') {
      return await query.filter(n => n.isArchived === true && (searchQuery ? (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()) || Boolean(n.tags?.find(t => t.toLowerCase().includes(searchQuery.toLowerCase())))) : true)).toArray();
    } else if (activeFolderId !== 'all' && activeFolderId !== 'recent') {
      return await query.filter(n => n.folderId === activeFolderId && (searchQuery ? (n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()) || Boolean(n.tags?.find(t => t.toLowerCase().includes(searchQuery.toLowerCase())))) : true)).toArray();
    }
    
    if (searchQuery) {
      return await query.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()) || Boolean(n.tags?.find(t => t.toLowerCase().includes(searchQuery.toLowerCase())))).toArray();
    }
    
    return await query.toArray();
  }, [activeFolderId, searchQuery]) || [];

  const handleSelectFolder = async (id: string) => {
    setActiveFolderId(id);
    if (id === 'daily') {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const todayNote = await db.notes.where('dailyDate').equals(todayStr).first();
      
      if (todayNote) {
        setActiveNoteId(todayNote.id);
      } else {
        // Create today's note if it doesn't exist
        const newNote: Note = {
          id: nanoid(),
          title: `Daily Note: ${format(new Date(), 'MMMM d, yyyy')}`,
          content: '## Goals for Today\n- [ ] \n\n## Notes\n',
          contentPlainText: '',
          type: 'daily',
          folderId: null,
          tags: ['daily'],
          isPinned: false,
          isFavorite: false,
          isArchived: false,
          color: null,
          coverImage: null,
          linkedNoteIds: [],
          linkedEventId: null,
          wordCount: 0,
          readingTimeMinutes: 0,
          viewedAt: Date.now(),
          dailyDate: todayStr,
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        await db.notes.add(newNote);
        setActiveNoteId(newNote.id);
      }
    } else {
      setActiveNoteId(null);
    }
  };

  const handleNewNote = async () => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const newNote: Note = {
      id: nanoid(),
      title: activeFolderId === 'daily' ? `Daily Note: ${format(new Date(), 'MMMM d, yyyy')}` : '',
      content: activeFolderId === 'daily' ? '## Goals for Today\n- [ ] \n\n## Notes\n' : '',
      contentPlainText: '',
      type: activeFolderId === 'daily' ? 'daily' : 'note',
      folderId: activeFolderId !== 'all' && activeFolderId !== 'daily' && activeFolderId !== 'favorites' && activeFolderId !== 'recent' && activeFolderId !== 'archive' ? activeFolderId : null,
      tags: activeFolderId === 'daily' ? ['daily'] : [],
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      color: null,
      coverImage: null,
      linkedNoteIds: [],
      linkedEventId: null,
      wordCount: 0,
      readingTimeMinutes: 0,
      viewedAt: Date.now(),
      dailyDate: activeFolderId === 'daily' ? todayStr : null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    await db.notes.add(newNote);
    setActiveNoteId(newNote.id);
  };

  const getFolderTitle = () => {
    if (activeFolderId === 'all') return 'All Notes';
    if (activeFolderId === 'daily') return 'Daily Notes';
    if (activeFolderId === 'favorites') return 'Favorites';
    if (activeFolderId === 'recent') return 'Recent';
    if (activeFolderId === 'archive') return 'Archive';
    const folder = folders.find(f => f.id === activeFolderId);
    return folder ? folder.name : 'Notes';
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-white text-gray-900">
      <NoteSidebar 
        folders={folders} 
        activeFolderId={activeFolderId} 
        onSelectFolder={handleSelectFolder}
        onNewFolder={() => console.log('New Folder UI needed')}
      />
      <NoteList 
        notes={notes}
        activeNoteId={activeNoteId}
        onSelectNote={setActiveNoteId}
        onNewNote={handleNewNote}
        folderTitle={getFolderTitle()}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      
      {/* Editor Pane */}
      <div className="flex-1 bg-white h-full flex flex-col relative">
        {activeNoteId ? (
          <NoteEditor 
            noteId={activeNoteId} 
            onDelete={async (id) => {
              await db.notes.delete(id);
              setActiveNoteId(null);
            }}
          />
        ) : (
          <div className="p-8 flex flex-col items-center justify-center text-gray-400 h-full">
            <p>Select a note or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}
