# 🏆 ARENAHUB — Premier Competitive Esports & Tournament Platform

ArenaHub is a centralized competitive gaming and esports tournament web application engineered for players, teams, organizers, and communities. It features automated single-elimination bracket generation, deterministic standings, role-based authorization, team roster management, and live match scoring.

---

## 🚀 Key Features

- **🎮 Competitive Game Titles**: Support for tactical shooters (Valorant, CS2), MOBAs (League of Legends), and sports esports (Rocket League).
- **⚔️ Single-Elimination Tournament Brackets**: Automated power-of-two bracket generation with walkover handling, next-round winner advancement, and live tree visualization.
- **🛡️ Team & Roster Coordination**: Captain leadership, member invitations (accept/decline workflows), roster caps, and team participation records.
- **🏅 Deterministic Standings & Leaderboards**: Instant computation of Champions, Finalists, and Semifinalists derived strictly from verified match outcomes.
- **👑 Role-Based Access Control**:
  - `VISITOR`: Public tournament discovery, team profiles, and leaderboards.
  - `PLAYER`: Solo/team registration, team membership, profile management, and dashboard.
  - `ORGANIZER`: Tournament creation, lifecycle management (Open → Ongoing → Completed), bracket generation, and score dispute moderation.
  - `ADMIN`: Platform KPI metrics, role promotion/demotion, and immutable security audit logs.
- **🔔 Notification Feed**: In-app notifications for tournament starts, roster invitations, and match result verification.
- **🎨 Esports Dark-First Design System**: High-contrast, accessibility-aligned UI crafted with Tailwind CSS and Radix-inspired primitives.

---

## 🛠️ Technology Stack

- **Framework**: Next.js 16 (App Router, React 19, TypeScript in Strict Mode)
- **Styling**: Tailwind CSS, Lucide React, Custom Dark Esports Tokens
- **Database & ORM**: Prisma ORM with dual-engine flexibility (SQLite for zero-config local development, PostgreSQL with native enums and indexes for production)
- **Session & Security**: Secure HttpOnly JWT cookies (`jsonwebtoken`), modern password hashing (`bcryptjs`), input sanitization and schema verification (`zod`)
- **Testing**: Jest with `ts-jest` for unit validation, auth hierarchy, and bracket invariant testing
- **CI/CD**: GitHub Actions automated workflow for test execution and production builds

---

## ⚡ Quickstart & Local Setup

### 1. Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+

### 2. Installation
```bash
git clone <repository_url> arenahub
cd arenahub
npm install
```

### 3. Environment Setup
Copy the template environment configuration:
```bash
cp .env.example .env
```
*(Default `.env` is pre-configured with `DATABASE_URL="file:./dev.db"` for zero-dependency local operation).*

### 4. Database Initialization & Seeding
```bash
# Push schema and generate Prisma client
npm run db:push
npm run db:generate

# Populate realistic demonstration tournaments, teams, and accounts
npm run db:seed
```

### 5. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔑 Demonstration Accounts

The database seed script populates 4 core demonstration accounts with 1-click login available on `/auth/login`:

| Role | Email | Password | Username |
|---|---|---|---|
| **👑 Platform Admin** | `admin@arenahub.gg` | `ArenaAdmin123!` | `admin` |
| **🎯 Tournament Organizer** | `organizer@arenahub.gg` | `Organizer123!` | `apex_organizer` |
| **🛡️ Team Captain** | `captain@arenahub.gg` | `Password123!` | `vanguard_cap` |
| **⚡ Player** | `player@arenahub.gg` | `Password123!` | `shadow_striker` |

---

## 🧪 Testing

Execute automated unit, integration, and bracket domain invariant tests:
```bash
npm test
```

### Test Coverage Highlights:
- `tests/validations.test.ts`: Zod schema constraint checks, negative scores rejection, capacity boundaries.
- `tests/auth.test.ts`: Password hashing with bcrypt, JWT token signing/verification, role authorization hierarchy.
- `tests/tournament-domain.test.ts`: Single-elimination tree balance, match linkage (`nextMatchId`), walkover/bye resolution, standings calculations.

---

## 📡 API Reference

### Authentication
- `POST /api/auth/register` — Create account and establish session
- `POST /api/auth/login` — Verify credentials and set HttpOnly session cookie
- `POST /api/auth/logout` — Invalidate and clear session cookie
- `GET /api/auth/me` — Retrieve active session profile

### Tournaments
- `GET /api/tournaments` — List tournaments with search, game filter, and pagination
- `POST /api/tournaments` — Create tournament (Organizer/Admin only)
- `GET /api/tournaments/:slug` — Retrieve tournament details, registrations, and bracket
- `POST /api/tournaments/:slug/register` — Register player or team
- `POST /api/tournaments/:slug/start` — Lock registration, seed bracket, and transition to `ONGOING`
- `PATCH /api/tournaments/:slug/status` — Lifecycle transition with state-machine validation
- `GET /api/tournaments/:slug/standings` — Compute verified tournament standings

### Matches & Scoring
- `POST /api/matches/report` — Submit match scores and advance winner in bracket

### Teams & Rosters
- `GET /api/teams` — List competitive teams
- `POST /api/teams` — Create team roster
- `GET /api/teams/:id` — Team profile, roster, and match history
- `POST /api/teams/:id/invite` — Captain invites player by username/email
- `POST /api/teams/invites/:id/respond` — Accept or decline team invitation

### Administration
- `GET /api/admin/metrics` — Aggregate platform KPIs
- `GET /api/admin/users` — User directory with search and pagination
- `PATCH /api/admin/users/:id/role` — Update user permissions with audit logging
- `GET /api/admin/audit` — Immutable administrative event stream

---

## 🚢 Production Deployment (PostgreSQL)

For production deployment to platforms like Vercel, Railway, AWS ECS, or Render:

1. Provision a PostgreSQL instance (e.g., Supabase, Neon, AWS RDS).
2. Set environment variable:
   ```bash
   DATABASE_URL="postgresql://user:password@host:5432/arenahub?schema=public"
   ```
3. Use the production PostgreSQL schema located at `prisma/schema.postgresql.prisma`.
4. Run migrations:
   ```bash
   npx prisma migrate deploy --schema prisma/schema.postgresql.prisma
   ```
5. Build and launch:
   ```bash
   npm run build
   npm start
   ```

---

## 🛡️ Security Architecture

- **HttpOnly Cookies**: Session tokens cannot be accessed via JavaScript (`XSS` mitigation).
- **Server-Side Authorization**: Every protected mutation checks user roles at both the API handler and service levels.
- **ORM Parameterization**: Prisma parameterizes all SQL queries to prevent SQL injection.
- **Audit Logging**: Sensitive actions (role changes, score reports) write immutable records to the `AuditLog` table.
- **Validation**: Untrusted inputs are strictly checked against Zod schemas on the server.
