# Project Status

Last updated: 2026-08-08

This is the working source of truth for the E-Gaming platform. It covers both
repositories:

- Frontend: `C:\Users\HP\Desktop\Gaming_platform_frontend`
- Backend: `C:\Users\HP\Desktop\Gaming_platform_backend`

Update this file whenever a feature changes state, a security decision is made,
or a new platform dependency is introduced.

## Sole Model Quick Start

Use this section first. It is the shortest safe path for a single coding model
to continue the project without reopening settled decisions.

### Current Truth

- The platform is a modular monolith. Do not split services yet.
- Platform Admin and Super Admin own game setup, publishing, staff assignment,
  and Event approval.
- Game Manager is read-only for assigned games and supervises operations.
- Event Manager creates drafts inside assigned game scopes; Platform Admin
  reviews submitted Templates and Event Runs through an audited lifecycle.
- Event proposals move through `draft`, `in_review`, `changes_requested`,
  `active`/`scheduled`, or `rejected`; creators and latest submitters cannot
  review the same revision.
- Match Operator requires assigned game scope and executes only matches they
  explicitly claim or receive within that scope.
- Redux Toolkit thunks are the required feature-data boundary. Migration is
  incomplete; do not add new direct API calls to feature components.
- Backend authorization is final. Frontend route guards and hidden UI are only
  navigation helpers.

### Do Not Change Without Recording It Here

- `User.role` values: only `player` and `staff`.
- Staff roles: Super Admin, Platform Admin, Game Manager, Event Manager, and
  Match Operator.
- Platform Admin-only authority over game configuration and staff access.
- Game Manager has no write route for games.
- Event Manager cannot publish Templates or schedule Event Runs directly.

### Ordered Next Work Queue


1. Replace the legacy competition core.
   - Introduce `QuickMatchOffering` and migrate Match/Room references away
     from `Tournament` and `TournamentType`.
   - Remove hardcoded BGMI/CoC enums from runtime competition records; use the
     immutable Game key or Game Object ID under server validation.
   - Retire compatibility routes only after frontend and stored data migrate.

2. Harden payments before enabling real-money production traffic.
   - Verify signed provider callbacks, enqueue status reconciliation in a
     durable worker, add a unique merchant transaction key, and use integer
     minor units or a decimal money type.
   - Replace the withdrawal success stub with a reviewed lifecycle or return a
     clear not-implemented response until that lifecycle exists.

3. Redesign staff workspaces as role-specific control rooms.
   - Establish the shared workspace shell: clear role context, scoped work
     summary, attention queue, recent activity, and explicit player return.
   - Complete Platform Admin Event review UI, then reshape Game Manager and
     Match Operator screens around their existing scoped APIs and Redux data.
   - Keep Role Management and Game Management as governance workspaces, not
     operational dashboards.

4. Establish the production baseline, then consider service extraction.
   - Redis-backed distributed rate limits, background jobs, structured logs,
     metrics, alerts, backups, recovery drills, pagination, and load tests.
   - Keep the modular monolith until ownership, APIs, data boundaries, and
     operational targets are stable.

### Product Delivery Blueprint (Follow in Order)

Status: Planned. This is the canonical, step-by-step delivery sequence for
the player experience and the staff operating system. Each numbered item is a
vertical slice: complete its API, authorization, Redux boundary, UI states,
tests, and tracker update before beginning the next item. Do not mark a later
item production-ready while an earlier dependency remains open.

#### 0. Engineering and Release Baseline

1. Completed 2026-08-08: restore a clean frontend lint baseline and remove
   sensitive/debug browser logging.
2. Completed 2026-08-08: replace the backend placeholder `npm test` with a
   maintained aggregate command that runs every named suite.
3. Completed 2026-08-08: add GitHub Actions CI for backend tests, frontend
   lint/build/smoke checks, and `git diff --check`.
4. Record environment validation and the deployment rollback procedure.

Exit: a clean checkout has a reliable quality command in each repository.

#### 1. Player Identity and Safe Account Entry

1. Visitor lands on `/home`, can browse public catalog content, and chooses
   signup or login.
2. Signup creates only a `PendingRegistration`; verification promotes it to a
   player account. Build the email OTP request, verification, and resend
   cooldown flow before presenting real-money participation as available.
3. Login restores the protected player shell at `/dashboard`; session refresh,
   logout, banned-account handling, and account recovery remain server-owned.
4. Player completes profile, game-account connection where a Game requires it,
   and any required age/identity verification. Eligibility must be returned by
   the API; the frontend only explains what is missing.

Exit: an eligible verified player can securely reach the dashboard, while an
ineligible or unverified player receives a clear recovery path and cannot join
restricted competitions.

#### 2. Canonical Game and Quick Match Foundation

1. Platform Admin creates and activates a Game with its immutable key,
   supported modes/maps, and account-connection policy.
2. Introduce `QuickMatchOffering` as the canonical configurable product:
   Game, supported mode/map, team size, capacity, region, entry policy,
   schedule policy, and lifecycle (`draft`, `active`, `paused`, `retired`).
