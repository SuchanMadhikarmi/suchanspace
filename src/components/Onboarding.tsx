import { useState } from 'react';
import { format } from 'date-fns';
import { db } from '../db/db';
import YearGrid from './common/YearGrid';

const LIFE_AREAS = [
  { value: 'health', label: 'Health & Fitness', emoji: '💪' },
  { value: 'learning', label: 'Learning & Skills', emoji: '📚' },
  { value: 'career', label: 'Career & Work', emoji: '💼' },
  { value: 'relationships', label: 'Relationships', emoji: '❤️' },
  { value: 'finance', label: 'Finance & Wealth', emoji: '💰' },
  { value: 'creativity', label: 'Creativity & Art', emoji: '🎨' },
  { value: 'spirituality', label: 'Spirituality & Mind', emoji: '🧘' },
  { value: 'adventure', label: 'Adventure & Travel', emoji: '✈️' },
];

const TOTAL_STEPS = 6;

export default function Onboarding({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [lifeAreas, setLifeAreas] = useState<string[]>([]);
  const [firstHabit, setFirstHabit] = useState({ name: '', why: '', emoji: '⭐' });

  const next = () => setStep(s => s + 1);
  const prev = () => setStep(s => s - 1);

  const toggleArea = (v: string) => {
    setLifeAreas(prev => prev.includes(v) ? prev.filter(a => a !== v) : prev.length < 3 ? [...prev, v] : prev);
  };

  const finish = async () => {
    await db.settings.put({ name_val: 'userName', value: name || 'Friend' });
    await db.settings.put({ name_val: 'birthdate', value: birthdate });
    await db.settings.put({ name_val: 'lifeAreas', value: lifeAreas.join(',') });
    await db.settings.put({ name_val: 'setupComplete', value: 'true' });

    if (firstHabit.name.trim()) {
      await db.habits.add({
        name: firstHabit.name,
        why: firstHabit.why,
        emoji: firstHabit.emoji,
        frequency: 'daily',
        bestTime: 'morning',
        color: '#1A3C2E',
        category: 'health',
        createdAt: new Date().toISOString(),
        archived: false,
      });
    }
    onComplete();
  };

  const dots = Array.from({ length: TOTAL_STEPS });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ maxWidth: 520, width: '100%' }}>
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 40 }}>
          {dots.map((_, i) => (
            <div
              key={i}
              style={{
                width: i + 1 === step ? 24 : 8,
                height: 8,
                borderRadius: 4,
                background: i + 1 <= step ? 'var(--green)' : 'var(--border)',
                transition: 'all 300ms ease',
              }}
            />
          ))}
        </div>

        {/* Step 1: Welcome */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 20 }}>🌱</div>
            <h1 className="font-serif" style={{ fontSize: 40, fontWeight: 700, color: 'var(--text)', marginBottom: 16, lineHeight: 1.2 }}>
              Welcome to<br />SuchanSpace
            </h1>
            <p style={{ fontSize: 17, color: 'var(--muted)', lineHeight: 1.7, marginBottom: 36, fontFamily: "'DM Sans', sans-serif" }}>
              Your personal sanctuary for building habits, tracking goals, and becoming the person you want to be. Everything stays private on your device.
            </p>
            <button onClick={next} className="btn btn-primary" style={{ fontSize: 16, padding: '14px 36px' }}>
              Begin →
            </button>
            <div style={{ marginTop: 28, fontSize: 12, color: 'var(--border)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em' }}>
              crafted with ♥ by Suchan
            </div>
          </div>
        )}

        {/* Step 2: Name */}
        {step === 2 && (
          <div>
            <h2 className="font-serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>What's your name?</h2>
            <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 28, fontFamily: "'DM Sans', sans-serif" }}>We'll use it to greet you each morning.</p>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && name.trim() && next()}
              placeholder="Your first name..."
              autoFocus
              style={{ width: '100%', padding: '16px 18px', border: '2px solid var(--border)', borderRadius: 14, fontSize: 20, background: 'var(--white)', color: 'var(--text)', marginBottom: 24, fontFamily: "'Playfair Display', Georgia, serif" }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={prev} className="btn btn-secondary">Back</button>
              <button onClick={next} className="btn btn-primary" style={{ flex: 1 }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Birthdate */}
        {step === 3 && (
          <div>
            <h2 className="font-serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>When were you born?</h2>
            <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>This unlocks your Life Percentage — a beautiful reminder of how much life you've lived and how much awaits.</p>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 24, fontFamily: "'DM Sans', sans-serif", fontStyle: 'italic' }}>Based on an 80-year average lifespan.</p>
            <input
              type="date"
              value={birthdate}
              onChange={e => setBirthdate(e.target.value)}
              max={format(new Date(), 'yyyy-MM-dd')}
              style={{ width: '100%', padding: '14px 16px', border: '2px solid var(--border)', borderRadius: 14, fontSize: 16, background: 'var(--white)', color: 'var(--text)', marginBottom: 24 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={prev} className="btn btn-secondary">Back</button>
              <button onClick={next} className="btn btn-primary" style={{ flex: 1 }}>
                {birthdate ? 'Continue →' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Life areas */}
        {step === 4 && (
          <div>
            <h2 className="font-serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Your top 3 life areas</h2>
            <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>What matters most to you right now? Pick up to 3.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
              {LIFE_AREAS.map(a => {
                const selected = lifeAreas.includes(a.value);
                return (
                  <button
                    key={a.value}
                    onClick={() => toggleArea(a.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '12px 16px',
                      borderRadius: 12,
                      border: `2px solid ${selected ? 'var(--green)' : 'var(--border)'}`,
                      background: selected ? '#1A3C2E10' : 'var(--white)',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 150ms ease',
                      opacity: !selected && lifeAreas.length >= 3 ? 0.4 : 1,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{a.emoji}</span>
                    <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? 'var(--green)' : 'var(--text)', fontFamily: "'DM Sans', sans-serif" }}>{a.label}</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={prev} className="btn btn-secondary">Back</button>
              <button onClick={next} className="btn btn-primary" style={{ flex: 1 }}>Continue →</button>
            </div>
          </div>
        )}

        {/* Step 5: First Habit */}
        {step === 5 && (
          <div>
            <h2 className="font-serif" style={{ fontSize: 32, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Start with one habit</h2>
            <p style={{ fontSize: 15, color: 'var(--muted)', marginBottom: 24, fontFamily: "'DM Sans', sans-serif" }}>The most powerful number is one. What one habit will you commit to starting today?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
              <input
                value={firstHabit.name}
                onChange={e => setFirstHabit(f => ({ ...f, name: e.target.value }))}
                placeholder="Habit name (e.g. Morning run)"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 15, background: 'var(--white)', color: 'var(--text)' }}
              />
              <input
                value={firstHabit.why}
                onChange={e => setFirstHabit(f => ({ ...f, why: e.target.value }))}
                placeholder="Why does this matter to you?"
                style={{ width: '100%', padding: '12px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 15, background: 'var(--white)', color: 'var(--text)', fontFamily: "'Playfair Display', Georgia, serif", fontStyle: 'italic' }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                {['⭐', '🏃', '📖', '🧘', '💪', '✍️', '🎯', '🧠'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setFirstHabit(f => ({ ...f, emoji }))}
                    style={{ width: 40, height: 40, fontSize: 20, border: `2px solid ${firstHabit.emoji === emoji ? 'var(--green)' : 'var(--border)'}`, borderRadius: 8, background: firstHabit.emoji === emoji ? '#1A3C2E10' : 'var(--white)', cursor: 'pointer', transition: 'all 150ms ease' }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={prev} className="btn btn-secondary">Back</button>
              <button onClick={next} className="btn btn-primary" style={{ flex: 1 }}>
                {firstHabit.name.trim() ? 'Continue →' : 'Skip for now'}
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Done */}
        {step === 6 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: 28 }}>
              <div className="font-serif" style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>
                {name ? `Welcome, ${name}! 🎉` : 'You\'re all set! 🎉'}
              </div>
              <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
                Every day is a new page in your story. The year is laid out below — your journey starts today.
              </p>
            </div>
            <div style={{ marginBottom: 28, borderRadius: 16, overflow: 'hidden' }}>
              <YearGrid year={new Date().getFullYear()} dayData={{}} compact onDayClick={() => {}} />
            </div>
            <button onClick={finish} className="btn btn-primary" style={{ fontSize: 16, padding: '14px 40px', width: '100%' }}>
              Begin My Journey →
            </button>
            <div style={{ marginTop: 20, fontSize: 12, color: 'var(--muted)', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.05em' }}>
              SuchanSpace · made by Suchan · your data, your device
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
