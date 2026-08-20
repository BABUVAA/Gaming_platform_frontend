# Current Checkpoint

Last updated: 2026-08-20

Fast-resume index for the paired E-Gaming frontend/backend repositories.
`PROJECT_STATUS.md` remains authoritative.

## Safe Read Protocol

1. On a new task, handoff, context loss, or unknown revision, read
   `PROJECT_STATUS.md` completely and then this file.
2. Re-read the full tracker before changing roles, scopes, authorization,
   architecture, route ownership, money contracts, roadmap order, or feature
   completion state.
3. If these files disagree, `PROJECT_STATUS.md` wins and this checkpoint must
   be corrected before work continues.

## Contract Guardrails

- `User.role` remains only `player` or `staff`.
- Staff authority comes only from active `StaffAssignment` records.
- Staff may inspect safe player-dashboard reads, but only a persisted player
  may execute participation, social, game-account, profile, or money commands.
- Platform Admin owns Game configuration, offering publication, staff access,
  and Event approval. Game Manager is read-only; Event Manager proposes scoped
  drafts and may inspect bounded, safe registration/Match status for Events in
  assigned games; Match Operator operates scoped assigned Matches. Event
  Manager reads omit emails, lobby credentials, wallet data and player result
  authority.
- Invitation-only Event cards are visible only to a player with an active
  invitation; server discovery and registration enforce the same rule.
- Player Event registration is final. Registered and waitlisted players cannot
  cancel or re-enter; platform-owned Event recovery/refunds remain governed.
- New Event schedules contain timing, admission, entry and reward terms only.
  After registration closes, Event Manager proposes rounds from the final
  registered count; independent governance approval is required before any
  stage job, roster, batch or Match generation.
- Redux Toolkit owns feature data; do not introduce component-level API calls
  where a Redux boundary exists.
- Money uses integer INR minor units, an append-only balanced ledger,
  idempotency keys, and MongoDB transactions. Controlled development may use
  explicit `sandbox` money mode with PhonePe test credentials; every balance is
  labelled test money, withdrawals remain disabled, and live-money mode stays
  fail-closed until every documented release gate passes.
- New Quick Matches use Game-backed `QuickMatchOffering`, Match, and Room data;
  do not revive legacy Tournament/TournamentType dependencies.
- Scalable Events use reviewed stage definitions: bounded room size, explicit
  qualification rule, immutable ranked batch outcome, and restart-safe paged
  generation. Do not infer advancement from a fixed knockout bracket.

## Current Verified State

- Planning estimate: approximately 80% of the complete roadmap, 92% of the
  core playable platform, and 45% ready for unrestricted real-money traffic.
  These are planning estimates, not completion evidence.
- Latest backend aggregate passed on 2026-08-18. Canonical competition policy
  passed 91/91 and competition replica integration passed 86/86. Frontend
  state passed 86/86; full lint, route smoke, and the 552-module production
  build passed.
- Latest deployment checkpoint 2026-08-16: the Vercel/Render deployment is the
  public **testing/staging platform**, not a live-money launch. Backend commit
  `7cf9442` is live on Render and `/readyz` returns 200 with MongoDB and Redis
  ready; frontend commit `cb98193` is READY on Vercel. The fresh Render runtime
  scan contains no new application errors.
- PhonePe now uses the official scoped Node SDK for checkout, status, and
  callback validation. Real sandbox probes created a minimal INR 1.00 pending
  checkout and verified its status without completing payment or writing local
  wallet data. Deposit creation atomically persists the pending Transaction and
  reconciliation job before provider I/O. Callback username/password remain
  unconfigured, and Render currently has only the API service: the declared
  Event and payment workers still need provisioning and restart proof.
- The deployed test environment is explicitly configured with sandbox money
  mode, PhonePe deposits enabled, and paid Quick Match entry enabled. PhonePe
  returns to the public Vercel Wallet through the dedicated HTTPS
  `PHONEPE_REDIRECT_URL`; localhost remains a separate developer redirect.
  Withdrawal requests remain explicitly false. Checkout completion and
  exactly-once governance reconciliation evidence are still required.
