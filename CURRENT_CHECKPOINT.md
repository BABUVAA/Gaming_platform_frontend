# Current Checkpoint

Updated: 2026-10-02. Fast-resume index for both repositories.
`PROJECT_STATUS.md` remains authoritative; its newest dated amendments govern
over historical implementation notes. Prior checkpoint history is retained in
Git, and detailed feature/contract history remains in `PROJECT_STATUS.md`.

## Current slice: paired-system reassessment

User requested a whole-system re-audit and fixes, then commit/push and verification.
Implemented and pushed:

- Authentication-specific 401 classification prevents payment-provider errors
  from refreshing/replaying checkout or falsely expiring the player's session.
- Wallet/capability/status-check request identity prevents stale results;
  duplicate checks are blocked; both checkout providers protect new history rows.
- Canonical non-accepted Friendship records block private chat despite stale
  compatibility friend arrays.
- PhonePe callback redelivery preserves active leases and terminal job state.
- Vulnerable locked dependencies updated, Node 24 CI baseline, dependency audit
  gates and backend API-documentation coverage check.
- Test Redis isolation and bounded unavailable-Redis failure; CI Redis service;
  all test files included with an inventory guard; `.env.*` ignored except sample.
- Release CI fixes: exact-case Sidebar test path, CI-only build proxy target,
  and request-time CoC configuration guard instead of import-time process exit.

Full findings, changed-file map, test matrix and live limitations:
`PLATFORM_REASSESSMENT_2026-09-30.md`.

## Verification

- Frontend 191/191; ESLint; production build 579 modules; route and API-error
  smoke checks pass. Shared chunk warning remains ~609 kB minified / 181 kB gzip.
- Backend Linux CI aggregate 479/479, exit 0: auth 64 + integration 9; social 25 +
  integration 12; competition 139 + integration 148; payments 13 + integration
  39; realtime 15; restored additional coverage 15.
- Both release CI pipelines are green (frontend run 37030451677, backend
  37030208489). CoC/account focused checks pass 16/16. September 30 focused
  backend regression was 26/26. API docs cover 230/230 operations;
  full npm audits report zero vulnerabilities in both repositories; diff checks pass.
- Node 24.15.0 locally. MongoDB integration tests use temporary databases/replica
  sets. Redis authentication tests use disposable identities and explicit
  `TEST_REDIS_URL` (default local port 6379), not application `.env` credentials.
  This audit used isolated non-persistent Redis on port 6391. An unavailable
  endpoint was deliberately tested and failed promptly instead of hanging.
- Occasional Windows MongoMemoryServer forced-teardown warnings are recorded in
  the audit; they do not constitute production shutdown verification.

## Delivery and deployed evidence

- User authorized delivery on October 2. Audit commits frontend `031880b` and
  backend `745c327` are pushed to main; release fixes follow in frontend
  `be65b72` / `3ce1b57` and backend `848c2fa`. Baselines were frontend `91d0460`
  and backend `8d1e513`. This checkpoint is the delivery-record follow-up.
- No production database cleanup, cloud setting changes, new paid services or
  live-payment enablement. Existing environment secrets were not changed.
- Vercel production READY was confirmed for the audit code; deployment status
  is successful through `3ce1b57`. Public frontend returns 200 with baseline
  security headers. Normal Git deployment was used without a duplicate trigger.
- API health/readiness now return 200 with MongoDB and Redis ready. Anonymous
  session reads return expected 401 `ACCESS_TOKEN_MISSING` with correct CORS.
  Render MCP requires reauthentication: exact backend deployed SHA, logs and
  workers remain unverified. These public checks do not certify the full system.
- Existing Chrome staff session restored, opened Game Manager with scoped tabs,
  and survived reload without the expiry loop. This is not fresh login or mobile
  player proof. No test account, competition or payment data was created.
- Historic deployment/worker/Redis statements in the tracker are dated evidence,
  not a new live inspection. Reconnect Render before completing that part.

## Contract guardrails (summary, not a replacement for the full contract)

- Modular monolith. User classification is player/staff; authority is from active
  StaffAssignment records, not UI selection or an account's legacy role string.
- Super/Platform Admin govern globally. Tournament Manager, Game Manager,
  Event Manager and Match Operator require explicit Game scopes. No implicit
  access to another role's dashboard or operational mutations.
- Tournament Manager owns scoped Quick Match offering configuration. Approved
  player hosts propose drafts only. Game Manager handles scoped game-account
  review, Quick Match operator assignment/schedule, and reasoned pre-start room
  closure/cancellation. Event Manager owns reviewed Event operations/rounds.
  Only the assigned, scoped operator starts or submits results for a Match.
- Player participation is server-guarded; staff utility views do not permit
  player entry, team/clan/social mutations or money participation.
- Teams are independent of clans, use friend invitations/consent and complete
  server-derived format sizes. Same-format teams may overlap; identical ready
  rosters are unique. Active participation blocks both disband and member leave.
- Free offerings may explicitly waive game accounts. Full waiting Rooms can
  open the next Room; new attempts are distinct and retries remain idempotent.
  Early closure respects complete teams, configured minimum and promised places.
  Cancellation refunds original payers transactionally once, only before start.
- INR integer-minor append-only ledger, immutable entry/prize terms, provider
  evidence and idempotency remain mandatory. Browser success/signature alone
  never credits a wallet. Live money and withdrawals stay closed.
- Razorpay is the primary sandbox checkout; PhonePe compatibility remains.
  Owner-only payment history/check actions support explicit no-worker recovery
  with rate limits, a shared lease and persisted cooldown. Unattended processing
  still requires verified workers or a separately designed webhook workflow.
- Referral credit is 1000 minor units once after the first qualifying completed
  competition, non-withdrawable and usable for entry under existing gates.
- Secure cross-site cookie delivery stays silent (no login consent prompt).
  Pending signup recovery requires OTP before applying new username/password.

## Next verification and launch boundaries

1. Reconnect Render and confirm the backend deployed revision, runtime, logs and
   workers. Source is pushed and public readiness passes; exact SHA is unverified.
2. Run authenticated real-browser/device journeys, including interrupted signup,
   blocked-cookie login, team entry, staff workspaces, chat and sandbox recovery.
3. Rotate previously shared credentials; prove backup restore, alerts, load and
   current datastore durability. Do not copy secret values into tracked reports.
4. Keep final-launch money gates closed pending provider, payout, reconciliation
   and operational evidence. Paid infrastructure needs explicit owner approval.
5. Profile the large frontend bundle and stress-test concurrent chat flows in
   focused follow-up slices; do not treat source/contract tests as browser proof.
