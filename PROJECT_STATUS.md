# Project Status

Last updated: 2026-08-11

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
- Staff may open the player dashboard only as a read-only utility for platform
  visibility. Staff accounts cannot join, register, check in, submit player
  results/disputes, use social/team/clan participation, or initiate player
  money actions.
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
- Staff player-dashboard access is read-only; only `User.role = player` may
  execute player participation commands.

### Fast Completion Critical Path

Planning baseline recorded 2026-08-09: approximately **58% of the complete
documented platform roadmap is implemented**, approximately 70-75% of the core
playable system exists, and only approximately 35-40% is ready for unrestricted
production real-money traffic. These percentages are planning estimates, not
completion evidence; a feature moves to Completed only when its stated tests
and exit gate pass.

The goal is to reach 100% in the following strict order without opening new
product domains or spending critical-path time on visual polish:

1. **58% -> 65%: finish paid Quick Match safety.**
   - Completed 2026-08-09: add protected cursor-paginated immutable ledger
     history.
   - Completed 2026-08-10: reviewed prize release with independent governance
     approval, participant-conflict denial, and atomic ledger movement.
   - Complete withdrawal/payout behavior.
   - Prove paid solo and Team journeys with concurrent database tests and a
     multi-user browser workflow, then deliberately enable paid discovery.
2. **65% -> 75%: finish the canonical competition migration.**
   - Migrate remaining legacy host/detail/data paths to Game-backed
     `QuickMatchOffering`, Match, and Room boundaries.
   - Rehearse stored-data migration and rollback, then retire legacy
     Tournament/TournamentType routes only when no active client depends on
     them.
3. **75% -> 85%: deliver the Event MVP end to end.**
   - Registration window and admission policy, capacity/waitlist, stages,
     rounds/batches, verified results, advancement, leaderboard, disputes,
     settlement, notifications, and restart-safe jobs.
4. **85% -> 93%: finish role-specific staff workflows.**
   - Complete Platform Admin Event review, Event Manager handoff, Game Manager
     health/escalation, Match Operator workload/handoff, staff profiles, and
     security-event review with responsive browser checks.
5. **93% -> 100%: production operations and final system audit.**
   - Distributed rate limits, pagination of remaining unbounded reads,
     structured logs/metrics/alerts, background-job operations, accessibility,
     authorization matrix, dependency/security review, load/failure testing,
     backup restore, incident procedure, and requirement-by-requirement final
     audit across both repositories.

Acceleration rules:

- Work on one highest-priority incomplete vertical slice at a time. Do not
  interrupt it for P2 polish unless the user explicitly changes priority.
- The planned Tournament card redesign remains deferred until the paid money
  and canonical migration gates are complete.
- Run focused tests while developing; run aggregate backend tests and frontend
  test/lint/build once after the complete slice is stable, not after every
  small edit.
- Run CPU-heavy aggregate gates sequentially on the shared development machine;
  use parallel agents for independent inspection and implementation work.
- Reuse shared fixtures, service boundaries, Redux thunks, and migration
  scripts instead of building page-specific shortcuts.
- Record one concise checkpoint after verification. Keep historical evidence,
  but do not duplicate the same current-state explanation across multiple
  roadmap sections.
- Keep `CURRENT_CHECKPOINT.md` as the replace-in-place fast-resume index. The
  full tracker remains authoritative; use the checkpoint on subsequent turns
  in one uninterrupted session and require a full tracker read on new
  sessions, handoffs, context loss, or contract-changing work.
- External provider or deployment evidence must not block unrelated local
  work. Record the external gate and continue with the next independently
  verifiable slice.
- Speed never permits bypassing authorization, transactionality, idempotency,
  migration rollback, or the real-money release gates.

### Ordered Next Work Queue


1. Completed locally 2026-08-09: activate and integration-test transactional
   account email.
   - Completed locally 2026-08-09: `RESEND_API_KEY` and the explicit
     non-production `onboarding@resend.dev` sender are stored only in the
     ignored backend `.env`; the application email-service wrapper received a
     Resend delivery ID and the account owner confirmed receipt.
   - Verify a dedicated account-email subdomain and set `RESEND_FROM_EMAIL`
     before arbitrary-recipient or production delivery.
   - Database-backed replica-set tests cover signup OTP promotion, resend
     cooldown, expired/incorrect codes, reset-link expiry, concurrent recovery
     requests, and single use. An isolated browser workflow against the real
     Redux thunks and backend routes completed signup, OTP verification,
     reset-link request, and password replacement.
   - The verified sender domain, staging delivery/failure monitoring, and
     bounce handling remain production release gates; they do not block the
     next local product slice.

2. Replace the legacy competition core.
   - Completed player-discovery slice 2026-08-09: the protected Tournaments
     page now reads active Game-backed `QuickMatchOffering` records through a
     dedicated Redux lifecycle and shows canonical capability, seat, money,
     schedule, and eligibility data. It never falls back to the legacy queue.
   - Completed free-entry queue slice 2026-08-09: verified eligible players
     join through `POST /api/player/quick-matches/:offeringId/queue`; Redis
     serialization, database uniqueness, optimistic capacity checks, and
     idempotent execution creation converge a full queue on one canonical
     Room and Match. Paid offerings still fail closed at discovery until the
     remaining ledger, prize-release, and browser gates pass.
   - Completed Team/player-read slice 2026-08-09: new clan Teams resolve an
     active catalog Game, canonical mode, immutable game key, and explicit
     roster size; a dry-run/apply migration covers legacy Team records. Player
     queue, Match timeline, detail, check-in, result, and dispute requests now
     use a Redux boundary and canonical player-safe Match serialization.
   - Completed Match execution slice 2026-08-09: two scoped operators racing
     to claim one canonical Match converge on one owner; lobby publication and
     player check-ins converge on `lobby_ready`; result submission is
     first-writer-wins; verification opens a 30-minute dispute window; and a
     different governance actor resolves disputes before settlement. Match
     Control now uses Redux thunks/selectors and displays submitted evidence,
     dispute deadlines, notes, and resolutions.
   - Introduce `QuickMatchOffering` and migrate Match/Room references away
     from `Tournament` and `TournamentType`.
   - Remove hardcoded BGMI/CoC enums from runtime competition records; use the
     immutable Game key or Game Object ID under server validation.
   - Retire compatibility routes only after frontend and stored data migrate.

