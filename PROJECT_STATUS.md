# Project Status

Last updated: 2026-08-07

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
| Game catalog | `backend/modules/game-catalog` | Draft/active/archived platform games, capabilities, and account connection policy |
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
- Game Manager and Event Manager assignments require at least one valid game
  scope. Platform and match-scoped roles reject client-supplied game IDs.
- Super Admin and Platform Admin are platform-wide governance roles.
- Game Manager and Event Manager require the relevant game ID to be inside the
  assignment scope. Match Operator access is restricted by match assignment.
- A staff user may hold multiple different assignments, but cannot hold the
  same active/suspended role twice.
- Role definitions are server-owned policy records. Each declares its
  `managedRoles`, `assignableBy` authority, and `scope`; staff-assignment
  creation, activation, suspension, and revocation enforce `assignableBy`.
  The current graph is Super Admin ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Platform Admin ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Game Manager, Event
  Manager, and Match Operator, with Super Admin retaining authority over every
  lower role. New roles must be inserted through this policy graph and tested
  before they can be assigned.
- Access-control APIs are mounted at `/api/access-control/*`, separate
  from `/api/admin/*`. Each response is filtered to roles the caller may
  manage, recommend, review, or inspect; access never grants platform-admin
  APIs.

### Staff Hiring Lifecycle

- Direct assignment is available only when an active assignment lists the
  requested role in its server-owned `managedRoles` policy.
- A recommendation never grants access. Active roles may recommend only roles
  listed in their server-owned `recommendableRoles` policy.
- Game Manager and Event Manager may recommend Match Operators. Platform Admin
  may recommend lower operational roles for Super Admin review.
- A pending recommendation records candidate, requested role and scopes,
  reason, recommender, expiry, and full review outcome. Duplicate pending
  recommendations for the same candidate and role are rejected.
- Only a different higher-authority reviewer whose role can manage the
  requested role may approve or reject. Approval creates the StaffAssignment;
  rejection requires a review note. The recommender may withdraw only while
  the request is pending.
- Recommendations expire after 14 days if not reviewed. Recommendation and
  decision events are written to the append-only staff activity ledger.

### UI and Dashboards

| User / role | Entry route | Dashboard / UI |
|---|---|---|
| Visitor | `/home` | Marketing, signup, login. |
| Player | `/dashboard` | Player shell: compete, tournaments, matches, clans, chats, wallet, profile, game accounts, account settings. |
| Approved Host | Player dashboard | Host actions for existing games; no separate staff dashboard. |
| Staff with any assignment | `/staff` | Role switcher. Shows one workspace card per active assignment and an explicit player-dashboard link. |
| Staff access participant | `/staff/access-control` | Search candidates by email, recommend permitted roles, review subordinate recommendations, inspect assignments and history. Backend policy decides available actions. |
| Super Admin | `/panelAdmin` | Platform administration and governance controls. |
| Platform Admin | `/panelAdmin` | Staff management, game catalog, verification, finance, and platform oversight. |
| Game Manager | `/staff/games` | Scoped game operations: modes, maps, and player instructions. |
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
  Unmatched `/api/*` routes now return the JSON `API_ROUTE_NOT_FOUND`
  envelope, and frontend normalization rejects HTML/oversized transport bodies
  instead of displaying raw server documents in toast messages.
- Canonical email identity is shared by signup, login, model persistence,
  staff-candidate search, and account-creation tooling. Gmail dots and
  plus-address aliases resolve to one account identity. Staff provisioning uses
  the current `basicInfo.dob` shape, delegates password hashing to the User
  model exactly once, and rolls back both users and assignments on failure.
- Redux Toolkit API thunk factory, normalized loading state, and store hooks.
- Protected routing, verified-account gates, and route error recovery UI.
- Player account settings, password change, game account connection, wallet UI,
  chat, friends, clans, teams, and live clan updates.
- Matchmaking HTTP command flow with Socket.IO used for live updates instead of
  queue joining.
- Staff assignment, role reports, service activity history, and security-event
  storage for prohibited privilege fields in public signup requests.
