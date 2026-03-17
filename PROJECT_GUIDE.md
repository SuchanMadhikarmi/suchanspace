# SuchanSpace / Productivity App — Complete Project Guide

This guide explains what this project can do right now, how it is structured, and how to use each major feature end-to-end.

## 1) What this project is

A personal productivity web app built with React + Vite, with:
- local-first data storage in IndexedDB (Dexie)
- account authentication (Supabase Auth)
- per-user cloud backup/restore (Supabase Postgres)
- section-based interface for daily execution, habits, goals, journaling, weekly reviews, learning, and settings

## 2) Core capabilities at a glance

### Account and access
- Email/password sign up and sign in.
- Session persistence and auto-refresh via Supabase client.
- Sign out from Settings.

### Local-first data model
- All productivity data is stored locally in IndexedDB for fast UX.
- Uses typed Dexie tables for daily entries, tasks, habits, goals/projects, journal, weekly reviews, learning, focus sessions, letters, and settings.

### Cloud backup and restore
- On login, app pulls latest cloud backup into local DB (`syncFromCloudToLocal`).
- Auto cloud backup runs every 60 seconds while authenticated.
- Backup attempt also runs on tab close/unload and on auth/session cleanup.
- Manual “Sync Now” is available in Settings.
- Last sync timestamp is tracked per user in localStorage.

### Navigation and app shell
- Sidebar (desktop) + BottomNav (mobile).
- Sections: Today, Habits, Goals & Projects, Journal, Weekly Review, Learning, Settings.
- Focus overlay mode can be toggled globally with `F` key.

## 3) Tech stack

- Frontend: React 19, TypeScript, Vite 7
- State/data: Dexie + dexie-react-hooks
- Backend services: Supabase Auth + Supabase Postgres (`user_backups` table)
- UI/data visualization: Recharts, Lucide icons, canvas-confetti
- Date handling: date-fns

## 4) Setup and run

## Prerequisites
- Node.js + npm
- Supabase project (for auth/cloud sync)

### Environment variables
Create `.env` with:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Database setup
Run `supabase/schema.sql` in your Supabase SQL editor.

This creates `public.user_backups` and enables row-level security so users can only access their own backup row.

### Local commands
```bash
npm install
npm run dev
npm run build
npm run lint
npm run preview
```

## 5) Onboarding flow (first app use)

The app has a 6-step onboarding before normal navigation appears:
1. Welcome screen
2. Name capture
3. Birthdate capture (optional)
4. Top life area selection (up to 3)
5. Optional first habit creation
6. Completion screen with year grid

It saves onboarding/config values to `settings` and marks `setupComplete=true`.

## 6) Section-by-section feature guide

## Today
Purpose: Run your day.

What you can do:
- See contextual greeting, beautiful date, and daily quote.
- View year progress (day number, percent, remaining days).
- Expand/collapse full year heat grid (`YearGrid`) based on daily score.
- Track morning energy (1–5).
- Fill Morning Intention fields:
  - MIT (Most Important Task)
  - blocker
  - gratitude
- Mark MIT status (`yes`, `partial`, `no`).
- Track daily progress snapshot:
  - habits done / total
  - tasks done / total
  - focus session count
- Manage today’s habits via `HabitStrip`.
- Manage today’s tasks via `TaskList`.
- Run Pomodoro-style focus timer (25m work / 5m break).
- Evening reflection block (stored in daily entry).

Behavior details:
- Daily entry writes are debounced (~1 second).
- Daily score is calculated from habits + MIT + tasks + journal.

## Tasks (inside Today)
What you can do:
- Add tasks with priority (`high|medium|low`) and optional minute estimate.
- Complete/uncomplete tasks.
- Delete tasks with confirmation.
- Reorder pending tasks by drag-and-drop (sortOrder swap).
- Show/hide completed tasks.
- Change priority inline.

## Habit Strip (inside Today)
What you can do:
- Toggle each active habit complete/incomplete for the selected day.
- See all-complete banner when all active habits are done.
- Trigger confetti + toast when all habits are completed.

## Focus Timer (inside Today and focus overlay)
What you can do:
- Start/pause/reset timer.
- Switch between work and break modes manually.
- Auto-transition when timer hits zero.
- Persist completed work sessions into `focusSessions` table.

## Habits
Purpose: Build and sustain consistency.

What you can do:
- Create habit with name, why, category, frequency, best time, color, emoji.
- Mark completion for today.
- View metrics:
  - total habits
  - best streak
  - today completion rate
  - week completion rate
- View insights panel (best day, hardest day, streak highlights).
- View streak leaderboard across habits.
- View per-habit 30-day completion % and best/current streak.
- View mini 63-day heatmap per habit.
- Archive habit.
- Permanently delete habit (also deletes its logs) with confirmation.

## Goals & Projects
Purpose: Long-term direction with execution layers.

