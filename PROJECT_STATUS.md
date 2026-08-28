# Project Status

Last updated: 2026-08-28

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

- Deployment audit 2026-08-28 found the exact cause of the persistent Profile
  loader. Vercel was current, but the last three Render backend deploys had
  failed startup and Render was still serving commit `2459968` from August 24.
  That legacy API returned Profile fields at the response root; the current
  frontend expected the canonical `{ success, data }` envelope, stored `null`,
  and retried continuously. Render logs identified missing PhonePe callback
  credentials and an incomplete Discord OAuth group. Production validation now
  treats signed PhonePe callbacks as optional only for the documented manual
  sandbox-reconciliation mode, requires callback credentials as an exact pair,
  separates Discord bot publication (bot+guild pair) from optional player OAuth
  (complete OAuth trio plus bot+guild), and leaves each unavailable capability
  fail-closed. The frontend rejects malformed Profile success payloads into a
  recoverable error instead of looping. Focused gates pass: backend 8/8 and
  frontend 3/3 plus ESLint and the 567-module build. Backend commit `4a4d37e`
  deployed `live` on Render and frontend commit `10a36ca` is `READY` on Vercel.
  An authenticated production request now returns 200 with root keys
  `success`, `message`, and `data`, including the expected private player
  profile. The infinite Profile request loop is closed.

- Deployed player-surface audit completed 2026-08-27 against the Vercel test
  frontend and `e-gaming` presentation data. Compete, Clan, Matches, Wallet,
  Account Settings and Quick Match details rendered without console errors or
  horizontal overflow. The audit found three routes trapped behind the retired
  detailed-profile gate (`Profile`, `Chats`, and `Game Accounts`) plus a stale
  header wallet projection. Those routes now use their dedicated Redux/API
  boundaries, Profile owns an explicit loading/error/retry state, the dashboard
  fetches the compact Wallet summary once, and desktop/mobile headers render the
  canonical currency plus `availableMinor`. The first production recheck also
  exposed Profile transport being suppressed while authentication bootstrap
  settled; the private request now depends only on its own overlap guard while
  route and server authentication remain authoritative. Frontend passes
  136/136, ESLint, and the 567-module production build. Recheck Profile after
  the follow-up Vercel commit publishes.

- Lean player-profile contract completed 2026-08-27. The private profile
  endpoint now returns only player identity, editable presentation fields and
  linked game-account data; it no longer populates friends, requests, teams,
  bookmarks, active chats, clan, wallet or unrelated operational records.
  Friends are read through the canonical social boundary, saved teams through
  the player-team boundary, and direct-chat shortcuts are transient Redux state.
  The authenticated public-profile read exposes a safe player showcase only:
  identity, HTTP(S)-only social links, verified game account display names
  without account IDs, public clan summary, exact canonical public Event/Quick
  Match metrics and the latest eight public results. Invitation-only Event
  activity is excluded. The Clan friend-search route returns a separately
  minimal actionable identity, keeping the showcase out of mutation lookup
  flows. Profile renders compact worth, recent-competition and clan sections.
  Backend aggregate passes 393/393, frontend passes 135/135 plus ESLint and
  the 567-module build; generated API documentation covers 212/212. Authenticated
  desktop and 390x844 mobile proof passed on 2026-08-27 using `bhupesh_player`
  viewing the populated `babu` profile. The check exposed a stale Clan preview
  serializer/UI mismatch, which is now Redux-backed by the public-profile
  contract; identity, two verified accounts, social link, public clan and
  competition metrics render without horizontal overflow or profile errors.

- Player Profile refinement completed 2026-08-26. The page now keeps one
  compact identity header plus concise Game Accounts and Social Links sections.
  Redundant statistics, private email display, explanatory labels and the
  obsolete embedded Tournament-history panel are removed; canonical Match and
  Event collections remain the source of competition history. Players can edit
  a bounded bio and social links together, while avatar/banner uploads advertise
  only the backend-supported JPEG/PNG contract. Public profile reads now cross
  the Redux boundary with stale-response protection, and rendered social links
  accept only HTTP/HTTPS destinations. Staff utility mode remains read-only.
  Frontend verification passes 135/135, full ESLint and the 567-module build.
  The unauthenticated browser guard was clean; authenticated desktop/mobile
  visual proof remains a presentation follow-up.

- Event responsibility amendment completed 2026-08-25. Admin `Event
  Management` contains only independent Template/Event approval. The scoped
  Event Manager workspace now owns invitation-only Event rosters plus final
  sporting results and reward-status visibility. Invitation routes live under
  `/api/staff/events/*` and repeat active Event Manager and assigned-Game checks.
  The obsolete governance invitation routes and handlers are removed completely;
  old URLs fall through to the normal API-not-found response. Event reward release did not move into
  operations: completed allocations appear under the separate Admin `Prize
  Review` and still require an independent non-recipient governance identity.
  Backend 375/375, frontend 120/120, ESLint, both diff checks and the 564-module
  production build pass; API documentation covers all 208 mounted operations.

- Staff workspaces use one compact player-style shell. Match Operator and Game
  Manager share concise top responsibility tabs; Event Manager and Tournament
  Manager keep compact left-side work navigation because their creation and
  operations surfaces need more room. Governance uses the same visual density.
  Duplicate role banners, decorative heroes and nonessential instructional
  copy are removed, while counts, state, actions and safety warnings remain.
  This is a frontend presentation contract only: staff roles, assignment/game
  scopes, routes, Redux/API ownership and server authorization are unchanged.
  Verification on 2026-08-25 passed frontend 120/120, ESLint, diff check and
  the 563-module production build. The unauthenticated browser route correctly
  reached Login without console warnings; authenticated role-by-role visual
  proof remains a follow-up.

- The platform is a modular monolith. Do not split services yet.
- Player Teams are independent of Clans. Any verified, participation-eligible
  player may create a Game/format-scoped roster and invite an accepted friend;
  the invited player must still be an accepted friend when accepting.
  The captain owns roster changes while forming; accepted members may leave,
  and the captain may disband. A player may hold only one active membership or
  pending invitation for the same Game/format/team-size combination. A later
  unfriend does not silently destroy an already accepted Team roster. Clan join,
  leave, role and membership changes never create, expose, restrict or destroy
  Teams. The canonical backend boundary is `/api/player/teams`; Teams have a
  dedicated player workspace and are not a Clan tab.
- Platform Admin and Super Admin own game setup, staff assignment, and Event
  approval. Tournament Manager owns Quick Match/Tournament offering setup and
  lifecycle only inside assigned game scopes.
- Tournament offerings support either the historical single winner-pool rule
  or an ordered INR place-reward table. Place rewards are immutable in each
  generated Match. Solo places pay the ranked player. Split-funded teams split
  a team-place amount deterministically across the snapshotted Match members.
  A captain-funded team snapshots either `captain_keeps` (the captain receives
  the complete team reward) or `reimburse_then_split` (the captain first
  recovers every funded seat fee, then remaining winnings split across the
  immutable team).
  The assigned Match Operator records and verifies the complete ranking.
  Platform/Super Admin settles it, and a different non-participant governance identity releases
  the exact ledger-backed allocations. No result, settlement, or release
  request accepts client-owned money or recipient amounts.
- Game Manager supervises operations for assigned games. Its mutations are
  limited to approving/rejecting scoped game-account verification requests,
  escalating supported initial or replacement evidence for independent fraud review, and
  setting the schedule plus lobby credentials for an assigned-game Match after
  a Match Operator owns it. Game/catalog configuration, competition definition,
  staff, result, dispute and money controls remain read-only.
- Game Manager supervision includes bounded Event registration
  identities, round/Match coverage, operator workload, and sporting standings
  for assigned games. It excludes email, wallet, lobby credentials, private
  Match evidence and chat. Game-account review receives only the submitted UID,
  in-game name, bounded proof note and safe player identity.
- A player may establish one Game identity per Game. A verified identity may
  be replaced once for that Game after it has remained verified for 30 days,
  provided the player has no active Room/Match/Event or pending financial
  settlement. COC replacement repeats live owner-token verification. BGMI
  first-time verification and replacement require one privately stored
  PNG/JPEG screenshot plus a fraud warning acknowledgement; during replacement
  the current verified identity stays active until a scoped Game Manager
  approves it. Pending requests are unique, rejected
  requests preserve the current identity, and approval atomically consumes the
  one lifetime replacement.
- Event Manager creates drafts inside assigned game scopes; Platform Admin
  reviews submitted Templates and Event Runs through an audited lifecycle.
  After a Run is approved, routine Event execution belongs to the scoped Event
  Manager: close registration, configure one round from the authoritative
  eligible-player count, create bounded Match rooms, assign operators, inspect
  verified promotion/elimination evidence, configure the next round, manage
  invitation-only rosters, and inspect final sporting results/reward status.
  Governance Event Management owns only independent Template/Event approval.
  Governance retains disputes, exceptional recovery and independent ledger
  release under its dedicated review workspaces; it does not manage Event
  invitations, sporting results, or routine room plans.
- Event Manager operational reads and commands remain game-scoped and bounded.
  They omit player emails, wallet data, lobby credentials and private chat.
  Round commands never accept player IDs: the server derives Round 1 from the
  committed registration roster and every later round from immutable promoted
  outcomes.
- Invitation-only Event Runs are private in player discovery: only players
  with an active invitation may see their registration card or participate.
- Event participant leaderboards are cursor-bounded and expose only a safe
  display name. Registered players begin with no sporting rank (`-` in the
  UI); only final immutable standings replace it with an authoritative place.
  Waitlisted/cancelled entries are excluded. Open/limited Events follow their
  spectator visibility, while invitation-only Events retain exact private
  visibility at the backend read boundary.
- The separate `e-gaming` presentation database was prepared 2026-08-27 without
  changing the local `node-auth` database. One idempotent local command,
  `scripts/seedPresentationDatabase.js`, owns setup and joining: 1,000 verified
  funded players, 20 clans, 940 ready BGMI/COC teams, baseline accepted friend
  pairs plus every friendship required by seeded Team rosters, five staff identities and eight assignments using only the existing
  canonical roles/scopes. Every player has INR 1,000 of ledger-backed sandbox
  funds. The same command creates independently reviewed BGMI Solo/Erangal and
  COC 5v5/War monthly Templates plus two approved September 2026 open paid
  Events with INR 10 per-seat entry and place-wise top-ten rewards. It also
  creates 14 active free Quick Matches: BGMI Solo/Duo/Squad across all four
  configured maps and COC 5v5/10v10 on War, each with place-wise rewards. A
  fifteenth active BGMI Squad/Erangal Quick Match uses sandbox paid entry at
  INR 10 per seat and place rewards of INR 500/300/200. The existing
  `bhoopi.patel.92372@gmail.com` presentation player now has verified BGMI and
  COC identities, INR 1,000 sandbox funds, three accepted test friends, and
  captain-owned ready `Bhoopi Test Duo` and `Bhoopi Test Squad` rosters.
  `--join-only` lists these choices and joins a bounded requested player count
  through the canonical Event/Quick Match services without repeating account
  or Wallet setup. No deployed API/UI test-lab route exists, credentials are
  not tracked, and the command refuses any database other than exactly
  `e-gaming`. The older hardcoded account/dummy/catalog seed scripts are
  removed. Database verification matched every stated count and exact Wallet
  balance; the featured setup and catalog are idempotent, and the backend
  aggregate remains green at 393/393.
- Open and limited-seat Events remain spectator-visible after registration
  closes through completion. Invitation-only Events remain private. Spectator
  reads expose schedules, safe round/Match status and sporting standings only;
  registration controls disappear and lobby/private evidence never leaks.
- Event registration is a player commitment. Confirmed and waitlisted players
  cannot cancel or re-enter; one registration remains attached through every
  later Run round, including weekly-spaced rounds when configured. Players do
  not re-register per round. Direct cancellation receives stable 409. Only an
  audited platform-owned Event failure/cancellation may release entry funds.
- Event Run approval covers registration timing, admission, entry terms and
  rewards only. After registration closes, the Event Manager configures one
  round at a time using room size, promotion count, timing and final-round
  intent. The backend projects the exact rooms from the current server-owned
  player list. Verified ordered Match results mark the configured top players
  promoted and every other room participant eliminated. The next round can be
  configured only from that promoted list.
- Event proposals move through `draft`, `in_review`, `changes_requested`,
  `active`/`scheduled`, or `rejected`; creators and latest submitters cannot
  review the same revision.
- Event review UI compares those identities through the authenticated Redux
  `userId`. A different Platform/Super Admin may review; backend policy remains
  authoritative. This fixed the previous false visual block for Super Admins.
- Match Operator requires assigned game scope and executes only matches they
  explicitly claim or receive within that scope.
