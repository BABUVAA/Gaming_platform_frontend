# Current Checkpoint

## Local Fix: Required Login Cookie Consent and Delivery Proof

- Login now requires explicit acceptance of the two secure authentication
  cookies and remembers only that non-sensitive consent choice. The page states
  that the cookies keep the player signed in and are not advertising cookies.
- Successful credentials are followed by a raw `/api/auth/session` check before
  Redux authenticates, navigates, or displays the success toast. A browser that
  rejects the cookie stays on Login and receives one actionable
  `Cookies blocked` warning instead of success followed by duplicate session
  expiry errors.
- Cross-site production cookies now opt into partitioned storage while retaining
  `HttpOnly`, `Secure`, and `SameSite=None`. Each successful login/refresh clears
  both legacy unpartitioned and partitioned variants before setting the fresh
  cookie, and logout clears both variants as well.
- Verification passes locally: frontend 165/165, full ESLint, diff check, and
  the 579-module production build; backend aggregate 430/430 and diff check.
  Local browser proof confirmed the consent control and its pre-submit warning.
  Commit, push, deployment, and a real affected-iPhone login remain pending.

## Local Refinement: Password Visibility Controls

- Login, Signup, and recovered-signup password and confirmation fields now
  include independent eye buttons. Credentials remain masked by default, and
  toggling visibility does not change form values, validation, autocomplete,
  or submission behavior.
- The shared Input renders each interactive end icon as a labelled,
  keyboard-focusable `type="button"`, so it cannot accidentally submit the
  form. Static accessibility coverage protects the Login and Signup wiring.
- Frontend verification passes 163/163, full ESLint, diff check, and the
  578-module production build. Commit and push were requested for this slice.

## Local Fix: Shared-Network Login and Signup Rate Limits

- Public Login and Signup no longer place every anonymous request from one
  mobile carrier, office, or shared Wi-Fi address into the same small bucket.
  Keys remain SHA-256 fingerprints; no email or network address is stored in
  Redis plaintext.
- Login now permits 10 attempts per normalized email per 10 minutes and a
  broader 100 attempts per network in that window. Signup permits 10 attempts
  per normalized email per hour and 50 per network per hour. This preserves
  account-focused and bot-burst protection while isolating legitimate users.
- Other authentication, staff, money, gameplay, and realtime limits are
  unchanged. Focused authentication coverage passes 61/61 and the complete
  backend aggregate passes 430/430. Backend commit `db77fb6` and tracker commit
  `4f2174a` are pushed to `main`; deployment and live proof remain.

## Deployment Fix: Post-login Session Expiry Loop

- Production diagnosis found that the public Vercel frontend and Render API are
  different sites while auth cookies defaulted to `SameSite=Lax`. The current
  deployed API also returned no credentialed CORS allowance for the stable
  production alias, so a successful credential response could not reliably
  carry its cookies into the immediate HTTP/Socket session checks.
- Production auth cookies now default to `SameSite=None; Secure; HttpOnly`, and
  the Render blueprint pins the exact stable
  `https://gaming-platform-frontend-vert.vercel.app` origin plus the explicit
  cross-site cookie policy. Preview deployment URLs remain untrusted by
  default. The runbook records the same deployment contract.
- Frontend auth tracks the active bootstrap request ID. Starting Login
  supersedes an anonymous session check, so a delayed pre-login 401 can no
  longer clear the newer authenticated identity or dispatch session
  invalidation.
- Verification passes locally: frontend 160/160, full ESLint, and the
  578-module production build; backend aggregate 429/429, including auth
  60/60; API docs 220/220; and both repositories' diff checks. Deployed
  diff checks.
- Deployed 2026-08-30: Vercel production commit `07e84d7` succeeded and its
  canonical bundle contains both the session request guard and pending-signup
  recovery path. Render commits `e57985c` and `dbff1b0` are live. `/readyz`
  reports MongoDB and Redis ready; credentialed preflight and anonymous session
  reads return the exact canonical origin; and an existing staff cookie restored
  the authenticated workspace without console errors. A fresh player
  signup/OTP/login journey remains the final user-credential proof.

## Local Slice: OTP-authorized Pending Signup Recovery

- Retrying signup for an email already in `PendingRegistration` now restores
  the OTP step from any device without requiring the original password. The
  player can choose a different valid username and a new strong password.
- Replacement credentials are accepted only in the successful email-OTP
  promotion transaction. An invalid OTP does not change the pending username
  or password hash; the original date of birth and referral stay immutable.
- Session storage retains only the safe pending email/resend projection and,
  for recovery, the proposed username. Passwords, confirmation values, OTPs,
  tokens, and hashes are explicitly excluded; after a reload the password must
  be entered again.
- Verification passes: frontend 159/159, full ESLint, diff check, and the
  578-module production build; backend aggregate 428/428, including auth 59/59
  and account-email integration 9/9; API documentation covers all 220 mounted
  operations. The local desktop signup route rendered its complete public form
  without console warnings/errors; the expected connection toast appeared
  because the API was not running for that isolated visual check.

## Local Slice: Current and Durable Notifications

- Notification badges now use the server's exact owner-only unread total rather
  than counting only the 25 loaded rows. The bounded newest-first history and
  opaque cursor remain unchanged, and supporting owner/read and owner/time
  indexes keep the count and feed queries bounded for active accounts.
- A player can mark one alert or every alert read. Read state is durable and a
  canonical private realtime event updates every active tab. Fresh-page reads
  are race-safe against notifications or read changes arriving while the HTTP
  request is in flight.
- Notifications reconcile when the authenticated socket becomes ready, when
  the app returns to the foreground, and whenever the bell opens, covering
  reconnects and time spent offline. The bell is directly available on mobile;
  its responsive panel caps the badge at `99+`, supports loading older rows,
  and exposes `Mark all read`.
- Verification: frontend 157/157, full ESLint, diff check, and the 578-module
  production build; backend maintained aggregate 427/427, including social
  integration 10/10 and realtime 15/15; API documentation covers 220/220
  mounted operations. The local 390px shell reached Login without browser
  warnings/errors; populated authenticated visual proof remains a follow-up.

## Local Slice: Global Recruitment Chat and Friend Unread Counts

- Verified active players now open Chats on the conversation list and choose
  Global Chat explicitly. Global messages are identity-derived, limited to 500
  characters, rate-limited, retained to the newest 200 MongoDB rows, and
  initially load 50. The UI warns that the room is public and keeps global
  state inside Redux.
- Clicking another global sender's username opens actions to view the existing
  public profile. A current Clan Leader or Co-leader also sees `Invite to clan`;
  the server rechecks role, capacity, membership, verification, ban/security,
  and Clan-open state. Invitations expire after seven days, never auto-enrol a
  player, notify the recipient, and require explicit accept or decline from the
  Chats pane.
- Personal-chat sidebar rows now restore up to 50 durable conversations and
  show a compact per-friend unread badge (capped visually at `99+`) plus the
  latest message. Each PersonalChat stores participant last-read timestamps;
  live messages update Redux immediately and only a successfully loaded thread
  is marked read. No read receipt is exposed to the sender.
- The Compete Refer & Earn banner is included in this same frontend delivery.
  Current verification: frontend 157/157, full ESLint, and
  the 578-module production build; backend maintained aggregate 426/426,
  including social 25/25, social integration 9/9 and realtime 15/15; API
  documentation covers 219/219 operations. The local Chats URL reached the
  expected Login guard at exact viewport width with no browser warnings/errors;
  authenticated desktop/mobile visual proof remains a follow-up.

## Local Refinement: Refer & Earn Compete Banner

- The player Compete page now opens with a compact responsive Refer & Earn
  banner showing the exact ₹10 tournament-credit benefit, email-verification
  plus first-tournament condition, and a direct CTA to `/dashboard/refer`.
- The banner is hidden in staff read-only utility mode because staff accounts
  cannot participate in the referral program. Referral qualification, ledger,
  and spending rules are unchanged. Frontend passes 154/154, full ESLint, diff
  check, and the 576-module production build. Authenticated visual proof and
  deployment remain follow-ups.

## Local Fix: Mobile Referral Link Wrapping

- The Refer & Earn share rows now wrap long referral URLs at any character on
  narrow screens instead of truncating or widening the page. The copy action
  still receives the complete, unchanged link value.
- Focused referral coverage guards the wrapping classes and removal of the old
  truncation behavior. Frontend passes 153/153, full ESLint, diff check, and
  the 576-module production build. Deployment remains a follow-up.

## Local Fix: Compact Mobile Navigation and Refer & Earn Discovery

- The mobile bottom bar now carries exactly five requested player actions:
  Compete, Clan, Profile, Wallet, and Chat. Every player destination remains in the
  header hamburger menu, which now uses a compact two-column icon grid, marks
  the active route, closes on Escape, and prevents background scrolling while
  open.
- Refer & Earn appears in the canonical player navigation immediately after
  Wallet. The full `Refer & Earn` label and gift icon are easy to find in the
  mobile hamburger menu and desktop sidebar; the existing verified-player
  `/dashboard/refer` route is unchanged.