3. Make Match and Room records reference `QuickMatchOffering` and the
   Game-backed capability values. New runtime competition records must not use
   hardcoded BGMI/CoC or legacy Tournament enums.
4. Publish data migration, compatibility, rollback, and test plans; migrate
   frontend reads/writes before retiring Tournament/TournamentType routes or
   stored references.

Exit: a Platform Admin can publish an offering for any cataloged active game
and an eligible player can enter its queue without a legacy Tournament record.

#### 3. Player Competition Journey

1. Dashboard shows eligible active offerings with entry requirements, rules,
   capacity, price/prize disclosure, and clear loading, empty, and error
   states through Redux thunks/selectors.
2. Player joins a Quick Match queue; the server performs eligibility,
   capacity, duplicate-entry, and payment-hold checks atomically.
3. When capacity is reached, the system creates the Match/Room and gives the
   assigned Match Operator operational work. Socket events notify players but
   never authorize a join or state change.
4. Player sees check-in, lobby details, match state, result, and a time-bound
   dispute path. Results stay pending until the defined verification/dispute
   process completes.

Exit: a player can discover, join, play, track, and dispute one Quick Match
end to end with server-enforced eligibility and no direct feature API calls.

Quick Match canonical flow: Platform Admin publishes an active offering with a
fixed participant capacity. Eligible players enter its queue; when the fixed
capacity is full, the system creates and schedules one Match/Room, the
assigned Match Operator runs check-in and lobby publication, players compete,
and the verified result moves through its dispute and settlement lifecycle.
Quick Matches do not use an Event registration window or round bracket.

#### 4. Money, Prize, and Withdrawal Safety

1. Replace mutable wallet summaries as the financial source of truth with an
   immutable, double-entry ledger using integer minor units or a decimal type.
2. Model balances explicitly: available, entry-held, prize-pending,
   withdrawable, and withdrawal-pending. Every change has an idempotency key,
   actor/system reason, and audit event.
3. Verify signed provider callbacks, use a unique merchant transaction key,
   and reconcile through durable background jobs rather than web-process
   polling.
4. Settle entry holds, refunds, fees, and prizes only from verified match
   outcomes. Reconciliation discrepancies enter a restricted review queue.
5. Replace the withdrawal success stub with a documented lifecycle: requested,
   under_review, approved/rejected, provider_processing, paid/failed, and
   reconciled. Until it exists, return an explicit not-implemented response.

Exit: duplicate callbacks, retries, disputed outcomes, and failed payouts
cannot credit/debit a player twice or silently change a balance.

#### 5. Platform Administration and Governance

1. Super Admin and Platform Admin use `/panelAdmin` for governance. Platform
   Admin alone owns Game configuration, offering publication, staff access,
   and Event approval; backend policy remains final.
2. Complete Role Management as a governance workspace: candidate search,
   recommendation/review, assignment, scopes, status changes, audit history,
   staff profile, and current workload.
3. Complete Game Management as a governance workspace: readiness, lifecycle,
   capability changes, named manager ownership, offering/Event impact, and
   auditable history.
4. Add a restricted finance/integrity/support review queue only as a
   permissioned Platform Admin workflow. Do not introduce Finance, Integrity,
   or Support as new `User.role` or StaffAssignment roles without changing the
   User, Role, Scope, and UI Contract and implementing the backend policy.

Exit: platform governance actions have clear ownership, approval separation,
audit evidence, and no hidden client-side-only permissions.

#### 6. Role-Specific Staff Operations

1. `/staff` becomes the shared staff shell: active assignment context, scoped
summary, attention queue, recent activity, and an explicit return to the
player dashboard.
2. Game Manager `/staff/games`: read-only assigned-game health, room pipeline,
operator workload, Event readiness, delayed work, and escalation history.
3. Event Manager `/staff/events`: create/edit only unapproved scoped Template
and Run drafts; show feedback, submission state, and approved handoff status.
4. Platform Admin Event review: queue submitted Templates/Runs, compare
revisions, record reviewer note, approve/reject/return for changes, and show
immutable history.
5. Match Operator `/dashboard/operations`: scoped claimable work plus explicit
assigned work; check-ins, lobby publication, evidence, result verification,
handoffs, disputes, and SLA/attention states.
6. Socket.IO derives staff identity and room eligibility from active
StaffAssignments and game scopes, applying the same predicates as HTTP.

Exit: every staff member sees only assigned, authorized work and can complete
their responsibility without accessing governance or financial controls.

#### 7. Events as a Separate Competition Product

1. Retain EventTemplate and EventRun as the approved planning boundary; do
   not overload them with participant or result state.
2. Add registration, eligibility/capacity, stages, batches, seeding,
leaderboards, results, prizes, and disputes as separate bounded records.
3. Add durable jobs for registration opening/closure, stage creation,
notifications, escalations, and settlement with idempotent state transitions.
4. Expose approved player-facing Event discovery and registration only after
the underlying governance, money, and operator flows are safe.

Exit: an Event Manager can propose, a Platform Admin can approve, players can
register, and operations can execute and settle an Event with auditable state.

