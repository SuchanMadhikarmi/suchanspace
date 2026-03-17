import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Task, type Priority } from '../../../db/db';
import { Plus, Trash2, GripVertical, Clock, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { getPriorityColor } from '../../../utils/dateUtils';
import ConfirmDialog from '../../common/ConfirmDialog';

interface TaskListProps {
  date: string;
  compact?: boolean;
}

export default function TaskList({ date, compact = false }: TaskListProps) {
  const { showToast } = useApp();
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const [newMinutes, setNewMinutes] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const dragTask = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const tasks = useLiveQuery(
    () => db.tasks.where('date').equals(date).sortBy('sortOrder'),
    [date]
  );

  const pending = tasks?.filter(t => !t.completed) ?? [];
  const completed = tasks?.filter(t => t.completed) ?? [];

  const handleAdd = async () => {
    const title = newTask.trim();
    if (!title) return;
    const maxOrder = Math.max(0, ...(pending.map(t => t.sortOrder ?? 0)));
    await db.tasks.add({
      title,
      date,
      priority: newPriority,
      estimatedMinutes: newMinutes ? parseInt(newMinutes) : undefined,
      completed: false,
      carriedOver: false,
      createdAt: new Date().toISOString(),
      sortOrder: maxOrder + 1,
    });
    setNewTask('');
    setNewMinutes('');
  };

  const handleToggle = async (task: Task) => {
    if (!task.id) return;
    await db.tasks.update(task.id, {
      completed: !task.completed,
      completedAt: !task.completed ? new Date().toISOString() : undefined,
    });
    if (!task.completed) showToast('Task completed! 🎉', 'success');
  };

  const handleDelete = async (id: number) => {
    await db.tasks.delete(id);
    setConfirmDelete(null);
    showToast('Task deleted', 'info');
  };

  const handlePriorityChange = async (task: Task, priority: Priority) => {
    if (!task.id) return;
    await db.tasks.update(task.id, { priority });
  };

  // Drag & Drop
  const handleDragStart = (taskId: number) => { dragTask.current = taskId; };
  const handleDrop = async (targetId: number) => {
    if (!dragTask.current || dragTask.current === targetId) return;
    const sourceTask = tasks?.find(t => t.id === dragTask.current);
    const targetTask = tasks?.find(t => t.id === targetId);
    if (!sourceTask?.id || !targetTask?.id) return;
    const srcOrder = sourceTask.sortOrder ?? 0;
    const tgtOrder = targetTask.sortOrder ?? 0;
    await db.tasks.update(sourceTask.id, { sortOrder: tgtOrder });
    await db.tasks.update(targetTask.id, { sortOrder: srcOrder });
    setDragOver(null);
    dragTask.current = null;
  };

  return (
    <div>
      {/* Add task input */}
      {!compact && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Priority dot */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['high', 'medium', 'low'] as Priority[]).map(p => (
              <button
                key={p}
                onClick={() => setNewPriority(p)}
                title={p}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: getPriorityColor(p),
                  border: newPriority === p ? '2px solid var(--text)' : '2px solid transparent',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 150ms ease',
                }}
              />
            ))}
          </div>

          <input
            ref={inputRef}
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Add a task... (Enter to add)"
            style={{
              flex: 1,
              minWidth: 120,
              padding: '9px 14px',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              fontSize: 14,
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
          />
          <input
            value={newMinutes}
            onChange={e => setNewMinutes(e.target.value)}
            placeholder="min"
            type="number"
            min="1"
            style={{
              width: 64,
              padding: '9px 10px',
              border: '1.5px solid var(--border)',
              borderRadius: 10,
              fontSize: 14,
              background: 'var(--bg)',
              color: 'var(--text)',
            }}
          />
          <button className="btn btn-primary" onClick={handleAdd} style={{ padding: '9px 16px' }}>
            <Plus size={16} />
          </button>
        </div>
      )}

      {/* Pending tasks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {pending.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: '24px',
              color: 'var(--muted)',
              fontSize: 14,
              fontStyle: 'italic',
              background: 'var(--highlight)',
              borderRadius: 12,
            }}
          >
            No pending tasks. Add one above or enjoy a clear day ✨
          </div>
        )}
        {pending.map(task => (
          <TaskRow
            key={task.id}
            task={task}
            onToggle={() => handleToggle(task)}
            onDelete={() => setConfirmDelete(task.id!)}
            onPriorityChange={(p) => handlePriorityChange(task, p)}
            dragging={false}
            dragOver={dragOver === task.id}
            onDragStart={() => handleDragStart(task.id!)}
            onDragOver={() => setDragOver(task.id!)}
            onDrop={() => handleDrop(task.id!)}
            onDragEnd={() => { setDragOver(null); dragTask.current = null; }}
            compact={compact}
          />
        ))}
      </div>

      {/* Completed tasks toggle */}
      {completed.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => setShowCompleted(s => !s)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--muted)',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'DM Sans', sans-serif",
              marginBottom: 8,
            }}
          >
            {showCompleted ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {completed.length} completed
          </button>
          {showCompleted && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, opacity: 0.7 }}>
              {completed.map(task => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => handleToggle(task)}
                  onDelete={() => setConfirmDelete(task.id!)}
                  onPriorityChange={(p) => handlePriorityChange(task, p)}
                  dragging={false}
                  dragOver={false}
                  onDragStart={() => {}}
                  onDragOver={() => {}}
                  onDrop={() => {}}
                  onDragEnd={() => {}}
                  compact={compact}
                />
              ))}
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title="Delete task"
        message="Are you sure you want to delete this task? This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={() => confirmDelete && handleDelete(confirmDelete)}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

