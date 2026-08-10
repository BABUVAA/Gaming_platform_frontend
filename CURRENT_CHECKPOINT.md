# Current Checkpoint

Last updated: 2026-08-10

This is the fast-resume operational index for the paired E-Gaming frontend and
backend repositories. `PROJECT_STATUS.md` remains authoritative.

## Safe Read Protocol

1. On a new task/thread, handoff, context loss, or unknown tracker revision,
   read `PROJECT_STATUS.md` completely and then this file.
2. In one uninterrupted session, use this checkpoint plus relevant tracker
   sections.
3. Re-read the full tracker before changing roles, scopes, authorization,
   architecture, route ownership, money contracts, roadmap order, or feature
   completion state.
4. If the files disagree, `PROJECT_STATUS.md` wins and the fast path stops
   until this checkpoint is corrected.

## Contract Guardrails

- `User.role` remains only `player` or `staff`.
- Staff authority comes only from active `StaffAssignment` records.
- Staff may open the player dashboard only as a read-only visibility utility.
  Only `User.role = player` may execute player participation commands.
- Platform Admin owns Game configuration, offering publication, staff access,
  and Event approval. Game Manager is read-only; Event Manager proposes scoped
  drafts; Match Operator executes scoped assigned Matches.
- Redux Toolkit owns feature data; do not add direct component API calls where
  a Redux boundary exists.
- Money uses integer INR minor units, append-only balanced ledger entries,
  idempotency keys, and MongoDB transactions. Paid discovery stays disabled
  until every documented gate passes.
- New Quick Matches use Game-backed `QuickMatchOffering`, Match, and Room data;
  do not revive legacy Tournament/TournamentType dependencies.

## Current Verified State

- Planning estimate: approximately 62% of the complete roadmap, about 76% of
  the core playable system, and about 42% ready for unrestricted production
  real-money traffic. These are planning estimates, not completion evidence.
- Backend aggregate: 153 tests passed, 0 failed.
- Frontend aggregate: 22 state/transport tests, full lint, and production build
  passed.
- Owner-only immutable wallet history and independent reviewed prize release
  are complete. Release uses settled ledger allocations, never a browser winner
  or amount; settler, participant, unresolved-dispute, corrupt, concurrent, and
  rollback conflicts fail closed.
- Platform Admin Prize Review is Redux-backed and passed a live browser empty-
  state/refresh check with no API or console errors.
- Adjacent money risk: settlement still reads mutable offering prize terms.
  Release is safe because it uses immutable settled allocations, but execution
  financial-term snapshots remain required before paid discovery.
- Paid discovery and withdrawals remain intentionally blocked. Tournament card
  visual redesign remains deferred.

## Active Slice

Owner: backend identity/authorization policy is final; frontend explains the
read-only staff state. No new user or staff role is introduced.

Enforce staff player-dashboard access as read-only:

1. Inventory every player-facing read and mutation route across Quick Match,
   Match, Event/Tournament, clan/team/social, wallet/payment, game-account, and
   host capabilities.
2. Add one reusable server middleware/policy that requires
   `User.role = player` for participation mutations after authentication and
   verification. Active staff authority must never satisfy it.
3. Preserve safe player-dashboard reads needed for staff visibility; keep
   staff operational commands solely in their scoped staff workspaces.
4. Return one stable 403 error contract for staff participation attempts and
   add policy/route coverage proving every inventoried mutation is protected.
5. Expose the read-only staff state in shared frontend selectors/navigation;
   hide or disable participation CTAs and explain that staff should use their
   assigned workspace.
6. Ensure account-security actions such as logout/password change remain
   available; they are identity maintenance, not player participation.
7. Verify player behavior remains unchanged, staff reads remain usable, staff
   writes fail server-side, and browser navigation is clear on desktop/mobile.

Exit gate: a staff account can inspect safe player-dashboard information but
cannot enter or affect a player competition, social group, game identity, or
money lifecycle through UI or direct HTTP requests.

