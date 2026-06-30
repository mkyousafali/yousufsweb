# Yousufweb — Complete Production-Ready Blueprint

**Tech Stack:** SvelteKit 2.x | TypeScript | Tailwind CSS | Supabase (PostgreSQL) | Vercel  
**Theme:** Tech-Driven Enterprise Automator (Dark, Executive)  
**Deployment:** Vercel PWA  
**Dev Server:** Port 6000 (hardcoded, strict)

---

## 🚀 Quick Start

### 1. Initialize Environment
```bash
npm install
npm run init    # Interactive setup wizard for Supabase credentials & admin account
```

### 2. Set Up Database
- Copy the migration file: `supabase/migrations/001_initial_schema.sql`
- Run in Supabase SQL Editor or via CLI: `supabase db push`
- This creates all `YOUSUFS_*` tables with RLS policies

### 3. Start Development
```bash
npm run dev     # Runs on http://localhost:6000
```

### 4. Deploy to Vercel
```bash
git add .
git commit -m "Initial project"
git push origin main
# Vercel auto-deploys from git
```

Set Vercel environment variables:
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (never expose to client)

---

## 📁 Project Structure

```
yousufweb/
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql          # Database schema (YOUSUFS_ prefixed)
├── src/
│   ├── app.html                             # Root HTML template
│   ├── app.css                              # Global styles + utilities
│   ├── app.d.ts                             # TypeScript app types
│   ├── hooks.server.ts                      # Auth guard + Supabase client setup
│   ├── lib/
│   │   ├── types.ts                         # Database types (auto-generated)
│   │   ├── supabase.ts                      # Client factory (browser/server)
│   │   ├── stores/
│   │   │   ├── windowManager.ts             # OS window state (drag, resize, z-index)
│   │   │   └── auth.ts                      # Auth state store
│   │   └── components/
│   │       ├── public/
│   │       │   ├── Hero.svelte              # Typewriter + matrix rain + PWA install
│   │       │   └── MetricCard.svelte        # Animated metric cards
│   │       └── admin/
│   │           ├── Window.svelte            # Draggable/resizable window frame
│   │           ├── Desktop.svelte           # Main desktop grid + icon launcher
│   │           ├── Sidebar.svelte           # Left app launcher dock
│   │           ├── Taskbar.svelte           # Bottom system taskbar
│   │           ├── StartMenu.svelte         # Start menu popup
│   │           └── modules/
│   │               ├── ContentManager.svelte    # Edit YOUSUFS_site_content
│   │               ├── MediaLibrary.svelte      # Manage YOUSUFS_media_library
│   │               ├── CaseStudies.svelte       # Manage YOUSUFS_automation_cases
│   │               ├── TaskLogs.svelte          # Read YOUSUFS_tasks_logs
│   │               ├── ProfileSettings.svelte   # Edit YOUSUFS_profiles
│   │               └── SystemMonitor.svelte     # Runtime diagnostics
│   └── routes/
│       ├── +layout.server.ts                # Server-side session setup
│       ├── +layout.ts                       # Universal Supabase client creation
│       ├── +layout.svelte                   # Root component + auth watcher
│       ├── +page.server.ts                  # Load site_content + cases
│       ├── +page.svelte                     # Public portfolio page
│       ├── admin/
│       │   ├── login/
│       │   │   ├── +page.server.ts          # Login form handler
│       │   │   └── +page.svelte             # Login UI
│       │   └── dashboard/
│       │       ├── +layout.server.ts        # Auth guard + profile load
│       │       ├── +layout.svelte           # Desktop layout (sidebar + taskbar)
│       │       ├── +page.server.ts          # (empty, auth guaranteed by layout)
│       │       └── +page.svelte             # Desktop component
│       └── api/admin/
│           ├── auth/logout/+server.ts       # POST → sign out
│           ├── content/+server.ts           # GET/list content
│           ├── content/[id]/+server.ts      # PATCH individual content
│           ├── media/+server.ts             # GET media library
│           ├── media/[id]/+server.ts        # DELETE media (soft)
│           ├── cases/+server.ts             # GET all cases
│           ├── cases/[id]/+server.ts        # PATCH individual case
│           ├── logs/+server.ts              # GET task logs (filterable)
│           └── profile/+server.ts           # GET/PATCH admin profile
├── static/
│   ├── manifest.webmanifest                 # PWA manifest
│   └── icons/
│       ├── icon-192.png
│       ├── icon-512.png
│       └── icon-512-maskable.png
├── .env.example                             # Template env vars
├── .gitignore                               # Blocks .env, node_modules, builds
├── package.json                             # Dependencies + dev scripts
├── tsconfig.json                            # TypeScript config (strict)
├── tailwind.config.ts                       # Colour tokens + animations
├── postcss.config.js                        # CSS processing
├── vite.config.ts                           # Port 6000, PWA plugin
├── svelte.config.js                         # SvelteKit + Vercel adapter
├── vercel.json                              # Deployment config + security headers
├── INITIALIZER_SCRIPT.js                    # Interactive .env setup
├── AI_AGENT_INSTRUCTIONS.md                 # LLM constraints for this project
└── DEPLOYMENT_GUIDE.md                      # Pre-deploy verification steps
```