What you can do:
- Create goals (title, why, target date, category, success metric, color).
- Track active/completed goal counts.
- See urgency panel for goals approaching deadline with low progress.
- Add and toggle milestones per goal.
- View milestone timeline and % completion.
- Expand goal to manage associated projects.
- Create projects tied to a goal.
- Move projects across statuses:
  - not-started
  - in-progress
  - blocked
  - done
- Delete goals (also deletes related projects) with confirmation.
- Delete individual projects with confirmation.

## Journal
Purpose: Reflect daily with structure and trends.

What you can do:
- Create/edit daily journal entry per date.
- Auto-save with debounced persistence.
- Set mood (excellent → rough).
- Set energy 1–5.
- Add/remove tags (with suggestions from historical tags).
- Write freeform body text.
- See word count and save status.
- Use full-screen writing focus mode.
- Switch views:
  - editor
  - calendar
  - insights
- Track writing streak.
- View 30-day mood/energy trend chart.
- Access “on this day last year” context when available.

## Weekly Review
Purpose: Weekly reflection loop.

What you can do:
- Navigate week by week (Monday-start week).
- See week stats (tasks done, avg daily score, habit checks, journal count).
- View mood arc chart for the week.
- Complete guided review questionnaire (6 prompts).
- Rate week 1–10.
- Save or update review for a week.
- Browse past reviews in archive with summary + rating.

## Learning
Purpose: Track learning work and insights.

What you can do:
- Create learning tracks (name, description, target hours, category, color).
- Log learning sessions (track, duration, key insight, source, clarity rating).
- Auto-increment track `totalHours` and update `lastSession` when session logged.
- View track progress bars toward target hours.
- View “hours by subject” chart.
- View weekly learning hours trend.
- Search/filter insight library by track and search text.
- Browse saved insights with date, duration, source, and clarity markers.

## Settings
Purpose: Personalization, account, and maintenance.

What you can do:
- Update profile fields (`userName`, `birthdate`).
- Save settings to local DB.
- View life progress widget (percentage of estimated lifespan).
- View data counts (habits, tasks, journal entries, sessions).
- Clear all local data with destructive confirmation.
- View signed-in account email.
- View last cloud sync timestamp.
- Trigger manual cloud sync (`Sync Now`).
- Sign out.

## 7) Keyboard shortcuts and interaction shortcuts

Global shortcuts:
- `F` → Toggle full-screen focus overlay.
- `Esc` → Exit focus overlay.
- `\` → Collapse/expand desktop sidebar.

Sidebar section shortcuts (when not typing in input/textarea):
- `T` Today
- `H` Habits
- `G` Goals & Projects
- `J` Journal
- `W` Weekly Review
- `L` Learning

## 8) Data architecture

## Local database (Dexie)
Tables include:
- `dailyEntries`
- `tasks`
- `habits`
- `habitLogs`
- `goals`
- `projects`
- `projectTasks`
- `journalEntries`
- `weeklyReviews`
- `learningTracks`
- `learningSessions`
- `focusSessions`
- `monthlyLetters`
- `annualLetters`
- `settings`

Notes:
- Some tables (`projectTasks`, letters) are present in schema but not actively surfaced in current UI flows.
- `settings` uses `name_val` as key with flexible value storage.

## Cloud backup payload
Backup row stores full serialized app data in `payload` JSONB with versioning metadata (`version`, `savedAt`).

## 9) Supabase security model (implemented)

`public.user_backups` policies enforce user-level isolation:
- Select: user can read own row only.
- Insert: user can insert own row only.
- Update: user can update own row only.

Primary key is `user_id` referencing `auth.users(id)` with cascade delete.

## 10) UX and design patterns in this codebase

- Section-driven dashboard architecture
- Local-first writes with live reactive reads
- Heavy use of optimistic, low-friction input patterns
- Debounced autosave for writing/reflection sections
- High visual feedback (toasts, badges, progress bars, confetti)
- Desktop + mobile nav variants

## 11) Operational notes for developers

- If Supabase env vars are missing, app blocks authenticated usage with setup prompt.
- Initial sync behavior on login currently restores cloud state into local DB.
- If no backup exists, local data is cleared during sync bootstrap for that signed-in user.
- Auto backup interval is 60 seconds.
- Build uses TypeScript project references + Vite bundling.

## 12) Current constraints / important caveats

- Features are single-user per authenticated account; no team/shared workspaces.
- No server-side collaborative editing or real-time multi-client conflict resolution.
- Some data structures exist for future expansion but are not fully exposed in UI.
- Several date utility calculations for BS/event timelines are approximate by design.

## 13) Recommended next extensions (if you want to evolve it)

- Add conflict-aware two-way sync strategy (merge policies per table).
- Add export/import of full payload (JSON) from Settings.
- Add analytics dashboard over weekly/monthly trends.
- Expose `projectTasks` and letters in dedicated UI sections.
- Add test coverage for cloud sync and critical autosave paths.

---

If you update features, keep this guide in sync so it remains the source-of-truth for what the app can do.