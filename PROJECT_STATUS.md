# Project Status

Last updated: 2026-08-06

This is the working source of truth for the E-Gaming platform. It covers both
repositories:

- Frontend: `C:\Users\HP\Desktop\Gaming_platform_frontend`
- Backend: `C:\Users\HP\Desktop\Gaming_platform_backend`

Update this file whenever a feature changes state, a security decision is made,
or a new platform dependency is introduced.

## Product Model

E-Gaming is a player-first gaming competition platform. Players discover games,
connect game accounts, join Quick Matches and Events, form clans and teams, and
manage their profile and wallet.

Competitions are intentionally split into two models:

- Quick Matches: a player joins a limited queue; when it fills, the platform
  creates operational work for a Match Operator.
- Events: repeatable Event Templates produce dated Event Runs with registration
  windows. Future stages, batches, leaderboards, and elimination flows belong
  to the Event domain, not to the old Tournament model.

## Current Architecture

The platform remains a modular monolith. Domains are separated into modules so
they can move to dedicated services later without a large rewrite.

| Area | Current location | Responsibility |
|---|---|---|
| Identity and sessions | `backend/controllers`, `backend/utils/sessionService.js` | Cookie JWTs, Redis sessions, refresh rotation, single-session policy |
| Player account | `backend/models/User.js`, `frontend/src/store/slices` | Player profile, account settings, game accounts |
| Staff management | `backend/modules/staff-management` | Staff assignments, scopes, governance limits, activity history |
| Game catalog | `backend/modules/game-catalog` | Draft/active/archived platform games and game configuration |
| Competition Events | `backend/modules/competition-events` | Event Templates and Event Runs |
| Matchmaking | `backend/services/matchmakingService.js` | Queue joining, rooms, matches, operator handoff |
| Realtime | `backend/sockets`, Redis adapter | Presence, chat, clan and match live updates |
| State management | `frontend/src/store` | Redux Toolkit thunks, slices, selectors, shared store hooks |

## Access Model

`User.role` has only two values:

- `player`: normal account classification.
- `staff`: account has one or more active staff assignments.

Detailed authority comes only from `StaffAssignment` records.

| Role | Responsibility |
|---|---|
| Super Admin | One active account. Platform governance and administrator access. |
| Platform Admin | One active account. Staff management, catalog, and platform oversight. |
| Game Manager | Assigned game configuration only. |
| Event Manager | Assigned game Event Templates and Event Runs. |
| Match Operator | Assigned match lobbies, check-ins, results, and disputes. |

Rules currently enforced:

- Staff may hold multiple non-duplicate assignments.
- Staff cannot change their own assignment.
- Only Super Admin can change Super Admin or Platform Admin access.
- Only one active or suspended Super Admin and Platform Admin assignment may
  exist for each governance role.
- Player hosting is a capability (`canCreateTournaments`), not a staff role.

## User, Role, Scope, and UI Contract

### User Types

| Type | Identity state | What it means |
|---|---|---|
| Visitor | No session | Can use only public pages and the payment-provider callback never acts as a visitor identity. |
| Pending registration | `PendingRegistration` document | Has submitted signup data but is not a User, cannot log in, and has no wallet, role, or session. |
| Player | `User.role = player` | Standard platform account. Uses player dashboard and can receive optional capabilities. |
| Staff | `User.role = staff` plus active StaffAssignment | Player identity with one or more operational responsibilities and staff workspace access. |

### Capabilities and Roles

| Item | Stored in | Meaning |
|---|---|---|
| Host capability | `User.permissions.canCreateTournaments` | Approved player may create supported competition offerings. It is not a staff role. |
| Super Admin | `StaffAssignment` | Platform governance. One active/suspended assignment maximum. |
| Platform Admin | `StaffAssignment` | Staff, catalog, and platform administration. One active/suspended assignment maximum. |
| Game Manager | `StaffAssignment` | Manages only assigned game configuration. |
| Event Manager | `StaffAssignment` | Creates and manages Events only for assigned games. |
| Match Operator | `StaffAssignment` | Operates assigned matches, lobby data, check-ins, results, and disputes. |