## Paused In-Progress State

Paused at the user's request on 2026-08-10. Do not restart this slice from
scratch; inspect and finish the existing shared-worktree changes.

Backend work already applied but not yet finally verified:

- Added `services/playerParticipationPolicy.js` and
  `controllers/playerParticipationMiddleware.js` with stable
  `PLAYER_PARTICIPATION_REQUIRED` denial based on the persisted User role.
- Player summary now returns the persisted `player`/`staff` classification;
  Quick Match discovery adds `staff_read_only` and cannot report staff as
  eligible.
- Participation middleware has been added across user social/game-account,
  Match/queue/result/dispute, Quick Match queue, payment order/withdrawal,
  clan/team/bookmark, and legacy host mutations. Re-audit the final route list
  before completion.
- Socket connection state now loads/refetches the persisted account role;
  personal/clan chat creation and messages reject staff participation.
- Added `tests/playerParticipationPolicy.test.js` to the maintained competition
  suite. Its mutation-router inventory caught both legacy host POST paths
  missing the shared guard; `routes/hostRoutes.js` was corrected and the new
  policy test passes 4/4.
- Focused post-pause backend checks pass: competition 59/59, social 23/23,
  realtime 11/11, plus the combined summary/discovery/serialization check
  27/27. No post-change backend aggregate has run.

Frontend work already applied and focused-verified by the frontend agent:

- Shared staff utility helper/selector, Staff role label, read-only shell
  notice, staff-safe navigation/header/sidebar, and separate dashboard-viewer
  route guards are present.
- Safe staff views include Games, Tournaments, Matches/details, read-only
  Wallet history, Profile, Game Accounts, Account Settings, and password
  security. Clan, Chats, and Refer remain player-only.
- Quick Match and legacy Tournament join, Match check-in/result/dispute and
  lobby credentials, Wallet top-up, Game Account connect/verification, and
  Profile media/social mutation controls are suppressed for staff.
- Quick Match and Wallet mutation thunks have staff no-transport conditions.
- Frontend focused staff-mode transport/state checks pass 16/16 and the agent
  reported focused ESLint plus production build passing. A full post-slice
  frontend aggregate/lint/build gate and browser verification remain.
- Additional completed UI refinement 2026-08-10: `/staff` now presents a
  responsive assignment-first control room with role-specific cards,
  responsibility previews, and scope/assignment summaries. The landing body
  now contains only assigned-role cards; read-only player access stays in the
  navbar and governance access stays in Admin Panel. Header branding changes
  from Player Arena to Staff Control for persisted staff summaries. Focused
  ESLint and production builds pass; the earlier real Platform Admin desktop
  browser check had no fresh warning/error logs.
- Match Operator route ownership refinement 2026-08-10: live Operations moved
  from the player-owned `/dashboard/operations` route to
  `/staff/operations`. The old URL now performs a guarded compatibility
  redirect. Navigation, the staff workspace card, route-level tests, focused
  ESLint, the frontend state suite, and the production build pass.
- Player/staff navigation separation 2026-08-10: Admin and Operations links
  are hidden from every player-dashboard navigation surface, including the
  mobile menu, when a staff identity uses the read-only player view. Staff
  Workspace remains as the return route. The 30-test frontend state suite,
  focused ESLint, and production build pass.
- Staff Directory revocation recovery 2026-08-10: revoked rows remain visible
  with a Reassign action; suspended rows keep Restore. Reassign posts the
  durable user/role plus prior game scopes through the governance assignment
  endpoint, preserving revocation history and recording reactivation. Backend
  staff policy 4/4 and frontend directory contract 4/4 pass; focused ESLint,
  build, and diff checks pass. Local backend PID 27084 is listening on 8080
  with the updated feed.