- Navigation regression coverage confirms the five mobile primary actions,
  the complete hamburger list, the Refer & Earn item, and staff exclusion.
  Frontend passes 153/153, full ESLint, diff check, and the 576-module
  production build. The local browser reached the responsive public shell, but
  authenticated menu proof remains a follow-up because no local player session
  was available. Deployment remains a follow-up.

## Local Slice: Refer & Earn Tournament Credit

- A player's real-origin `/ref/:profileTag` link now carries a valid referral
  into Signup for seven days, displays the attached code, submits it through
  the Redux auth boundary, and preserves it immutably through pending OTP
  verification. OTP promotion creates one database-unique Referral for the new
  player; invalid, self, staff, banned, security-restricted and duplicate
  referred-user attribution fails closed.
- When the referred verified player completes their first Quick Match or Event,
  the eligible referrer receives INR 10.00 (1,000 minor units) exactly once via
  an idempotent balanced ledger posting. It credits `available`, so existing
  paid competition holds can spend it, but it never changes `withdrawable` and
  cannot be transferred. The owner-only read returns aggregate progress plus a
  bounded 50-row recent invite list.
- Refer & Earn now shows the live code/link, successful and pending counts,
  total earned, invite progress, and the exact verification, first-completion,
  one-time, tournament-only and anti-abuse rules. Wallet history labels the
  posting as referral tournament credit. Backend passes 422/422 and referral
  proof 2/2; API documentation covers 214/214 operations. Frontend passes
  152/152, ESLint, route smoke, diff check, and the 576-module production build.
  A local referral link reached Signup with the code visibly applied and no
  console warnings/errors. Authenticated populated visual proof and deployment
  remain follow-ups; existing live-money gates are unchanged.

## Local Refinement: Compact Friends Workspace

- `/dashboard/friends` now opens with one compact count header and inline
  player-tag search instead of stacked oversized Clan-style cards. A search
  result appears only after search, directly below the input.
- Incoming requests remain visible above one compact tab panel. Accepted
  Friends and Sent Requests are separate tabs with live counters, 40px
  avatars, dense rows, and 32px actions. Repeated Social labels, the empty
  player-result panel, 80px search avatar, large rounding, and excess padding
  are removed. Social Redux/API behavior and backend authorization are
  unchanged.
- Frontend passes 149/149, full ESLint, diff check, and the 573-module
  production build. Populated authenticated visual proof remains a follow-up.

## Local Slice: Friends Main Dashboard Tab

- Friends now has a dedicated verified-player route at
  `/dashboard/friends`, visible in the main player sidebar, mobile navigation,
  and account menu before Teams. The workspace owns player search,
  incoming/outgoing requests, accepted friends, removal, refresh/retry, and
  direct public-profile navigation through the existing Redux social/player
  thunks.
- Clan no longer fetches social connections or exposes Friends in its internal
  navigation. Its no-clan summary now reports only clan-owned saved/join-request
  state. Backend social authorization and staff read-only exclusions are
  unchanged.
- Frontend passes 149/149, full ESLint, route smoke, diff check, and the
  573-module production build. The unauthenticated local Friends URL reached
  Login with no browser console warnings/errors; populated authenticated
  visual proof remains a follow-up.

## Local Refinement: Clan Settings Edit Entry

- Leader and Co-leader see a pencil edit icon beside the Clan name/tag inside
  `My Clan`. It opens the existing Clan settings form for description,
  location, and join policy. The duplicate top navigation Settings tab is
  removed; Member and Elder permissions remain unchanged.
- Frontend passes 148/148, focused Clan coverage 7/7, ESLint, diff check, and
  the 572-module production build.

## Local Fix: First-open Team Tournament Picker

- Quick Match and Event team pickers no longer abort their shared
  `fetchTeams` request during its own idle-to-loading Redux transition. A player
  can log in and immediately open Join Now -> team selection without first
  visiting Teams or pressing Retry.
- The read remains Redux-owned and server Team/join eligibility is unchanged.
  The Teams workspace adds a compact always-visible tip: add players as friends
  first, then create the Team and invite them to the roster. Regression
  coverage checks both picker implementations and the guidance. Frontend
  passes 148/148, focused competition/picker coverage 12/12, ESLint, diff
  check, and the 572-module production build.

## Deployment Cleanup: Active Tournament Registrations Cleared Again

- The deployed `e-gaming` `BGMI QUICK MATCH SQUAD` offering remains active.
  On the latest repeat, its only waiting Room was deleted transactionally,
  clearing one new squad entry and four registered players so the next entry
  starts a fresh Room.
- The guarded preflight found no Match, wallet hold, ledger entry, Match
  message, notification, staff activity, or Discord job related to that Room.
  Post-commit verification remains zero across all of those dependencies.
- The latest operation preserved 2 Games, 1 Quick Match offering, 8 Teams, 15
  Users, and 9 Wallets. Competition Redis namespaces were scanned and already
  empty. Full backup:
  `C:\Users\HP\Desktop\Gaming_platform_backups\e-gaming-before-active-quick-match-registration-cleanup-2026-08-29T16-04-43.847Z.ejson.gz`.

## Local Slice: Admin Player Management

- `/panelAdmin` now defaults to a Player Management workspace for registered
  `player` accounts. Platform/Super Admin can search username, profile tag, or
  email; filter verified, pending-verification, under-review, and banned
  states; inspect safe registration/last-login timing plus linked Game, Team,
  and Clan indicators; and page through results 25 at a time.
- `GET /api/admin/players` is bounded to 50 maximum, binds its opaque cursor to
  the active search/status query, excludes staff and omits credentials,
  sessions, IP history, wallet/ledger details, ban reasons, and private
  security evidence. The old `/api/admin/findUsers` remains explicitly retired.
  No generic ban/delete mutation was added; permanent ban authority stays in
  the confirmed game-account fraud workflow.
- Verification: backend 414/414 and generated API documentation 213/213;
  frontend 146/146, ESLint, diff check, and the 572-module production build.
  This slice is local only and has not been committed, pushed, or deployed.

## Deployment Cleanup: Competitions and Game Accounts Cleared

- On 2026-08-29, a guarded transaction cleared the deployed `e-gaming`
  competition state: 15 Quick Match offerings and 2 Rooms were removed; Match
  and every Event collection verify at zero.
- All 15 embedded user Game links were removed across 9 affected accounts,
  together with 15 private identity claims, 3 verification requests and their
  3 private evidence objects. Fraud cases verify at zero.
- The cleanup preserved 14 Users, 2 Games, 4 Teams, 1 Clan, 4 Friendships, 8
  Wallets, 7 payment Transactions, 7 reconciliation jobs and 3 ledger entries.
  Competition money guards verified zero Quick Match/Event holds, prizes and
  competition ledger entries before mutation.
- Full pre-cleanup backup:
  `C:\Users\HP\Desktop\Gaming_platform_backups\e-gaming-before-competition-game-account-cleanup-2026-08-29T14-27-18.998Z.ejson.gz`.
  The new operator command is dry-run by default, hard-targets `e-gaming`,
  refuses competition money, verifies preservation transactionally and clears
  competition Redis state after commit.

## Completed Slice: Multi-Team Rosters and Squad Leaderboards

- Players may belong to or be invited to multiple Teams in the same
  Game/format. Forming Teams may overlap; only a second complete ready roster
  with the exact same Game, format, size, and accepted members is rejected with
  `TEAM_ROSTER_ALREADY_EXISTS`. A deterministic partial unique index protects
  concurrent final invitation acceptance, and startup backfills historical
  ready Teams before index creation.
- Team disband and member leave now fail with `TEAM_ACTIVE_PARTICIPATION` while
  the Team owns an active waiting/full Quick Match Room, a non-terminal Match,
  or a registered/waitlisted entry in an Event that is not completed,
  cancelled, or rejected. Terminal competition history releases both actions.
- Team Quick Match leaderboards render each joined squad as one block with Team
  name, captain, and roster. Solo offerings retain the existing flat table.
  The API keeps the legacy safe `players` projection during rolling deployment
  and adds safe `teams` blocks without internal Team or player IDs.
- Verification: backend 420/420 and focused Team coverage 14/14; frontend
  147/147, ESLint, 572-module production build, and both diff
  checks pass.

## Local Slice: Team Formation and Free Quick Match Verification Waiver

- Team formation no longer requires a connected or verified Game account.
  Verified, non-banned player accounts may create Teams for active catalog team
  formats and invite/accept eligible accepted friends. Captain authority,
  friendship, security restrictions, exact-complete-roster uniqueness,
  capacity and explicit member consent remain enforced by the backend.
- `QuickMatchOffering` now accepts an exact
  `gameAccountVerificationWaiverEndsAt` only for free offerings. Player
  discovery and the actual queue command evaluate the expiry independently;
  verification resumes automatically when it passes. Paid offerings reject a
  waiver, while other Quick Matches and all Events remain unchanged.
- Tournament Manager UI exposes the optional expiry and shows its active state.
  Players see a temporary-waiver badge, and the Teams workspace lists every
  active catalog Game with a supported team format without loading Profile.