- Server-owned role policy registry with explicit management hierarchy,
  assignment authority, and access scope. Staff assignment status changes now
  enforce the policy graph instead of a governance-only special case.
- Access-control APIs moved from the platform-admin boundary to the
  policy-gated `/api/access-control/*` boundary; callers see and manage only
  their subordinate roles. Verified, non-banned staff candidates are searched
  through this boundary instead of exposing the general admin user directory.
- Initial Super Admin and Platform Admin bootstrap accounts provisioned with
  active platform-governance assignments; credentials are retained outside the
  repository.
- Admin panel exposes Role Management and Game Management as separate
  workspaces. Other admin modules remain protected by their existing backend
  authorization and are hidden until their domain workflow is rebuilt.
- Robust staff hiring lifecycle: server-owned recommendable-role policy, exact-email candidate lookup, pending recommendation deduplication and expiry, higher-authority approval/rejection, recommender withdrawal, approval-created assignments, and actor-to-target audit records.
- Access Control UI foundation: policy hierarchy, filtered staff directory,
  scope-aware role assignment and editing, assignment lifecycle controls, role
  reports, and access-activity history. Revocation is terminal, scope changes
  are audited, and empty departments remain visible with zero-count reports.
- Role-management audit hardened activity visibility so person searches cannot
  replace the caller's manageable-role filter. Open recommendation uniqueness
  now covers pending and processing requests, and an assignment created during
  approval cannot be reset to a re-approvable pending request after a later
  audit-write failure.
- Game Catalog model with draft, active, and archived states, modes, maps, and
  verification configuration.
- Event Template and Event Run models with Event Manager scoped APIs.
- Complete Game Catalog creation and editing workspace: Platform Admin can
  configure identity, modes, maps, and account-connection policy, then save a
  private draft or atomically create an active game. Scoped Game Managers
  retain an ongoing configuration workspace after assignment.
- Server-enforced Game activation readiness requires at least one supported
  mode and a complete account-connection policy. Manager assignment is tracked
  as ownership information but never blocks creation or publication.
- Game identity and lifecycle are server-governed: clients cannot provide the
  legacy ID, game keys use a validated immutable slug, and publishing follows
  `draft -> active -> archived -> draft`. Active games cannot be edited into an
  incomplete state.
- Admin and scoped Game Manager workspaces include catalog search/filtering,
  readiness status, configuration controls, and role-filtered game activity
  history. Game Managers receive history only for assigned game scopes.
- Game visual presentation fields were removed from the Game model and catalog
  APIs because player pages use the deliberate frontend presentation registry.
  Existing database artwork fields were unset after confirming they were empty.
- Game Manager operations are now narrowly server-enforced: assigned managers
  may maintain modes, maps, and player instructions, but cannot alter game
  identity, lifecycle, verification method, provider integration, or stats-sync
  policy. Draft and active Event Templates block removal of their configured
  mode or map with `GAME_CAPABILITY_IN_USE` (HTTP 409).
- Event Templates now select their mode and optional map from the active
  game's configured capabilities. The backend validates and stores the
  canonical value, rejecting arbitrary or retired capability text.
- Centralized route mount policy in backend `index.js` for authenticated,
  staff, public callback, catalog, tournament, and CoC integration surfaces.
- Frontend build, route smoke test, and backend authentication suite pass at
  the latest recorded check.

## Active Work

### 1. Staff Hiring and Access Control

Owner: Super Admin and Platform Admin govern assignments; Game Manager and
Event Manager may recommend Match Operators for higher review.

Completed: StaffRecommendation records and server-owned hiring policy now
support exact-email candidate lookup, lower-role recommendations,
higher-authority review, approval-created assignments, rejection notes,
withdrawal, expiry, and append-only access history. The reusable workspace is
available at `/staff/access-control` and inside the admin panel. Activity
queries preserve both visibility and person filters, while the open-request
key prevents duplicate pending or processing recommendations.

### 2. Game Creation

Owner: Platform Admin owns initial definition and publication. Game Managers
receive optional game scope afterward for ongoing configuration.