- The existing Render API service now uses `npm ci`, validated `npm start`, and
  `/readyz`. A dedicated email-token signing secret was added without exposing
  its value; any verification/reset link issued before that one-time separation
  should be reissued. Render requires a Starter worker at $7/month, so the Event
  and payment workers remain uncreated pending the explicit $14/month spend.
- Product decision 2026-08-16: defer both paid Render Background Workers until
  final launch preparation. Platform Admin may use audited manual Event and
  sandbox-payment controls during development. Explicit sandbox money mode can
  enable PhonePe test deposits and paid Quick Matches; a governance action asks
  PhonePe for authoritative status and credits only an exact order/amount match.
  Manual balance credits remain forbidden. Withdrawals and all live-money
  operation remain disabled; worker provisioning, callbacks, restart proof,
  payout integration, and live certification stay launch gates.
- Sandbox-money testing refinement: the API exposes the current money mode and
  test-money flag; Wallet and paid cards label sandbox funds. Platform Admin has
  a bounded reconciliation queue and can trigger provider-status verification
  using only the job identity. The browser cannot supply amount, outcome, user,
  or wallet data. Provider evidence mismatch creates zero credit.
- Operator scale refinement: assigned and unassigned Match queues use distinct
  bounded opaque cursors, stable indexed ordering, Redux append de-duplication,
  stale-response guards, and load-more controls.
- Verification-request history is now bounded for both players and Platform
  Admins: 25-item opaque cursor pages, Redux-owned player state, deduplicated
  load-more UI, and indexed backend ordering. Focused pagination checks pass;
  frontend lint and the current 546-module production build pass.
- The active Staff Directory is also bounded: 25-item opaque assignment pages,
  Redux append de-duplication, and a role/time database index preserve the
  compact role rows and revoked-role reassignment workflow.
- Production dependency audit 2026-08-14: both frontend and backend
  `npm audit --omit=dev --json` reports contain zero production dependency
  vulnerabilities. Deployment and external-provider gates remain separate.
- Owner-only immutable wallet history and independent reviewed prize release
  are complete.
- Paid entry is enabled only in the deployed sandbox test mode; withdrawal and
  live-money modes remain blocked. Internal Solo/Team money flows are proven;
  payout adapter/worker/callback/live-certification gates remain red.
- Both worktrees are committed and pushed at the deployment revisions above.
- API documentation refinement 2026-08-18: the backend now generates an
  OpenAPI 3.1 specification for all 176 mounted HTTP operations and includes a
  human-readable guide covering cookies, envelopes, roles/scopes, opaque
  pagination, INR minor units, authentication, Quick Match, Event, PhonePe,
  prize and withdrawal flows. `npm run docs:api:check` compares the generated
  paths with the mounted router inventory. This documents current contracts;
  it does not turn outstanding worker/provider/live-money gates green.
- Event governance identity fix 2026-08-20: the approval queue now reads the
  authenticated Redux `userId`. A different Super Admin receives the Review
  action while the creator/latest submitter stays blocked; backend review
  policy remains final. Frontend 87/87, lint and 553-module build passed.

## Completed Slice: Staff Read-Only Player Visibility

Completed and verified 2026-08-11:

- Shared backend `requirePlayerParticipation` policy returns stable 403
  `PLAYER_PARTICIPATION_REQUIRED` for staff player mutations.
- Route inventory covers Match/Quick Match, wallet/payment, clan/team/social,
  chat sockets, game accounts, legacy host mutations, and profile data/file
  updates. The final audit found and fixed the two profile mutation routes.
- Staff-safe pages include Tournaments, Matches, Wallet history, Profile, Game
  Accounts, Account Settings, and password security. Clan, Chats, and Refer
  remain player-only.
- `/staff/operations` owns Match Operator controls; the old
  `/dashboard/operations` path is redirect-only.