### Scope Rules

- `User.role` is never an authorization source. It is only `player` or `staff`.
- Every privileged API verifies active staff assignments on the server.
- `gameScopes` are Game Object IDs on a StaffAssignment.
- Empty game scope means no game-specific operational authority unless the
  role's responsibility is platform-wide.
- Super Admin and Platform Admin are platform-wide governance roles.
- Game Manager and Event Manager require the relevant game ID to be inside the
  assignment scope. Match Operator access is restricted by match assignment.
- A staff user may hold multiple different assignments, but cannot hold the
  same active/suspended role twice.

### UI and Dashboards

| User / role | Entry route | Dashboard / UI |
|---|---|---|
| Visitor | `/home` | Marketing, signup, login. |
| Player | `/dashboard` | Player shell: compete, tournaments, matches, clans, chats, wallet, profile, game accounts, account settings. |
| Approved Host | Player dashboard | Host actions for existing games; no separate staff dashboard. |
| Staff with any assignment | `/staff` | Role switcher. Shows one workspace card per active assignment and an explicit player-dashboard link. |
| Super Admin | `/panelAdmin` | Platform administration and governance controls. |
| Platform Admin | `/panelAdmin` | Staff management, game catalog, verification, finance, and platform oversight. |
| Game Manager | `/staff/games` | Scoped game workspace. Needs full edit workflow. |
| Event Manager | `/staff/events` | Event templates, Event Runs, assigned games, and schedule management. |
| Match Operator | `/dashboard/operations` | Assigned-match operational console. |

Frontend route guards improve navigation only. Backend route middleware and
service-level scope checks are the final authority for all privileged actions.

## Completed

- Secure cookie-based authentication with short-lived access tokens, refresh
  rotation, Redis-backed session validation, session versioning, and logout
  revocation.
- Pending registration flow: signup creates a pending registration rather than
  a full player account. Email OTP verification is intentionally not built yet.
- Consistent API success/error envelope and frontend error toast normalization.
- Redux Toolkit API thunk factory, normalized loading state, and store hooks.
- Protected routing, verified-account gates, and route error recovery UI.
- Player account settings, password change, game account connection, wallet UI,
  chat, friends, clans, teams, and live clan updates.
- Matchmaking HTTP command flow with Socket.IO used for live updates instead of
  queue joining.
- Staff assignment, role reports, service activity history, and security-event
  storage for prohibited privilege fields in public signup requests.
- Game Catalog model with draft, active, and archived states, modes, maps, and
  verification configuration.
- Event Template and Event Run models with Event Manager scoped APIs.
- Guided Game Catalog draft creation, Platform Admin-only activation/archive
  controls, scoped Game Manager configuration workspace, and catalog activity
  history.
- Centralized route mount policy in backend `index.js` for authenticated,
  staff, public callback, catalog, tournament, and CoC integration surfaces.
- Frontend build, route smoke test, and backend authentication suite pass at
  the latest recorded check.

## Active Work

### 1. Game Creation

Owner: Platform Admin creates the draft, then assigns Game Manager scope.

Required flow:

1. Platform Admin creates a draft with only a display name and stable `link`
   game key. The legacy `id` is generated automatically.
2. Platform Admin assigns one or more Game Managers to that game scope.
3. Game Manager maintains assigned modes, maps, and account-connection
   configuration.
4. Platform Admin reviews and activates the game.
5. Active games become eligible for Events and Quick Matches.

Current API routes:

- `POST /api/admin/game-catalog`
- `GET /api/admin/game-catalog`
- `PATCH /api/admin/game-catalog/:gameId`
- `GET /api/staff/games`
- `PATCH /api/staff/games/:gameId`

Needs completion:

- Add asset upload/validation instead of manual local-path entry.
- Add a confirmation/review checklist before activation once required game
  assets and competition configuration are finalized.
- Migrate the active Compete and Tournament Details presentation configuration
  from `frontend/src/config/gamePresentation.js` to catalog `presentation`
  data. It remains active code, not removable dead code.

### Game Catalog Data Contract

Canonical fields for newly created games:

- Identity: `name` and immutable `link` game key. `id` is a generated legacy
  compatibility identifier, not an admin input.
- Lifecycle: `draft`, `active`, or `archived`; only Platform Admin can change
  it.
- Presentation: optional `presentation.cardImage`, `heroImage`, `logoImage`,
  and `accentColor`. Missing assets must have UI fallbacks.
- Competition configuration: `supportedModes` and `supportedMaps`, maintained
  by the scoped Game Manager.
- Account connection: `accountConnection.method`, `integrationKey`,
  `instructions`, and `supportsStatsSync`. Direct API verification is allowed
  only for server-implemented integrations; `supercell_coc` is valid only for
  the `coc` game key.

Deprecated and removed:

- The old flat creation endpoint (`GameController.addNewGame`) is removed.
- The unused `GameSlider`, old artwork-only `GameCard`, and socket-based
  `GameConnectForm` are removed.
- Legacy flat asset and verification fields remain readable only to keep
  existing records usable while they are migrated.

### 2. Staff Workspace

Completed: staff accounts land on `/staff` and select a role workspace.

Needs completion:

- Per-person staff profile with assignments, scopes, service history, and
  current workload.
- Security-event review UI.
- Match Operator task queue, handoffs, notes, evidence, and SLA metrics.
- Move Socket.IO staff/role restoration from coarse user classification to
  `StaffAssignment` checks.

## Required Future Flows

### Identity and Security

- Email OTP request, verification, resend cooldown, and pending-registration
  promotion to `User`.
- Staff invitation/creation flow separate from player signup.
- MFA/passkeys and recent-authentication checks for all governance actions.
- Dedicated rate limits and alerts for staff assignment, activation, wallet,
  and verification mutations.
- Security-event UI, denied-access logging, production alerting, and incident
  response procedure.

### Competition

- Event registration records.
- Event stages, batches, elimination/seeding logic, and leaderboards.
- Quick Match offering configuration by game, mode, map, team size, and room
  capacity.
- Operator assignment queue, lobby publishing, result verification, disputes,
  settlement, and player match history.
- Clear retirement plan for legacy Tournament/TournamentType data and routes.

### Payments

- Production payment order, verification, webhook signature validation,
  idempotency, withdrawal workflow, and ledger reconciliation.
- Wallet permissions and financial audit trail.

### Platform Scale

- Redis persistence, monitoring, and failover plan.
- Background jobs for Event generation, registration closure, matchmaking,
  cleanup, and notifications.
- Separate staff domain/service, staff subdomain, and stronger network policy
  after core product flows stabilize.
- Deployment monitoring, structured logs, backups, and disaster recovery.

## Route Security Rules

- Public: landing assets and the payment-provider callback only.
- Authenticated: catalog, CoC integration, tournaments, payment orders,
  player, clan, match, and notification APIs.
- Verified player: actions that alter player competition, wallet, social, or
  game-account state.
- Staff: role and game-scope checks are performed server-side per request.
- Admin: trusted origin, authenticated session, then active Platform Admin or
  Super Admin assignment.

## How We Maintain This File

### Agent Operating Protocol

Any coding agent joining this project must read this file before inspecting or
editing code. It must then:

1. Confirm the relevant current state, completed work, and known risks.
2. Work in an end-to-end vertical slice: inspect, implement, verify, then
   update this tracker.
3. Preserve existing architecture and avoid broad rewrites unless this file
   records an approved migration decision.
4. Update Completed, Active Work, Required Future Flows, and security notes
   whenever a meaningful feature, route, data model, or decision changes.
5. Record unfinished work as `In progress` or `Blocked`; never imply that a
   partial implementation is complete.

The user should only need to say: `Read PROJECT_STATUS.md and continue.`

Use these states for every feature:

- `Planned`: agreed design; no implementation.
- `In progress`: implementation started; not safe to depend on.
- `Completed`: implemented and verified.
- `Blocked`: needs a product, provider, or security decision.
- `Retired`: replaced; no new code should depend on it.

Before beginning a new domain, add its owner, flow, API boundary, security
rules, data model, and completion criteria here. After implementation, move it
to Completed and record any remaining risks under Required Future Flows.
