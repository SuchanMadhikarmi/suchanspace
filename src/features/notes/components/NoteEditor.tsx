import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../../db/db';
import type { Note, Template } from '../../../db/db';
import { Star, Clock, Share, BookOpen, Edit3, Trash2, CopyPlus, ChevronDown } from 'lucide-react';

interface NoteEditorProps {
  noteId: string;
  onDelete: (id: string) => void;
}

export default function NoteEditor({ noteId, onDelete }: NoteEditorProps) {
  const [note, setNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(true);
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const templates = useLiveQuery(() => db.templates.toArray()) || [];

  useEffect(() => {
    let active = true;
    db.notes.get(noteId).then(n => {
      if (n && active) {
        setNote(n);
        setContent(n.content);
        setTitle(n.title);
      }
    });
    return () => { active = false; };
  }, [noteId]);

  // Auto-save logic could go here via a debounced hook, but for now we'll save on blur
  const saveNote = async () => {
    if (!note) return;
    await db.notes.update(noteId, {
      title,
      content,
      updatedAt: Date.now()
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  const applyTemplate = (template: Template) => {
    // If the title is empty, maybe set it to the template name or a variation
    if (!title.trim()) {
      setTitle(template.name);
    }
    // Append or replace content. For a template, replacing or appending are options. 
    // Here we'll just append it if there's already content, or replace if empty.
    const newContent = content.trim() ? content + '\n\n' + template.content : template.content;
    setContent(newContent);
    setShowTemplateDropdown(false);
  };

  if (!note) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white max-w-4xl mx-auto w-full">
      {/* Editor Header Tooling */}
      <div className="h-[3.75rem] px-6 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4 text-sm text-gray-500">
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${!isEditing ? 'text-gray-900 bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => setIsEditing(false)}
          >
            <BookOpen size={16} /> Reading
          </button>
          <button 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${isEditing ? 'text-gray-900 bg-gray-100' : 'hover:bg-gray-50'}`}
            onClick={() => setIsEditing(true)}
          >
            <Edit3 size={16} /> Editing
          </button>
        </div>
        <div className="flex items-center gap-2 text-gray-400">
          <button 
            onClick={async () => {
              const newFav = !note.isFavorite;
              await db.notes.update(noteId, { isFavorite: newFav });
              setNote({ ...note, isFavorite: newFav });
            }}
            className={`p-2 hover:bg-gray-50 rounded-md transition-colors ${note.isFavorite ? 'text-yellow-400' : ''}`}
          >
            <Star size={18} fill={note.isFavorite ? 'currentColor' : 'none'} />
          </button>
          <button className="p-2 hover:bg-gray-50 rounded-md transition-colors"><Clock size={18} /></button>
          <div className="relative">
            <button 
              onClick={() => setShowTemplateDropdown(prev => !prev)}
              className="flex items-center gap-1 p-2 hover:bg-gray-50 rounded-md transition-colors"
              title="Apply Template"
            >
              <CopyPlus size={18} />
              <ChevronDown size={14} className="text-gray-400" />
            </button>
            {showTemplateDropdown && (
              <div className="absolute right-0 mt-1 w-56 bg-white border border-gray-100 shadow-xl rounded-md py-1 z-50">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-50">Templates</div>
                <div className="max-h-60 overflow-y-auto">
                  {templates.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">No templates found.</div>
                  ) : (
                    templates.map(t => (
                      <button
                        key={t.id}
                        onClick={() => applyTemplate(t)}
                        className="w-full text-left px-4 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors text-sm text-gray-700"
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button className="p-2 hover:bg-gray-50 rounded-md transition-colors"><Share size={18} /></button>
          <div className="w-px h-4 bg-gray-200 mx-2"></div>
          <button 
            onClick={() => onDelete(noteId)}
            className="p-2 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8" onBlur={saveNote}>
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title..."
          className="w-full text-4xl font-bold border-none outline-none placeholder:text-gray-300 mb-8 text-gray-900 bg-transparent"
        />

        {isEditing ? (
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start typing your markdown..."
            className="w-full h-full min-h-[500px] resize-none border-none outline-none leading-relaxed text-gray-700 bg-transparent"
            style={{ fontSize: '15px' }}
          />
        ) : (
          <div className="prose prose-blue max-w-none text-gray-800">
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeKatex]}
            >
              {content || '*No content*'}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