3. Harden payments before enabling real-money production traffic.
   - Verify signed provider callbacks, enqueue status reconciliation in a
     durable worker, add a unique merchant transaction key, and use integer
     minor units or a decimal money type.
   - Replace the withdrawal success stub with a reviewed lifecycle or return a
     clear not-implemented response until that lifecycle exists.

4. Redesign staff workspaces as role-specific control rooms.
   - Establish the shared workspace shell: clear role context, scoped work
     summary, attention queue, recent activity, and explicit player return.
   - Complete Platform Admin Event review UI, then reshape Game Manager and
     Match Operator screens around their existing scoped APIs and Redux data.
   - Keep Role Management and Game Management as governance workspaces, not
     operational dashboards.

5. Establish the production baseline, then consider service extraction.
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
2. Completed in code 2026-08-09: signup creates only a
   `PendingRegistration`; a Resend-delivered email OTP, bounded verification
   attempts, resend cooldown, and transactional promotion create the verified
   player account. Live provider delivery still requires environment setup and
   integration evidence before real-money participation is available.
3. Login restores the protected player shell at `/dashboard`; session refresh,
   logout, banned-account handling, and account recovery remain server-owned.
4. Player completes profile, game-account connection where a Game requires it,
   and any required age/identity verification. Eligibility must be returned by
   the API; the frontend only explains what is missing.

Exit: an eligible verified player can securely reach the dashboard, while an
ineligible or unverified player receives a clear recovery path and cannot join
restricted competitions.

#### 2. Canonical Game and Quick Match Foundation

1. Completed in code: Platform Admin creates and activates a Game with its immutable key,
   supported modes/maps, and account-connection policy.
2. Completed in code: `QuickMatchOffering` is the canonical configurable product:
   Game, supported mode/map, team size, capacity, region, entry policy,
   schedule policy, and lifecycle (`draft`, `active`, `paused`, `retired`).
3. Completed for new Quick Match runtime records: Match and Room reference `QuickMatchOffering` and the
   Game-backed capability values. New runtime competition records must not use
   hardcoded BGMI/CoC or legacy Tournament enums.
4. Publish data migration, compatibility, rollback, and test plans; migrate
   frontend reads/writes before retiring Tournament/TournamentType routes or
   stored references.

Exit: a Platform Admin can publish an offering for any cataloged active game
and an eligible player can enter its queue without a legacy Tournament record.

#### 3. Player Competition Journey

1. Completed in code 2026-08-09: Dashboard shows active Game-backed offerings
   with eligibility, capacity, price/prize and schedule disclosure, dynamic
   filters, and clear loading, empty, and error states through Redux
   thunks/selectors. Eligible free offerings expose the canonical join action.
2. Completed for free entry 2026-08-09: the player joins a Quick Match queue;
   the server performs identity, capacity, and duplicate-entry checks inside a
   serialized command. Paid entry remains hidden pending the complete money
   lifecycle release gate.
3. Completed through operator handoff 2026-08-09: when capacity is reached,
   the system creates one canonical Match/Room and places the Match in the
   game-scoped `awaiting_operator` queue. Socket events notify players but
   never authorize a join or state change.
4. Completed locally 2026-08-09: player check-in, lobby access, match state,
   first-writer-wins result submission, verification, and a time-bound dispute
   path use server-owned state transitions. Settlement is blocked while the
   30-minute dispute window is open or while a dispute is unresolved.

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
| Closed | Match operations | Match Operator assignments require game scopes; operational reads and claims are scoped; post-claim mutations require ownership; readiness, result, verification, dispute, resolution, and settlement use conditional writes. Governance roles cannot execute operator commands, while dispute resolution/settlement remain governance-only. | Verified by policy tests, a full MongoDB concurrency lifecycle, Redux transport tests, and an isolated scoped-operator browser check on 2026-08-09. |
| Closed | Event approval | Event Templates and Runs use submitted revisions, reviewer notes, return/reject states, independent reviewer checks, bounded queue/history reads, append-only review evidence, and a Platform Admin Redux review queue. | Verified by Event governance policy tests and frontend route/build checks on 2026-08-08. |
| P0 | Competition data | Game-backed offering administration, player discovery, free and transactionally held paid queueing, canonical Team creation, Room/Match handoff, protected player Match reads, and the complete operator/result/dispute lifecycle avoid legacy Tournament records and hardcoded game enums. Paid discovery, legacy host/detail aliases, and old stored competition records remain. | Finish the paid-entry release gates, then migrate remaining host/data paths with rollback evidence before retiring aliases. |
| P0 | Payment safety | Callbacks fail closed unless PhonePe SDK signature credentials are configured, capture the signed raw body, enqueue a durable reconciliation record, and merchant transaction IDs are unique. The standalone `worker:payments` claims/retries/verifies jobs and settles idempotently. Withdrawal explicitly returns not-implemented. The immutable integer/decimal ledger, worker deployment/sandbox evidence, and reviewed payout lifecycle remain incomplete, so deposits must not be treated as production-ready. | Deploy and monitor the worker, complete provider sandbox callback/retry verification, introduce the immutable minor-unit ledger, and implement the reviewed withdrawal lifecycle. |
| Closed | Realtime staff access | Socket connection now resolves active StaffAssignments and Game scopes at connection time. Match Operator subscriptions require assigned-game scope plus explicit ownership; the broad operator room was removed from authorization-sensitive delivery. | Verified by realtime staff-context and fail-closed scope tests on 2026-08-08. |
| P1 | Transactional account email | Resend-backed verification and password recovery are implemented behind a server service. Local environment-only credentials, live authorized-recipient delivery, database transaction tests, and an isolated real-route browser workflow are verified. A dedicated sender domain and operational delivery evidence remain open. | Verify a dedicated account-email domain for broader delivery, then certify staging delivery, failure, and bounce monitoring without storing secrets in the repository. |
| P1 | Distributed security | Express rate limiters use process memory, so limits reset on restart and are not shared by multiple server instances. Governance actions lack MFA/recent-auth controls. | Redis-backed rate-limit store, endpoint-specific keys/alerts, and MFA or recent-auth for staff and financial actions. |
| P1 | Frontend boundaries | Multiple feature pages call the Axios client directly despite the documented Redux boundary. Identity verification and recovery now use Redux thunks, but other domains remain. | Migrate one domain at a time to shared thunks/selectors and add component/integration tests. |
| P1 | API scale | Event, operator, social, and several administrative list reads can return unbounded collections; compatibility endpoints duplicate behavior. | Cursor pagination with bounded limits and stable sorting; record endpoint deprecation dates and remove aliases after client migration. |
| P1 | Financial model | Wallet embeds transaction summaries while Transaction is also stored separately, and money uses JavaScript Number values. The two representations can drift and arrays can grow without bound. | Adopt an immutable ledger as source of truth, minor-unit/decimal amounts, paginated projections, and reconciliation jobs. |
| P2 | Operations | Logging is console-based; no structured request tracing, metrics, alerting, job queue, backup verification, or disaster-recovery evidence was found. | Define SLOs, correlation IDs, redaction, metrics/alerts, durable jobs, backup restore drills, and failure runbooks. |
| P2 | Frontend quality | Frontend lint is clean, but there is no automated component test suite and the largest route chunks include Clan, Game Catalog, Role Management, and Operations. | Add tests for critical flows and split large pages by feature boundary without changing behavior. |

