# ArenaHub

> **A multi-tenant esports tournament management platform designed for organizing, managing, and monitoring competitive battle-royale tournaments through shared lobbies, team management, automated scoring, and result verification.**

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4.1-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Jest](https://img.shields.io/badge/Jest-30.5.2-C21325?style=flat-square&logo=jest)](https://jestjs.io/)
[![Build Status](https://img.shields.io/badge/Build-Passing-brightgreen?style=flat-square)](#testing-and-verification)
[![License](https://img.shields.io/badge/License-Unspecified-lightgrey?style=flat-square)](#license)

---

## Table of Contents

- [Overview](#overview)
  - [The Battle-Royale Paradigm](#the-battle-royale-paradigm)
  - [Target Audience](#target-audience)
- [Key Features](#key-features)
- [User Roles and Permissions](#user-roles-and-permissions)
- [Tournament Workflow](#tournament-workflow)
- [Scoring System](#scoring-system)
  - [Official BGMI / Battle-Royale Matrix](#official-bgmi--battle-royale-matrix)
  - [Standings & Deterministic Tie-Breaking](#standings--deterministic-tie-breaking)
  - [Worked Scoring Example](#worked-scoring-example)
- [Security Architecture](#security-architecture)
  - [Implemented Security Controls](#implemented-security-controls)
  - [Production Limitations & Disclosures](#production-limitations--disclosures)
- [Technology Stack](#technology-stack)
- [Application Architecture](#application-architecture)
- [Database Design](#database-design)
- [Project Structure](#project-structure)
- [Installation and Local Setup](#installation-and-local-setup)
  - [Prerequisites](#prerequisites)
  - [Step-by-Step Instructions](#step-by-step-instructions)
  - [Environment Configuration](#environment-configuration)
- [Demo Accounts](#demo-accounts)
- [API Documentation](#api-documentation)
- [Testing and Verification](#testing-and-verification)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview

### The Battle-Royale Paradigm

Traditional esports tournament software is structured around single-elimination or double-elimination brackets where two competitors or teams face off in head-to-head (1v1) matches. While effective for fighting games, tactical shooters, or sports titles, this architecture fundamentally fails for **Battle-Royale esports** (such as Battlegrounds Mobile India / BGMI, PUBG Mobile, or Apex Legends).

In a Battle-Royale tournament:
- **16 to 25 teams** (up to 100 players) drop into a **single, shared match lobby** simultaneously.
- Competition is multi-lateral: every squad competes against every other squad concurrently.
- Performance is measured through a composite of survival placement and frag (kill) counts across multiple sequential matches.
- Room credentials (Custom Room ID and Password) must be securely coordinated, time-locked, and restricted strictly to slotted squads right before drop time to prevent lobby crashing or ghosting.

**ArenaHub** was built from the ground up to solve these structural operations. It eliminates reliance on manual Discord spreadsheets and unverified scorecards by providing a unified web platform for organization multi-tenancy, slot assignments, automated scoring, referee verification, and formal dispute resolution.

### Target Audience

- **Esports Organizations & Tournament Organizers**: Multi-tenant organizations managing dedicated tournament series, bracket-free lobbies, customized point matrices, and slot allocations.
- **League Referees & Arbitrators**: Match observers verifying kill feeds, checking screenshot evidence, approving standings, and adjudicating disputes.
- **Team Captains & Players**: Squad leaders coordinating rosters (4 active starters + 1 substitute), registering for open cups, tracking upcoming drop times, retrieving room credentials, and logging results.
- **Esports Spectators**: Public community members tracking real-time standings, match schedules, organization profiles, and team performance metrics.
- **Platform Administrators**: Global overseers monitoring tenant health, managing user privileges, and inspecting audit trails.

---

## Key Features

The following 19 capabilities represent **verified, implemented functionality** present in the codebase:

1. **Multi-Tenant Organization Management**: Independent organization profiles with unique slugs, dedicated staff rosters, and strict tenant-level data isolation.
2. **Role-Based Access Control (RBAC)**: Fine-grained access enforcement across 6 discrete user roles (`PLATFORM_ADMIN`, `TOURNAMENT_ORGANIZER`, `REFEREE`, `TEAM_CAPTAIN`, `PLAYER`, `SPECTATOR`).
3. **User Authentication & Session Management**: Secure HttpOnly cookie-based JWT sessions with explicit `HS256` signature enforcement, client IP rate-limiting, and password hashing with `bcryptjs`.
4. **Team Creation & Management**: Squad profiles with custom tags (2–6 characters), logos, descriptions, captain leadership, and roster tracking.
5. **Roster Composition**: Squad limits enforcing 4 active starters with support for 1 optional designated substitute (maximum 5 players total).
6. **In-Game Identity Tracking**: Player in-game names (IGN) and character IDs (e.g., BGMI UID) validated and bound per squad member.
7. **Tournament Lifecycle Management**: State machine tracking tournament transitions from `DRAFT` $\to$ `REGISTRATION_OPEN` $\to$ `REGISTRATION_CLOSED` $\to$ `LIVE` $\to$ `COMPLETED` $\to$ `CANCELLED`.
8. **Shared Battle-Royale Lobbies**: Support for group matches with configurable maps (Erangel, Miramar, Sanhok, Vikendi) hosting up to 25 squad slots (100 concurrent players).
9. **Lobby Scheduling & Slot Assignment**: Slotting system assigning registered squads to designated room slot numbers (1–25) with collision prevention.
10. **Time-Locked Room Credential Reveal**: Server-side access engine releasing private Custom Room ID and Password exclusively to assigned roster players/captains and staff once the scheduled `revealTime` threshold is reached.
11. **Placement & Frag Point Engine**: Automatic calculation of placement points and kill multiplier points based on configurable tournament scoring matrices.
12. **Automated Leaderboard Generation**: Real-time aggregation of multi-match standings accumulating placement points, kill points, matches played, and Winner Winner Chicken Dinner (WWCD) counts.
13. **Deterministic Tie-Breaking**: Esports-standard tie-resolution applying sequential checks: Total Points $\to$ Kill Points $\to$ Total Wins (WWCD) $\to$ Best Placement $\to$ Team Tag alphabetical ordering.
14. **Match Result Submission & Verification**: Captain score submissions with image screenshot URLs, protected by referee verification workflows.
15. **Dispute Resolution Lifecycle**: Formal complaint pipeline allowing captains to contest results (`INCORRECT_KILLS`, `INCORRECT_PLACEMENT`, `UNAUTHORIZED_PLAYER`, etc.) with referee adjudication and transactional score adjustments.
16. **Immutable Audit Logging**: System actions (`LOBBY_CREATED`, `RESULT_SUBMITTED`, `RESULT_VERIFIED`, `DISPUTE_RESOLVED`, etc.) recorded with actor IDs, organization scoping, timestamps, and JSON metadata.
17. **In-App Notification Feed**: Targeted notifications delivering alerts for confirmed registrations, match room reveals, verified scores, and dispute verdicts.
18. **Spectator Read-Only Experience**: Public tournament hub, lobby schedules, and standings views with strict server-side masking of match credentials.
19. **Platform Administration Portal**: Centralized administration dashboard with tenant organization metrics, user role promotion/demotion, organization suspension controls, and global audit log streaming.

---

## User Roles and Permissions

| Role | Responsibilities | Key Capabilities | Permission Boundaries |
|---|---|---|---|
| **`PLATFORM_ADMIN`** | Platform Governance | Global oversight, metrics inspection, user role modification, tenant status updates (`ACTIVE`/`SUSPENDED`). | Superuser privileges across all organizations and tournaments. |
| **`TOURNAMENT_ORGANIZER`** | Tournament Operations | Create tournaments, schedule lobbies, slot squads, publish room credentials, update tournament state. | Scoped strictly to the organizations where the user is an owner or confirmed member. Cannot operate within competitor tenants. |
| **`REFEREE`** | Fair Play & Arbitration | Review captain-submitted results, verify placement/kill scores, arbitrate and resolve match disputes. | Scoped to tournaments owned by their organization. Cannot adjudicate disputes in other organizations. |
| **`TEAM_CAPTAIN`** | Squad Management | Create team, manage roster, register squad for tournaments, raise match disputes, submit initial match scores. | Cannot resolve disputes. Cannot overwrite verified results. Cannot view room credentials before `revealTime` or if unassigned. |
| **`PLAYER`** | Competitive Play | Join squads, view personalized dashboard, access match room credentials when slotted and revealed, view standings. | Cannot modify team metadata, register teams, adjudicate disputes, or access admin routes. |
| **`SPECTATOR`** | Community Observation | Browse public tournaments, examine verified standings, inspect leaderboards, explore public team profiles. | Strictly read-only. Server-side engine permanently denies access to room IDs and room passwords. |

---

## Tournament Workflow

The ArenaHub tournament lifecycle transitions through an automated and verified workflow:

```mermaid
flowchart TD
    A["1. Organization Publishes Tournament"] --> B["2. Squads Register (4 Starters + 1 Sub)"]
    B --> C["3. Capacity Reached / Registration Closes"]
    C --> D["4. Organizer Schedules Shared Lobbies (Maps: Erangel, Miramar, etc.)"]
    D --> E["5. Organizer Assigns Teams to Room Slots (1-25)"]
    E --> F{"6. Match Reveal Countdown"}
    F -- "now < revealTime" --> G["Credentials Masked (403 / null)"]
    F -- "now >= revealTime" --> H["Credentials Revealed to Assigned Squads & Staff"]
    H --> I["7. Match Played in BGMI Custom Room"]
    I --> J["8. Captain Submits Result & Screenshot Evidence"]
    J --> K{"9. Result Verification / Dispute"}
    K -- "Score Disputed" --> L["Captain Raises Dispute with Evidence"]
    L --> M["Referee Adjudicates & Corrects Scores in Transaction"]
    K -- "Score Verified" --> N["Referee Formally Verifies Result"]
    M --> O["10. Standings Engine Recalculates Aggregates"]
    N --> O
    O --> P["11. Deterministic Leaderboard Published"]
```

---

## Scoring System

### Official BGMI / Battle-Royale Matrix

The default scoring engine (`DEFAULT_BGMI_SCORING`) implements standard Battlegrounds Mobile India point distribution rules:

| Finish / Placement | Placement Points | Kill Points Multiplier |
|---|---|---|
| **1st Place (WWCD)** | **15 pts** | 1 pt per kill |
| **2nd Place** | **12 pts** | 1 pt per kill |
| **3rd Place** | **10 pts** | 1 pt per kill |
| **4th Place** | **8 pts** | 1 pt per kill |
| **5th Place** | **6 pts** | 1 pt per kill |
| **6th Place** | **4 pts** | 1 pt per kill |
| **7th Place** | **2 pts** | 1 pt per kill |
| **8th Place** | **1 pt** | 1 pt per kill |
| **9th Place** | **1 pt** | 1 pt per kill |
| **10th Place** | **1 pt** | 1 pt per kill |
| **11th – 25th Place** | **0 pts** | 1 pt per kill |

$$\text{Total Points} = \text{PlacementPoints}(\text{Rank}) + (\text{Kills} \times \text{KillMultiplier})$$

*Custom configurations*: Organizers can optionally configure custom placement points and custom kill point multipliers (e.g., 2 points per frag) per tournament via JSON configuration strings.

### Standings & Deterministic Tie-Breaking

When sorting tournament standings, if two or more teams accumulate identical cumulative points across matches, `StandingsService` breaks ties using deterministic rules:

1. **Total Points** (higher rank wins)
2. **Total Kill Points** (higher frags wins)
3. **Total Match Wins / WWCD** (more 1st place finishes wins)
4. **Best Single-Match Placement** (lower numeric finish, e.g., 2nd beats 3rd)
5. **Team Tag Alphabetical Order** (lexicographical comparison)

### Worked Scoring Example

Suppose **Team Alpha** and **Team Bravo** complete a 2-match tournament group:

| Team | Match 1 Finish & Kills | Match 2 Finish & Kills | Placement Pts | Kill Pts | Total Points | Tie-Break Result |
|---|---|---|---|---|---|---|
| **Team Alpha** | #1 (15 pts) with 6 kills | #5 (6 pts) with 4 kills | $15 + 6 = 21$ | $6 + 4 = 10$ | **31 pts** | **Rank 1** (Higher kill points: 10 vs 7) |
| **Team Bravo** | #2 (12 pts) with 3 kills | #2 (12 pts) with 4 kills | $12 + 12 = 24$ | $3 + 4 = 7$ | **31 pts** | **Rank 2** (Fewer kill points: 7 vs 10) |

---

## Security Architecture

ArenaHub underwent an extensive enterprise security audit and hardening process covering 14 security domains.

### Implemented Security Controls

- **Cryptographic JWT Sessions**: Signed using `jsonwebtoken` with explicit algorithm enforcement (`HS256`). Rejects algorithm substitution attacks (`none` or asymmetric public key confusion).
- **Environment Key Assertion**: In production (`NODE_ENV === "production"`), the server validates that `AUTH_SECRET` is defined, distinct from development defaults, and at least 32 characters long.
- **Competitor Registration Guard**: Public registration (`/api/auth/register`) enforces Zod validation permitting only `PLAYER`, `TEAM_CAPTAIN`, and `SPECTATOR`. Privileged roles (`TOURNAMENT_ORGANIZER`, `REFEREE`, `PLATFORM_ADMIN`) cannot be self-assigned.
- **Tenant Isolation**: Operations on tournaments, lobbies, slots, and dispute resolutions check active tenant membership. Organizers and referees from Organization A are barred from modifying resources owned by Organization B.
- **Suspension Enforcement**: Suspended organizations (`status === "SUSPENDED"`) are blocked from creating tournaments, scheduling lobbies, slotting teams, and accepting registrations.
- **Server-Side Credential Masking**: Public endpoints (`TournamentService.getBySlug`) sanitize match lobbies, setting `roomId: null` and `roomPassword: null`. Credential retrieval via `canAccessRoomCredentials()` enforces role, assignment, and `now >= revealTime` checks.
- **Result Immutability**: Once a match result is set to `VERIFIED`, normal competitors cannot overwrite or tamper with scores. Corrections require referee dispute adjudication.
- **IDOR Protection**: Captains and players can only submit scores for their own squads. Submissions for unassociated teams are rejected with HTTP 403.
- **Atomic Database Transactions**: High-concurrency operations (squad registrations, score upserts, dispute resolutions) execute within `prisma.$transaction()` blocks.
- **Protocol XSS Defense**: URLs for logos, banners, and dispute screenshots are validated through `safeHttpUrlSchema`, restricting protocols to `http:` and `https:`, blocking `javascript:` and `data:` schemes.
- **Sliding-Window Rate Limiting**: In-memory rate limiting applied to `/api/auth/login` (10 req/min) and `/api/auth/register` (5 req/min) returning HTTP `429 Too Many Requests` with `Retry-After`.
- **HTTP Security Headers**: Configured in `next.config.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Production Limitations & Disclosures

> [!WARNING]
> ArenaHub is currently configured for local and staging development. The following architecture updates are required prior to commercial production deployment:

1. **Room Credential Encryption at Rest**:
   - *Current State*: Access control and response scrubbing are strictly enforced at the application and API layers. Within the SQLite database, `roomId` and `roomPassword` are stored as plaintext columns.
   - *Production Requirement*: Implement application-level envelope encryption (AES-256-GCM via Node.js `crypto` with a KMS-managed master key) before writing room credentials to the database.
2. **Distributed Rate Limiting**:
   - *Current State*: The rate limiter uses in-memory process storage (`Map<string, RateLimitRecord>`). State is not synchronized across horizontal replicas or serverless worker instances.
   - *Production Requirement*: Replace the in-memory map with a Redis or Upstash client running sliding-window counters.
3. **Database Migration to PostgreSQL**:
   - *Current State*: Configured for SQLite (`file:./dev.db`) for zero-dependency local setup.
   - *Production Requirement*: Update `prisma/schema.prisma` datasource provider to `postgresql` and apply migrations to a managed PostgreSQL cluster (e.g., Supabase, Neon, AWS RDS).

---

## Technology Stack

```
Frontend:           Next.js 16.4.3 (App Router, Turbopack, React 19.3.0)
Styling:            Tailwind CSS v4, Lucide React icons
Language:           TypeScript 5.x (Strict Mode)
Database ORM:       Prisma ORM 6.4.1
Local Database:     SQLite (Production target: PostgreSQL)
Authentication:     JWT (jsonwebtoken 9.0.3, jose 6.2.12), bcryptjs 3.0.3
Validation:         Zod 4.6.7
Testing:            Jest 30.5.2, ts-jest 29.4.14
Date Utilities:     date-fns 4.4.0
Runtime:            Node.js v20+ / v22+
```

---

## Application Architecture

ArenaHub is structured as a **modular monolith** leveraging the Next.js App Router:

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React 19 / Tailwind CSS v4)"]
        UI_Home["Landing & Discovery (/)"]
        UI_Tourn["Tournament Hub (/tournaments/[slug])"]
        UI_Dash["Captain & Player Dashboard (/dashboard)"]
        UI_Disp["Referee Dispute Center (/disputes)"]
        UI_Admin["Platform Admin Portal (/admin)"]
    end

    subgraph RouteLayer ["Next.js App Router (Server Handlers)"]
        API_Auth["/api/auth/*"]
        API_Tourn["/api/tournaments/*"]
        API_Lobby["/api/lobbies/*"]
        API_Disp["/api/disputes/*"]
        API_Admin["/api/admin/*"]
    end

    subgraph ServiceLayer ["Business Logic & Domain Services"]
        SVC_Auth["AuthService & auth.ts (JWT, Sessions, RBAC)"]
        SVC_Limiter["RateLimiter (Sliding Window)"]
        SVC_Tourn["TournamentService (Multi-Tenant Lifecycle)"]
        SVC_Lobby["LobbyService (Slotting & Secure Reveal)"]
        SVC_Score["ScoringService & StandingsService"]
        SVC_Disp["DisputeService (Arbitration)"]
    end

    subgraph DataLayer ["Data Access & Storage"]
        ORM["Prisma Client 6.4.1"]
        DB[("SQLite (dev.db) / Target: PostgreSQL")]
    end

    ClientLayer --> RouteLayer
    RouteLayer --> ServiceLayer
    ServiceLayer --> ORM
    ORM --> DB
```

---

## Database Design

```mermaid
erDiagram
    User ||--o{ Organization : "owns"
    User ||--o{ OrgMembership : "belongs to"
    Organization ||--o{ OrgMembership : "has members"
    User ||--o{ Team : "captains"
    Team ||--o{ TeamPlayer : "has roster"
    User ||--o{ TeamPlayer : "player profile"
    Organization ||--o{ Tournament : "hosts"
    User ||--o{ Tournament : "organizes"
    Tournament ||--o{ TournamentRegistration : "receives"
    Team ||--o{ TournamentRegistration : "enters"
    Tournament ||--o{ Lobby : "schedules"
    Lobby ||--o{ LobbyTeam : "slots"
    Team ||--o{ LobbyTeam : "assigned to"
    Lobby ||--o{ LobbyResult : "contains"
    Team ||--o{ LobbyResult : "scores"
    Tournament ||--o{ Dispute : "has"
    Lobby ||--o{ Dispute : "filed in"
    Team ||--o{ Dispute : "raises"
    User ||--o{ Dispute : "raised by"
    User ||--o{ Dispute : "adjudicated by"
    User ||--o{ Notification : "receives"
    User ||--o{ AuditLog : "performed by"
    Organization ||--o{ AuditLog : "scoped to"
```

### Core Entities

- **`User`**: Core identity storing credentials (`passwordHash`), system role, IGN, character ID, and profile metadata.
- **`Organization`**: Multi-tenant unit owning tournaments and audit trails with status (`ACTIVE`, `SUSPENDED`).
- **`OrgMembership`**: Tenant-specific role assignment (`TOURNAMENT_ORGANIZER`, `REFEREE`, `MEMBER`).
- **`Team`**: Competitive squad tagged with a unique 2–6 character shorthand, led by a captain.
- **`TeamPlayer`**: Squad roster member binding character ID, IGN, and squad role (`CAPTAIN`, `PLAYER`, `SUBSTITUTE`).
- **`Tournament`**: Battle-Royale competition with format specifications, team capacities, schedules, and scoring rules.
- **`TournamentRegistration`**: Squad registration entry with unique constraint `[tournamentId, teamId]`.
- **`Lobby`**: Match lobby with assigned map, room credentials, scheduled start, and explicit reveal time.
- **`LobbyTeam`**: Team assignment binding a squad to an exact room slot number (1–25).
- **`LobbyResult`**: Match outcome recording placement, kill frags, calculated points, proof screenshots, and verification status (`SUBMITTED`, `VERIFIED`).
- **`Dispute`**: Formal protest filed by a squad captain against a match result with referee resolution notes.
- **`Notification`**: System and match alerts dispatched to users.
- **`AuditLog`**: Audit record logging actions, entities, actors, and JSON metadata.

---

## Project Structure

```
arenahub/
├── prisma/
│   ├── dev.db                      # Local development SQLite database (git-ignored)
│   ├── schema.prisma               # Prisma data models, relations, and indexes
│   └── seed.ts                     # Multi-tenant demo database seeding script
├── src/
│   ├── app/                        # Next.js App Router pages and API routes
│   │   ├── admin/page.tsx          # Platform Administrator KPI and governance portal
│   │   ├── auth/
│   │   │   ├── login/page.tsx      # Sign-in page
│   │   │   └── register/page.tsx   # Competitor registration page
│   │   ├── dashboard/page.tsx      # User personalized dashboard (matches, teams)
│   │   ├── disputes/page.tsx       # Dispute tracking and arbitration center
│   │   ├── leaderboards/page.tsx   # Global player and team leaderboards
│   │   ├── teams/                  # Team directory, creation, and squad profile pages
│   │   ├── tournaments/            # Tournament discovery, creation, and hub pages
│   │   ├── api/                    # Serverless API Route Handlers
│   │   │   ├── admin/              # Global KPIs, audit logs, user role assignment
│   │   │   ├── auth/               # Login, register, logout, session verification
│   │   │   ├── disputes/           # Dispute filing and referee adjudication
│   │   │   ├── games/              # Supported competitive titles
│   │   │   ├── lobbies/            # Lobby management, slotting, results, verification
│   │   │   ├── notifications/      # User notification retrieval and status updates
│   │   │   ├── organizations/      # Multi-tenant organization endpoints
│   │   │   ├── teams/              # Squad CRUD and roster player management
│   │   │   └── tournaments/        # Tournament CRUD, squad registrations, standings
│   │   ├── layout.tsx              # Root HTML shell, metadata, and main navigation
│   │   └── page.tsx                # Public landing page with featured tournaments
│   ├── lib/                        # Core utilities and security infrastructure
│   │   ├── auth.ts                 # JWT signing, cookie verification, RBAC, room credential logic
│   │   ├── db.ts                   # Prisma client singleton instantiation
│   │   ├── rate-limiter.ts         # In-memory sliding-window rate limiter
│   │   └── validations.ts          # Zod input schemas and safe URL protocol validators
│   └── services/                   # Domain business logic layer
│       ├── admin.service.ts        # Platform overview metrics and user administration
│       ├── auth.service.ts         # User registration, password verification, profile fetching
│       ├── dispute.service.ts      # Dispute creation, referee adjudication, score updates
│       ├── lobby.service.ts        # Lobby creation, team slotting, credential reveal, score submission
│       ├── organization.service.ts # Tenant organization creation and staff role management
│       ├── scoring.service.ts      # Placement point parser and kill multiplier calculation
│       ├── standings.service.ts    # Multi-match aggregate calculation and tie-breaking
│       └── tournament.service.ts   # Tournament creation, lifecycle management, squad registration
├── tests/                          # Automated Jest regression test suites
│   ├── auth.test.ts                # Session tokens, password hashing, and role guard tests
│   ├── security-audit.test.ts      # Multi-tenant isolation, room credential, and invariant tests
│   ├── tournament-domain.test.ts   # Scoring matrix, tie-breaking, and dispute resolution tests
│   └── validations.test.ts         # Schema boundary and safe URL protocol tests
├── .env.example                    # Template environment variables
├── next.config.ts                  # Next.js configuration and HTTP security headers
├── package.json                    # Project dependencies, engines, and run scripts
├── tsconfig.json                   # TypeScript compiler configuration (Strict mode)
└── README.md                       # Project documentation
```

---

## Installation and Local Setup

### Prerequisites

- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **npm**: `v10.x` or higher
- **Git**: Installed and configured on your operating system (Windows, macOS, or Linux)

### Step-by-Step Instructions

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/arenahub.git
   cd arenahub
   ```

2. **Install project dependencies**:
   ```bash
   npm install
   ```

3. **Configure local environment variables**:
   ```bash
   # Windows PowerShell
   Copy-Item .env.example .env

   # macOS / Linux
   cp .env.example .env
   ```

4. **Generate Prisma Client**:
   ```bash
   npm run db:generate
   ```

5. **Initialize Database Schema**:
   ```bash
   npm run db:push
   ```

6. **Seed Multi-Tenant Demo Data**:
   ```bash
   npm run db:seed
   ```
   *This seeds 8 users across all 6 roles, 2 organizations (KRAFTON Esports India and Skyesports Championship), 4 full squads (GodLike, Soul, XSpark, Blind), active tournaments, lobbies, results, and disputes.*

7. **Start the local development server**:
   ```bash
   npm run dev
   ```

8. **Open the Application**:
   Navigate to [http://localhost:3000](http://localhost:3000) in your web browser.

---

### Environment Configuration

The provided `.env.example` file contains template settings:

```env
# Database connection
# For local SQLite development (zero external dependencies):
DATABASE_URL="file:./dev.db"

# For production PostgreSQL (Supabase, Neon, AWS RDS, Docker):
# DATABASE_URL="postgresql://postgres:password@localhost:5432/arenahub?schema=public"

# Authentication secret (Minimum 32 characters for JWT HS256 signing)
AUTH_SECRET="arenahub-super-secret-development-key-32-chars-long!"

# App environment
NODE_ENV="development"
PORT=3000
```

> [!CAUTION]
> Never commit actual `.env` files, production credentials, or database files to source control.

---

## Demo Accounts

The database seed script (`prisma/seed.ts`) generates realistic demonstration accounts for local testing across all 6 roles.

> [!NOTE]
> All credentials below are **strictly for local development and evaluation**.

| Email | Password | System Role | Organization / Squad Affiliation |
|---|---|---|---|
| `admin@arenahub.gg` | `ArenaAdmin123!` | `PLATFORM_ADMIN` | Global Platform Administration |
| `organizer@arenahub.gg` | `Organizer123!` | `TOURNAMENT_ORGANIZER` | KRAFTON Esports India (Organizer) |
| `referee@arenahub.gg` | `Password123!` | `REFEREE` | KRAFTON Esports India (Senior Referee) |
| `captain@arenahub.gg` | `Password123!` | `TEAM_CAPTAIN` | Captain & IGL for GodLike Esports |
| `scout@arenahub.gg` | `Password123!` | `TEAM_CAPTAIN` | Captain for Team XSpark |
| `manya@arenahub.gg` | `Password123!` | `TEAM_CAPTAIN` | Captain for Blind Esports |
| `player@arenahub.gg` | `Password123!` | `PLAYER` | Assaulter for Team Soul |
| `spectator@arenahub.gg` | `Password123!` | `SPECTATOR` | Community Caster / Viewer |

---

## API Documentation

All API routes are implemented as Next.js Route Handlers under `/api/*`.

### Authentication
- `POST /api/auth/register` — Register a new competitor account (`PLAYER`, `TEAM_CAPTAIN`, `SPECTATOR`). Rate-limited.
- `POST /api/auth/login` — Authenticate with email/password and receive an HttpOnly JWT cookie. Rate-limited.
- `POST /api/auth/logout` — Invalidate session by clearing authentication cookie.
- `GET /api/auth/me` — Retrieve currently authenticated user profile and organizational memberships.

### Organizations (Multi-Tenancy)
- `GET /api/organizations` — List active organizations.
- `POST /api/organizations` — Create a new organization tenant (Authenticated).
- `GET /api/organizations/[slug]` — Fetch organization profile, tournaments, and public staff directory.
- `POST /api/organizations/[slug]/members` — Assign organizer or referee roles within an organization (Requires Org Owner).

### Teams & Rosters
- `GET /api/teams` — List teams with optional search and game filtering.
- `POST /api/teams` — Create a team with starting roster (Requires `TEAM_CAPTAIN` or `PLAYER`).
- `GET /api/teams/[id]` — Fetch squad details, roster members, match history, and statistics.
- `POST /api/teams/[id]/players` — Add a player or substitute to the squad roster (Requires Team Captain).

### Tournaments
- `GET /api/tournaments` — Discover tournaments with status, game, search, and pagination filters.
- `POST /api/tournaments` — Create a Battle-Royale tournament (Requires `TOURNAMENT_ORGANIZER` of target org).
- `GET /api/tournaments/[slug]` — Fetch tournament details, rules, lobbies (credentials scrubbed), and registrations.
- `PATCH /api/tournaments/[slug]/status` — Transition tournament lifecycle status (Requires Org Staff).
- `POST /api/tournaments/[slug]/register` — Register a 4-player squad (Requires Team Captain; capacity checked).
- `GET /api/tournaments/[slug]/standings` — Compute aggregate tournament standings and tie-breakers.

### Match Lobbies & Slotting
- `GET /api/lobbies` — List lobbies with tournament ID filtering.
- `POST /api/lobbies` — Create a match lobby with map and scheduled time (Requires Org Staff).
- `GET /api/lobbies/[id]` — Fetch lobby data; reveals room ID/password only if authorized and `now >= revealTime`.
- `PATCH /api/lobbies/[id]` — Update Custom Room ID, password, or match state (Requires Org Staff).
- `POST /api/lobbies/[id]/assign` — Slot a registered squad into a lobby slot (1–25) (Requires Org Staff).

### Results & Verification
- `POST /api/lobbies/[id]/results` — Submit match placement and kill frags with proof URL (Requires Squad Captain/Roster).
- `PATCH /api/lobbies/results/[id]/verify` — Formally verify or adjust a match score (Requires Org Referee/Staff).

### Disputes
- `GET /api/disputes` — List disputes filtered by tournament, status, or user.
- `POST /api/disputes` — Raise a dispute against a match result with evidence (Requires Team Captain).
- `POST /api/disputes/[id]/resolve` — Adjudicate dispute and adjust scores in transaction (Requires Org Referee/Staff).

### Notifications
- `GET /api/notifications` — Retrieve user notification stream.
- `PATCH /api/notifications` — Mark notifications as read.

### Platform Administration
- `GET /api/admin/metrics` — Retrieve platform-wide KPIs (Requires `PLATFORM_ADMIN`).
- `GET /api/admin/users` — Paginated user directory with role filters (Requires `PLATFORM_ADMIN`).
- `PATCH /api/admin/users/[id]/role` — Promote or demote user system roles (Requires `PLATFORM_ADMIN`).
- `PATCH /api/admin/organizations/[id]/status` — Suspend or activate an organization tenant (Requires `PLATFORM_ADMIN`).
- `GET /api/admin/audit` — Stream immutable system audit logs with pagination (Requires `PLATFORM_ADMIN`).

---

## Testing and Verification

ArenaHub maintains test coverage verifying business logic, authorization invariants, and scoring calculations.

### Verification Commands

```bash
# 1. Run automated test suites
npm test

# 2. Run TypeScript strict type-checking
npx tsc --noEmit

# 3. Compile optimized production build
npm run build

# 4. Check production dependencies for security advisories
npm audit --omit=dev
```

### Verification Results (Commit `217bb86`)

The repository passed all verification checks prior to merge:

- **Automated Tests**: **43 / 43 Passed (100%)** across 4 test suites:
  - `tests/security-audit.test.ts` (21 tests) — Multi-tenant isolation, room credential access control, dispute authorization, rate limiting, and XSS sanitization.
  - `tests/tournament-domain.test.ts` (9 tests) — Battle-Royale scoring calculations, custom multipliers, and standings tie-breaking.
  - `tests/auth.test.ts` (7 tests) — JWT token signing, verification, cookie extraction, and password hashing.
  - `tests/validations.test.ts` (6 tests) — Zod schema constraints, safe URL schemes, and competitor registration limits.
- **TypeScript**: **0 Errors** (`npx tsc --noEmit` exited with code `0`).
- **Production Build**: **Successful Compile** (`next build` with Next.js 16.4.3 and Turbopack completed in 3.2s).
- **Dependency Audit**: **0 Vulnerabilities** reported by `npm audit --omit=dev`.

---

## Deployment

### Recommended Production Architecture

ArenaHub is designed for deployment on modern cloud platforms:

- **Web Application**: Deploy the Next.js App Router on [Vercel](https://vercel.com/) or AWS ECS/Fargate with Node.js 20+.
- **Database**: Managed PostgreSQL instance (e.g., Supabase, Neon, AWS RDS PostgreSQL).
- **Session Caching & Rate Limiting**: Managed Redis (e.g., Upstash or AWS ElastiCache).
- **Static Assets & Proof Screenshots**: AWS S3 or Cloudflare R2 bucket with pre-signed upload URLs.

### Deployment Prerequisites

1. Set `DATABASE_URL` pointing to your production PostgreSQL connection string.
2. Generate a secure `AUTH_SECRET`:
   ```bash
   openssl rand -base64 32
   ```
3. Set `NODE_ENV="production"`.
4. Apply Prisma migrations to the production database:
   ```bash
   npx prisma migrate deploy
   ```

---

## Roadmap

### Completed (v0.1.0)
- [x] Multi-tenant organization data model and staff management.
- [x] Role-Based Access Control (RBAC) across 6 roles.
- [x] Battle-Royale 4-player squad management with IGN and character ID tracking.
- [x] Shared lobby scheduling with 25 slots per match.
- [x] Time-restricted server-side room credential reveal engine.
- [x] Placement and kill scoring with custom tournament configurations.
- [x] Deterministic 5-tier standings tie-breaker algorithm.
- [x] Referee result verification and dispute resolution workflows.
- [x] Concurrency safety with database transactions and unique constraints.
- [x] Enterprise security hardening (JWT algorithm locking, sliding-window rate limiting, protocol XSS defense, HTTP security headers).
- [x] Upgrade to Next.js 16.4.3.

### Planned Improvements
- [ ] **Lobby Credential Encryption at Rest**: AES-256-GCM envelope encryption for database-stored room passwords.
- [ ] **Distributed Rate Limiting**: Redis/Upstash adapter for multi-instance deployments.
- [ ] **PostgreSQL Migration**: Official Prisma PostgreSQL migration configuration for high-concurrency production deployments.
- [ ] **Automated OCR Scorecard Ingestion**: Optical Character Recognition for automated kill feed and placement extraction from match screenshots.
- [ ] **Direct File Upload Storage**: Direct-to-S3/R2 presigned upload pipeline with virus and MIME scanning.
- [ ] **Webhooks & Discord Bot Integration**: Automated lobby room notifications dispatched directly into organization Discord servers.

---

## Contributing

Contributions to ArenaHub are welcome. Please adhere to the following workflow:

1. **Fork the repository** on GitHub.
2. **Create a descriptive feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Commit your changes** with conventional commit messages:
   ```bash
   git commit -m "feat(lobbies): add automated slot auto-assignment"
   ```
4. **Run the verification suite**:
   ```bash
   npm test
   npx tsc --noEmit
   npm run build
   ```
5. **Push to your fork and submit a Pull Request** targeting `main`. Ensure your PR describes the motivation, changes made, and test evidence.

---

## License

No license has been specified for this project. All rights are reserved by the original authors.

---

## Acknowledgements

- [Next.js](https://nextjs.org/) by Vercel for the full-stack React framework.
- [Prisma](https://www.prisma.io/) for type-safe database access.
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
- [Lucide](https://lucide.dev/) for open-source iconography.
- [Zod](https://zod.dev/) for TypeScript-first schema validation.
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js) for cryptographic password hashing.