- Quick Match operational lifecycle amendment 2026-08-21: a full Room creates
  an `awaiting_operator` Match; an assigned-scope Match Operator claims it;
  the assigned-scope Game Manager then owns the bounded Match schedule and
  lobby credential configuration. Lobby credentials remain hidden from
  players until exactly ten minutes before the scheduled start. Player
  check-in is retired for Quick Match and Event Matches: the assigned operator
  may start only at or after the confirmed schedule with lobby evidence
  present. Game Manager receives no result, dispute, settlement, prize, wallet,
  or chat authority from this scheduling responsibility.
- Quick Match participation is waiting-Room-scoped, not offering- or globally
  exclusive. A player may hold only one seat in the current waiting Room for an
  offering. When that Room fills it becomes an independent Match and the next
  waiting Room opens immediately; the same player may join it while the prior
  Match is still active. Every fresh entry independently enforces game account,
  roster, capacity and funds. A caller-owned attempt ID makes retries return the
  original Room instead of charging or joining the next one accidentally.
- Quick Match joined-roster visibility is private to members of that exact
  active Room. The player UI calls it `Leaderboard`, but before results it is
  only an ordered joined-player lineup and must not imply sporting rank.
  Non-members cannot enumerate it. Joined players receive idempotent capacity
  notifications when their Room first reaches 50%, 90%, and full.
- Quick Match/Event room-operations amendment completed 2026-08-22. The
  backend now enforces full Room -> scoped operator claim -> assigned-game
  Game Manager schedule/lobby setup -> T-10 credential disclosure -> operator
  start at schedule -> operator ranking/result. Player check-in and player
  result submission routes are retired with stable responses. Operator and
  Game Manager workspaces expose bounded room progress and only the authority
  each role owns; joined players receive a private lineup and cannot duplicate
  their current waiting-Room entry. A filled Room no longer blocks entry into
  the next Room for the same offering. Wallet and staff shells were simplified
  without removing
  financial safety disclosures. The authenticated audit also fixed stale
  `Aborted` list state, duplicate Solo/team wording, assigned-Room pickup labels
  and full-Room player cards that ignored the generated Match lifecycle.
  Verification: backend aggregate 334/334 (competition unit 107/107, replica
  integration 99/99), frontend 108/108 plus full lint and 557-module production
  build, and generated API coverage 202/202. Real Game Manager, Tournament
  Manager, Player and assigned Match Operator sessions passed desktop and
  390x844 browser checks against the retained 100-player Room with no console
  errors or horizontal overflow. The temporary browser player and Wallet were
  transactionally removed.
- Compete card refinement completed 2026-08-23. The oversized first-offering
  spotlight was removed: every filtered Event and Quick Match now renders in a
  compact responsive poster card, one column on phones and two columns from
  small-tablet width. Game artwork is the full-card background; explicit dark
  gradients keep status, mode, title, countdown/timing, money, capacity and
  actions readable. Event countdowns and action rows were condensed without
  removing registration, personal-Match or progress behavior. The Quick Match
  feed no longer drops offerings after the first five. Browse order is now
  Game selection -> game-filtered Events -> game-filtered Tournaments; eligible
  Event cards expose direct View Event and Join Now actions. The redundant
  personalized Ready hero was removed so Compete opens directly on game selection.
  Tournament cards explicitly show mode, total reward, entry fee, seat capacity,
  joined/maximum progress, percentage and placement-reward previews when present.
  Their compact `View` action uses text only, without a trailing arrow.
  Eligible player cards expose `Join Now` for both Events and Quick Matches;
  committed Events and current waiting-Room entries replace it with `Joined`.
  Once a Quick Match Room fills, its card/detail opens `Join Next Room` without
  waiting for that Match to finish. The backend rejects duplicate entry into the
  same Event Run or current Quick Match waiting Room. Event
  cards follow their published long-form Run and round timing. Quick Matches
  follow Room fill, operator claim and Game Manager scheduling; the UI does not
  invent a one-hour start guarantee when no persisted schedule exists.
  Event details now use an artwork-backed compact header, 2x2 phone facts and
  direct Join Now/disabled Joined actions. Registration dates and separate
  oversized panels are removed. One compact section switches between Rewards
  and Leaderboard subtabs: rewards use simple Place/Reward rows without
  repeating the currency label, while registered players use Rank/Player rows
  with `-` until final results supply an authoritative placement. The backend
  leaderboard is bounded, registered-only and display-name-only; invitation
  privacy is rechecked through the exact Event read before any roster page.
  The player Matches page is reduced to Live Matches and Completed sections;
  filling, assigned, scheduled, live and result-review activity remains in the
  active section, while verified, settled and cancelled records move to history.
  The hero, lifecycle explanation panels and discovery shortcut were removed.
  Player-dashboard density was reduced across the shared shell and primary tabs:
  on phones, the Compete Game lobby is a compact three-column selector using
  6rem artwork cards, abbreviated counts and no description copy; larger cards
  return at tablet width. The player feed uses concise `Events` and `Quick Matches`
  headings without repeated selected-game explanation copy. The shared shell remains responsive and
  the sidebar is narrower with compact label-only rows, page padding is smaller,
  and Chats, Wallet, Profile, Game Accounts and Clan no longer use oversized
  promotional heroes. Functional actions, account states, wallet safety notices,
  balances, verification queues and player identity controls remain present.
  Clan mobile refinement reduces profile spacing and badge size, keeps actions
  responsive, retains facts in a compact two-column grid, clamps long clan
  descriptions to three lines behind `Read more`, and limits description inputs
  to 6rem on phones without truncating stored content. The Clan identity keeps
  its logo left, places a small copyable tag inline with the name and the plain
  description beside it, removes the redundant `Your Clan` label, and uses an
  icon-only top-right bookmark ribbon instead of Save/Saved copy.
  The member section uses one `Members` heading and only rank, avatar, player
  name and role; player tags, joined dates and leader/co-leader/elder summaries
  are removed. Mobile rows are shorter.
  Frontend verification passed 113/113, full lint, diff check and the
  557-module production build. Backend verification passed 335/335, including
  100/100 competition replica checks, and API documentation covers 203/203
  mounted operations.
  Authenticated visual review remains a follow-up.
- Match conversations are private operational records shared only by the
  Match participants and its currently assigned Match Operator. Messages are
  persisted, bounded, rate-limited and identity-derived; Event/Game Managers
  do not receive chat access through their read-only dashboards.
- Staff may open the player dashboard only as a read-only utility for platform
  visibility. Staff accounts cannot join, register, check in, submit player
  results/disputes, use social/team/clan participation, or initiate player
  money actions.
- Redux Toolkit thunks are the required feature-data boundary. Migration is
  incomplete; do not add new direct API calls to feature components.
- Backend authorization is final. Frontend route guards and hidden UI are only
  navigation helpers.
- Competition entry UX refinement 2026-08-20: Quick Match list/detail reads
  include server-owned live Room seat progress, and Event surfaces use
  authoritative registration counts. Player Join/Register opens a responsive
  confirmation sheet showing the exact free/paid terms and wallet hold; it
  never requests a password or accepts a client-owned amount. Full Quick Match
  capacity fails closed at backend eligibility. Mobile Login/Signup render as
  bottom sheets anchored to the viewport while desktop retains the two-column
  layout. Backend competition policy passed 93/93 and replica integration
  90/90; frontend passed 97/97, full lint and the 561-module build; API docs
  remain complete at 192/192. The 390x844 browser gate was console-clean.

### Do Not Change Without Recording It Here

- `User.role` values: only `player` and `staff`.
- Staff roles: Super Admin, Platform Admin, Tournament Manager, Game Manager,
  Event Manager, and Match Operator.
- Platform Admin-only authority over game configuration and staff access.
- Game Manager has no write route for Game configuration. Its scoped writes
  are the audited game-account verification decision and pre-start Match
  schedule/lobby configuration for assigned games. It cannot claim or operate
  Matches, verify results, resolve disputes, settle money, or release prizes.
- Event Manager cannot approve/publish its own Templates or Event Runs, resolve
  financial governance, or release ledger-backed prizes. It does own scoped
  invitation rosters and sporting result/reward-status views after approval.
- Once an Event Run is approved and registration closes, its scoped Event
  Manager owns routine round setup and Match-room handoff. Platform governance
  retains recovery/dispute/reward authority, not per-round approval.
- Staff player-dashboard access is read-only; only `User.role = player` may
  execute player participation commands.

### Fast Completion Critical Path

Planning estimate updated 2026-08-16: approximately **80% of the complete
documented platform roadmap is implemented**, approximately 92% of the core
playable system exists, and approximately 45% is ready for unrestricted
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
   - Completed locally 2026-08-11: reviewed withdrawal/payout lifecycle;
     production requests stay disabled until the provider adapter/worker gate.
   - Completed locally 2026-08-11: paid Solo and Team database/browser proof;
     paid discovery stays disabled until the external provider gates pass.
2. **65% -> 75%: finish the canonical competition migration.**
   - Completed 2026-08-11: migrate legacy host/detail/data paths to Game-backed
     `QuickMatchOffering`, Match, and Room boundaries.
   - Completed 2026-08-18: after migration and zero-record proof, remove the
     legacy Tournament/TournamentType runtime, routes, collections and UI.
3. **75% -> 85%: deliver the Event MVP end to end.**
   - Completed 2026-08-13 and refined 2026-08-20: registration window,
     admission policy, capacity/FIFO waitlist, committed registration, and
     invitation governance.
   - Completed locally 2026-08-13: immutable verified outcomes, restart-safe
     later rounds, disputes/corrections, bounded tied standings, and durable
     sporting completion.
   - Completed locally 2026-08-16: Event placement rewards. Each Run carries a
     proposed INR minor-unit reward table keyed by finishing place (for example,
     1st through 10th); Platform Admin independently approves the immutable
     table before registration. Every player sharing a standing place receives
     that place's configured amount, so tied ranks are funded explicitly rather
     than split or inferred. Completion will create ledger-backed
     `prize_pending` allocations from the final immutable standings, followed
     by an independent governance release to `withdrawable`. Initial draft UI,
     validation, review disclosure, completion allocation, and governed release
     UI are in place. Replica-set proof covers tied-place allocations,
     approver/recipient denial, concurrent idempotent release, and exact wallet
     movement. Focused frontend Event tests, lint, and the 548-module build
     pass. Browser/API proof and the final financial audit now pass.
     Local runtime note 2026-08-14: `/readyz` proved MongoDB and Redis ready
     after Redis was restored. The public frontend shell renders console-clean.
     The authenticated Event Manager browser gate passed on 2026-08-14:
     assigned BGMI scope, approved-template selection, supported first-stage
     controls, and the placement-reward section rendered with no console
     warnings or errors. No Event data was created or changed.
     Final code-level financial audit 2026-08-14 fixed the release read model:
     an Event's original approving administrator now receives
     `EVENT_PRIZE_INDEPENDENT_REVIEW_REQUIRED` and `canRelease:false` before a
     command is attempted. The audit also fixed recovery-created first-stage
     jobs to use the authoritative Event closure clock rather than wall-clock
     schema defaults. The focused placement-reward replica test passes.
     Production dependency audit 2026-08-14: `npm audit --omit=dev --json`
     reported zero production dependency vulnerabilities for both frontend and
     backend lockfiles. This does not replace deployment, runtime, or provider
     security validation.
     Live Event Manager proof created and submitted a temporary BGMI schedule
     using distinct registration/open/close/start dates and #1/#2/#3 rewards
     of INR 50/25/10; persisted evidence was 5000/2500/1000 minor units. The
     temporary Run and review evidence were then removed. The admin queue now
     visibly requires an independent reviewer for creator/last-submitter
     proposals and blocks selection plus decision transport before the server
     policy is reached. Focused Event frontend tests and lint pass.
     Final runtime proof 2026-08-16 used the existing Super Admin as immutable
     approver and the existing Platform Admin as independent reviewer for a
     disposable INR 95.00 Event. The UI showed final places 1, 2, 3, 3 and the
     released state with a clean console. Database evidence showed allocations
     5000/2500/1000/1000 minor units, zero prize-pending balances, exact
     withdrawable balances, four `prize_pending` entries, and four
     `prize_release` entries. Only the disposable Event/game/player fixture was
     removed afterward; both governance identities were preserved.
   - Completed locally 2026-08-16: scalable ranked Event stages. A reviewed Run
     can define up to 32 independently configured rounds with bounded 2-100
     player rooms, explicit `top_n` or final-ranking rules, room spacing,
     check-in timing, and next-round delay. Deterministic projection validates
     convergence for large rosters such as 5,000, 10,000, and 100,000 players;
     there is no product-level fixed Event capacity. Restart-safe paged workers
     freeze the admitted roster, create each batch/Match once, consume only
     verified full-room rankings, and generate later rounds from immutable
     outcome evidence. Match Operators can submit the complete ordered room
     result; Platform governance retains verification/dispute authority.
     Event Managers may propose a changed room size, top-N, or timing for an
     ungenerated future round. The proposal is immutable, game-scoped, blocks
     generation while pending, and requires an independent Platform/Super
     Admin decision; generated rounds cannot change. The review queue is
     opaque-cursor paginated.
     Final standings now preserve eliminated-player evidence as first-class
     filterable data: placement, elimination round, batch/room, elimination
     time, and immutable source outcome. Governance can filter champion versus
     eliminated players and a specific elimination round without loading raw
     roster/job data. Placement rewards continue to derive only from final
     immutable standings.
     Verification: backend competition policy 103/103 and replica-set
     integration 79/79; focused scale/adjustment journey 4/4; frontend state
     79/79, full lint, and 551-module production build. Desktop Platform Admin
     and Event Manager pages plus 390x844 controls rendered without overflow or
     console warnings/errors.
   - Remaining: production worker deployment evidence. `render.yaml` now declares the
     separate `egaming-event-worker`; setting its required Render environment
     values and proving supervision/restart behaviour remains an external gate.