Event canonical flow: an approved Event Run publishes a registration window
and one admission policy: `open`, `invitation_only`, or `limited_seats`.
Registration is accepted only while the window is open, within the capacity,
and for eligible/invited players; a full limited-seat Event may use a bounded
waitlist only when the Run explicitly enables it. After registration closes,
the Event starts through ordered rounds. Each round creates scheduled batches
of Matches, waits for verified results and the applicable dispute window, then
advances only the qualified participants to the next round. The Event is
complete only after its final round, final standings, and settlement are
verified; it must never be marked complete merely because registration closes.

#### 8. Production Operations and Scale

1. Add cursor pagination, stable sorting, bounded reads, and retire
compatibility endpoints only after all clients and data migrate.
2. Add Redis-backed distributed rate limits, durable jobs, structured logs,
correlation IDs, metrics, alerts, and security-event review.
3. Add database integration, browser end-to-end, concurrent workflow,
authorization-matrix, payment-reconciliation, accessibility, load, and
failure tests.
4. Define SLOs for authentication, queue join, room creation, realtime
delivery, Event registration, and payment reconciliation; rehearse backup
restore and incident response.

Exit: the platform has measured capacity, actionable alerts, verified recovery,
and reliable operational evidence before large-scale real-money traffic.

### Required End-of-Task Checklist

1. Read this file and the relevant repository `AGENTS.md` file.
2. Inspect current code before editing; preserve unrelated dirty changes.
3. Implement one complete vertical slice only.
4. Add concise comments for non-obvious code and tests for policy/lifecycle
   rules.
5. Run focused tests, lint/build when frontend changes, and `git diff --check`.
6. Update this file: move completed work, record remaining risks, and set the
   next concrete task.

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

Admin UI terminology: use **Event Management** for the Event Template/Run
workspace and **Tournament Management** for fixed-seat, on-demand competition
configuration. The latter continues to use the explicit internal
`QuickMatchOffering` model until the legacy Tournament/TournamentType migration
is retired; this avoids reviving legacy data dependencies while using the
product language preferred in the control room.

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

## System Audit Snapshot

Audit date: 2026-08-08. This is a code-level audit of both repositories, not a
penetration test, production load test, dependency vulnerability scan, or
payment-provider certification. Items remain open until code and focused tests
prove the completion criteria.

### Verified Strengths

- Protected HTTP and Socket.IO connections validate signed access claims
  against the Redis session; refresh rotation, replay detection, single-session
  replacement, user-agent binding, logout revocation, and socket disconnect on
  session revocation have focused tests.
- Unsafe browser requests use a trusted-origin check, API bodies are bounded,
  explicit CORS and baseline security headers are configured, and unknown API
  routes return the shared JSON error envelope.
- StaffAssignment is the privileged HTTP authorization source. Assignment
  uniqueness, governance-role limits, immutable activity records, scoped game
  management, and hiring review separation are established foundations.
- Matchmaking uses HTTP for commands, Socket.IO for notifications, Redis locks,
  database queue-membership invariants, and restart restoration from MongoDB.
- Payment credit settlement uses a MongoDB transaction and a conditional
  status update, which prevents the same stored transaction from crediting a
  wallet twice.
- Backend auth, social, competition, and realtime suites pass. Frontend route
  and API-error smoke checks pass, and the production build completes.

### Release Gates

