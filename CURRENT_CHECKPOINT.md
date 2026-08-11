# Current Checkpoint

Last updated: 2026-08-11

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
  drafts; Match Operator operates scoped assigned Matches.
- Redux Toolkit owns feature data; do not introduce component-level API calls
  where a Redux boundary exists.
- Money uses integer INR minor units, an append-only balanced ledger,
  idempotency keys, and MongoDB transactions. Paid discovery remains disabled
  until every documented release gate passes.
- New Quick Matches use Game-backed `QuickMatchOffering`, Match, and Room data;
  do not revive legacy Tournament/TournamentType dependencies.

## Current Verified State

- Planning estimate: approximately 62% of the complete roadmap, 76% of the
  core playable platform, and 42% ready for unrestricted real-money traffic.
  These are planning estimates, not completion evidence.
- Backend aggregate: 206/206 passed on 2026-08-11.
- Frontend aggregate: 52/52 passed; full lint and 526-module production build
  passed on 2026-08-11.
- Owner-only immutable wallet history and independent reviewed prize release
  are complete.
- Paid entry and withdrawal requests remain intentionally blocked in normal
  runtime. Internal Solo/Team money flows are fully proven; external PhonePe
  and payout adapter/worker/sandbox gates remain red.
- Both worktrees were clean before the final backend profile-route guard fix.
  Current intentional backend changes are `routes/userRoutes.js` and
  `tests/playerParticipationPolicy.test.js`; tracker changes are intentional.

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

## Completed Slice: Legacy Competition Migration and Rollback

Completed and verified 2026-08-11. Active client/host/detail/join paths are
canonical; reviewed migration dry-run/apply/no-op/rollback/reapply and Redis
recovery are covered; legacy queue POST is zero-write 410; historical reads are
deliberately retained. Backend 206/206 and frontend 52/52 passed. Desktop/mobile
browser and configured-environment dry-run passed with fixtures cleaned.

## Next Slice: Event MVP (Not Started)

Keep EventTemplate/EventRun as governance records. First add separate,
transactional EventRegistration records for `open`, `invitation_only`, and
`limited_seats` Runs: verified-player eligibility, open/close window, one
registration per player, capacity, and explicit waitlist policy. Rounds,
batches, leaderboards, disputes, settlement, notifications, and jobs follow
only after this boundary is verified.

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

1. Deliberate paid-entry enablement only after external provider gates turn green.
2. Event registration/rounds MVP, remaining staff workflows, then production
   hardening and final audit.

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