4. **85% -> 93%: finish role-specific staff workflows.**
   - Complete Platform Admin Event review, Event Manager handoff, Game Manager
     health/escalation, Match Operator workload/handoff, staff profiles, and
   security-event review with responsive browser checks.

Operational baseline refinement 2026-08-14: backend web and Event-worker
startup now execute a fail-closed production configuration validator. It never
prints secrets, rejects missing/placeholder mandatory values, and rejects any
attempt to enable paid entry. `PRODUCTION_RUNBOOK.md` documents Render
deployment checks and a paired web/worker rollback. This is repository-level
evidence only; target-environment deployment, worker supervision, readiness,
and restart proof remain external gates. Focused tests lock the `/readyz`
health check, separate Event worker command, and paid-entry false default.

Live deployment verification 2026-08-14: the deployed Render API
`https://gaming-platform-backend.onrender.com/readyz` returned 200 with both
MongoDB and Redis ready. The Vercel frontend returned 200, its production
bundle references that backend origin, and a credentialed CORS preflight from
the Vercel origin returned 204 with the exact allowed origin and credentials.
The initial Vercel bundle exposed a blank page because an unsafe custom Vite
vendor-chunk cycle initialized React incorrectly (`Children` was undefined).
The custom chunk groups were removed, the production bundle was rebuilt, and
the owner and a fresh browser check confirmed the redeployed frontend works
without console errors. The separately supervised
Event-worker startup/restart proof remains pending.

Deployment and PhonePe checkpoint 2026-08-16: backend commit `12e6696` is
live on Render with `/healthz` and `/readyz` returning 200; frontend commit
`2545a89` is READY on Vercel and the production alias returns 200. Immediate
Render/Vercel error scans were clean. The complete release gates passed 303
backend tests and 80 frontend tests plus lint and the 551-module build.
PhonePe checkout, order status, and callback verification now share the current
official scoped Node SDK and one client-credential contract. A real INR 1.00
sandbox checkout/status probe returned `PENDING` without completing payment or
touching a wallet. New deposit requests atomically commit their pending
Transaction and reconciliation job before provider I/O; timeout and rollback
replica tests prove zero premature wallet/ledger writes. The merchant callback
username/password are not configured, so signed callback proof remains open.
The connected Render workspace currently lists only the existing API web
service. Its settings are now corrected to `npm ci`, validated `npm start`,
and `/readyz`; a dedicated email-token signing secret is configured without
printing or storing it in the repository.
`render.yaml` now declares separate Event and payment-reconciliation workers,
but both still require target-environment provisioning, shared cloud datastore
secrets, supervision, and restart evidence. The original fail-closed deployment
kept deposit and paid-entry flags false; that checkpoint was superseded by the
explicit sandbox-only testing refinement below. Live-money mode remains closed.
Render
offers Background Workers only from Starter at $7/month, so both required
workers represent an explicit $14/month spend and have not been created.
Product decision 2026-08-16: worker provisioning is deferred to final launch.
Development Events may use the existing audited Platform Admin close, retry,
and advancement controls. Sandbox payments may use the new audited manual
provider-status reconciliation; manual wallet credits remain forbidden. Both
workers, supervised restart evidence, and one exactly-once sandbox deposit
remain mandatory launch gates.

Sandbox-money testing refinement 2026-08-16: development/testing may now enable
PhonePe deposits and paid Quick Matches only when the server is explicitly in
`PLATFORM_MONEY_MODE=sandbox`, the PhonePe environment is sandbox/uat, and each
feature flag is exactly true. Wallet and competition UI label all resulting
balances as test money; withdrawals remain unavailable. Platform Admin owns a
bounded manual reconciliation queue. Its verify command accepts only the job
identity and asks PhonePe for authoritative status; settlement additionally
requires the provider order ID and minor-unit amount to exactly match the
stored Transaction. Mismatch or retry creates zero additional credit. Live
money remains fail-closed, and manual wallet credit is never a substitute.
The backend aggregate passed 310/310; frontend state passed 84/84 with full
lint and the 554-module production build green.

Deployment evidence 2026-08-16: Vercel/Render is the public testing/staging
platform, not a live-money launch. Backend commit `7cf9442` is live on Render;
`/readyz` returned 200 with MongoDB and Redis ready. Frontend commit `cb98193`
is READY on Vercel. Render is configured for explicit sandbox money mode with
test deposits and paid entries enabled, while withdrawal requests are false.
PhonePe return navigation is now independent from the multi-origin CORS list:
the deployed service uses the public Vercel Wallet HTTPS URL, while local
development may use localhost. Checkout completion and exactly-once governance
reconciliation proof remain pending; this is not live-money release evidence.

Operator scale refinement 2026-08-16: assigned and unassigned Match Operator
queues now have separate typed opaque cursors, bounded 25/50-item pages, stable
indexed ordering, Redux stale-request protection and append de-duplication, and
load-more UI. This removes the previous unbounded operator queue read.

Recent-authentication refinement 2026-08-14: Account Settings has a
password-confirmation control that calls the authenticated, rate-limited
`POST /api/auth/reauthenticate` route. The server stores only a timestamp in
the active Redis session; it never stores or returns the password. Platform/
Super Admin mutations and player withdrawal requests require that timestamp
to be fresh for 15 minutes. Player deposits and competition entry do not ask
for a password; their provider, balance, hold, eligibility, idempotency and
participation checks remain authoritative. Protected actions return stable
`RECENT_AUTHENTICATION_REQUIRED` otherwise. Login creates the initial proof;
refresh does not extend it. Backend auth policy/session checks pass 38/38 and
frontend state tests pass 74/74 with lint clean and the 548-module production
build passes.

Pagination audit refinement 2026-08-14: retired the unused, unbounded
Platform Admin user, transaction, and legacy Tournament list routes. Their
backend paths now return stable `410 ADMIN_LIST_ROUTE_RETIRED`; their
unmounted frontend components, exports, and Redux transports are removed.
Bounded Role Management, Withdrawal Review, Prize Review, and other active
governance workspaces remain the supported routes. Backend auth checks pass
38/38; frontend state tests pass 74/74 with lint clean.

Verification-history pagination refinement 2026-08-14: player game-account
verification history and the Platform Admin review queue now use 25-item
cursor pages (maximum 50), deterministic `(createdAt, _id)` ordering, and
supporting compound indexes. Player history is Redux-owned; both screens
append server-cursored pages without duplicate entries. Focused transport
checks pass, as do frontend lint and the 546-module production build.

Staff-directory pagination refinement 2026-08-14: the active governance
assignment directory now uses 25-item opaque `(updatedAt, _id)` cursor pages
(maximum 50), a matching role/time index, and Redux append de-duplication.
Revoked role rows remain visible for deliberate reassignment. Focused state
checks, frontend lint, and the 546-module production build pass.
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
   - Operational setup started 2026-08-28: Resend owns the dedicated
     `mail.sweetmemoriesgift.com` sending domain in Tokyo, and its exact DKIM,
     return-path MX, and SPF records resolve publicly from the authoritative
     Vercel DNS zone. Resend accepted a real message from
     `noreply@mail.sweetmemoriesgift.com` to the account owner on 2026-08-28;
     the owner confirmed inbox receipt and Resend now reports the domain
     verified. Local and deployed `RESEND_FROM_EMAIL` use the trust-oriented
     `EGAMING ESPORTS <support@mail.sweetmemoriesgift.com>` sender, and the
     Render configuration deploy is live. Vercel DNS also publishes the
     monitoring-mode `_dmarc` TXT policy (`p=none`), and Resend accepted a
     second live message from the new support sender.
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
   - Completed 2026-08-18: Match accepts only Quick Match or Event sources,
     Room requires a QuickMatchOffering, and legacy competition compatibility
     routes, models, fields, indexes and frontend modules are removed.

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

Completed refinement 2026-08-11: canonical provider-aware email normalization
is an internal identity/uniqueness key only. `emailDisplay` preserves the
address the player entered for UI and Resend delivery, and OTP promotion sends
the player to Login because verification never creates a session.

#### 2. Canonical Game and Quick Match Foundation

1. Completed in code: Platform Admin creates and activates a Game with its immutable key,
   supported modes/maps, and account-connection policy.
2. Completed in code and ownership migration in progress 2026-08-21:
   `QuickMatchOffering` is the canonical configurable product:
   Game, supported mode/map, team size, capacity, region, entry policy,
   schedule policy, and lifecycle (`draft`, `active`, `paused`, `retired`).
3. Completed for new Quick Match runtime records: Match and Room reference `QuickMatchOffering` and the
   Game-backed capability values. New runtime competition records must not use
   hardcoded BGMI/CoC or legacy Tournament enums.
4. Publish data migration, compatibility, rollback, and test plans; migrate
   frontend reads/writes before retiring Tournament/TournamentType routes or
   stored references.

Exit: a game-scoped Tournament Manager can publish an offering for any active
game inside their assignment, and an eligible player can enter its queue
without a legacy Tournament record.

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

Deployment safeguard 2026-08-11: the PhonePe SDK is loaded only when a fully
configured callback is actually validated. A missing or malformed optional SDK
cannot stop API startup; the callback fails closed with a 503 provider-unavailable
response until the provider deployment is repaired.

#### 5. Platform Administration and Governance

1. Super Admin and Platform Admin use `/panelAdmin` for governance. Platform
   Admin owns Game configuration, staff access, and Event approval. Tournament
   offering publication belongs to game-scoped Tournament Manager; backend
   policy remains final.
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

Status: **Sporting lifecycle and durable player notifications complete locally;
Event finance and production worker deployment remain.** Separate `EventRegistration` and platform-owned `EventInvitation`
records now provide transactional `open`/`invitation_only`/`limited_seats`
admission, bounded capacity, optional FIFO waitlists, irreversible player
registration, and safe invitation consumption/revocation. Event
Manager draft Runs declare admission terms; Platform Admin approval validates
and displays them, then uses bounded invitation-run discovery, verified-player
candidate search, and cursor-paginated safe history. Player discovery,
registration, committed-state display, and authoritative counter refresh are
Redux-owned; staff sees
read-only availability and cannot send participation commands. This vertical
slice passed its admission gates on 2026-08-13. The first-stage handoff is also
complete locally: a reviewed immutable format/execution plan, durable EventJob,
frozen eligible roster, deterministic EventStage/EventBatch/Event Match graph,
bounded recovery APIs, player-own-batch privacy, and transactional Match start
propagation now exist. Later-round advancement is also complete locally:
immutable dispute-closed outcomes feed restart-safe leased jobs, deterministic
later stages, tied bounded standings, and durable Event completion evidence.
Completed Events remain visible to players and Platform Admin governance.

The advancement exit gate passed 19 focused backend cases, frontend 66/66 plus
lint and a 533-module build, and an independent clear audit. A real four-player
browser/API bracket produced the champion and placements `1, 2, 3, 3`; its
temporary data and credentials were removed. Event prize settlement remains
explicitly `not_configured` and Event wallet writes are forbidden. Event roster
freeze and final standings atomically enqueue per-player notification records;
the Event worker retries delivery and uses a unique Notification source link to
converge after a crash without duplicate player messages. Production still
needs that worker deployed and supervised as a separate process.