Required flow:

1. Platform Admin configures identity, supported modes, optional maps, and
   player account policy in one creation workspace.
2. Platform Admin either saves an incomplete/private draft or creates the game
   directly as active when the server readiness checks pass.
3. Active games become eligible for Events and Quick Matches immediately; a
   Game Manager assignment is not a publication dependency.
4. Platform Admin may assign one or more Game Managers after the Game record
   exists. Their authority is limited to assigned modes, maps, and player
   instructions. They cannot change identity, publication, archive, account
   verification policy, provider integration, or unrelated games.
5. Platform Admin can edit any catalog configuration, publish ready drafts,
   archive active games, and return archived games to draft for rework.

Current API routes:

- `POST /api/admin/game-catalog`
- `GET /api/admin/game-catalog`
- `GET /api/admin/game-catalog/activity`
- `PATCH /api/admin/game-catalog/:gameId`
- `GET /api/staff/games`
- `GET /api/staff/games/activity`
- `PATCH /api/staff/games/:gameId`

Needs completion:

- If editorial artwork needs administration later, introduce a dedicated asset
  or content domain with upload, validation, CDN delivery, and player-page
  fallbacks. Do not re-add visual fields to the Game model by default.

### Game Catalog Data Contract

Canonical fields for newly created games:

- Identity: `name` and immutable `link` game key. `id` is a generated legacy
  compatibility identifier, not an admin input.
- Lifecycle: `draft`, `active`, or `archived`; only Platform Admin can change
  it through the deliberate `draft -> active -> archived -> draft` transition
  graph.
- `link` is immutable after creation because player accounts, scopes, and
  future competition records use it as the durable game key.
- Competition configuration: `supportedModes` and `supportedMaps`, configured
  by Platform Admin during creation and maintained later by Platform Admin or
  an assigned Game Manager. A mode or map referenced by a draft or active
  Event Template cannot be removed until that template is updated or archived.
- Account connection: `accountConnection.method`, `integrationKey`,
  `instructions`, and `supportsStatsSync`. Direct API verification is allowed
  only for server-implemented integrations; `supercell_coc` is valid only for
  the `coc` game key. Platform Admin owns method, integration, and stats-sync;
  Game Managers may edit only player instructions for assigned games.
- Activation readiness is derived, not stored. Publication requires one or
  more supported modes and either player instructions for manual/API
  verification or an explicit `not_supported` account-connection policy. The
  backend returns the checklist and rejects incomplete activation with HTTP
  409. `hasActiveManager` is a separate ownership signal for administration UI.

Deprecated and removed:

- The old flat creation endpoint (`GameController.addNewGame`) is removed.
- The unused `GameSlider`, old artwork-only `GameCard`, and socket-based
  `GameConnectForm` are removed.
- Game model presentation and legacy flat artwork fields are retired and must
  not be reintroduced into catalog APIs. The active frontend presentation
  registry at `frontend/src/config/gamePresentation.js` remains a separate,
  intentional player-interface concern.
- Legacy verification fields remain readable only to keep existing records
  usable while they are migrated.

### 3. Staff Workspace

Completed: staff accounts land on `/staff` and select a role workspace. Role
management uses `/api/access-control/roles`, `/candidates`, `/assignments`,
`/reports`, and `/activity`; assignment scope updates use
`PATCH /api/access-control/assignments/:assignmentId/scopes`.

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
- Staff route sequence: trusted origin, valid session, verified account,
  active staff assignment, then route-specific role and scope checks.
- Admin: trusted origin, authenticated session, then active Platform Admin or
  Super Admin assignment.

## How We Maintain This File

### Development Reset

For an intentional local fresh start, run this inside the backend repository:

`node scripts/resetPlatformData.js --confirm --flush-redis`

`npm run reset:platform` remains available as a dry run. Use
`--allow-production` only after deliberate production approval when the
environment is marked as production.

It deletes every document in the Mongo database while preserving indexes and
flushes the configured Redis database, including sessions and caches. The
script refuses production execution unless `--allow-production` is supplied.

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