---

## 🎨 Design System

### Colours (Tailwind `os-*` tokens)
- **Background:** `os-bg` (#0a0a0f)
- **Surface:** `os-surface` (#111118)
- **Accent:** `os-accent` (#00d4ff cyan)
- **Accent 2:** `os-accent2` (#7c3aed purple)
- **Warn:** `os-warn` (#f59e0b amber)
- **Muted:** `os-muted` (#64748b)
- **Text:** `os-text` (#e2e8f0)

### Typography
- **Sans:** Inter / SF Pro Display
- **Mono:** JetBrains Mono / Fira Code

### Spacing Grid
- Base: 4px increments
- Desktop-focused breakpoints: `sm:`, `md:`, `lg:`, `xl:`

---

## 🔐 Security Model

### Authentication Flow
1. User logs in at `/admin/login` with email + password
2. Supabase Auth issues JWT + session cookie
3. `hooks.server.ts` validates JWT server-side via `safeGetSession()`
4. Unauthenticated requests to `/admin/*` redirect to login
5. All API routes require `safeGetSession()` check

### Database Access Control (RLS)
- All `YOUSUFS_*` tables have RLS enabled
- Public read access: only `is_public = true` items
- Write access: requires authenticated session
- Admin profile: only own record accessible

### Secret Management
- **Public:** `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY` (exposed to client)
- **Private:** `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never in client code)
- `.env` file excluded from git via `.gitignore`
- `INITIALIZER_SCRIPT.js` creates `.env` with mode 0o600 (owner read/write only)

### Deployment Security (Vercel)
- Security headers set in `vercel.json`:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: SAMEORIGIN`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

---

## 🖥️ Admin Dashboard Architecture

### Window Manager (`src/lib/stores/windowManager.ts`)
- **State:** Array of AppWindow objects (position, size, z-index, state)
- **Operations:** `open()`, `close()`, `minimize()`, `maximize()`, `focus()`, `move()`, `resize()`
- **Z-Index:** Auto-managed, prevents manual conflicts
- **Minimize:** Hides window, shows in taskbar
- **Maximize:** Saves snapshot of position/size for restoration

### Desktop (`src/lib/components/admin/Desktop.svelte`)
- Grid-based icon launcher (double-click to open app)
- Renders visible windows from `windowManager` store
- Handles icon selection state

### Sidebar (`src/lib/components/admin/Sidebar.svelte`)
- Persistent left dock (64px wide)
- App shortcuts with tooltips
- Launches windows with default sizes
- Settings/Profile shortcut at bottom

### Taskbar (`src/lib/components/admin/Taskbar.svelte`)
- Bottom bar (48px tall)
- Start button (left) → toggles StartMenu
- Window tabs (center) → click to minimize/restore
- System tray (right) → clock, user info, logout

### Start Menu (`src/lib/components/admin/StartMenu.svelte`)
- Popup from Start button
- Lists all available apps with descriptions
- Quick access to portfolio, logout

### Admin Modules (6 total)
1. **ContentManager:** Edit all `YOUSUFS_site_content` rows
2. **MediaLibrary:** Browse/manage `YOUSUFS_media_library`
3. **CaseStudies:** Publish/manage `YOUSUFS_automation_cases`
4. **TaskLogs:** Read-only `YOUSUFS_tasks_logs` audit trail
5. **ProfileSettings:** Edit own admin profile
6. **SystemMonitor:** Runtime diagnostics (uptime, device info, storage)

---

## 📡 API Endpoints

All authenticated endpoints require valid session.

### Content Management
- `GET  /api/admin/content` — List all content
- `PATCH /api/admin/content/[id]` — Update single item

### Media Library
- `GET    /api/admin/media` — List active media
- `DELETE /api/admin/media/[id]` — Soft-delete (set is_active=false)

### Case Studies
- `GET   /api/admin/cases` — List all cases
- `PATCH /api/admin/cases/[id]` — Update case (status, featured, etc.)

### Task Logs (Read-Only)
- `GET /api/admin/logs?type=system&status=success&limit=200` — Query logs with filters

### Admin Profile
- `GET   /api/admin/profile` — Fetch current admin's profile
- `PATCH /api/admin/profile` — Update display_name, bio, avatar_url

### Authentication
- `POST /api/admin/auth/logout` — Sign out

---

## 🌐 Public Pages

### `/` — Portfolio Landing Page
- **Loads:** All `is_public=true` content from `YOUSUFS_site_content`
- **Renders:**
  - Hero section with typewriter animation + matrix rain canvas
  - Metrics cards (4 KPIs pulled from DB)
  - Case studies grid (all `status='published'` cases)
  - Footer with copyright + links
- **PWA:** Service worker registers, install prompt shown

### `/admin/login` — Admin Login
- Email + password form
- Redirects authenticated users to dashboard
- Hides password via toggle

### `/admin/dashboard` — OS Desktop Environment
- Loads only if authenticated
- Sidebar, Desktop, Taskbar, StartMenu components
- Windows spawn on double-click or sidebar click
- Full drag/resize/minimize/maximize functionality

---

## 🔧 Development Commands

```bash
# Install dependencies
npm install

# Initialize environment (.env file)
npm run init

# Start development server (port 6000)
npm run dev

# Type check (strict mode)
npm run check

# Continuous type checking
npm run check:watch

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## 📦 Database Schema Summary

### YOUSUFS_profiles
- Linked to `auth.users` via id
- Stores display_name, bio, avatar_url
- Auto-created on signup via trigger

### YOUSUFS_site_content
- Key-value store: content_key → content_value
- Fields: section, sort_order, is_public, label, description
- Used to dynamically render hero text, metrics, headers

### YOUSUFS_media_library
- Stores URLs, alt text, dimensions, mime type
- Tags for filtering
- Soft-deleted via is_active flag

### YOUSUFS_automation_cases
- Portfolio case studies
- Fields: title, slug, client_name, industry, challenge, solution, outcome
- tech_stack (array), roi_metric, duration_weeks
- Status: draft | published | archived
- is_featured flag for promotion

### YOUSUFS_tasks_logs
- Immutable audit trail
- task_name, task_type, status, description, error_message
- Tracks system operations, manual actions, auth events
- Never has UPDATE/DELETE policies

---

## 🎯 AI Agent Instructions

When extending this project with AI assistance, follow these rules:

1. **Port 6000:** Always hardcoded. Never change in vite.config.ts.
2. **Secrets:** Never hardcode API keys, passwords, emails in code.
3. **Database:** All new tables must use `YOUSUFS_` prefix.
4. **RLS:** All tables must have Row Level Security enabled.
5. **Auth:** Use `safeGetSession()` from hooks, not `getSession()`.
6. **Colors:** Use Tailwind `os-*` tokens, not arbitrary hex.
7. **Stack:** SvelteKit + Svelte only. No React, Vue, or Next.js.
8. **Stores:** Use Svelte stores, not external state libraries.
9. **Build:** Test with `npm run build` before deploying.
10. **Admin Dashboard:** Desktop-first, not mobile-optimized.

See [AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md) for complete constraints.

---

## 📊 Performance & PWA

### Service Worker (via @vite-pwa/sveltekit)
- Automatically caches all build artifacts
- Offline-first navigation (except `/api/*`)
- Runtime caching for Supabase API + Google Fonts
- Manifest.json handles install prompts

### Lighthouse Targets
- Performance ≥ 80
- Accessibility ≥ 90
- Best Practices ≥ 90
- PWA ✓ (all checks passing)

### Browser Compatibility
- Chrome/Edge: Full support (Service Workers, modern CSS)
- Firefox: Full support
- Safari: Full support (iOS PWA support since iOS 16.4)
- Mobile: Limited desktop-first admin (not optimized for small screens)

---

## 🚢 Deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for complete pre-deployment verification steps, including:

- Type checking
- Build verification
- Local preview
- Database verification
- Auth testing
- Lighthouse audit
- Security checklist
- Vercel configuration
- Post-deploy testing
- Monitoring setup

---

## 📝 License

Created 2025 for Yousuf — Enterprise Technology Portfolio.  
All rights reserved.

---

**Next Steps:**
1. Run `npm run init` and provide Supabase credentials
2. Apply database migration in Supabase
3. Create admin user in Supabase Auth
4. Start dev server: `npm run dev`
5. Visit `http://localhost:6000` → portfolio
6. Visit `http://localhost:6000/admin/login` → login with admin account
7. Explore the desktop dashboard
8. Follow DEPLOYMENT_GUIDE.md before production release