| Priority | Domain | Verified current risk | Completion gate |
|---|---|---|---|
| Closed | Match operations | Match Operator assignments now require game scopes; queue reads and atomic claims are scoped, mutations require scope plus ownership, and free-form status writes were replaced by commands. | Verified by operator policy, lifecycle, unique-index, and duplicate-generation tests on 2026-08-08. |
| Closed | Event approval | Event Templates and Runs use submitted revisions, reviewer notes, return/reject states, independent reviewer checks, bounded queue/history reads, append-only review evidence, and a Platform Admin Redux review queue. | Verified by Event governance policy tests and frontend route/build checks on 2026-08-08. |
| P0 | Competition data | Match, Tournament, and TournamentType hardcode BGMI/CoC and legacy mode/map enums. Match and Room still depend on legacy Tournament records, so catalog-created games are not truly dynamic. | Migrate to Game-backed `QuickMatchOffering`, Match, Room, EventTemplate, and EventRun boundaries with compatibility migration tests. |
| P0 | Payment safety | Callbacks fail closed unless PhonePe SDK signature credentials are configured, capture the signed raw body, enqueue a durable reconciliation record, and merchant transaction IDs are unique. The standalone `worker:payments` claims/retries/verifies jobs and settles idempotently. Withdrawal explicitly returns not-implemented. The immutable integer/decimal ledger, worker deployment/sandbox evidence, and reviewed payout lifecycle remain incomplete, so deposits must not be treated as production-ready. | Deploy and monitor the worker, complete provider sandbox callback/retry verification, introduce the immutable minor-unit ledger, and implement the reviewed withdrawal lifecycle. |
| Closed | Realtime staff access | Socket connection now resolves active StaffAssignments and Game scopes at connection time. Match Operator subscriptions require assigned-game scope plus explicit ownership; the broad operator room was removed from authorization-sensitive delivery. | Verified by realtime staff-context and fail-closed scope tests on 2026-08-08. |
| P1 | Distributed security | Express rate limiters use process memory, so limits reset on restart and are not shared by multiple server instances. Governance actions lack MFA/recent-auth controls. | Redis-backed rate-limit store, endpoint-specific keys/alerts, and MFA or recent-auth for staff and financial actions. |
| P1 | Frontend boundaries | Multiple feature pages call the Axios client directly despite the documented Redux boundary. Sensitive signup/login-related data is logged by `ForgotPassword.jsx`. | Migrate one domain at a time to shared thunks/selectors, remove sensitive console output, and add component/integration tests. |
| P1 | API scale | Event, operator, social, and several administrative list reads can return unbounded collections; compatibility endpoints duplicate behavior. | Cursor pagination with bounded limits and stable sorting; record endpoint deprecation dates and remove aliases after client migration. |
| P1 | Financial model | Wallet embeds transaction summaries while Transaction is also stored separately, and money uses JavaScript Number values. The two representations can drift and arrays can grow without bound. | Adopt an immutable ledger as source of truth, minor-unit/decimal amounts, paginated projections, and reconciliation jobs. |
| P2 | Operations | Logging is console-based; no structured request tracing, metrics, alerting, job queue, backup verification, or disaster-recovery evidence was found. | Define SLOs, correlation IDs, redaction, metrics/alerts, durable jobs, backup restore drills, and failure runbooks. |
| P2 | Frontend quality | Frontend lint is clean, but there is no automated component test suite and the largest route chunks include Clan, Game Catalog, Role Management, and Operations. | Add tests for critical flows and split large pages by feature boundary without changing behavior. |

### Documentation Drift Found

- `GET /api/staff/games` and `GET /api/staff/games/activity` still exist as
  Game Manager catalog/activity reads. Only the former manager PATCH route is
  retired; the operational summary endpoint does not yet replace both reads.
- The frontend architecture says feature components use Redux thunks, but
  direct API calls remain in Clan, game-account, wallet, profile, match, and
  operator pages. Treat the Redux migration as in progress.
- The backend default `npm test` now runs the maintained auth, social,
  competition, and realtime suites. CI is still required to enforce it on
  every change.
- Current automated checks cover important units and contracts but do not yet
  provide database integration, browser end-to-end, payment callback, staff
  authorization matrix, or concurrent Event/operator workflow coverage.

## Access Model

`User.role` has only two values:

- `player`: normal account classification.
- `staff`: account has one or more active staff assignments.

Detailed authority comes only from `StaffAssignment` records.

| Role | Responsibility |
|---|---|
| Super Admin | One active account. Platform governance and administrator access. |
| Platform Admin | One active account. Staff management, catalog, and platform oversight. |
| Game Manager | Supervises assigned game operations, operator workload, and room/Event health. |
| Event Manager | Prepares scoped Event Template and Event Run proposals. |
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
| Game Manager | `StaffAssignment` | Read-only operational supervision for assigned games. |
| Event Manager | `StaffAssignment` | Creates scoped Event proposals that require Platform Admin approval. |
| Match Operator | `StaffAssignment` | Operates explicitly assigned matches inside assigned game scopes. |

### Scope Rules

- `User.role` is never an authorization source. It is only `player` or `staff`.
- Every privileged API verifies active staff assignments on the server.
- `gameScopes` are Game Object IDs on a StaffAssignment.
- Game Manager, Event Manager, and Match Operator assignments require at least
  one valid game scope. Platform roles reject client-supplied game IDs.
- Super Admin and Platform Admin are platform-wide governance roles.
- Game Manager and Event Manager require the relevant game ID to be inside the
  assignment scope. Match Operator queue access requires game scope, and every
  mutation after claiming also requires explicit match assignment.
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
- Only Super Admin and Platform Admin may assign, suspend, restore, revoke, or
  recommend staff roles. Operational staff do not alter staff records.
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
| Game Manager | `/staff/games` | Scoped operational overview: room health, operator workload, and Event readiness. No mutation controls. |
| Event Manager | `/staff/events` | Creates scoped draft template and Event Run proposals. Platform Admin approval is required for activation/scheduling. |
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
- Match Operator safety boundary: assignments require at least one valid game
  scope; available and assigned match reads are scope-filtered; claim, lobby,
  and lifecycle mutations require server-resolved game scope plus explicit
  ownership. Match stages use `prepare`, `start`, and `verify_result` commands;
  settlement and cancellation are governance-only. Conditional writes reject
  stale transitions, and one unique generated Match is enforced per legacy
  tournament instance with duplicate-key convergence. Existing unscoped Match
  Operator assignments fail closed until Platform Admin adds game scope.
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
  receive an operational read-only workspace after assignment.
- Server-enforced Game activation readiness requires at least one supported
  mode and a complete account-connection policy. Manager assignment is tracked
  as ownership information but never blocks creation or publication.