### Documentation Drift Found

- `GET /api/staff/games` and `GET /api/staff/games/activity` still exist as
  Game Manager catalog/activity reads. Only the former manager PATCH route is
  retired; the operational summary endpoint does not yet replace both reads.
- The frontend architecture says feature components use Redux thunks, but
  direct API calls remain in parts of Clan, game-account, wallet, and profile
  pages. Match Control has moved to the Redux boundary; treat the broader
  migration as in progress.
- The backend default `npm test` now runs the maintained auth, social,
  competition, and realtime suites. CI is still required to enforce it on
  every change.
- Identity now has database-backed integration coverage and an isolated manual
  browser workflow. Automated browser end-to-end coverage, payment-provider
  sandbox certification, broader domain database integration, a complete staff
  authorization matrix, and concurrent Event workflows remain open. Operator
  concurrency now has database-backed lifecycle coverage.

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
| Staff | `User.role = staff` plus active StaffAssignment | Operational identity with one or more staff responsibilities. Player-dashboard access is a read-only visibility utility and never grants competition participation. |

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
- Player participation commands require `User.role = player` in addition to
  normal authentication, verification, eligibility, and ownership checks.
  Active StaffAssignments never grant player participation.
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
| Staff with any assignment | `/staff` | Role switcher. Shows one workspace card per active assignment and an explicit read-only player-dashboard utility link. Staff cannot participate from that dashboard. |
| Staff access participant | `/staff/access-control` | Search candidates by email, recommend permitted roles, review subordinate recommendations, inspect assignments and history. Backend policy decides available actions. |
| Super Admin | `/panelAdmin` | Platform administration and governance controls. |
| Platform Admin | `/panelAdmin` | Staff management, game catalog, verification, finance, and platform oversight. |
| Game Manager | `/staff/games` | Scoped operational overview: room health, operator workload, and Event readiness. No mutation controls. |
| Event Manager | `/staff/events` | Creates scoped draft template and Event Run proposals. Platform Admin approval is required for activation/scheduling. |
| Match Operator | `/staff/operations` | Assigned-match operational console. |

Frontend route guards improve navigation only. Backend route middleware and
service-level scope checks are the final authority for all privileged actions.
Player-facing read routes may support staff visibility where their serializer
is safe, but every player participation mutation must fail server-side for a
staff-classified account and the frontend must present it as view-only.

## Completed

- Staff player-dashboard visibility is now a verified read-only utility. One
  shared backend participation policy rejects staff competition, social,
  game-account, profile, and money mutations with the stable
  `PLAYER_PARTICIPATION_REQUIRED` 403 contract, including direct HTTP calls.
  Safe player reads remain available with explicit staff read-only UI state;
  staff operational controls remain in assigned `/staff/*` workspaces.
- Canonical Quick Match execution financial terms are immutable and
  server-owned. Match creation snapshots versioned INR currency, entry policy,
  per-seat fee, prize pool, capture time, and offering provenance; settlement
  and cancellation explicitly validate that evidence plus every participant's
  exact hold and original append-only hold ledger posting. Mutable offering
  values are never reloaded for settlement. Missing, corrupt, or mismatched
  evidence fails closed with complete transactional rollback, and shared
  offering locking blocks repricing or retirement while a queue is active.
- Reviewed withdrawal lifecycle is locally complete. Verified players use
  server-owned immutable payout destinations; requests atomically move exact
  ledger-derived funds from withdrawable to withdrawal-pending. Governance
  uses expiring claims and audited approve/reject decisions; rejection or
  terminal provider failure releases once, while authenticated provider
  reconciliation finalizes paid funds once. Provider submission identity and
  payout references are durable and idempotent. Runtime requests remain
  deliberately unavailable until a real payout adapter and deployed worker
  are configured and sandbox-certified.
- Paid Quick Match Solo and complete-Team journeys are proven locally through
  real HTTP sessions, persisted player and StaffAssignment identities, browser
  role workflows, and exact ledger/database evidence. A shared server-owned
  paid-entry capability now protects both discovery and the queue command;
  default runtime direct POST attempts return 503 before any Room, Match, hold,
  or ledger write. The proof-only harness injects capability explicitly and
  cannot enable production. Production paid entry remains disabled because
  deposit and payout provider deployment/sandbox gates are still red.