interface TaskRowProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onPriorityChange: (p: Priority) => void;
  dragging: boolean;
  dragOver: boolean;
  onDragStart: () => void;
  onDragOver: () => void;
  onDrop: () => void;
  onDragEnd: () => void;
  compact: boolean;
}

function TaskRow({ task, onToggle, onDelete, onPriorityChange, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, compact }: TaskRowProps) {
  const [showPriority, setShowPriority] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
      onDragEnd={onDragEnd}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: compact ? '8px 12px' : '10px 14px',
        background: dragOver ? 'var(--highlight)' : 'var(--bg)',
        border: dragOver ? '1.5px dashed var(--green)' : '1.5px solid var(--border)',
        borderRadius: 10,
        transition: 'all 150ms ease',
        cursor: 'default',
      }}
    >
      {!compact && (
        <div style={{ cursor: 'grab', color: 'var(--border)', flexShrink: 0 }}>
          <GripVertical size={14} />
        </div>
      )}

      {/* Checkbox */}
      <button
        onClick={onToggle}
        className={task.completed ? 'habit-checked' : ''}
        style={{
          width: 20,
          height: 20,
          borderRadius: 6,
          border: task.completed ? 'none' : `2px solid ${getPriorityColor(task.priority)}`,
          background: task.completed ? getPriorityColor(task.priority) : 'transparent',
          cursor: 'pointer',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 150ms ease',
        }}
      >
        {task.completed && (
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: compact ? 13 : 14,
            color: task.completed ? 'var(--muted)' : 'var(--text)',
            textDecoration: task.completed ? 'line-through' : 'none',
            fontFamily: "'DM Sans', sans-serif",
            position: 'relative',
          }}
        >
          {task.title}
        </span>
        <div style={{ display: 'flex', gap: 6, marginTop: 2, flexWrap: 'wrap' }}>
          {task.carriedOver && (
            <span style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 2 }}>
              <RotateCcw size={9} /> carried
            </span>
          )}
        </div>
      </div>

      {/* Time estimate */}
      {task.estimatedMinutes && !compact && (
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--muted)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={10} /> {task.estimatedMinutes}m
        </span>
      )}

      {/* Priority indicator */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setShowPriority(s => !s)}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: getPriorityColor(task.priority),
            border: 'none',
            cursor: 'pointer',
          }}
          title={`Priority: ${task.priority}`}
        />
        {showPriority && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 16,
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '6px',
              zIndex: 100,
              display: 'flex',
              gap: 6,
              boxShadow: 'var(--shadow)',
            }}
          >
            {(['high', 'medium', 'low'] as Priority[]).map(p => (
              <button
                key={p}
                onClick={() => { onPriorityChange(p); setShowPriority(false); }}
                title={p}
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: getPriorityColor(p),
                  border: 'none',
                  cursor: 'pointer',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      {!compact && (
        <button
          onClick={onDelete}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--border)',
            padding: 2,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            transition: 'color 150ms ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--border)')}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}