- Verification passes: backend focused 38/38 and aggregate 411/411; frontend
  144/144, ESLint and the 570-module production build. Diff checks are clean.
  The slice remains local: it has not been deployed, and it did not create the
  planned BGMI Squad/Erangel offering in the deployed database.

## Deployment Cleanup: Dummy Players and Events Removed

- The deployed `e-gaming` database no longer contains the 1,003 seeded dummy
  players under `egaming.test`. Five staff accounts and nine real players were
  preserved by exact identity comparison inside the cleanup transaction.
- Cleanup removed 503 Friendships involving dummy players, 942 dependent
  Teams, 20 dummy-led Clans, 1,003 dummy Wallets and their seed ledger rows,
  and 2,003 dummy Game-account identity claims. The surviving real Clan was
  retained with dummy member/request/chat references pulled.
- All Event state is empty: 2 Templates, 2 Runs and 8 reviews were deleted;
  every Event execution, registration, notification, finance and standing
  collection verifies at zero. Quick Match definitions were outside this
  cleanup and were not broadly reset.
- A full compressed EJSON backup of all 50 pre-cleanup collections was written
  to `C:\Users\HP\Desktop\Gaming_platform_backups` before mutation. The
  guarded operation script is dry-run by default, targets only `e-gaming`,
  expects exactly 1,003 dummy players, and rolls back on unexpected references
  or preservation failures.
- Post-cleanup deployed counts are 14 Users (5 staff, 9 real players), 3 valid
  Friendships, 1 valid Clan, 3 valid Teams, 8 valid Wallets and 15 valid Game
  identities. Referential audits found zero invalid Friendship, Clan, Team,
  Wallet, Game-identity, User-Wallet or User-Clan references. Render `/readyz`
  reports MongoDB and Redis ready. All 3,533 derived dummy session, presence,
  matchmaking and chat cache keys are absent. The complete backend regression
  passes 407/407 and both repository diff checks are clean.

## Deployment Update: Paid Event Registration Enabled

- The Render testing API now has `PAID_EVENT_ENTRY_ENABLED=true`. Render
  rebuilt commit `104f6a9`, reported the deployment live, and the deployed
  `/readyz` endpoint confirmed MongoDB and Redis ready.
- This is sandbox-only because the backend additionally requires explicit
  sandbox money mode and PhonePe sandbox/uat configuration. Withdrawals and
  live-money operation remain disabled.
- The payment reconciliation code is exactly-once and ledger-backed, but
  automatic PhonePe deposit credit still depends on provisioning
  `npm run worker:payments`. Until then, Platform Admin provider-status
  verification remains the deployed fallback.

## Completed Fix: Login Rate-limit Capacity

- Login now permits 10 requests per IP-scoped 10-minute Redis window instead
  of 5. Because protection runs before credential validation, the first ten
  requests consume the bucket and request 11 receives `429 RATE_LIMITED`.
- The existing atomic fixed-window behavior, response headers, trusted proxy
  IP resolution and fail-closed 503 behavior remain unchanged.
- Focused backend rate-limiter verification passes 6/6.

## Completed Fix: Staff Sensitive-action Password Dialog

- `RECENT_AUTHENTICATION_REQUIRED` now identifies staff from the authenticated,
  server-loaded player summary instead of the deliberately minimal auth
  identity, which contains no role field.
- One password-confirmation dialog is mounted in the authenticated app shell,
  covering both `/staff` workspaces and the separate Platform/Super Admin
  dashboard without duplicate portals. A confirmed password retries the
  original protected Redux command once; cancellation remains non-mutating.
- Frontend verification passes 144/144, full ESLint and the 570-module
  production build.

## Completed Slice: Interrupted Verification Recovery and Fixed Sidebars

- Retrying signup with the same email restores the existing
  `PendingRegistration` instead of returning a dead-end conflict. This was
  later refined so a correct OTP may apply a username and password selected on
  the recovery device; no pending data changes before verification.
- The pending email-verification screen survives reload in session storage for
  at most 48 hours. No password, OTP, token or hash is stored; verification,
  expiry and resend rules remain server-owned.
- Repeating the exact initial BGMI UID/name after an interrupted response
  restores its one pending review request. It creates no duplicate request,
  identity claim or evidence upload. Different identity details remain blocked
  until the active request receives a decision; rejected requests retain their
  existing `Try again` path.
- Game-account attempt protection is now 10 requests per 15 minutes rather
  than 3 per 24 hours, allowing normal correction while Redis burst protection,
  durable identity uniqueness and review authorization remain enforced. The
  inspected local Redis namespace contained no remaining identity-limit key.
- Player, staff and governance sidebars are fixed below the desktop header,
  viewport-bounded and independently scrollable. Their grid column remains
  reserved so normal page content never moves beneath them. Mobile bottom
  navigation is unchanged.
- Verification passes: backend 405/405 across the complete groups, including
  recovery/rate-limit 10/10, BGMI replica integration 13/13 and account-email
  replica integration 8/8; frontend 142/142, ESLint and the 570-module
  production build. During the combined backend run, the heavy 1,001-player
  ranked-Event file had one process-level startup failure without an assertion;
  its immediate isolated rerun passed 2/2 and every remaining group passed.
  Browser navigation enforced the unauthenticated Login redirect; populated
  authenticated fixed-sidebar visual proof remains a follow-up.

## Previous Completed Slice: Reusable Team Names

- Team names are display labels and are no longer globally unique. Different
  forming, ready or disbanded Teams may use the same name; immutable Team IDs
  remain authoritative everywhere.
- The schema uniqueness and retired `TEAM_NAME_TAKEN` branch are removed. API
  startup drops only an existing unique single-field `teamName` index, so the
  change applies to deployed databases without disturbing other Team indexes.
- Focused Team/startup proof passes 13/13, including two active Teams sharing a
  name and removal of a simulated legacy unique index. The complete backend
  suite passes 400/400; the final rolling-deploy idempotency guard passes
  focused Team coverage 9/9.

## Previous Completed Slice: Server-derived Team Format Size

- The Team creator no longer shows or sends a player-count input. Solo is
  excluded, and selectable formats display their associated roster size:
  `Duo · 2 players`, `Squad · 4 players`, `5v5 · 5 players`, and equivalent
  symmetric `NvN` formats.
- The backend derives known format sizes and ignores conflicting client input,
  preventing a modified client from changing Duo/Squad capacity. Custom catalog
  formats retain bounded explicit-size compatibility for internal services, but
  are not offered by player Team creation until Game capabilities carry a
  structured roster-size association.
- Frontend passes 139/139, ESLint and the 569-module production build. Focused
  backend Team tests pass 9/9 and the affected Quick Match integration passes
  17/17; the complete backend regression passes 400/400.

## Previous Completed Slice: Batch Team Invitations

- Team captains can tick multiple accepted friends and invite them with one
  action, bounded by the Team's remaining roster places.
- Superseded 2026-08-29: connected Game accounts are no longer part of Team
  invitation eligibility, so all otherwise eligible accepted friends are
  selectable without per-friend Game-account checks.
- One transactional backend command bulk-loads selected players and friendships,
  then rechecks player eligibility, accepted friendship,
  same-format Team conflicts and remaining capacity. A mixed invalid selection
  rolls back completely instead of creating partial invitations.
- The canonical endpoint and Redux client accept only `playerIds`; the retired
  single-player request shape/helper were removed. Focused backend Team tests
  pass 9/9 and the complete backend suite passes 400/400. Frontend passes
  139/139, ESLint and the 569-module production build. Browser smoke correctly
  redirected an unauthenticated Teams visit to Login without console errors;
  populated visual proof remains an authenticated follow-up.

## Previous Completed Slice: Unique Game-account Ownership

- A private `GameAccountIdentity` registry now enforces one owner for each
  normalized `Game + account ID`. COC tags are canonicalized case-insensitively,
  and the same boundary applies to manual BGMI/current catalog identities.
- COC owner-token verification, initial manual requests, replacement requests
  and Game Manager approval claim the identity transactionally. A competing
  player receives `409 GAME_ACCOUNT_ALREADY_LINKED`; responses never reveal the
  current owner.
- Pending identities reserve the account during ordinary and fraud review.
  Rejection or final fraud resolution releases only that pending claim.
  Approval makes the claim permanent, and replacement never frees the old
  verified account for another platform player.
- API startup creates the unique compound index and backfills current embedded
  pending/verified identities before listening. A historical cross-player
  conflict fails startup for manual resolution instead of choosing an owner.
- Read-only database audits: `node-auth` 1,101 active identities / 0 conflicts;
  `e-gaming` 2,015 / 0 conflicts. Focused integration passes 12/12 and the
  complete backend suite passes 399/399.

## Previous Completed Slice: Compact Game-scoped Teams

- The dedicated Teams workspace is compact: one small header, a collapsible
  single-row creator, and concise two-column roster cards grouped by Game.
  Oversized spacing and the reusable Clan-era Team panel are not used.
- Superseded 2026-08-29: the creator lists every active catalog Game with a
  supported team format and no longer loads Profile to filter verified Games.