- Game identity and lifecycle are server-governed: clients cannot provide the
  legacy ID, game keys use a validated immutable slug, and publishing follows
  `draft -> active -> archived -> draft`. Active games cannot be edited into an
  incomplete state.
- Platform Admin Game Catalog includes search/filtering, readiness status,
  configuration controls, manager ownership, and activity history. Game
  Manager still has scoped catalog/activity read endpoints in addition to its
  read-only operational summary; consolidation remains open.
- Game visual presentation fields were removed from the Game model and catalog
  APIs because player pages use the deliberate frontend presentation registry.
  Existing database artwork fields were unset after confirming they were empty.
- Game Manager is a read-only game operations role. The former manager catalog
  PATCH endpoint and Redux mutation were removed. Its scoped operational read
  model reports room attention, live/active rooms, operator workload, Event
  readiness, and recent rooms without creating duplicate mutable state.
- Platform Admin is the only role that can create or modify game setup,
  capability configuration, lifecycle, and account-connection policy. Draft
  and active Event Templates block removal of their configured mode or map
  with `GAME_CAPABILITY_IN_USE` (HTTP 409).
- Event Templates now select their mode and optional map from the active
  game's configured capabilities. The backend validates and stores the
  canonical value, rejecting arbitrary or retired capability text.
- Event Managers now create draft-only Templates and Event Runs. Platform Admin
  approval APIs activate a draft Template and schedule a draft Run at
  `/api/admin/events/templates/:templateId/approve` and
  `/api/admin/events/runs/:runId/approve`.
- Quick Match offering API foundation: Platform Admin can create and list
  `QuickMatchOffering` records at `/api/admin/quick-match-offerings`. New
  offerings reference an active Game, canonicalize its configured mode/map,
  require complete-team capacity, use integer minor-unit fee/prize fields, and
  write staff activity. This is additive; legacy Tournament matchmaking still
  owns live queue, Room, and Match creation until the documented migration.
- Quick Match execution compatibility foundation: new full-room executions can
  create `Room` and `Match` records directly from an active
  `QuickMatchOffering`, using the canonical Game Object ID/key rather than
  legacy Tournament/TournamentType references or the BGMI/CoC Match enum.
  Legacy records and routes remain readable. Separate partial unique indexes
  protect active membership for legacy and offering queues; startup detects and
  safely rebuilds the previous legacy index shape before HTTP traffic starts.
  Match Operator scope queries recognize either the legacy game snapshot or
  the new canonical game key.
- Platform Admin now has a dedicated Quick Matches workspace in `/panelAdmin`.
  It uses Redux thunks/selectors (not component-level API calls) to list,
  create, edit, activate, pause, reactivate, and retire offerings. The form
  presents only active Games and their configured mode/map capabilities.
- Role Management staff directory now filters by person/email and role; Game
  Catalog returns and displays named active Game Manager owners and filters
  games by ownership state.
- Centralized route mount policy in backend `index.js` for authenticated,
  staff, public callback, catalog, tournament, and CoC integration surfaces.
- Frontend build plus route/API-error smoke checks pass. Backend authentication,
  social, competition, and realtime suites pass at the latest recorded check.
  Frontend lint is clean and is recorded in the audit snapshot.

## Active Work

### 1. Staff Hiring and Access Control

Owner: Super Admin and Platform Admin govern all staff assignments and hiring.

Completed: StaffRecommendation records and server-owned hiring policy now
support exact-email candidate lookup, lower-role recommendations,
higher-authority review, approval-created assignments, rejection notes,
withdrawal, expiry, and append-only access history. The reusable workspace is
available at `/staff/access-control` and inside the admin panel. Activity
queries preserve both visibility and person filters, while the open-request
key prevents duplicate pending or processing recommendations.

### 2. Game Creation

Owner: Platform Admin owns initial definition and publication. Game Managers
receive optional game scope afterward for operational supervision.

Required flow:

1. Platform Admin configures identity, supported modes, optional maps, and
   player account policy in one creation workspace.
2. Platform Admin either saves an incomplete/private draft or creates the game
   directly as active when the server readiness checks pass.
3. Active games become eligible for Events and Quick Matches immediately; a
   Game Manager assignment is not a publication dependency.
4. Platform Admin may assign one or more Game Managers after the Game record
   exists. They supervise assigned room health, operator workload, and Event
   readiness only; they cannot mutate games, staff roles, templates, Events,
   or player financial data.
5. Platform Admin can edit any catalog configuration, publish ready drafts,
   archive active games, and return archived games to draft for rework.

Current API routes:

- `POST /api/admin/game-catalog`
- `GET /api/admin/game-catalog`
- `GET /api/admin/game-catalog/activity`
- `PATCH /api/admin/game-catalog/:gameId`
- `GET /api/staff/games`
- `GET /api/staff/games/activity`
- `GET /api/staff/games/operations`

Retired API routes:

- `PATCH /api/staff/games/:gameId` is removed. Game Managers cannot modify
  game configuration through any route.

Migration note:

- The Game Manager catalog/activity reads still exist. Decide whether the
  operations endpoint will absorb their required ownership/history data, then
  migrate the frontend and retire redundant reads deliberately.

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
  and maintained only by Platform Admin. A mode or map referenced by a draft or active
  Event Template cannot be removed until that template is updated or archived.
- Account connection: `accountConnection.method`, `integrationKey`,
  `instructions`, and `supportsStatsSync`. Direct API verification is allowed
  only for server-implemented integrations; `supercell_coc` is valid only for
  the `coc` game key. Platform Admin exclusively owns method, integration,
  instructions, and stats-sync.
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
- Platform Admin Event approval UI for the existing draft Template/Run approval
  endpoints, including rejection reason and audit history. The backend approval
  endpoints are complete; this visible review workspace is still required.
- Event rejection/return-for-changes transitions and Event Manager editing of
  unapproved drafts. Do not let Event Managers alter approved or scheduled work.
- Move Socket.IO staff/role restoration from coarse user classification to
  `StaffAssignment` checks.

### 4. Quick Match Offering Migration

Owner: Platform Admin configures offerings; Match Operator executes assigned
matches; Game Manager supervises assigned-game health.

Completed foundation: `QuickMatchOffering` is a Game-backed, Platform
Admin-only API resource with a Redux-backed `/panelAdmin` workspace. Its
current endpoints are:

- `GET /api/admin/quick-match-offerings?status=&limit=`
- `POST /api/admin/quick-match-offerings`
- `PATCH /api/admin/quick-match-offerings/:offeringId`

The create boundary accepts only active catalog Games, resolves configured mode
and optional map to the canonical Game capability, rejects incomplete team
capacity, and stores `entryFeeMinor`/`prizePoolMinor` with an explicit
currency. New records may be `draft` or `active`; creation is written to the
staff activity ledger. No player queue or wallet movement uses this resource
yet.

Lifecycle policy: `draft -> active -> paused -> active` and any non-retired
state may transition to `retired`; retired offerings are immutable. An active
offering must be paused before its competition configuration can change, which
prevents a live queue definition from being silently altered. Every update and
lifecycle transition is recorded in staff activity.

Security rules:

- The `/api/admin/*` mount requires active Platform Admin or Super Admin
  authorization; no client-supplied staff role is trusted.
- Offering money-like configuration uses minor units only. It does not grant
  authority to charge a player or settle a prize; ledger and payment controls
  remain a separate required gate.
- Existing Tournament/TournamentType routes and records remain compatible and
  operational until Match, Room, frontend, and stored data migrations are
  verified with a rollback plan.

Compatibility migration and rollback plan:

1. Deploy the additive Match/Room schema and indexes first. Existing legacy
   Matchmaking reads/writes remain untouched; startup rebuilds only the named
   legacy membership index if it lacks the required `tournamentTypeId` filter.
2. Internal execution creation accepts a stable execution key, an active
   offering, and an exactly full roster. It creates a full Room plus one
   idempotent Match without a legacy Tournament record. No player-facing route
   calls this boundary yet.
3. After payment holds, queue eligibility, and player discovery are complete,
   direct only new offering queues to this execution boundary. Keep legacy
   reads and routes until stored-data/client migration evidence is complete.
4. Roll back by disabling the new queue caller; the additive fields do not
   alter legacy records, and legacy matchmaking continues to use its original
   Tournament/TournamentType path. Do not drop new fields or indexes until all
   executions that reference them have aged out or been migrated.

Validation: model, lifecycle, source-isolation, operator-scope, and index-shape
policy tests cover this boundary. Database-backed migration rehearsal remains
required before production rollout.

Next work: harden payment callbacks and disable the withdrawal success stub,
then implement player discovery/queue joins only after money holds are safe.

Player discovery foundation: verified players can read active Game-backed
offerings at `GET /api/quick-matches`. The server returns canonical offering
details and eligibility explanations, including missing game-account
verification and the current `payment_holds_not_available` join block. This
endpoint is discovery-only; it exposes no queue/join command until the ledger
and atomic payment-hold boundary are complete.

### 5. Payment Callback Safety (In progress)

The public PhonePe callback no longer starts delayed status polling in the web
process or credits a wallet directly. It retains the bounded raw request body,
requires the PhonePe SDK callback signature, and queues a durable
`PaymentReconciliationJob` for the matching unique merchant transaction ID.
It fails closed with `PAYMENT_CALLBACK_NOT_CONFIGURED` until the deployment
sets `PHONEPE_CALLBACK_USERNAME` and `PHONEPE_CALLBACK_PASSWORD` alongside
the existing PhonePe client credentials. `/api/payment/withdraw` now returns
`WITHDRAWAL_NOT_IMPLEMENTED` (HTTP 501), not false success.

`npm run worker:payments` is the separately deployed reconciliation process. It
claims queued or stale jobs atomically, verifies provider status, records
bounded retry state, and settles only through the existing MongoDB transaction.
Do not enable production deposits yet: configure and deploy this worker with
the callback credentials, then obtain PhonePe sandbox callback/retry evidence;
the immutable minor-unit ledger and payout lifecycle are still required.