- Legacy active competition migration is complete locally. Active frontend
  discovery/detail/join/host paths now use canonical Game-backed
  QuickMatchOffering APIs and Redux; Approved Hosts create audited drafts only
  and cannot publish. The old queue mutation returns zero-write 410 while
  historical reads remain temporarily available. A reviewed-hash migration
  supports dry-run/apply/no-op/rollback/reapply, source/target evidence,
  dependency-safe refusal, Redis restoration, canonical seed data, and
  unresolved fail-closed reporting. No legacy route/model is removed while a
  deliberate historical compatibility read remains.

- Secure cookie-based authentication with short-lived access tokens, refresh
  rotation, Redis-backed session validation, session versioning, and logout
  revocation.
- Player identity email flow: signup creates a pending registration and asks
  the backend Resend service to deliver a 6-digit OTP. Codes are HMAC-hashed,
  expire after 10 minutes, allow five failed attempts, and have a 60-second
  resend cooldown. Successful verification transactionally promotes the
  pending record to a verified `User` without creating a login session.
- Password recovery uses a non-enumerating request response and a Resend email
  containing a 30-minute, HMAC-hashed, single-use reset credential. Successful
  reset changes the password, increments `authVersion`, consumes the token, and
  revokes the current Redis session. Signup verification and recovery UI use
  Redux Toolkit thunks rather than component-level API calls.
- Recovery issuance has a 60-second atomic per-account cooldown. Concurrent
  requests converge on one stored credential and send only one currently valid
  link instead of emailing a link that a racing write immediately invalidates.
- Signup and recovery use native React-managed forms. Signup is intentionally
  excluded from the whole-app loading overlay so its pending OTP state remains
  mounted while the request completes; the submit button owns its local loading
  state.
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
- Player Tournaments discovery now uses `/api/player/quick-matches` through a
  private Redux lifecycle. It renders only active Game-backed offerings with
  catalog capabilities, fixed seats, minor-unit price/prize disclosure,
  schedule policy, game-account eligibility, and explicit payment/queue
  blockers; it does not send new offering IDs to the legacy join endpoint.
- Match Operator safety boundary: assignments require at least one valid game
  scope; available and assigned match reads are scope-filtered; claim, lobby,
  and lifecycle mutations require server-resolved game scope plus explicit
  ownership. Match stages use `prepare`, `start`, and `verify_result` commands;
  settlement and cancellation are governance-only. Conditional writes reject
  stale transitions, and one unique generated Match is enforced per legacy
  tournament instance with duplicate-key convergence. Existing unscoped Match
  Operator assignments fail closed until Platform Admin adds game scope.
- Match operations now complete the canonical runtime lifecycle: atomic claim,
  prepare/check-in, lobby publication, all-player readiness, start, one accepted
  result under concurrent submissions, operator verification, a bounded
  dispute window, governance-only dispute resolution, and governance-only
  settlement. Lobby and command writes repeat status/version/ownership scope in
  their update predicates, settlement cannot bypass an open dispute window,
  and settled results cannot be disputed. Match Control uses private Redux
  state and exposes result evidence and dispute details without direct Axios
  calls.
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
  write staff activity. Canonical free-entry offerings now own their player
  queue, Room, and Match creation; legacy Tournament matchmaking remains only
  for existing compatibility clients and records.
- Quick Match execution compatibility foundation: new full-room executions can
  create `Room` and `Match` records directly from an active
  `QuickMatchOffering`, using the canonical Game Object ID/key rather than
  legacy Tournament/TournamentType references or the BGMI/CoC Match enum.
  Legacy records and routes remain readable. Separate partial unique indexes
  protect active membership for legacy and offering queues; startup detects and
  safely rebuilds the previous legacy index shape before HTTP traffic starts.
  Match Operator scope queries recognize either the legacy game snapshot or
  the new canonical game key.
- Clan Team creation now resolves the active Game catalog instead of accepting
  a fixed game enum. New records store Game Object ID/key, canonical mode, and
  explicit roster size; legacy request keys remain a temporary alias and the
  dry-run-first `migrate:teams` command backfills compatible stored records.
- Player Match timeline, detail, check-in, result, and dispute requests use a
  dedicated Redux slice. Backend reads are participant-authorized, bounded to
  100 records, use the shared response envelope, prefer canonical Game and
  offering identity, hide unpublished lobby credentials, and omit internal
  execution/legacy source keys.
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

### 0. Transactional Account Email Activation

State: Completed for local development and test on 2026-08-09. The backend
service, endpoints, models, Redux thunks, and public verification/recovery
interfaces are implemented. Environment-only provider delivery, six isolated
MongoDB replica-set integration tests, and the full real-route browser workflow
passed. Production still requires a verified account-email domain in
`RESEND_FROM_EMAIL`, staging delivery/failure evidence, and bounce monitoring.
Those external deployment controls remain a P1 release gate.

### Current Next Slice: Legacy Competition Core Replacement

State: In progress. The durable free-entry Quick Match queue slice was
completed locally on 2026-08-09 across both repositories. It enforces verified
Game identity, exact roster size, duplicate membership, complete-team
capacity, Redis serialization, database uniqueness, optimistic concurrency,
and idempotent full-room Match creation without `Tournament` or
`TournamentType`. A generated Match enters `awaiting_operator`, where the
existing game-scoped operator queue owns assignment. The frontend joins only
through its Redux command boundary and explains server eligibility failures.

Completed next slice 2026-08-09: new Teams persist `gameRef`, `gameKey`,
canonical Game mode, and explicit `teamSize`; no fixed BGMI/CoC enum governs
new Team records. Legacy Team requests resolve through the Game catalog and a
reviewable `npm run migrate:teams -- --apply` command backfills stored records.
Its development dry run found zero candidates and zero unresolved records.
Player Match list/detail and player commands now use Redux, bounded backend
reads, shared envelopes, canonical offering/Game identity, and explicit
serialization that excludes execution and legacy source internals.

Completed next slice 2026-08-09: canonical Match execution is verified from
two-operator claim contention through prepare, lobby/check-in convergence,
start, competing player result submissions, verification, the 30-minute
dispute window, governance resolution, and settlement. Operator routes now
separate strict Match Operator work from governance-only commands. The Match
Control page uses Redux, shows result/dispute evidence, and passed an isolated
scoped-operator browser check; aborted navigation requests stay silent.