- Backend authorization still owns player, friendship, capacity, captain,
  conflict and invitation-consent eligibility. Connected Game accounts are no
  longer checked during creation, invitation, or acceptance.
- Existing Teams stay readable after later verification changes, preserving the
  ability to decline, leave, disband or manage a roster instead of trapping it.
- Verification: frontend 139/139, ESLint and the 569-module production build;
  backend focused Team tests 8/8 and aggregate 395/395. The local browser
  correctly enforced the unauthenticated Login redirect with no console errors;
  populated authenticated visual QA remains a presentation follow-up.

## Earlier Completed Slice: Social Profile Entry Points

- Friends now use the real `/profile-pic.png` fallback plus a guarded image
  error fallback, so an absent or invalid stored avatar cannot render a broken
  image. Friends retain their direct public-profile action.
- Clan members and pending join requests expose a compact Profile action using
  their canonical player tag. Direct-chat rows merge current friend identity,
  show a resilient avatar, and expose Profile without opening the conversation.
- A visited public Profile now derives `Add Friend`, `Accept Request`,
  `Cancel Request`, or non-destructive `Friends` state from the server-returned
  friendship status and performs every mutation through the social Redux/API
  boundary before refreshing the showcase.
- The Clan description card no longer depends on BGMI/PUBG artwork. Its identity
  background is a neutral layered clan pattern. Teams remain independent and
  visible only to their creator/accepted members/pending invitees; no Clan Team
  surface or clan-wide roster access was restored.
- Verification: focused social/profile passes 14/14, aggregate frontend passes
  139/139, ESLint passes, and the 569-module production build succeeds. A live
  visual check was attempted after starting Vite, but the app browser refused
  localhost navigation; no runtime issue was observed by the code gates.

## Earlier Completed Slice: Player-owned Teams

- Product decision 2026-08-28: Teams are a player feature, independent of
  Clans. Eligible players can create format-scoped rosters and invite accepted
  friends; friendship is rechecked on acceptance. A later unfriend does not
  dissolve an already accepted roster. Clan
  membership changes must have no effect on Team availability or membership.
- Canonical ownership moved from `/api/clan/teams` and the Clan tab to
  `/api/player/teams` and a dedicated Teams workspace. Existing Team records
  remain readable during migration; no competition or money snapshot contract
  changes.
- The backend checks current player eligibility and an accepted Friendship on
  invite and again on acceptance. Team list reads return only rosters where
  the caller is accepted or invited. Clan leave/kick no longer inspect or
  mutate Teams, and realtime refresh uses `player.team.updated`.
- Replica proof covers players with no Clan: invitation is rejected before
  friendship, rejected again if the friendship is removed before acceptance,
  then succeeds and reaches a ready Duo after friendship is restored. Backend
  social passes 23/23, social replica passes 2/2, competition policy passes
  126/126 and API documentation covers 212/212 operations. Frontend passes
  137/137, ESLint and the 568-module production build.

Last updated: 2026-08-29

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
- Platform Admin owns Game configuration, staff access, initial Event approval,
  disputes/recovery and financial governance.
  Tournament Manager owns Quick Match/Tournament offering creation and
  lifecycle only within assigned game scopes. Game Manager is operationally
  read-only except for one assigned-game account-verification decision. Event
  Manager proposes scoped drafts and, after initial approval, owns registration
  closure, sequential round setup, room generation/handoff, operator assignment,
  and promoted/eliminated operational views for assigned games. Match Operator
  operates scoped assigned Matches. Event Manager reads omit emails, lobby
  credentials, wallet data, private chat and result-verification authority.
- Event Manager also owns assigned-game invitation-only rosters and final
  sporting result/reward-status views. Admin Event Management contains only
  independent Template/Event approvals. Actual ledger prize release remains an
  independent governance command under Prize Review and is not granted to the
  Event Manager.
- Invitation-only Event cards are visible only to a player with an active
  invitation; server discovery and registration enforce the same rule.
- Event participant leaderboards are cursor-bounded, registered-only and
  display-name-only. Rank is absent and renders as `-` until final immutable
  standings exist. Open/limited Event spectator visibility applies; an
  invitation-only Run is rechecked through the exact private Event read before
  any leaderboard page is returned.
- Open and limited-seat Events remain visible after registration closes for
  safe spectator timelines and standings; invitation-only Events stay private.
- Game Managers may inspect bounded registration identities, active Quick
  Match Rooms, Match/operator coverage and standings only for assigned games.
  They may approve/reject a player game-account request, escalate supported
  initial or replacement evidence for independent fraud review, and configure the
  pre-start schedule plus lobby credentials for an assigned-game Match. Lobby
  credentials are server-hidden from players until T-10 minutes. They retain
  no Match claim/start/result, wallet, email, private chat, Game configuration,
  competition-definition or staff mutation authority.
- Player Game identities are one-per-Game. Ordinary overwrite remains locked,
  but one replacement is available after 30 verified days when no competition
  or financial obligation is active. COC repeats live owner-token validation;
  Initial and replacement BGMI requests require privately stored screenshot
  evidence and Game Manager review.
  Suspicion creates an independent governance fraud case and temporary player,
  prize-release and withdrawal freeze; only confirmed fraud becomes a permanent
  ban. Provider truth is reconciled and legitimate ledger funds are not
  automatically confiscated.
- Quick Match entry is scoped to the current waiting Room. A player may occupy
  one waiting Room per offering; when it fills and becomes a Match, the next
  Room opens immediately and the player may join it while the prior Match is
  active. A bounded attempt ID makes response retries return the original Room,
  while a fresh attempt receives an independent entry and, when paid, an exact
  Room-scoped wallet hold. Current members see a private `Leaderboard` and no
  duplicate Join action; non-members cannot enumerate it.
- Quick Match and Event player check-in is retired. Full Room -> operator claim
  -> Game Manager schedule/lobby setup -> server disclosure at T-10 -> assigned
  operator start at schedule -> operator result is the canonical operational
  path. Joined players receive deduplicated 50%, 90%, and full Room notices.
- Match chat is private to server-derived Match participants and the assigned
  Match Operator; it must be persistent, bounded and rate-limited.
- Player Event registration is final. Registered and waitlisted players cannot
  cancel or re-enter; that one registration covers the Run's later scheduled
  rounds, including weekly spacing when configured. Players do not re-register
  for each round. Platform-owned Event recovery/refunds remain governed.
- New Event schedules contain timing, admission, entry and reward terms only.
  After registration closes, Event Manager configures one round at a time from
  the server-owned current list. Round 1 uses committed registrations; later
  rounds use immutable promoted outcomes. No routine per-round governance
  approval or client-supplied player list is allowed.
- Redux Toolkit owns feature data; do not introduce component-level API calls
  where a Redux boundary exists.
- Money uses integer INR minor units, an append-only balanced ledger,
  idempotency keys, and MongoDB transactions. Controlled development may use
  explicit `sandbox` money mode with PhonePe test credentials; every balance is
  labelled test money, withdrawals remain disabled, and live-money mode stays
  fail-closed until every documented release gate passes.
- Referral rewards are fixed at INR 10.00 in server-owned minor units and post
  once to the referrer's non-withdrawable `available` bucket only after the
  referred verified player completes a first Quick Match or Event. The client
  never submits an amount or qualification result; tournament completion and
  the referral-owned idempotency key remain authoritative.
- For a paid team Quick Match or Event, only the immutable ready-team captain
  may choose `captain_pays` or `split`. The server derives the complete roster,
  per-seat fee and payer for every hold. Captain payment charges the captain
  for all seats; split payment charges one exact seat fee to each accepted
  member. Admission plus every hold is one transaction, and capture, release
  or refund follows the snapshotted payer. Split-funded teams divide rewards
  across their immutable members. Captain-funded teams snapshot either
  `captain_keeps` or `reimburse_then_split`; the latter reimburses every funded
  seat fee to the captain before splitting remaining winnings across the team.
  Sporting standings remain owned by the canonical team.
- Player password reauthentication is required only for withdrawal requests.
  Deposits and Quick Match/Event entry rely on the verified session plus their
  provider, balance, hold, eligibility and idempotency contracts. Governance
  staff commands retain recent authentication.
- New Quick Matches use Game-backed `QuickMatchOffering`, Match, and Room data;
  do not revive legacy Tournament/TournamentType dependencies.
- Tournament Manager ownership migration completed 2026-08-21. The dedicated
  route is `/staff/tournaments`; governance status alone does not grant
  offering mutations, game scope is repeated by every backend command, and
  Approved Host submissions remain draft-only.
- Scalable Events use Event Manager-owned sequential stage definitions: bounded
  room size, explicit top-N/final rule, immutable ranked batch outcomes, and
  restart-safe paged generation. Open registration has no product seat cap;
  APIs and workers remain technically bounded and cursor-paged. Do not infer
  advancement from a fixed knockout bracket or accept player IDs from clients.

## Current Verified State

