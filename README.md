# LoanOS — Loan Officer Coaching & Performance Platform

A gamified coaching platform for mortgage loan officers, built with React, TypeScript, and Lovable Cloud.

## Features

- **Dashboard** — Momentum score, daily power moves, quick stats with real-time metrics
- **Activity Logging** — Log calls, emails, meetings with voice note transcription (OpenAI Whisper)
- **Contact Management** — CRM with health scoring and relationship tracking
- **Leaderboard** — Ranked performance by points, volume, and loans closed
- **Programs & Policies** — Library with quiz-based acknowledgments
- **Manager Dashboard** — Team overview, coaching notes, alerts & escalations
- **Gamification** — Achievements, celebration feed, streaks

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Lovable Cloud (Supabase) — Database, Auth, Edge Functions, Storage
- **AI**: OpenAI Whisper (transcription), Lovable AI Gateway (contact extraction)

## Getting Started

### 1. Clone & Install

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

### 2. Environment

Environment variables are auto-managed by Lovable Cloud. No `.env` setup is required when using the Lovable editor.

### 3. Backend Secrets

The following secrets are configured in Lovable Cloud (Settings → Secrets):

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` | Voice note transcription via Whisper API |
| `LOVABLE_API_KEY` | AI Gateway for contact extraction (auto-provisioned) |

### 4. Storage Buckets

- `voice-notes` — Audio recordings from voice notes
- `program-documents` — Program/policy supporting documents

### 5. Database

All tables, RLS policies, functions, and triggers are managed via Lovable Cloud migrations. Key tables:

`profiles`, `activities`, `contacts`, `daily_power_moves`, `achievements`, `user_achievements`, `leaderboard_data`, `programs`, `policies`, `notifications`, `coaching_notes`, `team_alerts`, `celebration_feed`, `licenses`, `ceo_messages`, `continuing_education_modules`

### 6. Key Database Functions

- `calculate_momentum_score(user_id, days)` — Computes momentum score
- `update_contact_health(contact_id)` — Recalculates contact health
- `generate_team_alerts()` — Creates alerts for inactive/low-performing LOs
- `calculate_leaderboard(period_type, start, end)` — Ranks users by performance
- `refresh_all_leaderboards()` — Refreshes daily/weekly/monthly rankings

## Project Structure

```
src/
├── components/       # UI components (coaching, gamification, manager, notifications)
├── hooks/            # React hooks (useAuth, useActivities, useContactsCRUD, etc.)
├── pages/            # Route pages (Dashboard, ActivityLog, ContactsPage, etc.)
├── services/         # whisperService (transcription + contact extraction)
├── integrations/     # Auto-generated Supabase client & types
└── lib/              # Utilities
supabase/
├── functions/        # Edge functions (voice-transcribe, seed-demo-data)
└── migrations/       # Database schema migrations
```

## Deployment

Open [Lovable](https://lovable.dev) → Share → Publish.