Operational baseline refinement 2026-08-13: public `GET /healthz` reports
process liveness without datastore calls, while `GET /readyz` fails closed with
the shared 503 envelope until both MongoDB and Redis are ready. The backend
environment example documents the Event worker interval and bounded job/outbox
batch sizes. Deployment must configure the web-service health check and run
`npm run worker:events` as a separately supervised worker against the same
MongoDB and Redis; local code cannot prove that external deployment state.

Observability refinement 2026-08-13: every HTTP response receives a bounded
`X-Request-Id`. Completion and error logs are structured JSON records with
method, template-safe path, status, duration, stable error code, and request
ID only; they deliberately omit bodies, tokens, email addresses, IP addresses,
and raw identifiers. Production log collection, metrics, alerts, SLOs, and
incident drills remain external operations gates.

Dependency audit refinement 2026-08-14: backend and frontend production
dependency audits both report zero vulnerabilities. Frontend is now locked to
React Router v7.18.2, so the earlier React Router v6 advisory/migration note is
retired. This audit does not replace browser, authorization, deployment, or
provider verification.

Current stages/rounds implementation contract (amended 2026-08-21):

- Owner and authorization: Event Manager creates the Event schedule without
  round rules. Platform/Super Admin approves the registration, entry and reward
  contract once. After registration closes, the scoped Event Manager owns
  routine execution one round at a time. No client request supplies participant
  IDs or a roster count; the backend uses registered players for Round 1 and
  immutable promoted outcomes for every later round.
- API boundary: player Event reads expose only the viewer's safe state. Run
  draft APIs accept timing, admission, entry and reward terms but no plan.
  Post-close staff APIs own next-round configuration and idempotent generation.
  Governance APIs retain read-only execution evidence, recovery, dispute and
  financial controls; the old routine round-plan approval queue is being
  retired by this amendment.
- Data boundary: EventRun records the sequential manager mode and the configured
  round definitions. Separate immutable roster entries, EventStage, EventBatch,
  EventBatchOutcome, and durable EventJob records own execution. A Match has an
  exactly-one EventBatch source and never pretends to be a Quick Match. Each
  later round is derived only from immutable promoted roster-entry evidence.
- Safety: free team admission now stores one registration per member plus an
  immutable server-derived team/name/captain/member snapshot. The captain sends
  only a saved Team ID; every member's player role, consent, eligibility,
  invitation and game account are rechecked transactionally. For paid entry,
  accepted ready-team membership authorizes the captain to choose either full
  captain funding or one exact per-member seat hold; every payer is derived and
  snapshotted by the server. Every normal
  `teamSize > 1` approval, round and generation path also remains fail-closed
  until team Match ranking, advancement, standings and reward allocation are
  implemented end to end. Format, participants per Match, advancement count,
  seeding policy, schedule spacing, and bye rules are validated and reviewed
  rather than inferred from game names or modes.
- Completion criteria for this amendment: open admission persists no product
  capacity, the Event Manager configures and processes every round under game
  scope, repeated calls converge, client roster authority is rejected, complete
  ordered room outcomes create bounded promoted/eliminated evidence, and the
  next round consumes only the promoted list. Governance keeps initial review,
  safe final evidence, recovery and independent rewards; its old routine close
  and round-review commands are retired.

First-stage completion evidence (2026-08-13): 13/13 Event-stage replica tests,
79/79 competition policy checks, 55/55 competition integration checks, the
237/237 backend aggregate, 62/62 frontend checks, full lint, and a 532-module
production build passed. Independent audit found no code must-fix. A real
Platform Admin froze two admitted players and generated one Stage/Batch/Match;
both players saw only their own batch and checked in; the scoped Match Operator
claimed, prepared, and started the Event Match; Match, Batch, Stage, and Run all
became `in_progress`. Desktop and 390x844 player views were responsive, and a
fresh operator tab was console-clean after fixing the safe string/populated
EventBatch PropType boundary. Production automatic closure still requires a
separately supervised `npm run worker:events` process using the same MongoDB
configuration and restart policy; manual Platform Admin recovery remains
available but is not deployment proof.

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
`open` has no product seat cap; technical reads and writes stay cursor-paged and
rate-limited. Invitation-only entry remains private. `limited_seats` alone owns
a finite capacity and optional FIFO waitlist. After registration closes, the
Event Manager selects the room size, per-room promotion count, timing, and
whether the round is final. The backend partitions only the current eligible
server-owned list, creates Matches once, and derives promoted/eliminated lists
from verified complete room rankings. The manager repeats this for each next
round until the final ranking completes the Event.

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
| Closed | Event admission | Scheduled/open Event Runs enforce verified-player windows, open/invitation/limited-seat policy, transactional capacity and FIFO waitlists, committed registration, invitation governance, bounded reads, and staff participation denial. Player cancellation is API-denied; platform-owned recovery remains separate. | Verified by replica-set Event tests, policy tests, full aggregates, and player/staff/governance browser/API checks; commitment policy refined 2026-08-20. |
| Closed | Competition data | Game-backed Quick Matches and Events own all active competition records. Tournament/TournamentType models, routes, collections, indexes, socket contracts and frontend compatibility modules were retired after a zero-record database check. | Verified by the fail-closed retirement command, full backend/frontend gates and generated API-route coverage on 2026-08-18. |
| P0 | Payment safety | Immutable integer-minor-unit ledger settlement, durable reconciliation, reviewed prize/withdrawal lifecycles, and explicit sandbox test-money mode are implemented. Platform Admin can manually request authoritative PhonePe status; exact order/amount evidence credits once and mismatch credits zero. Withdrawals and live-money mode remain blocked. | Complete deployed sandbox deposit/callback/retry evidence, provision and monitor reconciliation plus Event workers, integrate and certify a payout provider, then separately approve live-money release. |
| Closed | Realtime staff access | Socket connection now resolves active StaffAssignments and Game scopes at connection time. Match Operator subscriptions require assigned-game scope plus explicit ownership; the broad operator room was removed from authorization-sensitive delivery. | Verified by realtime staff-context and fail-closed scope tests on 2026-08-08. |
| P1 | Transactional account email | Resend-backed verification and password recovery are implemented behind a server service. Local environment-only credentials, live authorized-recipient delivery, database transaction tests, and an isolated real-route browser workflow are verified. A dedicated sender domain and operational delivery evidence remain open. | Verify a dedicated account-email domain for broader delivery, then certify staging delivery, failure, and bounce monitoring without storing secrets in the repository. |
| P1 | Distributed security | Authentication, signup, verification, recovery, password-change, refresh, staff-assignment, Event-governance, operator, and player-financial mutations use atomic Redis counters keyed by hashed client/actor correlation and fail closed if protection storage is unavailable. Session-bound recent authentication protects governance and withdrawals; MFA and actionable mutation alerts remain. | Add MFA/passkeys and production alerts for sensitive governance and financial denials/actions. |
| P1 | Frontend boundaries | Multiple feature pages call the Axios client directly despite the documented Redux boundary. Identity verification and recovery now use Redux thunks, but other domains remain. | Migrate one domain at a time to shared thunks/selectors and add component/integration tests. |
| P1 | API scale | Event execution, wallet history, security attention, staff profiles, player notifications, and assigned/unassigned operator Match queues use bounded stable reads with append de-duplication. Other social and compatibility list reads remain. | Cursor pagination with bounded limits and stable sorting for every remaining list; record endpoint deprecation dates and remove aliases after client migration. |
| Closed | Financial model | The append-only balanced ledger stores integer INR minor units as the source of truth; Wallet is a rebuildable bucket projection and owner history is cursor-paginated. Durable reconciliation and idempotent settlement are implemented. External payment/payout certification remains under Payment safety. | Verified by payment policy plus replica-set ledger, settlement, prize-release and withdrawal tests. |
| P2 | Operations | Request and worker logs are structured/redacted, request IDs exist, and durable Event/payment jobs have restart-safe code. Central collection, metrics, heartbeat alerts, SLO enforcement, worker deployment, backup restore and disaster-recovery drills remain unproven. | Provision/supervise workers, centralize logs, add actionable metrics/alerts and SLOs, then rehearse restart, backup restore and incident rollback. |
| P2 | Frontend quality | Frontend lint is clean. Route-level lazy loading is retained and stable vendor chunks now split React/router, state, realtime, and icons; the largest emitted JavaScript chunk fell from 508 kB to 261 kB. Automated component/browser coverage and further route-specific splitting remain. | Add tests for critical flows and continue splitting only when measured route load evidence justifies it. |

### Documentation Drift Found

- API discovery is now machine-checkable. The backend owns
  `docs/openapi.json` (OpenAPI 3.1) and `docs/API_REFERENCE.md`; the generator
  inventories all 207 mounted HTTP method/path pairs and labels their access
  boundary. `npm run docs:api` regenerates the specification and
  `npm run docs:api:check` fails for missing/extra paths, duplicate operation
  IDs, or missing shared contracts. Domain request/response schemas should be
  refined alongside their controllers; the route inventory prevents silent
  endpoint omission but is not a substitute for domain integration tests.

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
| Tournament Manager | Creates and manages Quick Match/Tournament offerings for assigned games. |
| Game Manager | Supervises assigned game operations, operator workload, and room/Event health. |
| Event Manager | Prepares scoped Event proposals and, after approval, operates registration closure, rounds, room handoff, promotions and eliminations. |
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
| Tournament Manager | `StaffAssignment` | Creates and manages Game-backed Quick Match/Tournament offerings inside assigned game scopes. |
| Game Manager | `StaffAssignment` | Read-only operational supervision for assigned games. |
| Event Manager | `StaffAssignment` | Creates scoped Event proposals requiring initial Platform Admin approval, then operates approved Event rounds in scope. |
| Match Operator | `StaffAssignment` | Operates explicitly assigned matches inside assigned game scopes. |

### Scope Rules

- `User.role` is never an authorization source. It is only `player` or `staff`.
- Player participation commands require `User.role = player` in addition to
  normal authentication, verification, eligibility, and ownership checks.
  Active StaffAssignments never grant player participation.
- Every privileged API verifies active staff assignments on the server.
- `gameScopes` are Game Object IDs on a StaffAssignment.
- Tournament Manager, Game Manager, Event Manager, and Match Operator
  assignments require at least one valid game scope. Platform roles reject
  client-supplied game IDs.
- Super Admin and Platform Admin are platform-wide governance roles.
- Game Manager and Event Manager require the relevant game ID to be inside the
  assignment scope. Match Operator queue access requires game scope, and every
  mutation after claiming also requires explicit match assignment.
- A staff user may hold multiple different assignments, but cannot hold the
  same active/suspended role twice.
- Role definitions are server-owned policy records. Each declares its
  `managedRoles`, `assignableBy` authority, and `scope`; staff-assignment
  creation, activation, suspension, and revocation enforce `assignableBy`.
  The current graph is Super Admin -> Platform Admin -> Tournament Manager,
  Game Manager, Event Manager, and Match Operator, with Super Admin retaining
  authority over every lower role. New roles must be inserted through this
  policy graph and tested before they can be assigned.
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
| Game Manager | `/staff/games` | Scoped operations plus assigned-game player account verification. No Game configuration, competition, staff, or money mutations. |
| Event Manager | `/staff/events` | Creates scoped draft Template/Run proposals; after initial approval, manages registration closure, round rooms, operator handoff, and promoted/eliminated lists. |
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
- Legacy competition retirement is complete. Active frontend and backend
  discovery, detail, joining, hosting, Match operations and history use
  Game-backed Quick Matches or Events. The configured database contained zero
  old records before the one-time command dropped the empty collections and
  stale indexes. No Tournament/TournamentType route, model, socket contract or
  frontend compatibility module remains.

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
- Completed locally 2026-08-13: Platform/Super Admin Security Attention uses a
  cursor-bounded, hash-safe review feed. It records blocked privilege-field
  signup attempts plus refresh replay/fingerprint mismatch session signals;
  no tokens, raw IPs, full hashes, or player records are exposed, and no
  security mutation authority was added. Backend policy 97/97, frontend 72/72,
  lint/build, and desktop/390px browser verification passed.
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
  queue, Room, and Match creation.
- Quick Match execution compatibility foundation: new full-room executions can
  create `Room` and `Match` records directly from an active
  `QuickMatchOffering`, using the canonical Game Object ID/key rather than
  legacy Tournament/TournamentType references or the BGMI/CoC Match enum.
  Only canonical Quick Match and Event sources are accepted. Canonical partial
  indexes protect active membership and Match uniqueness, and Match Operator
  scope queries use the canonical game key.
- Team creation now resolves the active Game catalog instead of accepting
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

## Completed Slice: Paid Event Registration and 1,000-Player Rehearsal