- Transactional email branding completed locally 2026-08-28. Verification and
  password-reset HTML share a compact, email-client-safe shell using the
  platform's existing amber `EG` mark plus `EGAMING ESPORTS`; the mark does not
  depend on remote image loading and plain-text alternatives remain intact.
  Focused backend account-email tests pass 6/6, diff check is clean, and Resend
  accepted a real branded preview to the confirmed owner address. Backend code
  still requires the normal commit/push deployment step.

- Transactional sender-domain activation started 2026-08-28. Resend contains
  `mail.sweetmemoriesgift.com` in Tokyo, while Hostinger remains only the
  registrar because `ns1.vercel-dns.com` and `ns2.vercel-dns.com` are
  authoritative. The exact Resend DKIM TXT, return-path MX, and SPF TXT records
  were added to Vercel DNS and independently resolve publicly. Resend accepted
  a live 2026-08-28 message from `noreply@mail.sweetmemoriesgift.com`; the
  account owner confirmed receipt and Resend reports the domain verified. Local
  and deployed `RESEND_FROM_EMAIL` now use
  `EGAMING ESPORTS <support@mail.sweetmemoriesgift.com>`, and Render deploy
  `dep-da8gs58n74is73dtvul0` is live. The configured API key is intentionally
  send-only. Vercel DNS now publishes `_dmarc.sweetmemoriesgift.com` as
  `v=DMARC1; p=none;`, confirmed through public DNS, and Resend accepted a live
  message from the support sender. Next prove the real verification/reset flows
  plus delivery-failure monitoring; strengthen DMARC only after observing clean
  alignment. No provider secret is tracked.

- Deployment repair prepared 2026-08-28. Vercel serves the current frontend,
  but Render reports backend commits `24fcdef`, `2fecb78`, and `3aca2f5` as
  `update_failed`; commit `2459968` remains live. Its legacy root-level Profile
  response caused the current client to store `null` and refetch roughly once
  per second. Render startup logs name the blockers: missing PhonePe callback
  username/password and Discord client ID/secret/redirect. The validator now
  permits both callback credentials to remain absent during documented manual
  sandbox reconciliation, requires them as a pair when enabled, and treats the
  configured Discord bot+guild publication pair separately from optional OAuth.
  The frontend validates the canonical private Profile envelope and fails into
  Retry instead of looping on a malformed 200 response. Backend focused gates
  pass 8/8; frontend focused gates pass 3/3 with ESLint, diff check and the
  567-module build. Backend `4a4d37e` is now `live` on Render and frontend
  `10a36ca` is `READY` on Vercel. An authenticated production API proof returns
  the canonical `{ success, message, data }` envelope with the expected private
  profile, closing the repeated-load incident.

- Deployed player-page audit completed 2026-08-27. Compete, Clan, Matches,
  Wallet, Account Settings and Quick Match details loaded against `e-gaming`
  without console errors or horizontal overflow. Blank Profile, Chats and Game
  Accounts routes were caused by obsolete full-profile route gates; each now
  uses its owned Redux/API boundary, and Profile exposes loading/error/retry
  states. The dashboard now fetches the canonical Wallet summary and both
  header variants format `availableMinor` instead of retired money fields.
  The first live recheck proved Game Accounts, Chats and the Wallet header, then
  found Profile still idle during auth bootstrap. Its private thunk now blocks
  only overlapping requests; route guards and the backend remain the auth
  boundary. Frontend verification passes 136/136, ESLint, diff check and the
  567-module build. Recheck Profile after the follow-up Vercel commit publishes.

- The 2026-08-27 presentation population is no longer deployed. Owner-requested
  cleanup on 2026-08-29 removed all 1,003 `egaming.test` dummy players and all
  Event state from `e-gaming`, while preserving every staff account and nine
  real players. The local seed utility remains available for deliberate future
  test-data setup, but its former account/Event counts must not be treated as
  current database state.

- Lean player-profile contract completed 2026-08-27: `GET /api/users/profile`
  returns only the signed-in player's identity, editable profile fields and
  linked game-account projection. Friends, requests, teams, bookmarks, active
  chats, clan, wallet and other operational data are no longer loaded through
  the profile API. Chats keep transient shortcuts in Redux and resolve friends
  through the canonical social boundary; saved Team pickers load only the
  dedicated player-team boundary. `GET /api/users/public/:playerTag` is an
  authenticated safe showcase: identity, HTTP(S)-only social links, verified
  game names/account display names (never account IDs), public clan summary,
  canonical completed Event/Quick Match worth metrics and the newest eight
  public results. Invitation-only Event history never enters it. Clan friend
  search retains a separate minimal actionable identity result. Profile UI now
  presents that showcase with compact worth, recent competition and clan
  sections. Backend passes 393/393, frontend 135/135, ESLint and the
  567-module production build; API docs cover 212/212. Authenticated desktop
  and 390x844 mobile proof passed 2026-08-27 using `bhupesh_player` viewing
  the populated `babu` profile. A stale Clan preview serializer/UI mismatch
  found during that proof now uses the Redux public-profile contract; identity,
  two verified accounts, social link, public clan and metrics render cleanly
  with no horizontal overflow.

- Player Profile refinement 2026-08-26: Profile now uses a compact identity
  header and two concise Game Accounts/Social Links sections. Statistics,
  private email display, excessive labels and the obsolete embedded Tournament
  history are removed. Bio and social editing share one mobile-scrollable
  dialog; JPEG/PNG upload copy matches backend enforcement. Public player reads
  now use Redux with request-ID stale protection, and only HTTP/HTTPS social
  links render. Staff utility mode stays read-only. Frontend passes 135/135,
  ESLint and the 567-module build. Authenticated desktop/mobile presentation
  proof remains open; the browser reached the expected Login guard cleanly.

- Controlled game-account replacement 2026-08-26: ordinary verified identity
  overwrite remains blocked, but a player may use one replacement per Game
  after 30 days and after active competition/financial obligations clear. COC
  repeats owner-token verification. Initial and replacement BGMI review accept one private, encrypted,
  signature/dimension/hash-checked PNG/JPEG; assigned Game Manager review can
  approve, reject or escalate it. Escalation temporarily freezes player
  mutations, Match/Event prize release, withdrawal approval and new provider
  submission until Platform/Super Admin clears or permanently bans the account.
  Automated image signals are not proof, browser upload cannot attest capture
  device, in-flight provider truth still reconciles, and legitimate ledger
  balances are never automatically confiscated. Backend passes 390/390;
  frontend passes 134/134, ESLint and the 567-module build; API docs cover
  212/212. Live authenticated S3 upload/review proof remains open.

- Simple chat contract 2026-08-26, revised 2026-08-30: Friend, Clan and Match conversations retain
  only the newest 200 MongoDB messages; Friend/Clan Redis windows retain 100
  and initially load 50. Older messages disappear automatically, with no read
  receipt, editing, deletion or permanent archive feature. Friend threads now
  keep owner-specific last-read timestamps and expose only that owner's unread
  count in the Chats sidebar; Clan and Match unread tracking remains absent. Friend and Clan
  socket sends now wait for a 10-second delivery acknowledgement, keep failed
  text available to retry, and treat Redis cache failure as non-fatal after the
  authoritative MongoDB save. Match chat prunes beyond 200 without converting
  cleanup failure into a false send failure. Clan chat visibility now loads the
  canonical current-membership record instead of treating the profile's raw
  clan ID as a populated object, so every active MEMBER/ELDER/COLEADER/LEADER
  can open it; non-members and staff participation remain server-denied.
  Personal messages now map to the other player's User ID in the UI, and an
  explicit authenticated `session:ready` handshake prevents room joins before
  backend chat handlers exist. Persisted Friend/Clan messages now carry the
  same canonical message ID through realtime delivery and acknowledgement;
  shared position-independent merging renders those two copies once. Room
  history and the live browser cache merge instead of replacing each other, so
  older rows stay visible whenever a new message arrives. Live messages and
  history loads are thread-ID checked, Clan events carry their Clan ID, and a
  ten-second load timeout prevents a permanent Joining state. The Chat page is
  viewport-bounded with internal scrolling and a mobile/tablet Back to Chats
  control; its redundant summary strip and duplicate page heading are removed.
  Unfriend
  transactionally deletes the pair's
  Personal Chat plus both active-chat rows, clears Redis after commit, and
  removes the live thread from both clients; re-friend starts empty. A live
  `babu`/`bhupesh_player` proof verified two-way display/reload and complete
  unfriend cleanup, then restored their Friendship with no old history.
  Prior backend aggregate baseline is 377/377; affected realtime passes 13/13
  and cleanup integration 1/1. Affected realtime passes 14/14. Frontend passes
  129/129, full ESLint and the 567-module build.
- Mobile player bottom navigation uses `Games` and `Settings` for the two long
  account labels and distributes compact items across available width; desktop
  labels remain unchanged.
- Account Settings omits its duplicate page header. Its manual password section
  is player-only and described only as withdrawal confirmation; staff security
  is handled by the automatic dialog inside Staff workspaces.
- Game Accounts has no summary statistics or supported-game count badge; only
  actionable per-Game account status and review history remain.