- Staff player navigation omits Admin and Operations. Join, check-in, result,
  dispute, lobby credentials, wallet top-up/withdrawal, game-account changes,
  and profile mutations are absent or disabled.
- Desktop/mobile browser verification used a real Game Manager. Safe reads
  returned 200 and showed the read-only state; direct authenticated profile and
  queue POSTs returned the stable 403; no application console/API errors were
  observed.
- Staff workspace refinements remain verified: assignment-only role cards,
  bounded role-dashboard sections, Admin-only People/Hiring, compact aligned
  Directory rows, suspended Restore, and revoked Reassign with audit history.

## Completed Slice: Immutable Quick Match Financial Terms

Completed and verified 2026-08-11. Canonical Matches capture hidden versioned
money terms; settlement/cancellation use only that snapshot and exact hold plus
hold-ledger evidence. Missing/corrupt evidence rolls back. Shared offering
locking prevents queued repricing. Backend aggregate 176/176 and dedicated
replica-set tests 8/8 passed; independent audit found no must-fix issue.

## Completed Slice: Reviewed Withdrawal and Payout Lifecycle

Completed locally and verified 2026-08-11. Requests, review claims/decisions,
ledger holds/releases/finalization, provider idempotency, cursor history, safe
serialization, Redux player/admin interfaces, and responsive runtime states are
implemented. Backend 190/190 and frontend 43/43 passed. Production requests
remain intentionally disabled until a real payout adapter, deployed worker,
authenticated callback/reconciliation, and sandbox evidence exist.

## Completed Slice: Paid Solo and Team End-to-End Proof

Completed locally and verified 2026-08-11. Default runtime paid POSTs return
503 with zero writes. An explicit proof-only harness completed paid Solo and
complete Teams through real sessions, persisted staff roles, operator work,
dispute, settlement, independent prize release, exact Wallet/ledger evidence,
safe serialization, and desktop/mobile UI. Backend 196/196 and frontend 44/44
passed. External provider gates remain red, so paid entry stays disabled.

## Completed Slice: Legacy Competition Retirement

Completed and verified 2026-08-18. A fail-closed retirement command first
proved zero TournamentType, Tournament, Result, legacy Room, and legacy Match
records in the configured database. It then removed the empty collections,
legacy fields/indexes, and Redis keys. Backend models, routes, controllers,
matchmaking/socket contracts, migration utilities, API documentation, and
frontend history routes/Redux modules are removed. Match now accepts only
Quick Match or Event sources; Room requires a QuickMatchOffering. Full backend
tests, competition 91/91, competition replica integration 86/86, frontend
86/86, lint, route smoke, build, and diff checks passed.

## Completed Slice: Event Registration and Admission

Completed and verified 2026-08-13. `EventRegistration` and platform-owned
`EventInvitation` are separate from EventRun planning records. Open,
invitation-only, and limited-seat admission enforce verified-player identity,
registration windows, capacity, optional FIFO waitlists, committed player
registration, immutable FIFO order, invitation consumption/revocation,
and transactional all-or-nothing counters. Platform Admin invitation-run
discovery, bounded verified-player search, paginated history, and safe
serializers are Redux-owned. Approval discloses and validates admission terms.
Staff sees only read-only Event availability.

The final gate passed 13 Event replica-set cases, 223 backend aggregate checks,
56 frontend checks, lint, a 530-module build, independent audit, and real
desktop/mobile browser/API workflows for player registration, staff denial,
and Platform Admin invite/revoke. The browser gate found and fixed the revoked
player-summary response and a nullable review selection warning.

## Completed Slice: Event First-Stage Generation and Handoff

Completed locally and verified 2026-08-13. Reviewed solo single-elimination
plans now close registration through a durable job, freeze the admitted and
eligible roster once, and generate deterministic EventStage, EventBatch, and
first-class Event Match records. Team Events and implicit byes fail closed.
Recovery is bounded, classified, and audited. Player reads expose only the
viewer’s batch; scoped Match Operators claim and operate Event Matches.