Completed and verified 2026-08-17. Event Manager proposals now carry reviewed
INR `entryTerms`; Platform/Super Admin sees the exact policy and fee before
approval. Player registration never accepts a client amount. A paid entry
atomically moves the reviewed fee from `available` to `entry_held`, writes one
balanced append-only posting and durable per-attempt evidence, or writes
nothing. Player retries return the original committed registration and never
create another hold or FIFO position. Platform-owned Event recovery may release
funds under its separate audited policy.
At close, admitted holds capture to platform revenue and waitlisted holds
release before any roster or Match is written. Missing, extra, wrong-amount,
wrong-currency or wrong-status evidence fails closed. Paid commands remain
default-closed outside explicit sandbox money mode and require verified-player
participation. The 2026-08-21 amendment removed password reauthentication from
registration while preserving every server-owned financial check.

The shared-database rehearsal `6a828224467598a0c5d5f545` completed
1,000 verified BGMI players at INR 2.00 sandbox entry through three reviewed
ranked rounds: 10 rooms of 100/top 50, 5 rooms of 100/top 20, and one 100-player
final. Every round used a different persisted BGMI Match Operator: Platform
Admin, Super Admin, then the dedicated Match Operator. Verification evidence
at completion included 1,000 registrations, 1,000 captured entry holds, 1,000
roster rows, 3 stages, 16 batches/Matches, 1,000 standings, 1,000 hold postings,
1,000 capture postings, and 10 pending plus 10 released reward postings. Final
fixture-wallet totals are INR 8,000 available, zero held, zero prize-pending,
and INR 550 withdrawable.

Owner-requested reset repeated 2026-08-21: all shared-database Event, Tournament/Quick
Match, Match/Room, registration, competition audit, payment Transaction,
wallet-hold, immutable ledger, prize and withdrawal records were deleted in one
MongoDB transaction. All 1,007 User/player accounts and 1,005 Wallet identities
were preserved; wallet balances and embedded histories were reset to zero.
Games, verified game accounts, staff assignments and identity/security data
were not removed. The Event/Quick Match catalogs are now intentionally empty
and must be recreated for the next test cycle. The latest reset removed 1
Template, 3 Runs, 10 reviews, 2 Event jobs, 1 Quick Match offering, 2 payment
Transactions, 2 reconciliation jobs and 6 related staff-activity rows. The
post-transaction audit found every targeted collection at zero and the Redis
competition-key cleanup completed successfully.

Verification: backend aggregate 318/318, competition integration 89/89,
frontend state 84/84, full lint, 554-module production build, API documentation
coverage 180/180, and diff checks passed. The resumable rehearsal safely
recovered from a deliberate driver lifecycle mismatch without re-registering
or double-charging. Production live-money release, supervised workers and
provider certification remain separate launch gates.

## Completed Refinement: Event Management Workspaces

Implemented locally and code-verified 2026-08-17. The Event Manager dashboard now uses a
compact left sidebar with separate `Templates` and `Events` workspaces instead
of rendering both creation flows together. Templates remain reusable approved
game/mode/map/team-size definitions; Events remain dated registration,
admission, entry-fee, stage and reward instances created from them. Forms use
explicit labels and the previous oversized introduction/explanation panels are
removed.

Event cards now open a read-only operational detail view. Three new
Event-Manager-only, assigned-game-scoped endpoints expose a bounded summary,
25-item opaque-cursor registration pages, and 25-item opaque-cursor Match-room
pages. Registration rows contain only username/profile tag/status/time. Match
rows contain stage/room, counts, schedule, status, assigned operator and safe
result summary; they omit emails, player identities, lobby credentials, wallet
data and raw proof/dispute evidence.

Platform/Super Admin `Event Management` is separated into `Approvals`,
`Invitations`, and `Operations & Reports`, preserving existing independent
review authority without stacking every tool on one page. The empty approval
workspace was further reduced to an icon-led pending counter, compact empty
state and round-change counter. Repeated policy explanations, duplicate empty
messages and the unused decision panel are hidden; review details appear only
when actionable records exist or a reviewer selects one. Verification passed
backend competition policy 103/103 and replica-set integration 91/91,
frontend 86/86, full lint, the 555-module production build, and API
documentation coverage at that checkpoint. After legacy competition retirement,
the current specification covers all 176 mounted operations.
Superseded 2026-08-21: `Operations & Reports` is now governance-only
`Results & Rewards`; sequential room and round work moved to Event Manager.
The authenticated desktop/mobile admin visual gate remains pending; local
public-shell rendering is clean, but the available browser session was not
signed into governance after the final compact-layout edit.

## Active Work

### Team Event Execution (Completed for free-entry ranked/sequential Events)

- A captain submits only a saved Team ID. The backend derives the canonical
  roster and rechecks inside one MongoDB transaction: ready Team state,
  captain ownership, exact Game/mode/team size, member consent, player-only
  classification, ban state, verified game accounts, admission capacity,
  waitlist policy and every invitation.
- Every roster member receives one EventRegistration with an immutable
  team/name/captain/member snapshot. Whole-team registration and invitation
  consumption commit together. Duplicate retries converge, overlapping rosters
  produce one complete winner plus a stable conflict, and roster drift or any
  ineligible member creates zero partial registration/counter writes.
- Compete and Event details use a Redux-owned team picker. It lazily loads the
  saved profile, exposes loading/retry/create-Team recovery, filters plausible
  captain-owned ready rosters, and sends no member IDs.
- Free-entry ranked/sequential team Events are now playable end to end. The
  immutable team unit is carried through roster freeze, player-capacity-aligned
  batches, Match participants, operator `rankingKeys`, outcomes, whole-team
  promotion/elimination, later rounds, team-place standings and rewards.
  `advanceCount` is a team count while room capacity remains a player count and
  must be divisible by `teamSize`.
- A configured placement reward is the total for that team place. The server
  splits it deterministically among immutable members, preserving every minor
  unit; clients never submit allocations. Shared standings and result feeds
  expose only safe team key/name/member counts, never member database IDs.
- Paid team Event entry supports `captain_pays` and `split` while preserving
  one participant registration and hold per seat. Ledger movements, capture,
  cancellation release and recovery refund use the immutable payer rather than
  changing sporting ownership. Legacy reviewed-plan/single-elimination team
  execution remains intentionally fail-closed; the supported path is Event
  Manager-owned ranked sequential rounds.
- Verification 2026-08-24: dedicated 5v5 COC and multiround tests prove whole-
  team batching/advancement, retry-safe generation, malformed/split ranking
  rejection, team-place standings and exact 1001/500 minor-unit splits. Backend
  maintained aggregate now passes 367/367 with the dedicated team suite in the
  aggregate script; frontend passes 119/119, ESLint and the 560-module
  production build. API documentation remains 207/207.

### Production Worker and Configuration Hardening (Code complete; deployment proof pending)

- Event and payment workers now clean up MongoDB and Redis after partial
  startup, interrupt idle polling on SIGTERM/SIGINT, stop between bounded
  Event batches, finish only the current bounded unit, and close both
  datastores inside Render's configured 300-second drain window.
- Structured worker lifecycle logs contain code/status metadata only. Each
  heartbeat actually pings MongoDB and Redis and reports their latency.
  Runtime parsing and production validation share bounded interval and batch
  ranges, including the notification service's real maximum of 100.
- Production sandbox deposits require PhonePe callback username/password.
  Discord remains optional, but any partial Discord configuration or a non-
  HTTPS production OAuth redirect fails startup. Duplicate canonical Discord
  role names fail closed instead of choosing an ambiguous role.
- Repository evidence is complete, but no worker was provisioned or deployed.
  Remaining external gates are the explicit $14/month Render decision, cloud
  secrets, supervised restart/heartbeat alerts, one exactly-once PhonePe
  sandbox callback/poll credit, deployed Discord env/callback, and later live
  payout/provider certification. Paid entry, withdrawals and live-money mode
  remain closed.
- Discord publication and role sync are crash-durable in code. API mutations
  enqueue Mongo-backed leased jobs (inside the owning transaction where one
  exists); the Event worker reconciles bounded missed intents, reclaims expired
  leases and retries with backoff. Stable nonces/edit evidence converge message
  delivery, while role delivery recomputes current assignments so suspension or
  revocation removes stale Discord roles. Private invitation Events and lobby
  secrets are excluded at both enqueue/reconciliation and payload boundaries.
  Deployed worker supervision remains an external proof gate.

### Discord Community and Staff Connection (Local integration complete; deployment env pending)

- Discord remains a communication surface only. Platform sessions, active
  `StaffAssignment` records and game/Match scopes remain the sole authority.
- `EGAMING ESPORTS` was reset into bounded Start Here, Official Updates, Live
  Events, BGMI, Clash of Clans, Community, private Staff Operations and Archive
  areas. Existing content was moved or hidden, never broadly deleted. Original
  generated EGAMING icon and banner assets are stored under
  `backend/assets/discord`; the reset command is dry-run by default and its
  post-activation dry run is fully clean.
- Staff OAuth uses one-time Redis state and `identify guilds.join`. The backend
  persists only Discord identity, never OAuth access/refresh tokens. It joins
  the member and reconciles the six canonical Discord roles from active
  assignments. Assignment, scope, suspension and revocation changes enqueue a
  non-authoritative durable sync; delivery recomputes current assignments, so
  stale managed roles are removed while unrelated Discord roles are preserved.
  Bot hierarchy failures are explicit and retryable.
- `/staff/discord` is now a compact Redux-owned connection surface with Connect,
  Sync roles and Open Discord only. The superseded free-text composer API,
  publish limiter/model runtime, legacy setup script and confusing footer were
  removed. Staff perform normal chat, voice and moderation in Discord itself.
- Server-owned lifecycle transitions publish durable, mention-disabled embeds:
  approved public Event launches, generated Event rounds, Match schedules and
  dispute-closed Event/settled Quick Match results. Existing mutable messages
  are edited by durable subject/type identity. Invitation-only Events, lobby
  credentials, chat, disputes, wallet data and unverified results are excluded.
- Live proof published two current BGMI Event launch cards to `event-launches`;
  both contain Registration, Event starts, Entry and Rewards fields and no
  footer. The exact superseded generic message and its one obsolete dispatch
  row were removed; competition and account data were untouched.
- Verification: backend 346/346, including competition 116/116 and replica
  integration 102/102; frontend 115/115, lint and the 558-module build; API
  documentation 207/207; both diff checks pass. Discord Community was enabled
  by the server owner on 2026-08-24 with `#rules` as the guidelines channel and
  the private `#discord-delivery-log` as both the Community-updates and safety-
  notifications channel. The managed bot role is above all six canonical staff
  roles, and the post-activation reset dry run is fully clean. Local OAuth is
  configured: the backend secret is loaded, and Discord Developer Portal owns
  the exact localhost and Render callback URLs. A Redis-backed authorization
  probe verified the `identify guilds.join` URL and removed its temporary state.
  Authenticated proof then connected `bhupeshplatformadmin@gmail.com` to Discord
  and live Discord membership exactly mirrored its five active assignments:
  Platform Admin, Tournament Manager, Game Manager, Event Manager and Match
  Operator, with no sync error. Local integration is complete. Deployment still
  requires equivalent `DISCORD_CLIENT_SECRET` plus deployed callback configuration
  in the Render environment; no secret is tracked in Git.

### 0. Transactional Account Email Activation

State: Completed for local development and test on 2026-08-09. The backend
service, endpoints, models, Redux thunks, and public verification/recovery
interfaces are implemented. Environment-only provider delivery, six isolated
MongoDB replica-set integration tests, and the full real-route browser workflow
passed. `mail.sweetmemoriesgift.com` now has publicly resolving Resend DKIM,
return-path MX, and SPF records, and Resend accepted a live sender-domain test
that the owner received. Resend reports the domain verified and the live Render
service now uses `support@mail.sweetmemoriesgift.com`. A publicly resolving
DMARC `p=none` policy is active. Production still requires staged
delivery/failure evidence and bounce monitoring before strengthening DMARC to
`quarantine` or `reject`.

Email branding refinement completed locally 2026-08-28: verification and
password-reset HTML now share an email-client-safe shell with the existing
amber `EG` brand mark and `EGAMING ESPORTS` identity. The mark is HTML text,
so it remains visible when remote images are blocked; plain-text alternatives
are unchanged. Focused account-email tests pass 6/6, diff check is clean, and
Resend accepted a real branded preview to the confirmed account owner.
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

Owner: Tournament Manager configures offerings only within assigned games;
Match Operator executes assigned matches; Game Manager supervises assigned-game
health. Platform/Super Admin assign and revoke Tournament Manager scope but do
not gain offering mutation authority from governance status alone.

