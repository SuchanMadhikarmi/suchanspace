import { useState, useMemo } from 'react';
import { format, subWeeks, endOfWeek, eachWeekOfInterval } from 'date-fns';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type LearningTrack } from '../../db/db';
import { useApp } from '../../context/AppContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import Modal from '../common/Modal';
import { Plus, BookOpen, Search, Zap, Clock } from 'lucide-react';
import { LEARNING_CATEGORIES } from '../../utils/dateUtils';

export default function LearningSection() {
  const { showToast } = useApp();
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [sessionForm, setSessionForm] = useState({
    trackId: '',
    duration: 30,
    keyInsight: '',
    source: '',
    clarityRating: 4,
  });
  const [trackForm, setTrackForm] = useState({
    name: '',
    description: '',
    targetHours: 20,
    category: '',
    color: '#1A3C2E',
  });

  const tracks = useLiveQuery(() => db.learningTracks.orderBy('name').toArray(), []);
  const sessions = useLiveQuery(() => db.learningSessions.orderBy('date').reverse().toArray(), []);

  const trackById = useMemo(() => {
    const m: Record<number, LearningTrack> = {};
    tracks?.forEach(t => { if (t.id) m[t.id] = t; });
    return m;
  }, [tracks]);

  // Total hours
  const totalHours = useMemo(() => {
    const mins = sessions?.reduce((s, e) => s + e.duration, 0) ?? 0;
    return (mins / 60).toFixed(1);
  }, [sessions]);

  // Hours by subject (bar chart)
  const hoursBySubject = useMemo(() => {
    const map: Record<string, number> = {};
    sessions?.forEach(s => {
      const track = trackById[s.trackId ?? 0];
      const name = track?.name ?? 'Other';
      map[name] = (map[name] ?? 0) + s.duration;
    });
    return Object.entries(map).map(([name, mins]) => ({ name, hours: +(mins / 60).toFixed(1) })).sort((a, b) => b.hours - a.hours);
  }, [sessions, trackById]);

  // Weekly hours chart (last 8 weeks)
  const weeklyHours = useMemo(() => {
    const weeks = eachWeekOfInterval(
      { start: subWeeks(new Date(), 7), end: new Date() },
      { weekStartsOn: 1 }
    );
    return weeks.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const startStr = format(weekStart, 'yyyy-MM-dd');
      const endStr = format(weekEnd, 'yyyy-MM-dd');
      const mins = sessions?.filter(s => s.date >= startStr && s.date <= endStr).reduce((sum, s) => sum + s.duration, 0) ?? 0;
      return { week: format(weekStart, 'MMM d'), hours: +(mins / 60).toFixed(1) };
    });
  }, [sessions]);

  // Filtered insights
  const insights = useMemo(() => {
    let list = sessions?.filter(s => s.keyInsight) ?? [];
    if (selectedTrack !== 'all') list = list.filter(s => String(s.trackId) === selectedTrack);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(s => s.keyInsight?.toLowerCase().includes(q) || s.source?.toLowerCase().includes(q));
    }
    return list;
  }, [sessions, selectedTrack, searchQuery]);

  const handleAddSession = async () => {
    if (!sessionForm.trackId) { showToast('Please select a learning track', 'error'); return; }
    await db.learningSessions.add({
      trackId: Number(sessionForm.trackId),
      date: format(new Date(), 'yyyy-MM-dd'),
      duration: sessionForm.duration,
      keyInsight: sessionForm.keyInsight,
      source: sessionForm.source,
      clarityRating: sessionForm.clarityRating,
      createdAt: new Date().toISOString(),
    });
    // Update track hours
    const track = trackById[Number(sessionForm.trackId)];
    if (track?.id) {
      await db.learningTracks.update(track.id, {
        totalHours: (track.totalHours ?? 0) + sessionForm.duration / 60,
        lastSession: format(new Date(), 'yyyy-MM-dd'),
      });
    }
    showToast('Session logged!', 'success');
    setShowSessionModal(false);
    setSessionForm({ trackId: '', duration: 30, keyInsight: '', source: '', clarityRating: 4 });
  };

  const handleAddTrack = async () => {
    if (!trackForm.name.trim()) { showToast('Track name required', 'error'); return; }
    await db.learningTracks.add({
      name: trackForm.name,
      description: trackForm.description,
      targetHours: trackForm.targetHours,
      totalHours: 0,
      category: trackForm.category,
      color: trackForm.color,
      startDate: format(new Date(), 'yyyy-MM-dd'),
      createdAt: new Date().toISOString(),
    });
    showToast('Learning track created!', 'success');
    setShowTrackModal(false);
    setTrackForm({ name: '', description: '', targetHours: 20, category: '', color: '#1A3C2E' });
  };

  const TRACK_COLORS = ['#1A3C2E', '#C4622D', '#4A7C59', '#D97706', '#7B5EA7', '#1E6F8E'];

  return (
    <div className="section-content" style={{ maxWidth: 960 }}>
      {/* Header */}
      <div className="stagger-1 section-head" style={{ marginBottom: 28 }}>
        <div>
          <h1 className="font-serif" style={{ fontSize: 38, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Learning</h1>
          <div style={{ fontSize: 14, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
            <span className="font-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{totalHours}h</span> total learning time
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowTrackModal(true)} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Plus size={14} /> New Track
          </button>
          <button onClick={() => setShowSessionModal(true)} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <Zap size={14} /> Log Session
          </button>
        </div>
      </div>

      {/* Learning Tracks */}
      <div className="stagger-2" style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>
          Learning Tracks
        </div>
        {tracks?.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", border: '1.5px dashed var(--border)', borderRadius: 16 }}>
            <BookOpen size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.4 }} />
            No learning tracks yet. Create one to start tracking!
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {tracks?.map(t => {
            const pct = t.targetHours ? Math.min(100, Math.round((t.totalHours / t.targetHours) * 100)) : 0;
            const trackSessions = sessions?.filter(s => s.trackId === t.id) ?? [];
            return (
              <div key={t.id} className="card card-hover" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: t.color ?? 'var(--green)', flexShrink: 0 }} />
                  <div className="font-serif" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{t.name}</div>
                </div>
                {t.description && (
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 12, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.4 }}>{t.description}</div>
                )}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span className="font-mono" style={{ fontSize: 12, color: 'var(--text)' }}>{t.totalHours.toFixed(1)}h / {t.targetHours}h</span>
                    <span className="font-mono" style={{ fontSize: 12, color: 'var(--green)' }}>{pct}%</span>
                  </div>
                  <div className="progress-bar" style={{ height: 6 }}>
                    <div className="progress-bar-fill" style={{ width: `${pct}%`, background: t.color ?? 'var(--green)' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>{trackSessions.length} sessions</span>
                  {t.lastSession && (
                    <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
                      Last: {format(new Date(t.lastSession + 'T12:00:00'), 'MMM d')}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts row */}
      <div className="stagger-3 rg-2" style={{ gap: 20, marginBottom: 28 }}>
        {/* Hours by subject */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>Hours by Subject</div>
          {hoursBySubject.length === 0 ? (
            <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)', fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No data yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={hoursBySubject} layout="vertical" barSize={14}>
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }} tickLine={false} axisLine={false} width={80} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} formatter={(val) => [`${val}h`, 'Hours']} />
                <Bar dataKey="hours" fill="var(--green)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Weekly hours trend */}
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>Weekly Learning Hours</div>
          <ResponsiveContainer width="100%" height={140}>
            <LineChart data={weeklyHours}>
              <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} formatter={(val) => [`${val}h`, 'Hours']} />
              <Line type="monotone" dataKey="hours" stroke="var(--amber)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--amber)', strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Library */}
      <div className="stagger-4">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
            Insights Library ({insights.length})
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              value={selectedTrack}
              onChange={e => setSelectedTrack(e.target.value)}
              style={{ padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}
            >
              <option value="all">All Tracks</option>
              {tracks?.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
            </select>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search insights..."
                style={{ padding: '6px 10px 6px 30px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 12, background: 'var(--bg)', color: 'var(--text)', width: 180 }}
              />
            </div>
          </div>
        </div>

        {insights.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif", border: '1.5px dashed var(--border)', borderRadius: 14 }}>
            No insights yet. Log a session with a key insight to build your knowledge library!
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {insights.map(s => {
            const track = trackById[s.trackId ?? 0];
            return (
              <div key={s.id} className="card" style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
                  {track && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: (track.color ?? 'var(--green)') + '18', color: track.color ?? 'var(--green)', fontFamily: "'DM Sans', sans-serif" }}>
                      {track.name}
                    </span>
                  )}
                  <div style={{ display: 'flex', gap: 2, marginLeft: 'auto' }}>
                    {Array.from({ length: s.clarityRating ?? 0 }).map((_, i) => (
                      <div key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)' }} />
                    ))}
                  </div>
                </div>
                <div style={{ fontSize: 14, color: 'var(--text)', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.6, marginBottom: 8 }}>
                  💡 {s.keyInsight}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', fontFamily: "'DM Sans', sans-serif" }}>
                    {format(new Date(s.date + 'T12:00:00'), 'MMM d')}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={10} style={{ color: 'var(--muted)' }} />
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--muted)' }}>{s.duration}min</span>
                  </div>
                </div>
                {s.source && (
                  <div style={{ fontSize: 11, color: 'var(--sage)', marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    📚 {s.source}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Session Modal */}
      <Modal isOpen={showSessionModal} onClose={() => setShowSessionModal(false)} title="Log Learning Session" size="md" footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setShowSessionModal(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleAddSession} className="btn btn-primary">Log Session</button>
        </div>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>Learning Track *</label>
            <select
              value={sessionForm.trackId}
              onChange={e => setSessionForm(f => ({ ...f, trackId: e.target.value }))}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
            >
              <option value="">Select track...</option>
              {tracks?.map(t => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
            </select>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>
              Duration: <span className="font-mono">{sessionForm.duration}min</span>
            </label>
            <input type="range" min={5} max={240} step={5} value={sessionForm.duration} onChange={e => setSessionForm(f => ({ ...f, duration: Number(e.target.value) }))} style={{ width: '100%' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>Key Insight (optional)</label>
            <textarea
              value={sessionForm.keyInsight}
              onChange={e => setSessionForm(f => ({ ...f, keyInsight: e.target.value }))}
              placeholder="The most important thing you learned..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)', fontFamily: "'Playfair Display', Georgia, serif", lineHeight: 1.6, resize: 'vertical' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>Source (book, course, video...)</label>
            <input
              value={sessionForm.source}
              onChange={e => setSessionForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Where did you learn this?"
              style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>
              Clarity Rating: <span className="font-mono">{sessionForm.clarityRating}/5</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n} onClick={() => setSessionForm(f => ({ ...f, clarityRating: n }))} style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${n <= sessionForm.clarityRating ? 'var(--gold)' : 'var(--border)'}`, background: n <= sessionForm.clarityRating ? 'var(--gold)' + '20' : 'transparent', cursor: 'pointer', fontSize: 16, transition: 'all 150ms ease' }}>
                  {n <= sessionForm.clarityRating ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* New Track Modal */}
      <Modal isOpen={showTrackModal} onClose={() => setShowTrackModal(false)} title="New Learning Track" size="md" footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button onClick={() => setShowTrackModal(false)} className="btn btn-secondary">Cancel</button>
          <button onClick={handleAddTrack} className="btn btn-primary">Create Track</button>
        </div>
      }>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>Track Name *</label>
            <input value={trackForm.name} onChange={e => setTrackForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Python Programming, Piano..." style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }} autoFocus />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>Description</label>
            <input value={trackForm.description} onChange={e => setTrackForm(f => ({ ...f, description: e.target.value }))} placeholder="What are you learning and why?" style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>
              Target Hours: <span className="font-mono">{trackForm.targetHours}h</span>
            </label>
            <input type="range" min={5} max={500} step={5} value={trackForm.targetHours} onChange={e => setTrackForm(f => ({ ...f, targetHours: Number(e.target.value) }))} style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 6 }}>Category</label>
            <select value={trackForm.category} onChange={e => setTrackForm(f => ({ ...f, category: e.target.value }))} style={{ width: '100%', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, background: 'var(--bg)', color: 'var(--text)' }}>
              <option value="">Select category...</option>
              {LEARNING_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', fontFamily: "'DM Sans', sans-serif", display: 'block', marginBottom: 8 }}>Color</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {TRACK_COLORS.map(c => (
                <button key={c} onClick={() => setTrackForm(f => ({ ...f, color: c }))} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: trackForm.color === c ? '3px solid var(--text)' : '3px solid transparent', cursor: 'pointer', padding: 0, transition: 'border 150ms ease' }} />
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