Next: paid discovery remains blocked until immutable execution financial-term
snapshots, withdrawal/payout review, and multi-user browser evidence are
complete.
Retain compatibility reads
until frontend and stored-data migration tests pass; do not add new role or
route authority.

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

Completed UI refinement 2026-08-10: `/staff` is now a responsive control-room
landing page containing only trusted assignment-derived workspace cards. The
former username hero, explanation, and summary counters are removed; a plain
`Welcome back` heading remains. Rich role cards retain their role label,
description, responsibility preview, scope, and Open action. Read-only player
pages remain in global navigation and governance access remains inside Admin
Panel. Welcome and workspace content use separate restrained section
boundaries, with one short instruction below the welcome heading. Staff header
branding no longer describes the area as Player Arena. No fabricated
operational metrics or new authority were introduced.

Staff workspace visual rule recorded 2026-08-10: assigned role dashboards use
the same restrained dark surface, rounded bordered header boundary, separate
content sections, and consistent spacing as the `/staff` landing. Game Manager
and Match Control already follow this structure; Event Manager now uses the
same bounded header and page surface. Role-specific controls and information
density remain driven by operational need.

Completed route ownership refinement 2026-08-10: Match Operator live controls
now live at `/staff/operations` under the dedicated Operator authorization
guard and no longer render inside the player `/dashboard` shell. Navigation
and the Match Operator workspace card target the staff-owned route. The former
`/dashboard/operations` URL is compatibility-only and redirects to the new
location; backend operator APIs and authority are unchanged.

Completed navigation separation 2026-08-10: while staff inspect the read-only
player dashboard, its desktop header, sidebar, mobile bar, and mobile menu do
not show Admin or Operations tabs. The Staff Workspace return link remains;
assigned administrative and operational links appear only on staff-owned
surfaces. This changes navigation placement, not server authorization.

Completed directory lifecycle refinement 2026-08-10: the Staff Directory feed
retains active, suspended, and revoked assignment rows. Suspended rows expose
Restore; revoked rows expose Reassign, which uses the governed assignment
endpoint with the durable role identity and prior game scope. Revoked status is
terminal for ordinary status transitions, so it is never treated as a simple
Restore. Reactivation records `STAFF_ROLE_REACTIVATED` while preserving the
earlier revocation and activity history.

Completed Directory density refinement 2026-08-10: Role Management renders
one compact row per current assignment with email/identity, role/status/scope,
and inline actions. Per-person cards are removed; game-scope controls expand
only for the selected row. Header and body rows share a fixed action column so
roles and buttons remain aligned when different roles expose different action
counts. This is presentation-only and does not alter role authority or audit
retention.

Completed governance/workspace separation 2026-08-10: People and Hiring remain
inside the Super Admin/Platform Admin Admin Panel only. The staff-owned access
page exposes Directory, History, and Policy, is guarded by governance admin
assignments, and is no longer linked for Game Manager, Event Manager, or Match
Operator identities. Backend assignment authority remains unchanged and final.

Needs completion:

- Per-person staff profile with assignments, scopes, service history, and
  current workload.
- Security-event review UI.
- Complete the Match Operator workspace beyond its existing live queue and
  controls with handoffs, notes, richer evidence, and SLA metrics.
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
staff activity ledger. Verified players now use this resource for free-entry
discovery and durable queueing. Paid solo and Team queue commands can create
atomic per-player holds internally, but paid discovery remains disabled until
the complete money release gate passes.

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
2. Completed locally 2026-08-09: internal execution creation accepts a stable
   execution key, an active offering, and an exactly full roster. It creates a
   full Room plus one idempotent Match without a legacy Tournament record.
3. Completed for free entry 2026-08-09: the verified player route directs only
   canonical offering joins to this execution boundary. Paid offerings fail
   closed before queue state is created. Keep legacy reads and routes until
   stored-data/client migration evidence is complete.
4. Roll back by disabling the new queue caller; the additive fields do not
   alter legacy records, and legacy matchmaking continues to use its original
   Tournament/TournamentType path. Do not drop new fields or indexes until all
   executions that reference them have aged out or been migrated.

Validation: model, lifecycle, source-isolation, operator-scope, and index-shape
policy tests cover this boundary. A MongoDB replica-set integration suite now
proves concurrent joins converge on one canonical Room and one Match, retries
are idempotent, paid offerings create no queue state, arbitrary Game-backed
Team formats resolve, legacy Teams backfill, and canonical player Match reads
preserve lobby secrecy. A seventh replica-set test proves concurrent operator
claim, readiness convergence, competing result submission, dispute timing,
governance resolution, and settlement. The configured development migration
dry run found no legacy Team candidates. Broader competition-data migration
rehearsal remains required before production rollout.

Next work: paid offerings remain unavailable in discovery until execution-level
financial terms are snapshotted, withdrawal/payout review is complete, and
multi-user browser evidence exists; the existing legacy queue stays available
only for compatibility.

Player discovery and join foundation: verified players read active Game-backed
offerings at `GET /api/player/quick-matches`. The server returns canonical
offering details and eligibility explanations, including missing game-account
verification and paid-entry payment holds. Eligible free offerings can be
joined at `POST /api/player/quick-matches/:offeringId/queue`; team offerings
use compatible saved Teams backed by canonical Game identity, mode, and size.
The application mount was corrected to the documented `/api/player` boundary
on 2026-08-09 after the staff-to-player Tournaments page exposed a 404. A
regression test now covers the full mount, and a signed-in Match Operator was
verified opening the player tournament card without console errors.

Planned player-card refinement (not implemented): redesign the Tournaments
offering card around the new `QuickMatchOffering` plus canonical Game data;
do not restore or read legacy `TournamentType`/`Tournament` presentation data.
The card should recover the stronger visual quality of the earlier design
while keeping the current canonical API boundary:

- Lead with recognizable Game presentation, offering title, and a compact
  lifecycle badge without repeating the Game name unnecessarily.
- Give Entry, Prize, and Seats a clear primary-stat hierarchy.
- Replace the generated sentence `duo · erangal · 2-player team · india` with
  clean human-facing chips or labeled facts such as `Duo`, `Erangel`, and
  `India`. Do not show the awkward `2-player team` phrase; when roster size is
  not already obvious from the mode, present it separately as `Players per
  team: 2`.
- Separate schedule information from eligibility. Show the start rule as a
  concise status row, then place account-verification and paid-entry blockers
  in a dedicated action area with one clear recovery CTA.
- Use the existing frontend Game presentation registry for artwork/accent
  treatment. Do not add visual fields back to the Game or competition models.
- Preserve responsive desktop/mobile layouts, accessible labels, loading,
  empty, disabled, and blocked states. Completion requires focused component
  coverage plus browser verification with solo, duo/team, free, and paid
  offerings.

### 5. Payment Callback Safety (In progress)

#### Paid Quick Match money contract

State: In progress. Owner: verified Player initiates entry;
Payments owns money movement; Match governance releases/captures holds only
through server lifecycle commands.

Implemented foundation 2026-08-09: `WalletLedgerEntry` declares balanced,
append-only, idempotent INR minor-unit postings; Wallet has the five canonical
projection buckets plus ledger initialization/version fields; legacy balances
are lazily captured by an opening entry; and completed PhonePe reconciliation
posts deposits into available funds through the same Mongo transaction. The
Wallet page now loads through Redux, shows settlement buckets, never calls the
provider callback from the browser, and keeps withdrawal visibly disabled
while payout review is incomplete. Atomic solo and Team holds, cancellation
release, final entry capture, verified participant-ID prize allocation into
`prize-pending`, concurrent idempotency evidence, and protected immutable
ledger pagination are complete. Prize release/payout review and a multi-user
browser flow remain, so paid discovery is still blocked.

Paid Quick Match progress 2026-08-09:

- Three wallet-ledger MongoDB replica-set tests pass: one-time legacy opening,
  idempotent deposit/entry-hold postings, and complete insufficient-funds
  rollback.
- `WalletHold` now records one paid seat per player, Room queue entries retain
  their hold IDs, and paid queue membership plus every roster hold execute in
  one Mongo transaction inside the offering lock. Free queue regression tests
  remained green.
- The expanded Quick Match integration suite now passes 8/8 tests. The funded
  paid test initially found that the Match ID was attached only to the final
  player hold when a waiting Room became full; the corrected query now attaches
  the Match to every held record for that Room and the full regression passed.
- Completed after the checkpoint: the suite now passes 12/12 tests. A funded
  Team join holds one seat against every member and fully rolls back when any
  member lacks funds. Concurrent cancellation releases each hold once and
  closes the Room. Concurrent settlement captures each hold once, closes the
  Room, and credits `prize-pending` only to winner IDs selected from Match
  participants. Player result submission now requires a winning player or
  complete winning Team through the Redux boundary.
- Completed after the checkpoint: verified players can read their own immutable
  history at `GET /api/payment/ledger?limit=&cursor=`. The bounded cursor uses
  stable descending `(createdAt, _id)` ordering (default 20, maximum 50), the
  database query requires an owner leg, and serialization returns only safe
  entry metadata plus that player's account legs. It never exposes another
  user, platform balancing legs, idempotency keys, or internal reference IDs.
- The Wallet Redux boundary owns initial load, refresh, pagination, append
  de-duplication, stale-response rejection, and error preservation. The UI
  renders immutable per-account movements with distinct loading, empty, retry,
  refresh, and load-more states; it does not infer a misleading net amount for
  internal transfers.
- Completed 2026-08-10: `GET /api/admin/prize-releases?limit=&cursor=` provides
  a bounded safe review queue, and
  `POST /api/admin/prize-releases/:matchId/release` accepts only Match identity.
  The server derives winners and exact amounts from canonical settled
  `prize_pending` ledger entries, requires a different governance reviewer,
  blocks any reviewer who participated in the Match, rejects unresolved or
  corrupt evidence, and atomically moves each allocation to `withdrawable`
  with durable Match audit state.
- The Platform Admin Prize Review workspace uses Redux for queue pagination,
  stale-response protection, evidence, confirmation, blocked states, and
  per-Match errors. It never accepts a client-selected winner or amount.
- Do not unblock paid discovery yet. Staff participation denial is complete.
  Immutable execution-level financial snapshots and the reviewed withdrawal
  lifecycle are complete locally. The next required proof is a multi-user paid
  solo and Team lifecycle browser workflow. Production payout and paid
  discovery remain blocked on real provider adapter/worker evidence.

- `QuickMatchOffering.entryFeeMinor` is the fee for one player seat, including
  every member of a submitted Team. A Team join succeeds only when every
  member can fund their own seat; the captain never silently pays for others.
- INR is stored and moved as integer minor units. A posted append-only
  double-entry ledger is the financial source of truth; Wallet is a rebuildable
  per-user projection with `available`, `entry-held`, `prize-pending`,
  `withdrawable`, and `withdrawal-pending` buckets.
- Join API remains `POST /api/player/quick-matches/:offeringId/queue`. For a
  paid offering, one MongoDB transaction must create every roster hold and the
  queue membership, or create neither. Retries return the existing membership
  and holds; partial roster charges are forbidden.
- Entry holds remain locked through result verification and the dispute
  window. Cancellation releases them. Final settlement captures them exactly
  once; prize allocation requires verified participant IDs and is not inferred
  from free-form score text.
- Completed gates: replica-set insufficient-funds rollback,
  concurrent/retried joins, atomic Team holds, cancellation release,
  disputed-settlement blocking, capture/prize idempotency, and the protected
  wallet projection API/Redux UI. Protected cursor-paginated owner-only ledger
  reads, explicit append-only mutation rejection, and the compound owner/time/id
  index and independent reviewed prize release are also complete. Remaining
  completion requires withdrawal/payout behavior, staff participation denial,
  execution-level financial-term snapshots, and a multi-user browser workflow.
  Paid discovery stays blocked until these gates pass.

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