Ownership migration state 2026-08-21: **Completed locally**. The existing
Game-backed offering Redux workspace moved from `/panelAdmin` to
`/staff/tournaments`; dedicated staff APIs repeat Tournament Manager role and
game-scope checks, and the old admin mutation routes are retired fail-closed.
Approved Host proposals remain draft-only and become scoped Tournament Manager
work; host capability does not activate or publish an offering. Offering money
terms remain configuration only and grant no wallet, settlement, prize-release
or payment-reconciliation authority.

Completed foundation: `QuickMatchOffering` is a Game-backed,
Tournament-Manager-only API resource with a Redux-backed
`/staff/tournaments` workspace. Its current endpoints are:

- `GET /api/staff/tournaments/games`
- `GET /api/staff/tournaments/offerings?status=&limit=`
- `POST /api/staff/tournaments/offerings`
- `PATCH /api/staff/tournaments/offerings/:offeringId`

The retired `/api/admin/quick-match-offerings*` mutation surface returns a
stable `410 TOURNAMENT_MANAGER_ROUTE_REQUIRED`; governance identity alone does
not authorize offering mutation.

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

- The `/api/staff/tournaments/*` mount requires an active Tournament Manager
  assignment and filters or rejects every read/mutation by the assignment's
  `gameScopes`; no client-supplied role or game scope is trusted.
- Offering money-like configuration uses minor units only. It does not grant
  authority to charge a player or settle a prize; ledger and payment controls
  remain a separate required gate.
- Tournament/TournamentType routes and records were removed only after the
  configured database proved all legacy collections and references empty.

Completed compatibility migration and retirement:

1. Deploy the additive Match/Room schema and indexes first. Existing legacy
   Matchmaking reads/writes remain untouched; startup rebuilds only the named
   legacy membership index if it lacks the required `tournamentTypeId` filter.
2. Completed locally 2026-08-09: internal execution creation accepts a stable
   execution key, an active offering, and an exactly full roster. It creates a
   full Room plus one idempotent Match without a legacy Tournament record.
3. Completed for free entry 2026-08-09: the verified player route directs only
   canonical offering joins to this execution boundary.
4. Completed 2026-08-18: a confirmation-gated command proved all legacy
   collections/references empty, then removed old collections, fields, indexes
   and Redis keys. Backend/frontend compatibility code was deleted.

Validation: model, lifecycle, source-isolation, operator-scope, and index-shape
policy tests cover this boundary. A MongoDB replica-set integration suite now
proves concurrent joins converge on one canonical Room and one Match, retries
are idempotent, paid offerings create no queue state, arbitrary Game-backed
  Team formats resolve, stored Teams backfill, and canonical player Match reads
preserve lobby secrecy. A seventh replica-set test proves concurrent operator
claim, readiness convergence, competing result submission, dispute timing,
governance resolution, and settlement. The configured development migration
  dry run found no Team candidates. Competition retirement is complete.

Paid-entry availability remains controlled by its independent sandbox/live
money release gates; no legacy competition queue exists.

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
  every member of a submitted Team. The captain explicitly selects
  `captain_pays` or `split`; the first charges every seat to the captain and the
  second charges one seat to each accepted member. Clients never send amounts.
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
- Completed locally 2026-08-13: Directory rows open a compact, governance-only
  read profile showing current roles/scopes and bounded service/access history.
  Mutation controls remain separate. The profile passed backend policy 92/92,
  frontend 70/70, lint/build, and desktop/390px browser verification.
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

Owner: Event Manager prepares work; Platform Admin approves and publishes the
initial Event contract; Event Manager then owns routine Event execution.

Required flow:

1. Event Manager selects an active game inside their `gameScopes`, then creates
   a draft Event Template using only approved game capabilities.
2. Platform Admin reviews the proposal, approves it to `active`, rejects it,
   or returns it for changes. Rejection and returned drafts remain auditable.
3. Event Manager creates a dated draft Event Run from an approved Template
   with registration/admission, entry and reward terms only.
4. Platform Admin validates those terms and schedules registration. Open Events
   accept all eligible registrations without a seat cap; limited-seat Events
   retain their explicit capacity/waitlist contract.
5. After registration closes, Event Manager configures Round 1 from the exact
   registered count. The server creates rooms without client-owned player IDs.
   Match Operators submit complete ordered results; the configured top players
   are promoted and all others are recorded as eliminated. Event Manager then
   configures the next round from promoted players and repeats until the final.
   Game Manager monitors readiness;
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

Owner: Tournament Manager configures offerings inside assigned game scopes;
Event Manager proposes scheduled Events; Platform Admin governs staff scope and
Event approval; Game Manager supervises readiness; Match Operator executes
rooms.

- Retire ambiguous legacy Tournament/TournamentType vocabulary in favor of
  explicit `QuickMatchOffering`, `EventTemplate`, `EventRun`, `Match`, and
  `Room` boundaries.
- Quick Match Offering: game, mode, map, team size, capacity, region, entry
  policy, schedule policy, and operator coverage requirement. Only an active
  Tournament Manager whose assignment contains the offering Game may create,
  activate, pause, edit, reactivate, or retire it.
- Event format: support daily/weekly/monthly recurrence, registration windows,
  batches, eliminations, seeding, standings, prizes, results, and disputes.
- Each state transition must be idempotent, audited, and guarded against
  duplicate jobs or concurrent operator actions.

#### 4. Scoped Operational Dashboards

Game Manager dashboard (`/staff/games`):

- Scope: assigned `gameScopes` only; supervision plus scoped player
  game-account verification decisions.
- Shows room pipeline, waiting/active/disputed rooms, operator workload,
  Event readiness, delayed work, and escalation history.
- Cannot modify games, staff assignments, Templates, Event Runs, wallet data,
  or player profile identity. It may approve/reject only the submitted game
  account identity for an assigned Game.
- Completed locally 2026-08-13: assigned-game metrics include a bounded
  attention queue for operator assignment, delayed starts, result verification,
  and disputes plus safe recent operator action history. Backend authority
  remains the active Game Manager assignment and `gameScopes`. This original
  read-only baseline was later amended by the explicit verification authority
  below. Verification passed backend competition policy 82/82, frontend
  68/68, lint/build, and real desktop/390px browser checks with a clean console.

Event Manager dashboard (`/staff/events`):

- Scope: assigned `gameScopes` only.
- Creates and edits only unapproved drafts in scope; views review status and
  reviewer feedback; never directly publishes a Template or schedules a Run.
- After approval, owns registration closure, sequential round configuration,
  room generation/handoff, operator assignment, and safe promoted/eliminated
  views. It cannot change approved entry/reward terms, verify disputed results,
  settle money, or release prizes.

Tournament Manager dashboard (`/staff/tournaments`):

- Scope: assigned `gameScopes` only.
- Creates and manages canonical Quick Match/Tournament offerings for active
  scoped Games, including lifecycle and server-validated entry/prize terms.
- Receives Approved Host draft proposals for scoped Games. It cannot mutate
  Games, Events, staff access, wallet balances, payment reconciliation, match
  settlement, or prize release.

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
- Completed locally 2026-08-13: Security-event UI for durable signup privilege
  abuse and session replay/fingerprint signals. Remaining: broader denied-access
  logging, production alerting, and an incident response procedure.

### Competition

- Event registration records.
- Event stages, batches, elimination/seeding logic, and leaderboards.
- Quick Match offering configuration by game, mode, map, team size, and room
  capacity.
- Operator assignment queue, lobby publishing, result verification, disputes,
  settlement, and player match history.
- Tournament/TournamentType data and route retirement completed 2026-08-18.

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

Run on 2026-08-21 for the shared staff dashboard layout:

- Staff Home, Access Control, Tournament Manager, Event Manager, Game Manager,
  and Match Operations now render inside one player-style responsive shell.
  Desktop receives a persistent assignment-aware sidebar; mobile receives a
  horizontally scrollable bottom workspace navigation. Role pages retain
  their own scoped tools and backend guards.
- Staff Home is the role picker. Each selected role then exposes its own
  responsibility navigation: Tournament setup/lifecycle views, Event
  Templates/Runs, Game oversight queues, Match assignment/owned operations,
  or governance sections. Responsibilities are not mixed across roles.
- Frontend state passed 101/101, full lint, route smoke and the 563-module
  production build. The unauthenticated route redirected to Login; an
  authenticated visual pass remains pending.

Run on 2026-08-21 for Tournament Manager ownership:

- Added the game-scoped `tournament_manager` StaffAssignment role, dedicated
  `/staff/tournaments` workspace, and scoped games/offering APIs. The former
  Platform Admin offering UI was removed and its API now fails closed with
  `410 TOURNAMENT_MANAGER_ROUTE_REQUIRED`.
- Backend competition policy passed 97/97 and competition database integration
  passed 91/91, including out-of-scope creation denial with zero writes.
- Frontend state passed 99/99, full lint and the 561-module production build;
  generated API documentation covers all 193 mounted operations.
- The unauthenticated local route redirected to Login as required. An
  authenticated visual role check remains pending because the local API was
  unavailable during the browser gate; authorization and transport contracts
  are covered by the automated gates above.

Run on 2026-08-17 for paid Event registration and the retained 1,000-player
BGMI rehearsal:

- Backend aggregate 318/318 passed, including 103 competition policy/unit,
  89 competition replica-set integration, and seven focused paid Event cases.
  The new cases prove default-closed zero writes, exact funded holds,
  insufficient-funds rollback, committed-registration retry evidence,
  admitted capture, waitlist release, corrupt-evidence denial, and terminal
  generation refunds.
- Frontend state 84/84, full lint, and the 554-module production build passed.
  Event Manager, governance review and player discovery expose the server-owned
  fee/test-money state while registration never sends a client-owned amount.
- API documentation generation/check covers all 180 mounted operations.
- Event Run `6a828224467598a0c5d5f545` completed with 1,000 paid
  registrations, three separately operated rounds, 16 Matches, 1,000 standings,
  exact entry ledger counts and independently released top-10 rewards. On
  2026-08-17 the owner requested a clean competition/finance state: this Event
  evidence and all other Event/Tournament/transaction records were deleted,
  while all User/player accounts were preserved and Wallet projections reset.

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

Run on 2026-08-18 for final legacy competition retirement:

- The confirmation-gated retirement command reported zero TournamentType,
  Tournament, Result, legacy Room and legacy Match records before dropping the
  empty collections, old indexes/fields and stale Redis keys.
- Full backend tests passed; canonical competition passed 91/91 and replica
  integration 86/86. Frontend passed 86/86, full lint, route smoke and the
  552-module production build. API documentation covers all 176 mounted
  operations.

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

Run on 2026-08-13 for Event registration and admission:

- Backend aggregate 223/223 passed, including 78 competition policy checks,
  42 competition replica-set integrations, and 13 focused Event admission
  cases covering final-seat races, idempotent retries, FIFO ordering,
  invitation consumption/revocation, all-or-nothing race rollback, approval
  readiness, bounded cursors, and safe serialization. Player cancellation and
  re-entry from that original workflow were retired on 2026-08-20.
- Frontend 56/56, full lint, and the 530-module production build passed.
- Independent audit found no remaining code-level must-fix. Real desktop/mobile
  browser/API checks passed player registration with authoritative counts,
  staff read-only visibility with no mutation controls, and Platform Admin
  bounded player search plus invite/revoke. The gate found and fixed the
  revoked-player response summary and nullable review selection warning.
- Temporary users, Event records, invitation/registration evidence, sessions,
  password override, and Redis/backend verification processes were removed;
  development ports 6379 and 8080 were closed.

Run on 2026-08-13 for Event first-stage generation and operator handoff:

- Backend aggregate 237/237 passed, including 79 competition policy checks,
  55 competition replica-set integrations, and 13 focused Event-stage cases.
- Frontend 62/62, full lint, and the 532-module production build passed.
- Independent audit verified reviewed snapshots/plans, due-job/run coupling,
  transactional freeze and crash rollback, bounded Stage/Batch reads, safe
  player-own-batch serialization, recovery taxonomy, and transactional
  Match/Batch/Stage/Run start propagation.
- Real Platform Admin, two-player, and scoped Match Operator sessions generated
  and ran one Event Match through live status. The 390x844 player view had no
  horizontal overflow; a fresh post-fix operator tab had zero console warnings
  or errors. The gate corrected null frozen-date display and the string versus
  populated EventBatch PropType contract.
- All temporary records, password override, sessions, Redis/backend processes,
  logs, and verification files were removed; ports 6379 and 8080 were closed.
- Production worker deployment remains unproven and must stay an operations
  gate until `npm run worker:events` is separately supervised with restart and
  monitoring evidence.

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

## Latest Small Refinement: Team Creation from Quick Match Entry

- A team-format Quick Match picker with no eligible saved roster now presents
  a direct `Create Team` action instead of a dead-end disabled join button.