The final gate passed 13/13 Event-stage replica cases, backend 237/237,
frontend 62/62, lint/build, independent audit, and real Platform Admin,
two-player, and Match Operator desktop/mobile workflows. Starting the Match
transactionally moved Match, Batch, Stage, and Run to `in_progress`; a fresh
operator tab was console-clean. Temporary fixtures, credentials, logs, and
ports 8080/6379 were cleaned. Production automation still requires a deployed,
supervised `npm run worker:events` process with restart/monitoring evidence.

## Completed Slice: Event Advancement and Sporting Completion

Completed locally and verified 2026-08-13. Immutable dispute-closed outcomes
drive restart-safe leased jobs, deterministic later stages, tied bounded
standings, and durable sporting completion. The independent audit was clear;
19 backend advancement/recovery cases and frontend 66/66 plus lint/build passed.
A real four-player browser/API bracket displayed the champion and placements
`1, 2, 3, 3`. Temporary data, credentials, logs, and ports were removed.

Event financial settlement remains explicitly `not_configured` and Event
wallet writes are forbidden. Roster-freeze and final-results notifications use
a transactionally created outbox, unique durable notification source links,
and the existing Event worker retry loop. Production still requires a deployed,
supervised Event worker.

## Completed Slice: Event Placement Rewards

Completed locally and verified 2026-08-16. Event Manager proposals carry an
INR minor-unit placement table; Platform Admin review freezes it before
registration. Final tied standings allocate the configured amount to every
player sharing a place. A different governance identity must release the
ledger-backed pending rewards, and recipients cannot release their own reward.

The runtime gate used the existing Super Admin as approver and existing
Platform Admin as independent reviewer for a disposable INR 95.00 Event. The
UI showed final places `1, 2, 3, 3`, then `released`, with a clean console.
Database evidence showed `5000/2500/1000/1000` allocations, zero pending
balances, exact withdrawable balances, four pending ledger rows, and four
release ledger rows. The disposable Event/game/four-player fixture was then
removed without changing either governance identity.

## Completed Slice: Paid Event Registration and 1,000-Player Rehearsal

Completed and verified 2026-08-17. Event Runs own independently reviewed INR
entry terms. Paid registration atomically holds the server-owned fee with a
balanced ledger row and per-attempt evidence; player retry never charges twice;
closure captures admitted holds and releases waitlisted holds before roster
freeze. Corrupt/missing evidence and insufficient funds produce zero partial
admission or competition writes. The player command never accepts an amount,
staff remains read-only, recent authentication is required, and paid Event
entry is enabled only by the explicit sandbox release flag.

Shared-database Event Run `6a828224467598a0c5d5f545` completed a
1,000-player BGMI INR 2.00 sandbox rehearsal. Round 1 used Platform Admin for
10 rooms of 100/top 50; Round 2 used Super Admin for 5 rooms of 100/top 20;
the 100-player Final used the dedicated Match Operator. Completion evidence was
1,000 registrations/captured holds/rosters/standings, 3 stages, 16 Matches,
1,000 hold and capture ledger rows, and 10 pending plus 10 released reward
rows. Wallet totals are INR 8,000 available, zero entry-held, zero
prize-pending, and INR 550 withdrawable.

Owner-requested reset 2026-08-17: the full Event/Tournament/Quick Match runtime,
all Matches/Rooms, registrations, competition reviews/audits, payment
Transactions, holds, ledger rows, prizes and withdrawals are now empty. The
reset preserved all 1,007 User/player accounts, all 1,005 Wallet identities,
verified game accounts, Games and staff assignments; every Wallet balance and
embedded transaction history is zero. Event Templates/Runs and Quick Match
offerings must be created again for the next test cycle.

Latest gates: backend 318/318, competition integration 89/89, frontend 84/84,
full lint, 554-module build, and API documentation 180/180. Production still
requires live-money provider certification and separately supervised workers.

## Latest Refinement: Event Management UI and Safe Operations