- Role Management Directory is now a compact one-role-per-row list: email,
  identity, role/status/scope, and inline actions. Scope editing expands only
  its selected row. Header/body columns use one fixed grid so two- and
  three-action rows align. Focused ESLint, the three-test directory contract,
  build, and diff validation pass.
- Governance UI split 2026-08-10: People and Hiring are available only in the
  Admin Panel. Staff access oversight shows Directory, History, and Policy and
  requires a Super Admin or Platform Admin assignment; operational staff do
  not receive its shortcut. Six focused route/navigation tests, ESLint, and
  the production build pass.
- Staff landing simplification 2026-08-10: removed Assignment policy,
  Player-facing view, and access-oversight secondary cards. `/staff` now shows
  only role workspaces derived from active assignments; player-safe pages stay
  reachable through navbar links. Focused ESLint, the 520-module build, and
  diff validation pass.
- Balanced Staff Dashboard 2026-08-10: the page keeps only a plain `Welcome
  back` heading above assigned workspaces—no username hero, explanation, or
  summary counters. The earlier rich role cards are restored with role labels,
  descriptions, responsibility chips, scope, and Open. Focused ESLint, the
  520-module production build, and diff validation pass.
- Staff landing section touch-up 2026-08-10: Welcome back and Your workspaces
  now have separate responsive bordered sections; the welcome section includes
  only the short `Select an assigned workspace to continue.` support line.
  Focused ESLint, build, and diff validation pass.
- Staff role-dashboard style consistency 2026-08-10: Game Manager and Match
  Control already use bounded role/content sections; Event Manager now matches
  the staff landing surface with a dark page shell and restrained bordered
  header section. Focused ESLint across all staff role pages, build, and diff
  validation pass.

Independent audit state:

- Earlier gaps for clan/host/chat enforcement, staff-safe route guards, legacy
  Tournament Join, and UTF-8 role labeling were reported to the implementing
  agents and corresponding code became visible.
- A final independent diff audit after all backend tests was not completed
  before pause.

Runtime note:

- The local backend was restarted during Prize Review verification and was
  listening on port 8080 as PID 24272 at that time. Later staff-read-only code
  edits occurred after that restart, so restart the exact current listener
  before browser-testing this slice.
- Prize Review browser verification itself is complete: a real Platform Admin
  opened the Redux empty queue/refresh state without API or console errors.

Resume commands/checks:

1. Inspect `git diff`/`git status` in both repositories and read agent messages
   or current files; do not discard shared changes.
2. Perform the final independent backend/frontend diff audit; the focused route
   inventory and domain suites are already green.
3. Run backend `npm test` once, then frontend `npm test`, `npm run lint`, and
   `npm run build` sequentially, plus `git diff --check` in both repositories.
4. Restart the exact port-8080 backend listener, then browser-verify a staff
   account can view safe pages, sees Staff/read-only labeling, cannot see
   participation controls, and receives 403 from a direct mutation attempt.
5. Only after every gate passes, mark this slice Completed and replace this
   paused section with the next active slice.

## Work Immediately After This Slice

1. Snapshot immutable Quick Match execution financial terms.
2. Reviewed withdrawal request/approval/provider payout lifecycle.
3. Multi-user paid solo and Team browser workflow.
4. Deliberate paid-discovery enablement only if every money gate is green.
5. Remaining legacy competition migration and rollback rehearsal.

## Fast Verification Protocol

- Run focused checks during implementation.
- Run CPU-heavy aggregate gates sequentially after the slice stabilizes; use
  parallel agents for independent inspections and edits.
- Run backend `npm test` once for backend behavior and frontend `npm test`,
  `npm run lint`, and `npm run build` once for frontend behavior.
- Always run `git diff --check` in each changed repository.

## End-of-Slice Update

1. Update `PROJECT_STATUS.md` with evidence and remaining risk.
2. Replace this file's operational state/counts; do not append history.
3. Preserve unrelated dirty changes and never track credentials or provider
   secrets.