- Superseded 2026-08-28: the action closes the picker and opens
  `/dashboard/teams`. Team creation and membership are independent of Clan;
  accepted friendship is required while forming a roster. The old Clan-tab
  destination is retired.
- No join, roster, game, format or financial authority moved into the browser;
  the backend continues to validate the completed selected team. Verification:
  frontend 114/114, full lint and 556-module production build.

## Completed Code Slice: Repeat Quick Match Rooms and Compact Player Views

- Quick Match entry now belongs to the current waiting Room. Filling a Room
  creates its independent Match and immediately exposes a fresh waiting Room,
  so the same player may join the next Room without waiting for the prior Match
  to end. Only duplicate membership in the current waiting Room is blocked.
- Each browser action sends a bounded attempt ID. An exact retry returns its
  original Room/Match; a genuinely new attempt can enter the next Room. Paid
  repeat entries create separate Room-scoped wallet holds and independently
  validate exact funds inside the existing transaction and offering lock.
- Player discovery/progress ignores filled Rooms when calculating the next
  available capacity while safely projecting the viewer's latest Room/Match.
  Private `Leaderboard` reads select the current waiting Room before historical
  filled Rooms and remain unavailable to non-members.
- Tournament detail now matches the compact Event-detail language: artwork
  header, four facts, Room progress, direct `Join Now`/`Joined`/`Join Next Room`,
  and simple Rewards/Leaderboard subtabs with `-` before an official rank.
  My Matches is one compact section split into Live Matches and Completed.
- Deployment startup removes only the two exact legacy offering-scoped index
  names before creating the waiting-Room membership and Room-hold indexes. The
  same migration can be run explicitly with
  `npm run migrate:quick-match-repeat-entry`.
- Verification: backend aggregate 338/338, including competition unit 108/108,
  competition replica integration 102/102 and payment integration 32/32;
  frontend 114/114, full lint and 556-module production build; generated API
  documentation 203/203; both repository diff checks pass. The public local
  authentication shell rendered console-clean. Authenticated desktop/mobile
  visual proof remains a follow-up because the browser had no player session.

## Completed Code Slice: Tournament Placement Rewards

- Canonical Quick Match/Tournament offerings now support `winner_split` or a
  contiguous 1-100 place INR reward table. The server derives the total prize;
  clients cannot provide a contradictory settlement amount.
- Generated Matches snapshot reward policy, exact place amounts and team size
  in versioned financial evidence. Historical version-1 winner-pool Matches
  remain settleable.
- The assigned Match Operator records and verifies every player/team in order.
  Solo places pay one player; team-place totals split deterministically across
  the complete snapshotted team. Settlement records exact place/recipient audit
  evidence and creates balanced `prize_pending` ledger rows.
- Independent governance release validates all ranked recipients from ledger
  evidence and displays each recipient's place. Player result submission is
  disabled for place-wise Tournaments; player cards show the configured table.
- Verification: backend 325/325 including competition integration 94/94 and
  payment integration 32/32; frontend 102/102, full lint and 556-module build;
  API documentation 197/197; both repository diff checks pass. The public
  local Login page rendered console-clean, but the final authenticated desktop/
  mobile Tournament Manager visual gate remains pending because no browser
  session was available.

## Latest Refinement: Bounded Simple Chat Delivery

- The product intentionally keeps Friend, Clan and Match chat small: no read
  receipts, unread tracking, editing, deletion controls or permanent archive.
  MongoDB retains only the newest 200 messages per conversation. Friend and
  Clan Redis projections retain 100 and their socket room open loads 50.
- Friend and Clan sends now use a bounded Socket.IO acknowledgement. The input
  clears only after success, failed text remains available to retry, and the
  acknowledged message is reconciled locally even when its live publication is
  missed. Redis cache reads fall back to MongoDB; a cache write failure after a
  durable MongoDB save no longer reports a false send failure.
- Personal realtime messages are indexed in the browser by the other player's
  User ID rather than the backend's composite room ID, so an open conversation
  renders incoming messages immediately in both directions. The backend emits
  `session:ready` only after authenticated rooms and chat handlers exist; the
  client does not join or send before that signal.
- Friend and Clan messages now expose the persisted message subdocument ID in
  both realtime delivery and the send acknowledgement. The shared frontend
  merge uses that canonical ID, with a stable content/time fallback that never
  includes list position, so the two delivery paths render exactly one row.
  Persisted room history and the browser-session live cache are merged rather
  than replaced, so sending or receiving a new message cannot temporarily hide
  older messages; switching conversations still resets to the selected thread.
  Every live row is checked against the open Friend/Clan thread before render,
  history-load payloads carry their owning thread ID, and Clan messages carry
  their Clan ID. Delayed responses and simultaneous conversations therefore
  cannot mix. A failed room load exits its joining state after ten seconds.
  The Chats workspace is viewport-bounded with internal message/sidebar
  scrolling, a restrained maximum width, wrapped message text, and a Back to
  Chats control that remains present through mobile and tablet breakpoints.
  The redundant Open threads, Direct chats and Clan room summary strip is
  removed together with the duplicate page-level Chats heading; the page opens
  directly with its conversation list and one sidebar title.
- Player mobile bottom navigation keeps the full `Game Accounts` and `Account
  Settings` labels on desktop, but renders compact `Games` and `Settings`
  labels below the desktop breakpoint. Mobile items share the available width
  with tighter tracking so labels cannot overlap adjacent tabs.
- Account Settings no longer repeats its route title. Player password copy is
  withdrawal-specific and contains no staff/governance explanation; staff use
  the automatic protected-command dialog only within Staff workspaces.
- Game Accounts removes the linked/verified/pending statistic cards and the
  supported-game count badge. The page retains only actionable account status,
  supported Games and verification-request history.
- Unfriending is destructive for that direct conversation by product decision.
  One MongoDB transaction marks the Friendship removed, deletes every Personal
  Chat document for the pair, and removes both users' active-chat/sidebar rows.
  The pair's Redis chat window is cleared after commit, and the removal event
  clears both connected clients. Re-friending starts with an empty thread.
- Match chat retains the newest 200 rows with indexed oldest-row pruning. The
  database write remains successful if best-effort retention cleanup is briefly
  unavailable; the next message repairs the rolling bound.
- Clan Chat now loads its canonical record through the current membership API.
  The previous UI incorrectly treated the player profile's raw clan reference
  as a populated record and could hide/break chat for a normal MEMBER. Every
  active clan role can now see the channel. Backend membership is still checked
  on room open and every send, so leaving or removal immediately revokes access.
- Verification 2026-08-26: the prior backend aggregate baseline is 377/377,
  including a real MongoDB newest-200 Match retention test. After this fix,
  affected backend realtime passes 13/13 and transaction-capable Friendship
  cleanup passes 1/1. Frontend passes 129/129, full ESLint and the 567-module
  production build. A broader backend rerun encountered transient in-memory
  Mongo startup timeouts in unrelated suites; the auth integration retry
  passed, while the later Event-advancement startup failure left that aggregate
  rerun incomplete without producing a product assertion failure.
- Local two-player proof 2026-08-26: `babu` and `bhupesh_player` exchanged live
  messages in both directions with correct UI thread keys and reload history.
  Unfriend then removed the Mongo conversation, both sidebar rows and Redis
  cache, while notifying both sockets. The Friendship was restored afterward
  and intentionally has no prior chat history. No credentials remain in the
  repository.

## Latest Refinement: Inline Staff Sensitive-Action Confirmation

- When a staff command receives the server-owned
  `RECENT_AUTHENTICATION_REQUIRED` code, the shared staff shell now opens a
  compact password dialog over the current workspace instead of requiring the
  staff member to navigate to Account Settings.
- Password confirmation still uses `POST /api/auth/reauthenticate`; plaintext
  credentials and the recent-authentication timestamp are never persisted in
  Redux or browser storage. A successful confirmation resumes the original
  command automatically exactly once. Cancelling stops it, while an incorrect
  password keeps the dialog open for correction.
- The existing backend 15-minute Redis session window, active StaffAssignment,
  game-scope and command authorization checks remain authoritative and are
  unchanged. Player password scope remains withdrawal-only.
- Verification 2026-08-25: frontend state/contract tests pass 120/120, full
  ESLint passes, the 566-module production build passes, and diff validation
  passes.

## Completed Code Slice: Scoped Game-Account Verification

- Game Manager now owns the manual player game-account decision for only the
  Games in its active assignment. The queue is status-filtered, cursor bounded,
  safely serialized and available in the `/staff/games` workspace.
- Review requires recent authentication. The request identity and Game scope
  come from the URL, persisted request and StaffAssignment; the browser sends
  only `approved`/`rejected` plus an optional bounded note.
- User game-account state, terminal request decision and append-only staff audit
  commit in one MongoDB transaction. Cross-game access returns no record,
  concurrent reviewers commit once, and responses omit email, wallet data and
  raw submitted internals.
- Verification: backend aggregate 328/328 including three new replica-set cases;
  frontend 103/103, full lint and 557-module build; API docs 199/199; diff checks
  pass. Authenticated desktop/mobile visual proof remains pending.

## Latest Refinement: Controlled Game-Account Replacement and Fraud Review

- Verified game accounts remain locked against ordinary overwrite. The player
  receives exactly one replacement per Game after a 30-day verified cooldown.
  Active competition membership, pending prize/entry funds, or an active
  withdrawal blocks submission and approval. COC re-verifies the provider
  owner token; BGMI uses a separate multipart replacement request and keeps the
  old verified identity authoritative until approval.
- First-time and replacement BGMI verification accept one signature-checked
  PNG/JPEG up to 5 MB with bounded dimensions. The request records a content
  hash, hash-only request-device/network
  correlation and deterministic duplicate/editing markers, then stores the
  object privately with server-side encryption. Only an assigned-game Game
  Manager can stream it through an authenticated no-store endpoint. Browser
  uploads cannot prove the device that captured an image, and marker/AI signals
  are review clues rather than automatic proof.
- A Game Manager may approve, reject, or escalate supported initial or
  replacement evidence with recent authentication. Escalation transactionally opens one
  durable fraud case and temporarily freezes player mutations, prize release,
  withdrawal approval and new provider submission. Platform/Super Admin makes
  the independent final decision: clear restores access; confirm permanently
  bans the account, increments auth version and revokes the session. Provider
  outcomes already in flight are still reconciled truthfully. Legitimate
  append-only ledger balances are never automatically confiscated.
- Game Accounts keeps its compact cards and now shows `Change account`, the
  eligibility date, or `Account change used`. Every BGMI manual request requires
  the screenshot and explicit permanent-ban warning. Game Manager sees current vs
  requested identity, private evidence and risk signals; Security Attention
  owns the final clear/permanent-ban queue.
- Verification 2026-08-26: backend aggregate passes 390/390, including
  replacement, fraud-freeze, Match/Event prize and withdrawal integration
  coverage. Frontend passes 134/134, full ESLint and the 567-module production
  build. Generated API documentation covers 212/212 mounted operations. A live
  authenticated S3 upload/review proof remains required in the configured test
  environment before this workflow is considered deployment-verified.

## Latest Fix: PhonePe Sandbox Completion Binding

- PhonePe V2 status lookup correctly uses the merchant order ID as its query,
  while completion evidence now binds the returned provider `orderId` to the
  provider order captured by the original checkout. The previous implementation
  incorrectly compared PhonePe's provider ID with the merchant ID and therefore
  rejected legitimate `COMPLETED` payments as evidence mismatches.
- Exact amount, stored provider-order identity, transaction idempotency and the
  balanced deposit ledger remain mandatory. A missing/mismatched provider ID or
  amount still fails closed with zero credit.
- Focused payment checks pass 14/14 and the complete payment replica integration
  suite passes 32/32. One affected ₹1,000 sandbox order was reverified against
  PhonePe after the fix and recovered to exactly one completed Transaction, one
  deposit ledger entry and ₹1,000 available test balance.

## Latest Refinement: Player Password Scope

- Player password reauthentication is required only before creating a
  withdrawal request. It is no longer required for PhonePe deposits, Quick
  Match/Tournament joins, or paid/free Event registration.
- Competition entry still requires an authenticated verified player, verified
  game account, server-owned eligibility/capacity, exact wallet balance and
  transactional idempotent holds. Deposits remain provider-verified and ledger
  backed. Staff and governance recent-authentication rules are unchanged.
- Account Settings now explains this boundary. Focused backend policy/payment
  checks pass 22/22 and focused frontend entry/authentication checks pass 4/4.

## Latest Refinement: Post-registration Round Planning and Compete Feed

