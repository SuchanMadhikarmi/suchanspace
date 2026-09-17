import { useState, useEffect } from 'react';
import type { CalendarEvent, Category } from '../../../db/db';
import SlideOver from '../../../shared/components/SlideOver';

interface EventEditorProps {
  isOpen: boolean;
  onClose: () => void;
  event: Partial<CalendarEvent> | null;
  onSave: (event: Partial<CalendarEvent>) => void;
  categories: Category[];
}

export default function EventEditor({ isOpen, onClose, event, onSave, categories }: EventEditorProps) {
  const [title, setTitle] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title || '');
      setCategoryId(event.categoryId || '');
    } else {
      setTitle('');
      setCategoryId('');
    }
  }, [event, isOpen]);

  const handleSave = () => {
    onSave({
      ...event,
      title,
      categoryId,
      type: event?.type || 'event',
      startTime: event?.startTime || Date.now(),
      endTime: event?.endTime || Date.now() + 3600000,
    });
    onClose();
  };

  return (
    <SlideOver isOpen={isOpen} onClose={onClose} title={event?.id ? 'Edit Event' : 'New Event'}>
      <div className="p-6 flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
          <input
            autoFocus
            type="text"
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select category...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>

        {/* Other fields like date/time, description, recurrence would go here */}

        <div className="mt-8 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            Save Event
          </button>
        </div>
      </div>
    </SlideOver>
  );
}