- Event Manager now uses a compact left sidebar with distinct `Templates` and
  `Events` workspaces. The previous large introduction/explanation panels are
  removed; all fields have direct labels.
- Templates are reusable approved game/mode/map/team-size definitions. Events
  are dated registration, access, fee, stage and reward instances created from
  an approved Template.
- Event cards open read-only operational details with summary counts, bounded
  registration pages and bounded Match-room pages. Backend game-scope policy is
  authoritative and serializers omit player email, wallet, lobby secret and
  result-authority data.
- Platform/Super Admin Event Management now separates `Approvals`,
  `Invitations`, and `Operations & Reports` instead of stacking every section.
- The approval empty state is now action-first: one pending counter, one compact
  status card and one round-change counter. Duplicate explanations, empty
  messages and the inactive decision panel no longer consume the page.
- Verification: backend competition 103/103 and competition integration 91/91;
  frontend 86/86, full lint, 555-module build; API docs 183/183.
- Authenticated desktop/mobile governance visual verification remains pending;
  the local public shell rendered without console warnings or errors.

Operational baseline refinement: backend exposes public `/healthz` liveness
and fail-closed `/readyz` dependency readiness checks. Configure the deployed
web service to use `/readyz`; deploy `npm run worker:events` separately with
the same MongoDB and Redis configuration.

Observability refinement: HTTP responses carry a bounded request ID and safe
structured completion/error logs omit request bodies, credentials, identifiers,
and raw network addresses. Centralized log collection, metrics/alerts, SLOs,
and incident drills remain production operations work.

Dependency audit: backend and frontend production dependencies audit clean.
Frontend now uses React Router v7.18.2 and `npm audit --omit=dev --json`
reports zero production vulnerabilities; the earlier v6 advisory note is
retired.

Scale refinement: player notifications are owner-only, cursor-paginated with a
25-item default/50-item maximum, explicitly serialized, and append older pages
without replacing realtime notifications. Other legacy/social/admin list reads
remain for the API-pagination audit.

Frontend delivery refinement: Vite now emits cacheable framework/state/realtime
and icon vendor chunks; the largest build chunk dropped from 508 kB to 261 kB
without changing route ownership. Further browser/component coverage remains.

Security hardening refinement: auth/signup/email recovery/verification,
password-change, and refresh limits use shared atomic Redis counters with
hash-only client correlation and fail closed when Redis protection is down.
Staff access, Event governance, operator, and financial mutations use the same
protection. MFA and actionable alerts remain future work.

Recent-authentication refinement: Account Settings lets a signed-in user
confirm their current password for a 15-minute sensitive-action window. The
timestamp lives only in the active Redis session. Platform/Super Admin
mutations and player payment mutations fail closed with
`RECENT_AUTHENTICATION_REQUIRED` when it expires; a refresh token never
extends the window. Backend auth policy/session checks pass 38/38; frontend
state tests pass 74/74 with lint clean and the 548-module production build
passes.

Pagination audit refinement: unused unbounded legacy admin list clients for
users, transactions, and Tournament records are retired on both sides. Their
old backend paths return stable `410 ADMIN_LIST_ROUTE_RETIRED`; use the
bounded governance workspaces instead. The focused retirement tests and full
frontend state suite pass.

## Completed Slice: Game Manager Operational Supervision

Completed locally and verified 2026-08-13. `/staff/games` now provides a
server-scoped, read-only attention queue for unassigned, delayed,
result-pending, and disputed Matches plus bounded operator action history for
each assigned game. It exposes no player rosters, emails, lobby secrets,
configuration commands, assignment controls, Event approval, or financial
data. Active Game Manager assignment and `gameScopes` remain the authority.

Backend competition policy passed 82/82; frontend passed 68/68, full lint, and
the 533-module production build. A real seeded Game Manager loaded the assigned
BGMI workspace on desktop and 390px mobile; both new sections rendered without
horizontal overflow or console warnings/errors. Temporary processes and logs
were removed, and ports 8080/6379 were closed.

## Completed Slice: Governance Staff Profiles

