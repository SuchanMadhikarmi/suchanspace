import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { useApp } from './context/AppContext'
import Sidebar from './components/layout/Sidebar'
import ToastContainer from './components/common/Toast'
import TodaySection from './components/sections/TodaySection'
import HabitsSection from './components/sections/HabitsSection'
import GoalsSection from './components/sections/GoalsSection'
import JournalSection from './components/sections/JournalSection'
import WeeklyReviewSection from './components/sections/WeeklyReviewSection'
import LearningSection from './components/sections/LearningSection'
import SettingsSection from './components/sections/SettingsSection'
import Onboarding from './components/Onboarding'
import FocusModeOverlay from './components/FocusModeOverlay'

function AppInner() {
  const { activeSection, sidebarCollapsed, focusMode, setFocusMode } = useApp()
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)

  const allSettings = useLiveQuery(() => db.settings.toArray(), [])

  useEffect(() => {
    if (allSettings === undefined) return // still loading
    const setupSetting = allSettings.find(s => s.name_val === 'setupComplete')
    setOnboardingDone(setupSetting?.value === 'true')
  }, [allSettings])

  // F key toggles focus mode
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if (e.key === 'f' || e.key === 'F') setFocusMode(!focusMode)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [focusMode, setFocusMode])

  if (onboardingDone === null) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="font-mono" style={{ color: 'var(--muted)', fontSize: 14 }}>Loading...</div>
      </div>
    )
  }

  if (!onboardingDone) {
    return (
      <Onboarding onComplete={() => setOnboardingDone(true)} />
    )
  }

  const sidebarW = sidebarCollapsed ? 64 : 220

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{
        flex: 1,
        marginLeft: sidebarW,
        minHeight: '100vh',
        overflowY: 'auto',
        transition: 'margin-left 250ms ease',
      }}>
        {activeSection === 'today' && <TodaySection />}
        {activeSection === 'habits' && <HabitsSection />}
        {activeSection === 'goals' && <GoalsSection />}
        {activeSection === 'journal' && <JournalSection />}
        {activeSection === 'weekly' && <WeeklyReviewSection />}
        {activeSection === 'learning' && <LearningSection />}
        {activeSection === 'settings' && <SettingsSection />}
      </main>

      {focusMode && <FocusModeOverlay />}
      <ToastContainer />
    </div>
  )
}

function App() {
  return <AppInner />
}

export default App