- Staff sensitive-action confirmation 2026-08-25: protected staff commands no
  longer require a trip to Account Settings when the server returns
  `RECENT_AUTHENTICATION_REQUIRED`. The shared staff shell opens a password
  dialog in place, sends the password only to the existing reauthentication
  endpoint, and automatically retries the original command once after success.
  Cancel stops the command, an incorrect password remains in the dialog, and
  neither password nor recent-authentication time is stored in browser state.
  The backend-owned 15-minute Redis session window and every role/scope rule
  are unchanged. Frontend verification passes 120/120, full ESLint and the
  566-module production build.

- Event responsibility amendment 2026-08-25: Admin `Event Management` is now
  the independent Template/Event approval queue only. Assigned-game Event
  Managers own invitation-only Run discovery, candidate search, invite/revoke,
  final sporting standings, round-result visibility and configured reward
  status through `/api/staff/events/*`. Every invitation read/write repeats the
  active Event Manager assignment and Game scope. The obsolete Admin invitation
  routes and controller handlers are fully removed, so unknown old URLs use the
  normal API-not-found response. Event Managers cannot release money. Completed Event allocations move to the separate Admin
  `Prize Review`, where the existing independent-review and recipient-conflict
  rules remain authoritative. Backend aggregate passed 375/375 including the
  new database scope denials; frontend passed 120/120, ESLint, diff checks and
  the 564-module production build. API documentation covers 208/208 operations.

- Staff dashboard refinement is complete in code. The shared staff shell now
  mirrors the compact player layout with a 14rem desktop rail, mobile bottom
  navigation, one concise workspace header and compact responsibility tabs.
  Match Operator and Game Manager use the shared tab pattern; Event Manager
  and Tournament Manager retain their useful left-side work navigation without
  duplicate role banners or instructional panels. Platform/Super Admin
  governance uses the same restrained spacing, and Event review, payment,
  prize, withdrawal and security panels show operational facts instead of
  long explanations. No route, role, game scope, API ownership or backend
  authority changed. Frontend verification passed 120/120, ESLint, diff check
  and the 563-module production build. The public browser pass reached the
  expected Login guard with no console warnings; an authenticated role-by-role
  visual pass remains the only follow-up for this presentation-only slice.

- Team Event registration and ranked/sequential execution are complete. A
  captain submits only a saved Team ID; the server re-derives the
  canonical ready roster and transactionally rechecks captain ownership, exact
  game/mode/size, member consent, player classification, bans, verified game
  accounts, capacity/waitlist and every invitation. Every member receives one
  registration with an immutable team/name/captain/member snapshot. Conflicting
  or overlapping teams, roster drift and retries cannot partially register.
  Free-entry team Events preserve immutable competition units through whole-
  team room composition, operator `rankingKeys`, advancement, team-place
  standings and deterministic team-total reward splitting. Room size remains a
  player count divisible by `teamSize`; `advanceCount` is a team count. Paid
  team entry now supports captain-funded or split-member holds with immutable
  payer evidence and all-or-nothing rollback. Captain-funded entry snapshots
  captain-keeps or reimbursement-first reward handling and ranked Event/Quick
  Match settlement follows that immutable policy. Legacy reviewed-plan/single-
  elimination team paths remain intentionally unsupported.

- Production worker/configuration hardening is complete in code. Event and
  payment workers now clean up partial startup, interrupt idle polling on
  shutdown, stop between bounded batches, close both datastores, and publish
  code-only structured lifecycle logs plus real MongoDB/Redis heartbeat probes.
  Runtime values and production validation share bounded polling/batch ranges;
  Render declares a 300-second worker drain. Sandbox deposits require callback
  credentials, and partial or non-HTTPS production Discord OAuth configuration
  fails startup. Duplicate canonical Discord role names now fail closed.
  External proof remains: paid Render worker provisioning, cloud secrets,
  supervised restart/heartbeat alerts, one exactly-once PhonePe sandbox credit,
  deployed Discord configuration, and later live payout/provider certification.
  Discord lifecycle publication and role sync now use a Mongo-backed leased
  outbox. Transactional mutations enqueue inside their session; the Event
  worker runs bounded reconciliation, lease recovery and retries. Stable
  delivery evidence prevents duplicates, current assignments remove stale
  roles, and private Events/lobby secrets remain excluded. Deployed worker
  supervision is still required before target-environment durability proof.

- Discord community code is complete. `EGAMING ESPORTS` now has bounded public,
  game, community and private staff areas plus a hidden Archive, original icon/
  banner assets and an idempotent dry-run/apply reset. Staff `/staff/discord`
  contains only Connect, Sync roles and Open Discord. One-time OAuth joins the
  member, stores identity without tokens and mirrors only active platform staff
  roles; suspension/revocation removes stale managed roles without affecting
  platform authority. Structured durable bot embeds publish public Event
  launches, generated rounds, Match schedules and dispute-closed/settled
  results while excluding invitation-only Events and private operational data.
  Two real BGMI Event launch cards are live with no footer; the superseded
  generic message and its one obsolete dispatch row were removed. Backend
  346/346, frontend 115/115 plus lint/build, docs 207/207 and diff checks pass.
  Discord Community is now live with `#rules` as the guidelines channel and the
  private `#discord-delivery-log` receiving both Community updates and safety
  notifications. The managed bot role is already above all six canonical staff
  roles, and the post-activation reset dry run has no remaining owner action.
  Local OAuth is configured: `DISCORD_CLIENT_SECRET` is loaded outside Git, and
  Discord Developer Portal contains the exact localhost and Render callback
  URLs. A Redis-backed authorization probe verified `identify guilds.join` and
  removed its temporary state. Authenticated proof connected the Platform Admin
  account to Discord user `babuva`; the live member exactly owns its five active
  Platform Admin, Tournament Manager, Game Manager, Event Manager and Match
  Operator roles with no sync error. Local integration is complete. Remaining:
  mirror the secret and deployed redirect setting into Render. Dispatch is now
  owned by the leased Mongo outbox and Event worker with bounded reconciliation;
  deployed worker supervision remains the external durability proof.

- Player Matches refinement 2026-08-24: `/dashboard/matches` remains one
  compact Live/Completed workspace, but its activity cards now match the
  Compete/Event visual system. Quick Match queues and Event rooms receive
  artwork-backed cards, clear source identity, concise game/mode/map context,
  status-only queue messaging, schedule/operator facts, T-10/start countdown
  priority and one direct action. A scheduled Match that misses its start time
  switches from a zero countdown to `Start delayed · waiting for operator`.
  Match detail removes the progress rail and uses Lobby, Chat, Dispute and
  Results tabs. The BGMI Lobby uses room-style player tiles: individual solo
  seats plus every capacity-implied two-seat duo and four-seat squad card,
  arranged in two columns on large screens. COC uses explicit Team A versus
  Team B war panels with five
  numbered slots per side. Slots use a modern flat filled-card treatment:
  occupied seats show a player initial, number and active marker, while vacant
  seats use a muted `Available` state. Player usernames wrap in full instead of
  disappearing behind single-line truncation. The signed-in player's seat is
  labelled `You`; duo/squad and COC also highlight the player's full team.
  Results
  renders the verified placement leaderboard.
  Loading uses card skeletons, failures expose Retry, and the page has a compact
  refresh control. No player Match command or lobby credential moved into the
  list. Frontend tests pass 116/116, lint and the 559-module production build
  pass, and the
  authenticated staff read-only Matches smoke remains clean. A populated
  player Match-room browser pass remains pending.

- Competition read caching 2026-08-24: high-frequency Quick Match discovery,
  scoped Tournament Manager offering lists, authorized Room leaderboards,
  private player Event discovery/detail, Event participant leaderboards and
  player standings now use short-lived Redis projections. Keys use versioned
  namespaces and hashed variants; concurrent misses share one loader, writes
  advance epochs, and an epoch recheck blocks stale refill races. Offering
  create/update, committed Quick Match join, Event registration, invitation
  and revocation invalidate their affected namespaces. MongoDB membership and
  invitation visibility remain authoritative. Auth/session, wallet/payment,
  notification, chat, operator evidence and lobby-secret Match responses
  deliberately bypass response caching. Backend aggregate components pass
  343/343, including competition policy 113/113 and replica integration
  102/102; focused cache behavior passes 5/5. The local Redis daemon was not
  available for a live adapter probe, so deployed hit/miss observation remains
  an operational follow-up; Redis-down fallback is verified.

- Team-entry recovery 2026-08-24 originally opened a Clan-owned team builder.
  Superseded 2026-08-28: `Create Team` now opens the independent Teams
  workspace and never requires Clan membership. Server-owned roster
  eligibility and competition join commands remain unchanged.

- Test competition catalog 2026-08-23: the active Event Manager scope now
  includes BGMI and COC. BGMI Monthly Championship has an active monthly
  Solo/Erangal Template and a scheduled September 2026 Run with registration
  open. COC Monthly Championship has an active 5v5/War Template and an
  `in_review` Run; approval remains correctly blocked until team Match
  execution, ranking, advancement, standings and rewards exist end to end.
  Seven active Quick Match combinations cover all current
  capabilities: BGMI Solo/Duo/Squad across Erangal/Miramar and COC 5v5/War.
  The prior paid BGMI Solo/Erangal offering was retained; six missing
  combinations were created as free on-demand offerings. The idempotent
  operational script and a second-run proof produced no duplicates, and a real
  verified-player read sees the BGMI Run plus all seven Quick Matches.

