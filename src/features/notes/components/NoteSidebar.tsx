import { Star, Calendar, Clock, Archive, Plus } from 'lucide-react';
import type { Folder } from '../../../db/db';

interface NoteSidebarProps {
  folders: Folder[];
  activeFolderId: string | 'all' | 'daily' | 'favorites' | 'recent' | 'archive';
  onSelectFolder: (id: string) => void;
  onNewFolder: () => void;
}

export default function NoteSidebar({
  folders,
  activeFolderId,
  onSelectFolder,
  onNewFolder
}: NoteSidebarProps) {
  const smartFolders = [
    { id: 'all', name: 'All Notes', icon: <Archive size={16} /> },
    { id: 'daily', name: 'Daily Notes', icon: <Calendar size={16} /> },
    { id: 'favorites', name: 'Favorites', icon: <Star size={16} /> },
    { id: 'recent', name: 'Recent', icon: <Clock size={16} /> },
  ];

  return (
    <div className="w-64 bg-gray-50/50 border-r flex flex-col h-full flex-shrink-0" style={{ borderColor: 'var(--border)' }}>
      <div className="p-4 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900 tracking-tight">Notes</h2>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-6 space-y-0.5">
          {smartFolders.map(sf => (
            <button
              key={sf.id}
              onClick={() => onSelectFolder(sf.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm font-medium transition-colors
                ${activeFolderId === sf.id ? 'bg-white shadow-sm text-blue-600' : 'text-gray-600 hover:bg-gray-100/80 hover:text-gray-900'}`}
            >
              <div className={activeFolderId === sf.id ? 'text-blue-500' : 'text-gray-400'}>
                {sf.icon}
              </div>
              {sf.name}
            </button>
          ))}
        </div>

        <div className="px-3">
          <div className="flex items-center justify-between px-2 mb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider group">
            <span>Folders</span>
            <button 
              onClick={onNewFolder}
              className="opacity-0 group-hover:opacity-100 hover:text-gray-900 transition-opacity"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-0.5">
            {folders.sort((a,b) => a.order - b.order).map(folder => (
              <button
                key={folder.id}
                onClick={() => onSelectFolder(folder.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors group
                   ${activeFolderId === folder.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 font-medium'}`}
              >
                <div className="flex items-center gap-2">
                  <span>{folder.icon || '📁'}</span>
                  <span className="truncate">{folder.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