Completed locally and verified 2026-08-13. Platform/Super Admin Staff Directory
rows now open a compact read-only profile with current role/scope status,
active-role count, recent service count, and up to 50 server-filtered service
and access records. Role suspension, revocation, reassignment, and scope edits
remain outside the drawer on their existing explicit controls. The endpoint is
still protected by staff-management policy and rejects malformed staff IDs.

Backend competition/staff policy passed 92/92; frontend passed 70/70, full
lint, and the 533-module build. A real Platform Admin opened a multi-role staff
profile on desktop and 390px mobile with no horizontal overflow or console
warnings/errors. Its temporary password was restored and ports/logs cleaned.

## Completed Slice: Platform Security Attention

Completed locally and verified 2026-08-13. Platform/Super Admin now has a
read-only Security Attention workspace backed by durable, 90-day retained
signals: blocked public-signup privilege-field injection, refresh-token replay,
and session fingerprint mismatch. Suspicious refresh events revoke the session
as before and additionally persist hash-only evidence. The queue is cursor
bounded (25 default, 50 maximum), exposes only type/severity/time, blocked
field names, and short correlation prefixes; it never returns credentials,
tokens, raw IP addresses, full hashes, or player records. No ban, session
revoke, delete, or financial action is exposed from this UI.

Backend policy passed 97/97; frontend passed 72/72, lint, and a 535-module
production build. A real Platform Admin saw high/medium seeded signals on
desktop and 390px mobile with no overflow or console warnings/errors.
Temporary signals, password, logs, and ports 8080/6379 were removed/restored.

## Latest Refinement: Post-registration Round Planning and Compete Feed

- Run creation no longer sends `executionPlan`. Approval schedules registration
  only; closure returns round setup required and leaves generation absent.
- Event Manager owns post-close round proposals projected from the server-owned
  registered count. Another Platform/Super Admin must approve before the
  first-stage job is created.
- Player `Compete` combines scheduled Events and Quick Matches. Separate
  Tournaments/Events navigation is removed; old list paths redirect to Compete.
  Event cards show countdown, entry/access/counts, rewards, committed status and
  the viewer's Match link.
- Gates: backend full aggregate 305/305 (policy 92/92, competition integration
  87/87); frontend 89/89, lint, 554-module build and route smoke. Browser
  visual gate remains pending.

## Latest Small Fix: Account Email Presentation

- Port 8080 development backend was stopped.
- Canonical email normalization is now identity-only; confirmation UI and
  Resend delivery preserve the player-entered email address.
- OTP success redirects to Login, the only session-creation path.
- Backend auth checks: 26 unit + 7 replica integration passed. Frontend: 52
  state tests and lint passed.
- PhonePe SDK loading is lazy and callback-only, so Render can boot even when
  its optional SDK install is malformed; configured callbacks fail closed 503.

## Work Immediately After This Slice

1. Completed locally 2026-08-16: Event placement reward tables have Event Manager draft UI,
   server validation, Platform-Admin review disclosure, and a governed release
   view. Replica-set financial proof covers tied-place allocation, one pending
   ledger entry per winner, approver/recipient denial, concurrent idempotent
   release, and exact `withdrawable` movement. Focused frontend Event tests,
   lint, and the 548-module production build pass. Browser/API proof and the
   final financial audit now pass.
   Local browser status 2026-08-14: the public shell is console-clean and
   `/readyz` is green. A real active Event Manager loaded the scoped BGMI Event
   workspace and placement-reward controls with no console errors.
   Code-level financial audit fixed original-approver release availability in
   the safe read model and a closure-clock recovery-job delay; the focused
   placement-reward replica test passes after both corrections.
   Live Event Manager proof created and submitted a temporary BGMI Event with
   distinct registration/open/close/start dates and #1/#2/#3 rewards of
   INR 50/25/10; database evidence matched 5000/2500/1000 minor units. The
   temporary in-review Run and its review record were removed. The admin queue
   now visibly requires an independent reviewer for creator/last-submitter
   proposals and blocks both selection and decision transport; focused tests
   and lint pass. Independent-admin release is now verified with the existing
   governance identities and exact ledger evidence.