- Compete cards 2026-08-23: removed the oversized first-card spotlight and
  render every filtered Event and Quick Match in consistent compact poster
  cards. Both grids are one column on phones and two columns from small-tablet
  width; game artwork fills each card behind a readability gradient. Event
  countdowns, facts and action rows are condensed while retaining registration,
  personal-Match and progress behavior. Browse order is Game selection, Events,
  then Tournaments, with both competition categories filtered by the selected
  game and direct View/Join actions on eligible Events. The redundant Ready/user
  hero is removed so game selection is the first page section. Tournament cards
  expose mode, reward, entry, capacity, joined percentage/progress and leading
  placement rewards; their `View` action has no trailing arrow. Eligible player
  cards now expose `Join Now` directly for
  both competition types; a committed Event or current waiting-Room Quick Match
  replaces that action with `Joined`. A filled Quick Match Room instead exposes
  `Join Next Room`; only duplicate entry into the same current Room remains
  server-denied.
  Event timing follows the published long-form Run/round schedule; Quick Match
  timing follows Room fill -> operator claim -> Game Manager schedule and is not
  presented as a guaranteed one-hour start. The Event detail view now uses an
  artwork-backed compact header, 2x2 mobile facts and direct Join Now/disabled
  Joined actions. Its compact Rewards/Leaderboard subtabs use simple table
  rows, omit registration dates and show `-` as every initial rank. Final
  immutable standings replace those placeholders with authoritative places.
  The bounded backend participant feed exposes only registered display names
  and preserves invitation-only visibility. Player Matches is simplified to
  Live Matches and Completed;
  scheduled/filling activity stays active and terminal records move to history,
  with the old hero and explanation panels removed. On phones, the Game lobby
  is now a single three-column selector with
  6rem artwork cards, abbreviated counts and hidden descriptions instead of
  three tall stacked cards; tablet and desktop retain the larger presentation.
  Competition sections use only the concise `Events` and `Quick Matches` headings.
  The shared player shell is now compact: a 14rem label-only sidebar, reduced
  content padding, and condensed Chats, Wallet, Profile, Game Accounts and Clan
  headers/cards while retaining their actions and safety-critical state. On
  phones, the Clan profile uses tighter spacing, smaller identity artwork,
  responsive action buttons, a two-column fact grid and a three-line expandable
  description; the logo stays left, the name has its small copyable clan tag
  inline, and the plain description shares its identity
  column, and an icon-only bookmark ribbon replaces the Save/Saved text action.
  The roster uses one `Members` heading and shows only rank, avatar, player name
  and role; player tags, joined dates and leader/co-leader/elder summaries are
  removed. Mobile rows are shorter.
  Clan creation/settings description inputs are limited to 6rem.
  Frontend passed 114/114, full lint, diff check and the 556-module production
  build. Backend passed 338/338, including 102/102 competition integration;
  API documentation covers 203/203 operations. Authenticated visual review
  remains pending.

- Quick Match repeat-Room amendment 2026-08-23: membership uniqueness and paid
  holds are Room-scoped. A full Room remains an independent active Match but no
  longer blocks the player from the offering's next waiting Room. Exact retries
  are attempt-idempotent; new paid entries hold funds separately. Discovery,
  progress and private leaderboard selection prefer the current waiting Room.
  Tournament detail now mirrors Event detail with compact facts, Room progress,
  direct entry action and Rewards/Leaderboard tabs; My Matches is one compact
  Live Matches/Completed view. Startup safely removes only the two legacy index
  names before creating the new constraints. Backend 338/338, frontend 114/114
  plus lint/build, and API documentation 203/203 pass. Authenticated visual proof
  remains pending; the public local shell was console-clean.

- Quick Match/Event room lifecycle 2026-08-22: a full Room is claimed by a
  scoped Match Operator, scheduled and given lobby credentials by its
  assigned-game Game Manager, disclosed to joined players at T-10, started by
  the operator at schedule, and completed from the operator's full ranking.
  Player check-in and player result submission are retired. Joined players get
  a private member `Leaderboard`, no duplicate current-Room Join action, and
  deduplicated 50%/90%/full capacity notifications; after full they may enter
  the next same-offering Room. Operator and Game Manager dashboards
  now show bounded room progress/lineups and their exact owned actions. Wallet
  and staff dashboards were made more compact while retaining critical safety
  states. The authenticated audit also fixed stale `Aborted` list state,
  duplicate Solo labels, assigned-Room pickup wording and full-Room cards that
  ignored a generated Match's lifecycle. Backend aggregate passed 334/334
  (competition 107/107 and replica integration 99/99); frontend passed 108/108,
  full lint and the 557-module production build; generated API documentation
  covers 202/202 operations. Real Game Manager, Tournament Manager, Player and
  assigned Match Operator sessions passed desktop and 390x844 browser checks on
  the retained 100-player Room with no console errors or horizontal overflow.
  The exact temporary browser player and Wallet were removed after logout.

- Player password scope 2026-08-21: recent password confirmation was removed
  from PhonePe deposit creation and paid Event registration; Quick Match entry
  already had no such guard. Player withdrawal requests remain protected, and
  governance recent-auth rules are unchanged. Focused backend checks pass 22/22
  and focused frontend entry/authentication checks pass 4/4.

- PhonePe completion binding fix 2026-08-21: the SDK status response's provider
  `orderId` is now compared with the provider order saved at checkout, not the
  distinct merchant order used to query status. Exact amount/provider identity
  still fail closed. Focused payment checks pass 14/14 and payment replica
  integration passes 32/32. The affected ₹1,000 sandbox payment was reverified
  as `COMPLETED` and produced exactly one balanced deposit ledger entry; the
  target wallet now contains ₹1,000 available test money.

- Scoped game-account verification 2026-08-21: Game Manager now has a compact
  Account Verification workspace backed by bounded assigned-game APIs. Review
  requires recent authentication and sends only decision plus note; the server
  derives request/player/Game/reviewer identity, rejects cross-game access,
  commits user account state + terminal request + staff audit atomically, and
  serializes no email/wallet/raw internal data. Backend aggregate 328/328,
  frontend 103/103 with full lint and 557-module build, API docs 199/199, and
  diff checks pass. Authenticated desktop/mobile visual proof remains pending.

- Event sequential-operations amendment 2026-08-21: open Events persist no
  product seat cap. After initial governance approval and registration close,
  the scoped Event Manager configures one round at a time using room size,
  top-N promotion, timing and final-round state. Round 1 uses committed
  registrations; every later round uses only immutable promoted outcomes.
  Complete ordered room results retain bounded promoted/eliminated evidence.
  Admin routine close and round-review paths are retired; governance retains
  approvals, invitations, recovery, final evidence and independent rewards.
  Backend competition policy passed 100/100, replica integration 93/93, API
  docs 197/197; frontend passed 101/101, lint and the 556-module build.
  Authenticated desktop/mobile visual proof remains pending because the local
  API session check was unavailable during the final browser attempt.

- Staff workspace shell 2026-08-21: `/staff` is the assignment-derived role
  picker and every selected role opens its own responsibility dashboard inside
  the same bounded responsive layout as the player dashboard. Tournament
  Manager separates overview/create/readiness/live/history; Game Manager
  separates overview/Events/attention/operators/history; Match Operator
  separates assignment and owned-match desks; Event and governance retain
  their scoped section navigation. Full frontend state passed 101/101, lint,
  route smoke and the 563-module production build passed. Authenticated
  visual verification remains pending; the local unauthenticated route guard
  correctly redirects to Login.

- Tournament Manager ownership 2026-08-21: added the game-scoped
  `tournament_manager` StaffAssignment role and `/staff/tournaments`
  workspace. Canonical offering games/list/create/update now use
  `/api/staff/tournaments/*`; old admin offering mutations fail with stable
  `410 TOURNAMENT_MANAGER_ROUTE_REQUIRED`. Platform/Super Admin retain role
  assignment but no implicit offering mutation. Backend competition policy
  passed 97/97 and replica integration 91/91; frontend passed 99/99 with full
  lint and the 561-module production build; API docs cover 193/193 operations.
  The unauthenticated local route correctly redirected to Login; an
  authenticated visual role check remains pending because the local API was
  unavailable during the browser gate.

- Planning estimate: approximately 80% of the complete roadmap, 92% of the
  core playable platform, and 45% ready for unrestricted real-money traffic.
  These are planning estimates, not completion evidence.
- Latest backend aggregate passed on 2026-08-18. Canonical competition policy
  passed 91/91 and competition replica integration passed 86/86. Frontend
  state passed 86/86; full lint, route smoke, and the 552-module production
  build passed.