### 6. Realtime Staff Scope Restoration (Completed 2026-08-08)

Socket.IO no longer treats `User.role` as operational authority. On each
connection it loads active `StaffAssignment` records, resolves Match Operator
Game scopes to canonical game keys, and restores only participant rooms plus
explicitly assigned, scope-authorized Match rooms. Unscoped Match Operators
fail closed. The former global `role:operators` broadcast path is no longer
used for assignment notifications, avoiding cross-game disclosure; unassigned
work remains available through the already scoped HTTP operator queue.

## Required Future Flows

### Delivery Phases and Exit Gates

Work in this order. A later phase may be designed early, but it must not be
treated as production-ready while an earlier dependency is open.

#### Phase 0: Restore Engineering Baseline

- Completed 2026-08-08: frontend lint passes with zero warnings/errors; the
  unused password-reset action and sensitive submitted-email console logging
  were removed.
- Completed 2026-08-08: backend `npm test` runs the maintained auth, social,
  competition, and realtime suites as one aggregate command.
- Completed 2026-08-08: frontend and backend GitHub Actions workflows enforce
  lint/build/smoke and aggregate-test checks respectively, plus
  `git diff --check`.
- Remove sensitive/debug console output and document environment validation.

Exit gate: a clean checkout has one reliable command per repository that fails
when a maintained quality check fails.

#### Phase 1: Authorization and Money Safety

- Completed 2026-08-08: Match Operator game scope, queue visibility, match
  ownership, state-transition enforcement, and generated-match uniqueness.
- Completed 2026-08-08: two-person Event review governance, immutable review
  history, revision lifecycle, scoped dashboard draft/submit/feedback workflow,
  and Game Manager operational dashboard recovery.
- Move payment callbacks to signed, idempotent, durable reconciliation and
  disable the fake withdrawal success path.
- Resolve staff Socket.IO identity from active assignments rather than
  `User.role`.

Exit gate: role/scope denial, self-approval, duplicate callback, duplicate
match generation, and concurrent transition tests all pass.

#### Phase 2: Canonical Competition Domain

- Introduce Game-backed `QuickMatchOffering` and remove legacy Tournament
  dependencies from new Match and Room records.
- Implement Event registration, stages, batches, results, leaderboard, and
  disputes as separate bounded records.
- Publish a migration and rollback plan before removing compatibility fields,
  collections, or routes.

Exit gate: a newly cataloged game can configure, publish, join, operate, and
complete a Quick Match without a hardcoded enum or legacy Tournament record.

#### Phase 3: Staff and Player Workflows

- Build simple role-first Role Management and game-health Game Management.
- Complete Event review, Event Manager, Game Manager, and Match Operator
  dashboards against the safe Phase 1 and Phase 2 APIs.
- Migrate feature-page requests to Redux Toolkit boundaries and add responsive
  browser tests for each critical workflow.

Exit gate: every role can finish its responsibility end to end, cannot see or
invoke out-of-scope actions, and receives clear loading, empty, error, and
recovery states.

#### Phase 4: Scale and Production Operations

- Add cursor pagination, durable background jobs, Redis-backed rate limits and
  cache invalidation, structured logs, metrics, alerts, backup restore drills,
  and load/failure tests.
- Define measurable SLOs for auth, queue join, room creation, realtime update,
  Event registration, and payment reconciliation.

Exit gate: target concurrency and failure scenarios are measured in a staging
environment, alerts are actionable, and recovery procedures are rehearsed.

#### Phase 5: Service Extraction Decision

- Keep the modular monolith unless measured scaling, release isolation, data
  ownership, or security boundaries justify extraction.
- First candidates are realtime, payment/ledger, competition jobs, and staff
  identity, but each needs an owned datastore/API contract, idempotency,
  observability, and rollback plan before separation.

Exit gate: extraction is supported by measured need and a migration design,
not only by anticipated user growth.

### Staff Experience and Competition Operations Roadmap

Status: Planned. These are approved product goals, not implemented authority.
Any implementation must preserve the existing rule that Platform Admin owns
platform configuration and approval, while operational roles work only inside
server-validated scopes.

#### 1. Simple Admin Experience

Owner: Platform Admin and Super Admin.

Goal: replace dense administration screens with a clean control-room layout
that answers three questions quickly: who owns work, what requires approval,
and what needs attention.

- Role Management: role-first directory, person search, game-scope filters,
  staff profile drawer, active/suspended/revoked status filters, current
  workload, service history, and clear assignment/revocation confirmation.
- Game Management: game health board with lifecycle, named Game Manager
  ownership, configuration readiness, upcoming Event impact, active room
  counts, and a deliberate change history.
- Platform Admin Event review: a dedicated approval queue for draft Templates
  and Event Runs, with approve, reject, return-for-changes, reviewer note,
  before/after values, and an immutable audit record.
- Design rule: use progressive disclosure. Overview cards lead to details;
  dangerous actions require a focused confirmation instead of exposing every
  configuration control in one large form.

Completion criteria:

- Every dashboard is responsive for desktop, tablet, and mobile.
- Every role-specific screen states what the user can do and what requires
  Platform Admin approval in plain language.
- Ownership, approval state, and operational attention are visible without
  opening a record.

#### 2. Event Management Lifecycle

Owner: Event Manager prepares work; Platform Admin approves and publishes.

Required flow:

1. Event Manager selects an active game inside their `gameScopes`, then creates
   a draft Event Template using only approved game capabilities.
2. Platform Admin reviews the proposal, approves it to `active`, rejects it,
   or returns it for changes. Rejection and returned drafts remain auditable.
3. Event Manager creates a dated draft Event Run from an approved Template.
4. Platform Admin validates timing, capacity, rules, and operational coverage,
   then schedules the Event Run.
5. Game Manager monitors readiness; Match Operators execute generated rooms;
   players see only approved, published registration windows.

Future data model additions:

- `EventReview`: proposal revision, decision, reviewer, note, timestamps, and
  immutable before/after snapshot.
- Event registration, participant eligibility, capacity/batch plan, stage,
  leaderboard, result, and dispute records. Do not overload `EventRun` with
  all of these responsibilities.
- Scheduled background jobs for opening/closing registration, creating stages,
  sending notifications, and escalating delayed operations.

#### 3. Tournament and Quick Match Management

Owner: Platform Admin configures offerings; Event Manager proposes scheduled
Events; Game Manager supervises readiness; Match Operator executes rooms.

- Retire ambiguous legacy Tournament/TournamentType vocabulary in favor of
  explicit `QuickMatchOffering`, `EventTemplate`, `EventRun`, `Match`, and
  `Room` boundaries.
- Quick Match Offering: game, mode, map, team size, capacity, region, entry
  policy, schedule policy, and operator coverage requirement. Only Platform
  Admin may activate, pause, or retire it.
- Event format: support daily/weekly/monthly recurrence, registration windows,
  batches, eliminations, seeding, standings, prizes, results, and disputes.
- Each state transition must be idempotent, audited, and guarded against
  duplicate jobs or concurrent operator actions.

#### 4. Scoped Operational Dashboards

Game Manager dashboard (`/staff/games`):

- Scope: assigned `gameScopes` only; read-only supervision.
- Shows room pipeline, waiting/active/disputed rooms, operator workload,
  Event readiness, delayed work, and escalation history.
- Cannot modify games, staff assignments, Templates, Event Runs, wallet data,
  or player identities.

Event Manager dashboard (`/staff/events`):

- Scope: assigned `gameScopes` only.
- Creates and edits only unapproved drafts in scope; views review status and
  reviewer feedback; never directly publishes a Template or schedules a Run.
- Shows proposal checklist, upcoming approved work, capacity/batch planning,
  and handoff status to Game Manager operations.

Match Operator dashboard (`/dashboard/operations`):

- Scope: active Match Operator `gameScopes` plus explicit match assignment.
  Unassigned work is visible and claimable only for assigned games.
- Existing Match Operator assignments without a game scope fail closed. A
  Platform Admin must add at least one game in Role Management before that
  operator can reopen the console.
- Shows only assigned rooms, check-in health, lobby publication, evidence,
  results, disputes, handoff notes, and shift workload. It never exposes game
  setup, Event approval, staff directory, or financial controls.

Security rule for all three dashboards:

- The frontend hides irrelevant navigation, but every API repeats role, active
  assignment, game scope, and record ownership checks on the server.
- Realtime events are filtered by the same scope before delivery; websocket
  presence is not authorization.

#### 5. Operational Reliability and Scale

- Add optimistic concurrency/version fields to configuration, Event review,
  and room-operation mutations so one staff member cannot silently overwrite
  another's newer work.
- Add structured audit events for approvals, room handoffs, delayed work,
  operator changes, result verification, and disputes.
- Add Redis-backed dashboard summaries with targeted invalidation and Socket.IO
  updates for online scoped staff; database remains the source of truth.
- Introduce workload thresholds, SLA timers, escalation rules, alerting, and
  staffing coverage reports before running high-volume competitions.
- Build test matrices for role/scope denial, lifecycle transitions, concurrent
  approvals, duplicate queue joins, restart recovery, and websocket filtering.

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

## Latest Verification

Run on 2026-08-08 against the current dirty working trees:

- Backend `npm test`: 86 passed, 0 failed (16 auth, 21 social, 40 competition,
  and 9 realtime tests).
- Frontend route smoke and API-error smoke checks: passed.
- Frontend production build: passed.
- Frontend `src/pages/Operations.jsx` focused ESLint check: passed.
- Frontend lint: passed with zero warnings/errors after PropTypes and unused
  import/variable cleanup, removal of sensitive password-reset console logging,
  and route-registry export cleanup.
- GitHub Actions CI workflows were added to both repositories. They are ready
  to run on pushes and pull requests, but have not yet been host-verified
  because the changes are not pushed.

Not run or not currently available: browser end-to-end tests, payment-provider
sandbox certification, database-backed integration tests, dependency/security
scanner, accessibility audit, load test, backup restore drill, and production
penetration test.

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