Superseded operational decision (2026-08-21): initial Event approval remains
governed, but routine round planning no longer returns to governance. The active
amendment is sequential Event Manager-owned execution: configure one round from
the current server-owned list, generate rooms, capture verified ranking evidence,
mark top-N promoted and all others eliminated, then repeat from the promoted
list. Open Events have no product seat cap. This replacement is now implemented;
the previous full-plan proposal and per-round governance review UI/Redux are
removed and their old mutation paths return stable retirement errors.

- New Event drafts no longer accept round definitions. Initial approval covers
  timing, admission/capacity, entry terms and placement rewards.
- Registration closure moves the Run to `registration_closed` with round setup
  required. Event Manager configures only the next round: players per room,
  promote count, timings and final-round state. Round 1 uses committed
  registrations; subsequent rounds use only immutable promoted outcomes.
- Open registration omits `registrationCapacity`; limited-seat and
  invitation-only schedules retain a finite capacity. Every API page, room and
  worker claim remains bounded even when the total registration count is large.
- Platform/Super Admin Event Management contains Approvals, Invitations, and
  Results & Rewards. It does not close registration, create rooms or plan later
  rounds. The retired admin close command returns 410.
- Historical Runs retain their approved plans. Every new Run created through
  the service explicitly starts with `roundPlanStatus=not_configured`.
- Player navigation now has one `Compete` destination. Scheduled Events and
  Quick Matches load together; former Tournaments/Events list paths redirect
  there. Event cards show status, access, entry, registration totals, rewards,
  commitment, own Match link and a countdown to registration or Event start.
- Verification: backend competition policy 100/100, competition replica
  integration 93/93 (including an open-capacity sequential registered ->
  promoted -> final journey), API documentation 197/197, frontend state
  101/101, lint, diff checks and the 556-module production build pass.
  Authenticated desktop/mobile visual verification remains pending because the
  local API session endpoint was unavailable during the final browser attempt.

## Latest Refinement: Event Detail and Standings

- Compete remains the single competition-discovery feed. Every Event card now
  opens a dedicated `/dashboard/events/:runId` view; no separate Event list or
  navigation tab was reintroduced.
- Registration controls render only while the server-owned registration window
  is open. After it closes, cards and details retain timing/status evidence but
  expose no disabled or actionable registration control.
- The detail view shows timing and countdown, entry/access/player counts, the
  complete placement-reward table, the viewer's registration and Match
  progression, and bounded cursor-paginated final standings.
- Backend `GET /api/player/events/:runId` applies the same invitation-only and
  ownership visibility policy as discovery, returns 404 to an unauthorized
  viewer, and avoids dependence on the 100-item discovery bound.
- Verification: backend aggregate 305/305, Event registration replica
  integration 14/14, API docs 181/181, frontend 90/90, full lint, and the
  556-module production build passed. Authenticated desktop/mobile visual
  verification remains pending.

## Latest Refinement: Event Operations Coordination

- After registration closes, Event Manager operations now expose bounded,
  cursor-paginated registration records, generated rooms, operator coverage
  and sporting standings. The manager may assign an eligible active Match
  Operator from the Event's game scope only while a room is still awaiting an
  operator; the conditional assignment and its staff audit commit atomically.
- Game Manager receives a separate read-only assigned-game Event view with
  registration identities, room/operator workload and standings. Email,
  wallets, lobby credentials, private result evidence, Match chat and every
  mutation remain excluded.
- Match chat is a persistent append-only conversation owned by each Match.
  Only server-derived Match participants and the currently assigned Match
  Operator may read or send; history is cursor-paginated, messages are bounded
  to 500 characters and writes are rate-limited. Event/Game Managers cannot
  access it.
- Match Operator operations retain the ranked room-order/result workflow and
  now show the private Match conversation inside the assigned room. Players
  receive the same conversation inside their Match timeline, never through an
  Event-wide public chat.
- Open and limited Events remain spectator-visible after registration closes
  through completion, with safe timelines and standings. Invitation-only
  Events remain private to invited/registered viewers at the API boundary.
- Verification: competition integration 90/90 and competition unit 92/92;
  focused Event registration/operations coordination replica checks 17/17;
  frontend aggregate 94/94, full lint, 559-module build; API documentation
  192/192; syntax and diff checks passed. The localhost public shell rendered
  cleanly without console warnings. Authenticated desktop/mobile role workflow
  remains a visual follow-up; server authorization and transport contracts are
  covered by the completed automated gates.

## Completed Code Slice: Competition Read Caching

- Redis now caches only bounded competition read projections: shared/scoped
  Quick Match offering discovery, authorized Room lineups, private player Event
  list/detail views, display-name Event leaderboards and player standings.
  Player Match reads containing time-gated lobby credentials remain uncached,
  as do auth/session, money, payment, withdrawal, notification, private chat
  and operator-evidence responses.
- Cache keys use versioned namespaces plus SHA-256 variant digests so player
  identities and cursors do not appear in Redis key names. Mandatory 10-15
  second TTLs bound missed invalidations; Redis errors fall through to MongoDB.
  Per-process single-flight coalescing prevents duplicate loaders for one key.
- Committed offering create/update, Quick Match join, Event registration,
  invitation and revocation writes advance namespace epochs. Readers recheck
  the epoch before filling Redis, preventing a slow pre-write query from
  repopulating stale data. Old epochs expire without Redis scans or broad
  flushes. Socket.IO continues to signal clients to refetch; HTTP and MongoDB
  remain authoritative.
- Quick Match leaderboard membership and Event invitation visibility are
  checked before cached data is returned. A private viewer overlay is never
  mixed into a shared public offering cache.
- Verification: focused cache behavior 5/5, competition policy 113/113,
  competition replica integration 102/102, and all backend aggregate
  components 343/343 passed. The local Redis daemon was unavailable for a live
  adapter probe; fail-open behavior is covered and deployed cache hit-rate/
  invalidation observation remains an operations follow-up. The endpoint and
  bypass matrix is documented in backend `docs/COMPETITION_CACHE.md`.

## Latest Refinement: Player Matches Workspace

- The existing Live Matches and Completed split remains the only player Match
  navigation. Cards now distinguish Quick Match queues from Event rooms and
  show Event round/room identity where available.
- Compact artwork-backed cards reuse the frontend Game presentation registry.
  Queue cards show only the current room status; generated Match cards
  prioritize schedule, assigned operator, lobby/start countdown and current
  lifecycle. A missed scheduled start becomes a clear delayed/operator-waiting
  state instead of leaving a zero countdown. Every card retains one direct
  destination instead of duplicating operational controls on the list.
- Match detail no longer renders a lifecycle progress rail. Its Lobby, Chat,
  Dispute and Results tabs keep distinct work together: Lobby renders BGMI solo
  player tiles plus horizontal two-seat duo and four-seat squad cards in a
  two-column desktop room grid. COC renders explicit Team A versus Team B war
  panels with five numbered slots per side. Game-specific slots use flat filled
  surfaces to distinguish occupied player initials and active markers from
  muted `Available` vacancies, without decorative HUD effects or explanation
  panels. Slot usernames wrap naturally on desktop and mobile rather than being
  hidden by a one-line ellipsis. The authenticated player seat is labelled
  `You`, and team modes additionally highlight that player's complete team.
  Chat remains the private
  participant/operator channel; Dispute preserves the stage-gated command;
  Results renders verified placement ranking and result notes.
- Loading uses two restrained card skeletons, errors include an inline Retry,
  and a small refresh action is available without adding another dashboard
  explanation panel. Lobby credentials remain exclusively on the protected
  participant Match detail response and are still time-gated by the backend.
- Frontend tests pass 114/114, ESLint and the production build pass. A real authenticated staff utility
  session rendered console-clean on desktop and 390x844 mobile with exact
  viewport width and no horizontal overflow. Populated player-card browser
  verification remains a follow-up because the available session was staff
  read-only.

## Latest Completion Pass: Team Events and Reliability Hardening

- Team Event free-admission groundwork and its independent security review
  pass. The review found and fixed a high-severity shared-roster gap: eligibility
  now loads and enforces every member's persisted `role === player`, so a Team
  containing a member who became staff cannot enter an Event or Quick Match.
  A concurrent overlapping-Team regression proves exactly one complete roster
  wins and the loser receives stable 409 with no partial registration.
- BGMI duo/squad Match lobbies now render every capacity-implied team card, not
  only occupied groups. Existing current-player/current-team highlighting and
  wrapped usernames remain intact.
- Ranked/sequential team Event execution now carries immutable team
  identities through room generation, operator team ranking, whole-team
  advancement, standings and deterministic team-total reward splitting. The
  independent safety review removed internal member-ID leakage and corrected
  promoted/eliminated pagination to return one whole team per row. Paid team
  entry now records captain-funded or split-member payer evidence per seat.
- Game Manager assigned-game reads now use database aggregate counts and
  independent per-game bounded feeds. A busy game cannot starve another game
  behind a global limit, and room-to-Match lookups are restricted to returned
  rooms. Supporting Match, Room, EventRun and StaffActivity indexes are present.
- Discord publications and staff role sync now use a leased Mongo outbox with
  transaction-aware enqueue, bounded reconciliation, expired-lease recovery,
  retry backoff and idempotent delivery evidence. Current assignments are
  recomputed at delivery so revoked roles converge; private Events and lobby
  credentials cannot enter publication payloads.
- Profile upload accepts only one 512KB JPEG/PNG whose signature matches its
  declared type and uses server-owned safe avatar/banner paths. S3 and COC
  upstream calls are bounded; COC tags are canonical and rate-limited through
  Redis, and upstream failures use redacted shared envelopes.
- Player Match and waiting-Room history replaced both silent 100-row caps with
  independent opaque cursors, 1-50 bounded pages, stable indexed ordering and
  backward-compatible root arrays. Redux refresh replaces while load-more
  appends/de-duplicates with stale-response protection.
- Frontend verification: 119/119 state/contract tests, full ESLint, 560-module
  production build and diff check pass. The public local shell rendered with no
  browser console warnings; authenticated team-Event and populated team Match-
  room proof remains pending because the local API was not running.
- Backend verification: the maintained aggregate passes 367/367: auth 48,
  auth integration 7, social 23, competition 119, competition integration 116,
  payment policy 11, payment integration 32 and realtime 11. API documentation
  covers 207/207 mounted operations; both repository diff checks pass.
- Next safe local priorities are remaining social/compatibility pagination,
  Redux-boundary migrations, graceful API shutdown/monitoring hooks and durable
  deployment evidence. External deployment/provider gates still require their
  documented billing and release decisions.

## Latest Refinement: Captain-Owned Team Entry and Reward Choice

- Paid team Quick Matches and Events now expose two explicit captain choices:
  `captain_pays` funds the complete server-derived roster from the captain's
  wallet, while `split` funds one reviewed per-seat fee from each accepted team
  member. Solo entry remains self-funded and free entry creates no hold.
- Only the canonical ready-team captain can submit the saved Team ID and mode.
  The backend re-derives member consent, eligibility and exact amounts; no
  client player list or amount is accepted. All registrations/queue membership
  and every seat hold commit in one MongoDB transaction or roll back together.
- Quick Match `WalletHold` and Event `EventEntryHold` retain the participant as
  sporting seat owner and snapshot a separate immutable payer. Settlement,
  cancellation release and Event recovery refund follow that payer. Sporting
  standings always belong to the canonical team; reward recipients follow the
  immutable funding/reward policy chosen at entry.
- Captain-funded teams now snapshot one bounded reward choice. With
  `captain_keeps`, the complete team-place reward is posted to the captain. With
  `reimburse_then_split`, the captain first recovers every funded seat fee and
  the remaining winnings split deterministically across the immutable team.
  If the reward does not cover the funded entry total, it remains entirely with
  the captain. Split-funded teams retain deterministic member reward splitting.
- Compete, Quick Match detail/cards, Event detail and the compatibility Event
  list use compact payment and reward choices after the captain selects a
  matching ready team. Redux sends only Team ID, bounded attempt ID where
  applicable, payment mode and reward enum. Passwords remain withdrawal-only
  on the player side.
- Production/live-money enablement remains fail-closed behind the existing
  provider, worker, monitoring and release gates. This contract is available
  only wherever the existing paid-entry sandbox/release flag is enabled.
- Verification 2026-08-25: backend maintained aggregate 375/375 (auth 48,
  auth integration 7, social 23, competition 122, competition integration 121,
  payment policy 11, payment integration 32 and realtime 11). Replica journeys
  prove both reward choices through Quick Match hold/capture/settlement/release
  and ranked Event pending allocation; corrupt payer/policy evidence fails
  closed. Frontend 120/120, ESLint and the 561-module production build pass.
  API documentation covers 207/207 mounted operations and both repository diff
  checks pass. Authenticated paid-team browser proof remains a testing
  follow-up, not an authorization substitute.