- Event detail refinement 2026-08-20: Compete Event cards open a dedicated,
  privacy-preserving detail route with rewards, personal progression and
  paginated standings. Registration actions are absent once the server window
  closes. Backend aggregate passed 305/305, Event registration replica checks
  passed 14/14, API documentation covers 181/181 routes, and frontend 90/90
  plus full lint and the 556-module build passed. Authenticated desktop/mobile
  visual verification remains pending.
- Event operations coordination 2026-08-20: Event Managers can inspect bounded
  registrations, rooms and standings, then atomically assign an eligible
  game-scoped Match Operator before play. Game Managers receive the same
  operational evidence read-only. Players and the assigned operator share a
  persistent, bounded, rate-limited private Match chat in their existing Match
  timelines. Open/limited Events remain safely spectator-visible after close;
  invitation-only Events remain private. Competition integration passed 90/90,
  competition unit 92/92, frontend 94/94 with full lint and a 559-module build,
  and API docs 192/192. The public localhost shell is console-clean;
  authenticated role-by-role desktop/mobile visual proof remains a follow-up.
- Competition entry UX 2026-08-20: Quick Match discovery/detail and Platform
  Admin offering management expose server-owned live seat progress; Event
  cards, detail, and Event Manager Runs expose authoritative registration
  progress. Player Join/Register actions open a responsive confirmation sheet
  showing exact free/paid terms and the wallet hold before the existing
  server-authorized command; they never request a password. Full Quick Match
  capacity fails closed. Mobile Login/Signup are bottom sheets anchored to the
  viewport; desktop keeps its two-column layout. Backend competition policy
  passed 93/93 and replica integration 90/90; frontend passed 97/97, full lint
  and the 561-module build; API docs remain complete at 192/192. A 390x844
  browser gate found no overflow or console warnings/errors.
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
- Verification-request history remains bounded for players and governance. The
  operational decision queue is now visible to scoped Game Managers with
  25-item opaque cursor pages and Redux append de-duplication; Platform/Super
  Admin retain the existing governance API fallback.
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
staff remains read-only, and paid Event entry is enabled only by the explicit
sandbox release flag. Password reauthentication is no longer required for
registration; verified-player, balance, hold and idempotency checks remain.

Shared-database Event Run `6a828224467598a0c5d5f545` completed a
1,000-player BGMI INR 2.00 sandbox rehearsal. Round 1 used Platform Admin for
10 rooms of 100/top 50; Round 2 used Super Admin for 5 rooms of 100/top 20;
the 100-player Final used the dedicated Match Operator. Completion evidence was
1,000 registrations/captured holds/rosters/standings, 3 stages, 16 Matches,
1,000 hold and capture ledger rows, and 10 pending plus 10 released reward
rows. Wallet totals are INR 8,000 available, zero entry-held, zero
prize-pending, and INR 550 withdrawable.

Owner-requested reset repeated 2026-08-21: the full Event/Tournament/Quick Match runtime,
all Matches/Rooms, registrations, competition reviews/audits, payment
Transactions, holds, ledger rows, prizes and withdrawals are now empty. The
reset preserved all 1,007 User/player accounts, all 1,005 Wallet identities,
verified game accounts, Games and staff assignments; every Wallet balance and
embedded transaction history is zero. Event Templates/Runs and Quick Match
offerings must be created again for the next test cycle. The latest transaction
deleted 1 Template, 3 Runs, 10 reviews, 2 Event jobs, 1 Quick Match offering,
2 payment Transactions, 2 reconciliation jobs and 6 related activity rows;
post-reset verification found every targeted collection at zero and cleared
the Redis competition keys.

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
  `Invitations`, and governance-only `Results & Rewards`. Routine round and
  batch operations live only in the Event Manager workspace.
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
mutations and player withdrawal requests fail closed with
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

Completed locally and verified 2026-08-13. `/staff/games` provides a
server-scoped, read-only attention queue for unassigned, delayed,
result-pending, and disputed Matches plus bounded operator action history for
each assigned game. It exposes no player rosters, emails, lobby secrets,
configuration commands, assignment controls, Event approval, or financial
data. The 2026-08-21 amendment adds only assigned-game account-verification
decisions; active Game Manager assignment and `gameScopes` remain the authority.

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
- Event Manager owns post-close sequential round configuration projected from
  the server-owned registered or promoted list. There is no routine per-round
  governance approval and no client player-list input.
- Open registration has no product capacity. Limited-seat and invitation-only
  schedules keep their explicit capacity and all technical reads remain paged.
- The Event Manager chooses players per room, top-N promotion, timing and final
  state for the current round only. Verified ordered results mark every player
  promoted or eliminated and feed the next round.
- Player `Compete` combines scheduled Events and Quick Matches. Separate
  Tournaments/Events navigation is removed; old list paths redirect to Compete.
  Event cards show countdown, entry/access/counts, rewards, committed status and
  the viewer's Match link.
- Gates: backend competition policy 100/100, competition integration 93/93,
  API docs 197/197; frontend 101/101, lint and 556-module build. Authenticated
  browser visual gate remains pending because the local API was unavailable.

## Latest Small Fix: Account Email Presentation

- Port 8080 development backend was stopped.
- Canonical email normalization is now identity-only; confirmation UI and
  Resend delivery preserve the player-entered email address.
- OTP success redirects to Login, the only session-creation path.
- Backend auth checks: 26 unit + 7 replica integration passed. Frontend: 52
  state tests and lint passed.
- PhonePe SDK loading is lazy and callback-only, so Render can boot even when
  its optional SDK install is malformed; configured callbacks fail closed 503.

## Latest Completed Slice: Team Events and Reliability Hardening

- Free-entry ranked/sequential team Events now execute end to end with immutable
  team units, player-capacity-aligned rooms, team operator rankings, whole-team
  advancement, team-place standings and exact deterministic reward splits.
- The independent review removed shared member-ID leakage and made promoted/
  eliminated feeds paginate one whole team per row. No additional P0/P1 issue
  was found in the reviewed path.
- Game Manager operational reads use aggregate counts plus independent per-game
  limits and supporting indexes, so a busy game cannot hide another assigned
  game's work.
- Discord delivery uses a leased Mongo outbox with transactional enqueue,
  bounded reconciliation, retry/lease recovery and idempotent evidence. Role
  revocation converges from current assignments; private Events and lobby
  secrets remain excluded.
- Profile upload verifies JPEG/PNG signatures, fixed fields and 512KB limits.
  COC tags, upstream timeouts/response sizes, Redis rate limits and redacted
  error mapping are enforced.
- Player Match and waiting-Room reads now have independent opaque cursors,
  stable indexed ordering, legacy-compatible arrays, Redux append/de-duplication
  and a compact load-older control.
- Verification: frontend 120/120, ESLint and the 561-module production build;
  backend maintained aggregate 375/375; generated API documentation covers all
  207 mounted operations. Paid Quick Match and ranked Event replica journeys
  prove captain-keeps and reimbursement-first reward allocations.
- Browser proof for an authenticated populated team Event/Match remains open.
  The public shell rendered console-clean, but port 8080 was unavailable.
  Withdrawals and unrestricted live money remain blocked.

## Work Immediately After This Slice

### Completed Slice: Captain-Funded Reward Handling

- Paid team entry snapshots `captain_keeps`, `reimburse_then_split`, or the
  server-derived `team_split` compatibility mode beside immutable payer
  evidence. The client submits no people, reimbursement values or allocations.
- Quick Match placement/winner settlement and ranked Event allocation honor
  the snapshot. Reimbursement returns every captain-funded seat fee first,
  then splits only the remaining winnings; insufficient reward stays with the
  captain. Split-funded teams continue deterministic member splitting.
- Compact Quick Match/Event team pickers expose `Keep full reward` and `Share
  with team`; Redux transports only the bounded enum.
- Gates: backend 375/375, frontend 120/120, ESLint, 561-module production
  build, API documentation 207/207 and both repository diff checks pass.

### Next Code-Critical Slice: Reliability and Remaining Scale Hardening

Team Event execution, Discord crash durability, upload/COC hardening and player
Match-history pagination are complete. Next, finish remaining social and
compatibility cursor pagination, Redux-boundary migrations, API graceful
shutdown/monitoring hooks, and opt-in browser/load failure scaffolding.
Preserve every live-money release gate. Do not enable live money or provision
paid workers without the documented external decisions.

### Completed Code Slice: Tournament Placement Rewards

- Canonical offerings accept `winner_split` or a contiguous 1-100 place INR
  table; Match financial snapshots are version 2 while version 1 remains
  compatible.
- Match Operator complete player/team ranking drives exact server allocations.
  Team-place totals split deterministically among complete Match team members.
  Governance settlement and independent release accept no client money.
- Tournament Manager form/cards, player Compete/detail/Match view, Match
  Operator ranking and governance release display are updated.
- Gates: backend 325/325 (competition integration 94/94, payments integration
  32/32); frontend 102/102, lint, 556-module build; docs 197/197; diff checks
  clean. Authenticated desktop/mobile browser verification remains the only
  open exit gate; the unauthenticated local shell was console-clean.

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
4. Repository worker/config hardening is complete. Perform the remaining
   supervised deployment, heartbeat/alert, provider and crash-recovery proofs
   only after the documented billing/release decisions.
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