2. Completed locally 2026-08-16: scalable ranked Event stages now support
   arbitrarily large reviewed rosters without a product-level capacity cap.
   Every round owns its bounded 2-100 player room size, top-N rule, timings,
   and deterministic projection; paged workers generate immutable batches and
   advance only verified ordered results. Event Managers may propose changes
   to an ungenerated future round, while Platform/Super Admin independently
   approves the exact immutable definition. Match Operators record the full
   room order. Final standings retain champion and eliminated players, with
   eliminated round, room, time, placement, and source evidence; governance UI
   filters by outcome and elimination round. Focused 1,001-player and complete
   multi-round journeys pass, as do the 103 policy and 79 replica-set
   competition aggregates. Frontend passed 79 state tests, full lint, and the
   551-module build. Desktop governance and Event Manager controls plus 390px
   responsive layout rendered with zero console warnings/errors.
3. During development, use the audited Platform Admin controls for manual Event
   generation/advancement. At final launch, deploy and monitor the continuous
   Event worker (`npm run worker:events`).
   Backend `render.yaml` now declares it as a separate Render worker beside the
   `/readyz`-checked API. Configure its same MongoDB/Redis secrets and prove
   supervision/restart behaviour before counting this as deployed.
   Live API/frontend check 2026-08-14: deployed `/readyz` returned 200 with
   MongoDB and Redis ready; Vercel frontend returned 200, uses this backend
   origin, and passed credentialed CORS preflight. Worker restart evidence is
   still required.
   A Vercel blank-page regression from circular custom Vite vendor chunks was
   fixed by removing the manual chunk groups; the rebuilt deployment was
   confirmed working by the owner and a fresh browser check with no console
   errors.
   Backend startup now runs an executable production configuration validator:
   the web process requires datastore, origin, session, email, and Resend
   settings; the worker requires its shared datastores. Missing/placeholder
   settings and any paid-entry enablement fail closed without logging secrets.
   `PRODUCTION_RUNBOOK.md` records deploy verification and rollback steps.
   Focused production-validator/Render-blueprint tests pass, preserving the
   `/readyz` API check, separate Event worker, and paid-entry false default.
   Deployment checkpoint 2026-08-16: the API and frontend commits are live,
   but the connected Render workspace still lists only the existing API web
   service. Provision both `egaming-event-worker` and
   `egaming-payment-worker` from `render.yaml`, copy the authoritative cloud
   MongoDB/Redis values, and prove supervised restart. The API service has now
   been aligned to the blueprint's `npm ci` / validated `npm start` / `/readyz`
   configuration. Each Render Background Worker starts at $7/month; creating
   both is an explicit $14/month billing decision and has not been performed.
   PhonePe sandbox checkout and status calls are green. Configure the merchant
   callback URL plus callback username/password, then prove one signed callback
   or worker reconciliation credits one ledger deposit exactly once. Do not
   enable live paid Quick Match entry during this work. The deployed test API
   now uses explicit sandbox money mode with manual governance reconciliation;
   withdrawal and live-money operation remain blocked.
4. Continue production hardening and final audit.
5. Enable live-money operation only after external provider gates turn green.

## Fast Verification Protocol

- Use focused tests during implementation.
- Run CPU-heavy aggregate gates sequentially after the slice stabilizes; use
  parallel agents for independent inspections and bounded implementation work.
- Backend: `npm test` and `git diff --check`.
- Frontend when changed: `npm test`, `npm run lint`, `npm run build`, and
  `git diff --check`.
- Complete browser/API verification for every user-visible or authorization
  slice before marking it Completed.

## End-of-Slice Update

1. Update `PROJECT_STATUS.md` with evidence and remaining risk.
2. Replace this file's operational state/counts; do not append stale history.
3. Preserve unrelated changes and never track credentials or provider secrets.
