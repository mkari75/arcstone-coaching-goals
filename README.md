# LoanOS — Loan Officer Coaching & Performance Platform

A gamified coaching platform for mortgage loan officers, built with React, TypeScript, and Lovable Cloud.

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Dashboard** | Momentum score, daily power moves, quick stats, morning kickoff & evening debrief |
| **Activity Logging** | Log calls, emails, meetings with voice note transcription (OpenAI Whisper) |
| **Contact Management** | CRM with health scoring, relationship tracking, and auto-extraction |
| **Leaderboard** | Ranked performance by points, volume, and loans closed (daily/weekly/monthly) |
| **Programs Library** | Investor programs with quiz-based acknowledgments and document attachments |
| **Policy Viewer** | Company policies with versioning, quizzes, and compliance tracking |
| **Manager Dashboard** | Team overview, coaching notes, alerts & escalations, PIP tracking |
| **Gamification** | Achievement badges, celebration feed with likes/comments, streaks |
| **Notifications** | In-app notification center with preferences and escalation workflows |
| **Analytics** | Activity trends, compliance breakdown, team performance comparison |

## 🛠 Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts
- **Backend**: Lovable Cloud — Database, Auth, Edge Functions, Storage
- **AI**: OpenAI Whisper (transcription), Lovable AI Gateway (contact extraction)

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone <YOUR_GIT_URL>
cd <YOUR_PROJECT_NAME>
npm install
npm run dev
```

### 2. Environment Variables

Environment variables are **auto-managed by Lovable Cloud**. No manual `.env` setup is needed when using the Lovable editor.

For local development outside Lovable, create a `.env` file:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
VITE_SUPABASE_PROJECT_ID=your_project_id
```

### 3. Backend Secrets

Configured in Lovable Cloud (Settings → Secrets):

| Secret | Purpose |
|--------|---------|
| `OPENAI_API_KEY` | Voice note transcription via Whisper API |
| `LOVABLE_API_KEY` | AI Gateway for contact extraction (auto-provisioned) |

### 4. Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `voice-notes` | ✅ | Audio recordings from voice notes |
| `program-documents` | ✅ | Program/policy supporting documents |
| `avatars` | ✅ | User profile pictures |

### 5. Database

All tables, RLS policies, functions, and triggers are managed via Lovable Cloud migrations (auto-applied on deployment).

**Key tables:** `profiles`, `activities`, `contacts`, `daily_power_moves`, `achievements`, `user_achievements`, `leaderboard_data`, `programs`, `policies`, `notifications`, `coaching_notes`, `team_alerts`, `celebration_feed`, `licenses`, `ceo_messages`, `continuing_education_modules`

**Key functions:** `calculate_momentum_score()`, `update_contact_health()`, `generate_team_alerts()`, `calculate_leaderboard()`, `refresh_all_leaderboards()`, `get_activity_trends()`, `get_compliance_breakdown()`, `get_team_performance_comparison()`

### 6. Seed Demo Data

A backend function (`seed-demo-data`) populates the environment with demo users, contacts, activities, power moves, leaderboard data, and celebrations for testing:

- **Users**: Mardi (super_admin), Regional Manager, 5 Loan Officers
- **Password**: `Demo2024!`
- **Data**: 14 days of power moves, activities, contacts, leaderboard rankings

## 📁 Project Structure

```
src/
├── components/       # UI components (coaching, gamification, manager, notifications)
├── hooks/            # React hooks (useAuth, useActivities, useContactsCRUD, etc.)
├── pages/            # Route pages (Dashboard, ActivityLog, ContactsPage, etc.)
├── services/         # whisperService (transcription + contact extraction)
├── integrations/     # Auto-generated Supabase client & types
└── lib/              # Utilities (exportUtils, etc.)
supabase/
├── functions/        # Edge functions (voice-transcribe, seed-demo-data)
└── migrations/       # Database schema migrations (auto-applied)
```

## 🚢 Deployment

Open [Lovable](https://lovable.dev) → Share → Publish.
