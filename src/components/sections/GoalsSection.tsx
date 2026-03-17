import { useState } from 'react';
import { format, differenceInDays } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Goal, type Project, type Milestone, type ProjectStatus } from '../../db/db';
import { useApp } from '../../context/AppContext';
import { Plus, Trash2, CheckCircle, Clock, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import { GOAL_CATEGORIES } from '../../utils/dateUtils';

const GOAL_COLORS = ['#1A3C2E', '#C4622D', '#4A7C59', '#D97706', '#2563EB', '#7C3AED', '#DB2777'];

export default function GoalsSection() {
  const { showToast } = useApp();
  const [addGoalOpen, setAddGoalOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [expandedGoal, setExpandedGoal] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ type: 'goal' | 'project'; id: number } | null>(null);

  const [goalForm, setGoalForm] = useState({
    title: '', why: '', targetDate: '', category: 'Career', successMetric: '', color: GOAL_COLORS[0],
  });
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', status: 'not-started' as ProjectStatus, priority: 'medium' as 'high' | 'medium' | 'low', notes: '',
  });

  const goals = useLiveQuery(() => db.goals.where('status').notEqual('abandoned').sortBy('createdAt'), []);
  const projects = useLiveQuery(() => db.projects.toArray(), []);

  const activeGoals = goals?.filter(g => g.status === 'active') ?? [];
  const completedGoals = goals?.filter(g => g.status === 'completed') ?? [];

  const getMilestoneProgress = (goal: Goal) => {
    if (!goal.milestones?.length) return 0;
    const done = goal.milestones.filter(m => m.completed).length;
    return Math.round((done / goal.milestones.length) * 100);
  };

  const getDaysUntilDeadline = (targetDate: string): number => {
    return differenceInDays(new Date(targetDate), new Date());
  };

  const getDeadlineColor = (days: number): string => {
    if (days < 0) return 'var(--danger)';
    if (days < 7) return 'var(--danger)';
    if (days < 30) return 'var(--gold)';
    return 'var(--sage)';
  };

  const handleAddGoal = async () => {
    if (!goalForm.title.trim()) return;
    await db.goals.add({
      ...goalForm,
      status: 'active',
      milestones: [],
      createdAt: new Date().toISOString(),
    });
    setGoalForm({ title: '', why: '', targetDate: '', category: 'Career', successMetric: '', color: GOAL_COLORS[0] });
    setAddGoalOpen(false);
    showToast('🎯 Goal created!', 'success');
  };

  const handleAddProject = async () => {
    if (!projectForm.title.trim() || !selectedGoalId) return;
    await db.projects.add({
      ...projectForm,
      goalId: selectedGoalId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setProjectForm({ title: '', description: '', status: 'not-started', priority: 'medium', notes: '' });
    setAddProjectOpen(false);
    showToast('📌 Project added!', 'success');
  };

  const toggleMilestone = async (goal: Goal, milestoneId: string) => {
    const updated = goal.milestones.map(m =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? format(new Date(), 'yyyy-MM-dd') : undefined }
        : m
    );
    await db.goals.update(goal.id!, { milestones: updated });
  };

  const addMilestone = async (goal: Goal, title: string) => {
    const newM: Milestone = {
      id: Math.random().toString(36).slice(2),
      title,
      completed: false,
    };
    await db.goals.update(goal.id!, { milestones: [...(goal.milestones ?? []), newM] });
  };

  const updateProjectStatus = async (project: Project, status: ProjectStatus) => {
    await db.projects.update(project.id!, { status, updatedAt: new Date().toISOString() });
  };

  const handleDeleteGoal = async () => {
    if (!confirmDelete || confirmDelete.type !== 'goal') return;
    await db.goals.delete(confirmDelete.id);
    await db.projects.where('goalId').equals(confirmDelete.id).delete();
    setConfirmDelete(null);
    showToast('Goal deleted', 'info');
  };

  const handleDeleteProject = async () => {
    if (!confirmDelete || confirmDelete.type !== 'project') return;
    await db.projects.delete(confirmDelete.id);
    setConfirmDelete(null);
    showToast('Project deleted', 'info');
  };

  const urgentGoals = activeGoals.filter(g => {
    const days = getDaysUntilDeadline(g.targetDate);
    const pct = getMilestoneProgress(g);
    return days > 0 && days < 30 && pct < 60;
  });

  return (
    <div className="section-content" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="stagger-1 section-head" style={{ marginBottom: 32 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Goals & Projects</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, fontFamily: "'DM Sans', sans-serif" }}>
            {activeGoals.length} active goals — {goals?.filter(g => g.status === 'completed').length ?? 0} completed
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddGoalOpen(true)}>
          <Plus size={15} /> New Goal
        </button>
      </div>

      {/* Weekly Progress Pulse */}
      <div className="card stagger-1" style={{ padding: '16px 20px', marginBottom: 24, background: 'var(--highlight)' }}>
        <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
          📊 You have <strong>{activeGoals.length}</strong> active goals with a total of{' '}
          <strong>{activeGoals.reduce((s, g) => s + (g.milestones?.length ?? 0), 0)}</strong> milestones.{' '}
          <strong>{activeGoals.reduce((s, g) => s + (g.milestones?.filter(m => m.completed).length ?? 0), 0)}</strong> completed so far.
        </span>
      </div>

      {/* Urgency Panel */}
      {urgentGoals.length > 0 && (
        <div className="stagger-2" style={{ marginBottom: 24 }}>
          {urgentGoals.map(goal => {
            const days = getDaysUntilDeadline(goal.targetDate);
            const pct = getMilestoneProgress(goal);
            return (
              <div
                key={goal.id}
                style={{
                  padding: '14px 18px',
                  background: 'rgba(192,57,43,0.06)',
                  border: '1px solid rgba(192,57,43,0.2)',
                  borderRadius: 12,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <AlertTriangle size={16} color="var(--danger)" />
                <span style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>
                  <strong>{goal.title}</strong> deadline in {days} days — you're {pct}% complete. Accelerate now.
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* GOAL CARDS */}
      <div className="stagger-3" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {activeGoals.map(goal => {
          const pct = getMilestoneProgress(goal);
          const daysLeft = getDaysUntilDeadline(goal.targetDate);
          const dlColor = getDeadlineColor(daysLeft);
          const goalProjects = projects?.filter(p => p.goalId === goal.id) ?? [];
          const isExpanded = expandedGoal === goal.id;

          return (
            <div key={goal.id} className="card" style={{ overflow: 'hidden' }}>
              {/* Progress stripe at top */}
              <div style={{ height: 4, background: 'var(--border)', position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${pct}%`, background: goal.color, borderRadius: '0 99px 99px 0', transition: 'width 600ms ease-out' }} />
              </div>

              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                      <h2 className="font-serif" style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
                        {goal.title}
                      </h2>
                      <span
                        style={{
                          padding: '3px 10px',
                          borderRadius: 99,
                          fontSize: 11,
                          background: goal.color + '22',
                          color: goal.color,
                          fontFamily: "'DM Sans', sans-serif",
                          fontWeight: 600,
                        }}
                      >
                        {goal.category}
                      </span>
                    </div>
                    {goal.why && (
                      <div style={{ fontSize: 14, color: 'var(--muted)', fontStyle: 'italic', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.5 }}>
                        {goal.why}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                    <span
                      className="font-mono"
                      style={{ fontSize: 13, fontWeight: 700, color: dlColor, display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <Clock size={12} />
                      {daysLeft > 0 ? `${daysLeft}d left` : 'Overdue'}
                    </span>
                    <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: goal.color }}>
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Milestone Timeline */}
                {goal.milestones?.length > 0 && (
                  <div style={{ marginBottom: 16, overflowX: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 0, minWidth: 'fit-content', padding: '8px 0' }}>
                      {goal.milestones.map((m, i) => (
                        <div key={m.id} style={{ display: 'flex', alignItems: 'center' }}>
                          <button
                            onClick={() => toggleMilestone(goal, m.id)}
                            title={m.title}
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              background: m.completed ? goal.color : 'var(--bg)',
                              border: `2px solid ${m.completed ? goal.color : 'var(--border)'}`,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              position: 'relative',
                              transition: 'all 200ms ease',
                            }}
                          >
                            {m.completed && (
                              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                            <div
                              style={{
                                position: 'absolute',
                                top: 28,
                                left: '50%',
                                transform: 'translateX(-50%)',
                                fontSize: 10,
                                color: 'var(--muted)',
                                whiteSpace: 'nowrap',
                                maxWidth: 80,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              {m.title.split(' ').slice(0, 3).join(' ')}
                            </div>
                          </button>
                          {i < goal.milestones.length - 1 && (
                            <div
                              style={{
                                height: 2,
                                width: 40,
                                background: goal.milestones[i + 1]?.completed || m.completed ? goal.color : 'var(--border)',
                                transition: 'background 300ms ease',
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Projects / Expand */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => setExpandedGoal(isExpanded ? null : goal.id!)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 13,
                      color: 'var(--muted)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    {goalProjects.length} project{goalProjects.length !== 1 ? 's' : ''}
                  </button>
                  <button
                    onClick={() => { setSelectedGoalId(goal.id!); setAddProjectOpen(true); }}
                    style={{ fontSize: 13, color: 'var(--muted)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    <Plus size={12} /> Add Project
                  </button>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={() => goal.id && setConfirmDelete({ type: 'goal', id: goal.id })}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--border)', display: 'flex', alignItems: 'center' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--danger)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--border)')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Expanded projects — Kanban-lite */}
                {isExpanded && (
                  <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                    <div className="rg-2" style={{ gap: 12 }}>
                      {(['not-started', 'in-progress', 'blocked', 'done'] as ProjectStatus[]).map(status => {
                        const statusProjects = goalProjects.filter(p => p.status === status);
                        const labels: Record<ProjectStatus, string> = {
                          'not-started': 'Not Started',
                          'in-progress': 'In Progress',
                          blocked: 'Blocked',
                          done: 'Done',
                        };
                        const colors: Record<ProjectStatus, string> = {
                          'not-started': 'var(--muted)',
                          'in-progress': 'var(--green)',
                          blocked: 'var(--danger)',
                          done: 'var(--sage)',
                        };
                        return (
                          <div key={status}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: colors[status], textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>
                              {labels[status]}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {statusProjects.map(project => (
                                <div
                                  key={project.id}
                                  style={{
                                    padding: '10px 12px',
                                    background: 'var(--bg)',
                                    borderRadius: 10,
                                    border: '1px solid var(--border)',
                                    fontSize: 13,
                                    fontFamily: "'DM Sans', sans-serif",
                                  }}
                                >
                                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{project.title}</div>
                                  {project.description && (
                                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, lineHeight: 1.4 }}>{project.description}</div>
                                  )}
                                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {(['not-started', 'in-progress', 'blocked', 'done'] as ProjectStatus[]).map(s => (
                                      <button
                                        key={s}
                                        onClick={() => updateProjectStatus(project, s)}
                                        style={{
                                          padding: '3px 8px',
                                          borderRadius: 6,
                                          fontSize: 10,
                                          border: 'none',
                                          cursor: 'pointer',
                                          background: project.status === s ? colors[s] : 'var(--border)',
                                          color: project.status === s ? 'white' : 'var(--muted)',
                                          fontFamily: "'DM Sans', sans-serif",
                                          fontWeight: 600,
                                          transition: 'all 150ms ease',
                                        }}
                                      >
                                        {labels[s].split(' ')[0]}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => project.id && setConfirmDelete({ type: 'project', id: project.id })}
                                      style={{ padding: '3px 6px', borderRadius: 6, fontSize: 10, border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--muted)' }}
                                    >
                                      <Trash2 size={10} />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              {statusProjects.length === 0 && (
                                <div style={{ padding: '8px', textAlign: 'center', color: 'var(--border)', fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>—</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Add milestone */}
                    <MilestoneAdder onAdd={(title) => addMilestone(goal, title)} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeGoals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '64px 24px', color: 'var(--muted)', background: 'var(--highlight)', borderRadius: 20, marginTop: 16 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🎯</div>
          <h3 className="font-serif" style={{ fontSize: 24, color: 'var(--text)', marginBottom: 8 }}>Set your first goal</h3>
          <p style={{ fontSize: 15, maxWidth: 400, margin: '0 auto 24px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
            Direction without goals is just motion. Set a clear goal and let your daily habits serve it.
          </p>
          <button className="btn btn-primary" onClick={() => setAddGoalOpen(true)}>
            <Plus size={15} /> Create Your First Goal
          </button>
        </div>
      )}

      {/* Completed goals (collapsed) */}
      {completedGoals.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
            ✅ Completed ({completedGoals.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {completedGoals.map(goal => (
              <div key={goal.id} style={{ padding: '12px 16px', background: 'var(--white)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, opacity: 0.7 }}>
                <CheckCircle size={16} color="var(--sage)" />
                <span className="font-serif" style={{ fontSize: 16, fontWeight: 600, color: 'var(--text)', textDecoration: 'line-through' }}>{goal.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ADD GOAL MODAL */}
      <Modal
        isOpen={addGoalOpen}
        onClose={() => setAddGoalOpen(false)}
        title="New Goal"
        width={560}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddGoalOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddGoal} disabled={!goalForm.title.trim()}>Create Goal</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Goal Title</label>
            <input
              value={goalForm.title}
              onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Improve fitness consistency"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 15, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Why does this matter?</label>
            <textarea
              value={goalForm.why}
              onChange={e => setGoalForm(f => ({ ...f, why: e.target.value }))}
              placeholder="Your deeper motivation..."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--highlight)', color: 'var(--text)', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.6, resize: 'none' }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Target Date</label>
              <input
                type="date"
                value={goalForm.targetDate}
                onChange={e => setGoalForm(f => ({ ...f, targetDate: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Category</label>
              <select
                value={goalForm.category}
                onChange={e => setGoalForm(f => ({ ...f, category: e.target.value }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
              >
                {GOAL_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Success Metric</label>
            <input
              value={goalForm.successMetric}
              onChange={e => setGoalForm(f => ({ ...f, successMetric: e.target.value }))}
              placeholder="How will you know you've succeeded?"
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>Color</label>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {GOAL_COLORS.map(color => (
                <button
                  key={color}
                  onClick={() => setGoalForm(f => ({ ...f, color }))}
                  style={{ width: 32, height: 32, borderRadius: '50%', background: color, border: goalForm.color === color ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer', outline: goalForm.color === color ? '2px solid white' : 'none', outlineOffset: -4, transition: 'all 150ms ease' }}
                />
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* ADD PROJECT MODAL */}
      <Modal
        isOpen={addProjectOpen}
        onClose={() => setAddProjectOpen(false)}
        title="New Project"
        width={480}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddProjectOpen(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAddProject} disabled={!projectForm.title.trim()}>Add Project</button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Project Name</label>
            <input
              value={projectForm.title}
              onChange={e => setProjectForm(f => ({ ...f, title: e.target.value }))}
              placeholder="What needs to get done?"
              autoFocus
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Description</label>
            <textarea
              value={projectForm.description}
              onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Details, context, approach..."
              rows={3}
              style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)', resize: 'none', fontFamily: "'DM Sans', sans-serif" }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Status</label>
              <select
                value={projectForm.status}
                onChange={e => setProjectForm(f => ({ ...f, status: e.target.value as ProjectStatus }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="blocked">Blocked</option>
                <option value="done">Done</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', display: 'block', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Priority</label>
              <select
                value={projectForm.priority}
                onChange={e => setProjectForm(f => ({ ...f, priority: e.target.value as 'high' | 'medium' | 'low' }))}
                style={{ width: '100%', padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title={`Delete ${confirmDelete?.type}`}
        message={`This will permanently delete this ${confirmDelete?.type} and cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete?.type === 'goal' ? handleDeleteGoal : handleDeleteProject}
        onClose={() => setConfirmDelete(null)}
      />
    </div>
  );
}

function MilestoneAdder({ onAdd }: { onAdd: (title: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
      <input
        value={val}
        onChange={e => setVal(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter' && val.trim()) { onAdd(val.trim()); setVal(''); } }}
        placeholder="Add milestone... (Enter)"
        style={{ flex: 1, padding: '8px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, background: 'var(--bg)', color: 'var(--text)' }}
      />
      <button
        className="btn btn-secondary"
        onClick={() => { if (val.trim()) { onAdd(val.trim()); setVal(''); } }}
        style={{ padding: '8px 14px', fontSize: 13 }}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