- Completed for new Quick Match runtime records 2026-08-09: introduce
  Game-backed `QuickMatchOffering` and remove legacy Tournament
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

Match Operator dashboard (`/staff/operations`):

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

- Completed in code 2026-08-09: email OTP issuance, verification, resend
  cooldown, bounded attempts, and pending-registration promotion to `User`;
  password recovery uses expiring single-use links and session invalidation.
- Resend is active locally with environment-only credentials. Verify a
  dedicated sender domain and monitor staging bounces/delivery failures before
  declaring transactional email production-ready. Local authorized delivery,
  identity-specific database integration, and an isolated real-route browser
  workflow passed 2026-08-09.
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

Run on 2026-08-11 for the staff read-only player-dashboard slice:

- Backend aggregate: 159/159 passed. The route inventory found and closed the
  remaining direct profile data/file mutation gap; both routes now require the
  verified-player participation policy. `git diff --check` passed.
- Frontend aggregate: 35/35 passed; full lint, the 520-module production build,
  and `git diff --check` passed.
- A real seeded Game Manager verified `/staff` plus safe desktop/mobile
  Tournaments, Matches, Wallet, Profile, and Game Accounts views. Admin,
  Operations, Join, top-up, withdrawal, and game-account mutation controls were
  absent or disabled. Authenticated direct profile and Quick Match queue POSTs
  both returned 403 `PLAYER_PARTICIPATION_REQUIRED`; no application console or
  API errors were observed.

Run on 2026-08-11 for immutable Quick Match execution financial terms:

- Backend aggregate: 176/176 passed: 26 auth, 6 auth integration, 23 social,
  68 competition, 20 competition integration, 8 payment policy, 14 payment
  integration, and 11 realtime tests.
- Eight dedicated replica-set cases prove later offering edits cannot change
  fees or prizes, concurrent settlement remains one-time, missing/corrupt
  snapshots and hold/ledger mismatches roll back, cancellation also fails
  without partial writes, free Matches remain compatible, queued Rooms block
  repricing/retirement, and internal terms do not leak through normal reads.
- Independent financial-integrity audit and `git diff --check` passed.

Run on 2026-08-11 for reviewed withdrawals:

- Backend aggregate: 190/190 passed, including 11 payment policy and 25
  payment replica-set integration cases; the withdrawal-focused replica suite
  passed 11/11. Independent financial review found no code-level must-fix.
- Frontend aggregate: 43/43 passed; full lint and the 525-module production
  build passed. Player and governance withdrawal flows remain Redux-owned.
- Desktop/mobile Player Wallet showed the explicit provider-unavailable state,
  a real Game Manager saw view-only Wallet history with no money controls, and
  a real Platform Admin loaded the safe empty Withdrawal Review queue. No
  application console/API errors were observed.
- Production limitation: no real payout adapter, deployed provider worker,
  authenticated callback certification, or sandbox payout evidence exists;
  the backend request capability therefore stays disabled by default.

Run on 2026-08-11 for paid Solo/Team proof and release control:

- Backend aggregate: 196/196 passed: 26 auth, 6 auth integration, 23 social,
  70 competition policy/unit, 24 competition integration, 11 payment policy,
  25 payment integration, and 11 realtime tests.
- Default-closed real HTTP paid POST returned 503
  `QUICK_MATCH_PAID_ENTRY_DISABLED` with zero Room, Match, hold, or ledger
  writes. `.env.example` documents the false default and rollback rule; the
  actual local environment remains unset/closed.
- An isolated explicit-capability harness completed paid Solo and two complete
  Duo Teams through concurrent/retried joins, operator execution, dispute,
  independent settlement, and independent prize release. Final evidence was
  two settled/released Matches, two closed Rooms, six exact captured ₹10 holds,
  zero held/prize-pending funds, and ₹140.02 total withdrawable prizes.
- Desktop/mobile Player, Match Operator, and Platform Admin browser workflows,
  owner-safe Match/ledger serialization, and post-fix console/network checks
  passed. Frontend aggregate 44/44, full lint, and 525-module build passed.
- Release verdict: internal paid lifecycle is green, but PhonePe callback/
  worker deployment and sandbox evidence plus real payout adapter/worker/
  reconciliation certification remain red. Paid entry stays disabled.

Run on 2026-08-11 for legacy competition migration:

- Backend aggregate 206/206 passed: competition 75/75 and competition
  integration 29/29. Configured local dry-run reported zero candidates,
  zero unresolved records, complete inventory/index evidence, and no apply.
- Frontend 52/52, full lint, route smoke, and 526-module build passed.
- Browser/API proof passed canonical direct details, Approved Host canonical
  draft submission, normal-player route/API denial, and true 390×844 mobile.
  The submitted draft created zero Tournament/TournamentType records; all test
  users, audit, draft, sessions, and browser fixtures were cleaned up.

Run on 2026-08-09 against the current working trees:

- Backend `npm test`: 153 passed, 0 failed (25 auth unit/contract, 6 auth
  database integration, 23 social, 54 competition policy/unit, 12 Quick Match
  database integration, 8 payment policy/unit, 14 payment/ledger database
  integration, and 11 realtime tests).
  The auth coverage includes the Resend adapter, credential hashing,
  reset-link, TTL, password-strength, hashed-password promotion, concurrent
  issuance, transactional promotion, and session revocation contracts.
- Focused backend `npm run test:auth:integration`: 6 passed, 0 failed against
  an isolated in-memory MongoDB replica set. The aggregate command includes and
  successfully reran this suite.
- Live Resend check: the application `emailService` was accepted by the
  provider using environment-only credentials and the authorized account
  recipient confirmed receipt. No provider key or recipient address is tracked.
- Frontend route smoke and API-error smoke checks: passed.
- Frontend production build and lint: passed after OTP verification, resend,
  password-reset request, and reset confirmation UI integration.
