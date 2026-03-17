import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db/db'
import { useApp } from './context/AppContext'
import { useAuth } from './context/AuthContext'
import { useIsMobile } from './hooks/useIsMobile'
import Sidebar from './components/layout/Sidebar'
import BottomNav from './components/layout/BottomNav'
import ToastContainer from './components/common/Toast'
import AuthScreen from './components/AuthScreen'
import TodaySection from './components/sections/TodaySection'
import HabitsSection from './components/sections/HabitsSection'
import GoalsSection from './components/sections/GoalsSection'
import JournalSection from './components/sections/JournalSection'
import WeeklyReviewSection from './components/sections/WeeklyReviewSection'
import LearningSection from './components/sections/LearningSection'
import SettingsSection from './components/sections/SettingsSection'
import Onboarding from './components/Onboarding'
import FocusModeOverlay from './components/FocusModeOverlay'
import { hasSupabaseConfig } from './lib/supabase'
import { pushUserBackup, syncFromCloudToLocal } from './services/cloudSync'
import { ensureAndGetAccessStatus, isCurrentUserAdmin, type AccessApprovalStatus } from './services/accessApproval'

function AppInner() {
  const { activeSection, sidebarCollapsed, focusMode, setFocusMode } = useApp()
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null)
  const isMobile = useIsMobile()

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

  const sidebarW = isMobile ? 0 : (sidebarCollapsed ? 64 : 220)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {!isMobile && <Sidebar />}
      <main style={{
        flex: 1,
        marginLeft: sidebarW,
        minHeight: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden',
        transition: 'margin-left 250ms ease',
        paddingBottom: isMobile ? 60 : 0,
      }}>
        {activeSection === 'today' && <TodaySection />}
        {activeSection === 'habits' && <HabitsSection />}
        {activeSection === 'goals' && <GoalsSection />}
        {activeSection === 'journal' && <JournalSection />}
        {activeSection === 'weekly' && <WeeklyReviewSection />}
        {activeSection === 'learning' && <LearningSection />}
        {activeSection === 'settings' && <SettingsSection />}
      </main>

      {isMobile && <BottomNav />}
      {focusMode && <FocusModeOverlay />}
      <ToastContainer />
    </div>
  )
}

function App() {
  const { session, loading: authLoading, signOut } = useAuth()
  const [syncReady, setSyncReady] = useState(false)
  const [accessStatus, setAccessStatus] = useState<AccessApprovalStatus | 'checking'>('checking')
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    if (!session?.user?.id) {
      setAccessStatus('checking')
      return
    }

    let canceled = false

    const checkAccess = async () => {
      const [status, admin] = await Promise.all([
        ensureAndGetAccessStatus(session.user.id, session.user.email),
        isCurrentUserAdmin(session.user.id),
      ])
      if (!canceled) {
        setIsAdmin(admin)
        setAccessStatus(status)
      }
    }

    checkAccess()

    return () => {
      canceled = true
    }
  }, [session?.user?.id, session?.user?.email])

  useEffect(() => {
    if (!session?.user?.id || (accessStatus !== 'approved' && !isAdmin)) {
      setSyncReady(false)
      return
    }

    let canceled = false

    const bootstrap = async () => {
      try {
        await syncFromCloudToLocal(session.user.id)
      } catch (error) {
        console.error('Initial cloud sync failed', error)
      } finally {
        if (!canceled) setSyncReady(true)
      }
    }

    bootstrap()

    const syncTimer = window.setInterval(() => {
      pushUserBackup(session.user.id).catch(error => {
        console.error('Auto cloud backup failed', error)
      })
    }, 60000)

    const handleBeforeUnload = () => {
      pushUserBackup(session.user.id).catch(() => undefined)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      pushUserBackup(session.user.id).catch(() => undefined)
      canceled = true
      clearInterval(syncTimer)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [session?.user?.id, accessStatus, isAdmin])

  if (!hasSupabaseConfig) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div className="card" style={{ maxWidth: 560, width: '100%', padding: 24 }}>
          <h2 className="font-serif" style={{ marginTop: 0, marginBottom: 10, color: 'var(--green)' }}>Supabase Setup Required</h2>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.55 }}>
            Add <strong>VITE_SUPABASE_URL</strong> and <strong>VITE_SUPABASE_ANON_KEY</strong> to your environment to enable multi-user login and cloud database sync.
          </p>
        </div>
      </div>
    )
  }

  if (authLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="font-mono" style={{ color: 'var(--muted)', fontSize: 14 }}>Checking session...</div>
      </div>
    )
  }

  if (!session) {
    return <AuthScreen />
  }

  if (accessStatus === 'checking') {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="font-mono" style={{ color: 'var(--muted)', fontSize: 14 }}>Checking account approval...</div>
      </div>
    )
  }

  if (accessStatus === 'pending' && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div className="card" style={{ maxWidth: 560, width: '100%', padding: 24 }}>
          <h2 className="font-serif" style={{ marginTop: 0, marginBottom: 10, color: 'var(--green)' }}>Approval Pending</h2>
          <p style={{ marginTop: 0, marginBottom: 16, color: 'var(--muted)', lineHeight: 1.55 }}>
            Your account request is pending admin approval. You will be able to use the app after it is approved.
          </p>
          <button className="btn btn-secondary" onClick={() => signOut()}>Sign Out</button>
        </div>
      </div>
    )
  }

  if (accessStatus === 'denied' && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div className="card" style={{ maxWidth: 560, width: '100%', padding: 24 }}>
          <h2 className="font-serif" style={{ marginTop: 0, marginBottom: 10, color: 'var(--danger)' }}>Access Denied</h2>
          <p style={{ marginTop: 0, marginBottom: 16, color: 'var(--muted)', lineHeight: 1.55 }}>
            This account was not approved for access. Contact the app owner if you think this is a mistake.
          </p>
          <button className="btn btn-secondary" onClick={() => signOut()}>Sign Out</button>
        </div>
      </div>
    )
  }

  if (accessStatus === 'error' && !isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg)' }}>
        <div className="card" style={{ maxWidth: 560, width: '100%', padding: 24 }}>
          <h2 className="font-serif" style={{ marginTop: 0, marginBottom: 10, color: 'var(--danger)' }}>Approval Check Failed</h2>
          <p style={{ margin: 0, color: 'var(--muted)', lineHeight: 1.55 }}>
            Could not verify your access status. Check Supabase schema setup and try again.
          </p>
        </div>
      </div>
    )
  }

  if (!syncReady) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div className="font-mono" style={{ color: 'var(--muted)', fontSize: 14 }}>Syncing your cloud data...</div>
      </div>
    )
  }

  return <AppInner />
}

export default App