- Isolated in-app browser workflow: passed against the real frontend Redux
  thunks, backend auth routes, and replica-set database for signup, OTP
  promotion, password-reset request, and password replacement. This check also
  found and verified the fix for signup state being unmounted by global loading.
- Player Quick Match discovery and free queue: five competition policy tests
  verify canonical eligibility plus free/paid queue policy; three MongoDB
  replica-set tests verify concurrent capacity, idempotency, canonical
  Room/Match creation, and fail-closed paid entry. Frontend lint, production
  build, route smoke, and API-error smoke checks pass. Five executable frontend
  tests cover discovery state plus the canonical solo/team request contract;
  frontend CI runs them.
- Staff-to-player Tournaments route: the backend now mounts the Quick Match
  player router at `/api/player`, the full mount has a regression test, and a
  signed-in Match Operator browser workflow displayed `BGMI CLASSIC ERANGAL`
  at `/dashboard/tournament` with no console errors.
- Canonical Team/player Match slice: model/policy tests cover arbitrary
  Game-backed Team modes and bounded explicit roster sizes. MongoDB integration
  covers Game format resolution, legacy Team backfill, and canonical player
  list/detail reads. The development `migrate:teams` dry run reported zero
  candidates/unresolved records. Eight frontend state/transport tests pass;
  Match pages no longer call Axios directly, and lint/build/route/API-error
  gates pass.
- Canonical Match Operator lifecycle: the seventh Quick Match replica-set test
  covers concurrent claim, prepare, lobby/check-in convergence, start,
  competing player result writes, verification, early-settlement rejection,
  dispute, governance resolution, and settlement. Operator policy tests prove
  governance cannot execute operational commands. Eleven frontend
  state/transport tests pass after Match Control moved behind Redux and player
  disputes stopped accepting settled matches. A real scoped operator opened
  `/dashboard/operations` in the in-app browser with clean loading/empty states
  and no console errors; this check found and verified silent aborted-request
  handling.
- Wallet ledger UI and protected history: sixteen frontend state/transport tests
  now pass.
  Wallet reads expose integer available/held/prize/withdrawal projections,
  browser code no longer impersonates a signed payment-provider callback, and
  withdrawal is disabled instead of presenting the intentional backend 501 as
  a working payout flow. Owner-only, bounded, stable cursor history is available
  through Redux with stale-response and append de-duplication protection. Four
  focused backend policy/unit tests and six replica-set ledger integration tests
  pass. A signed-in browser check displayed the Wallet ledger empty state and
  refresh action without console warnings or errors. This gate alone does not
  authorize paid discovery.
- Paid Quick Match money lifecycle: twelve replica-set integration tests now
  include atomic Team funding/rollback, one-time concurrent cancellation
  release, and one-time concurrent settlement capture with verified
  participant-ID prize allocation. Player result transport includes the
  selected winning player or complete Team; frontend tests, lint, and the
  production build pass. Paid discovery remains blocked by the documented
  ledger pagination, prize-release/payout, and browser gates.
- Reviewed prize release: eight payment policy tests, fourteen payment/ledger
  replica-set integration tests, and the complete 153-test backend aggregate
  pass. The queue and release command enforce independent governance review,
  participant conflict denial, exact canonical two-leg source allocations,
  stable cursor pages, one-time concurrent release, and multi-winner rollback.
  Twenty-two frontend state/transport tests, full lint, and production build
  pass. A real Platform Admin opened Prize Review at `/panelAdmin`; after the
  local backend was restarted to load the new router, the Redux empty state and
  refresh action rendered without API or console errors.
- Staff workspace experience: focused ESLint and production build pass after
  the `/staff` control-room redesign. A real Platform Admin browser session
  displayed the persisted Staff classification, Platform Admin assignment,
  platform-wide scope, access-control action, and explicit read-only player
  view with no new console warnings or errors.
- Frontend `src/pages/Operations.jsx` focused ESLint check: passed.
- Frontend lint: passed with zero warnings/errors after PropTypes and unused
  import/variable cleanup, removal of sensitive password-reset console logging,
  and route-registry export cleanup.
- GitHub Actions CI workflows were added to both repositories. They are ready
  to run on pushes and pull requests, but have not yet been host-verified
  because the changes are not pushed.

Not run or not currently available: automated browser end-to-end tests for the
full multi-user Quick Match lifecycle, payment-provider sandbox certification, remaining-domain
database integration tests, dependency/security scanner, accessibility audit,
load test, backup restore drill, and production penetration test.

## Route Security Rules

- Public: landing assets; signup/login; email verification/resend; password
  reset request/confirmation; and the payment-provider callback. Auth mutations
  remain behind trusted-origin enforcement and endpoint-specific rate limits.
- Authenticated: catalog, CoC integration, tournaments, payment orders,
  player, clan, match, and notification APIs.
- Verified player: actions that alter player competition, wallet, social, or
  game-account state also require `User.role = player`. A staff account may use
  safe player-dashboard reads but cannot invoke player participation commands.
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

Any coding agent joining this project, receiving a handoff, recovering from
context loss, or working without proof that it read the current revision must
read this file completely and then read `CURRENT_CHECKPOINT.md`. During later
turns in the same uninterrupted working session, it may use the complete
checkpoint plus the relevant sections of this file. A full reread is required
before changing roles, scopes, authorization, architecture, route ownership,
money contracts, roadmap order, or completion state. If the two files disagree,
this file is authoritative and the fast path is suspended until the checkpoint
is corrected. It must then:

1. Confirm the relevant current state, completed work, and known risks.
2. Work in an end-to-end vertical slice: inspect, implement, verify, then
   update this tracker and replace the operational state in
   `CURRENT_CHECKPOINT.md`.
3. Preserve existing architecture and avoid broad rewrites unless this file
   records an approved migration decision.
4. Update Completed, Active Work, Required Future Flows, and security notes
   whenever a meaningful feature, route, data model, or decision changes.
5. Record unfinished work as `In progress` or `Blocked`; never imply that a
   partial implementation is complete.
6. Use focused checks while iterating and run each expensive aggregate gate
   once after the complete slice stabilizes, unless a failure requires a rerun.

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
