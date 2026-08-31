# E-Gaming Platform Reassessment

Audit date: 2026-08-31  
Frontend revision: `2273be3` (`main`, synchronized with `origin/main`)  
Backend revision: `f0e43bc` (`main`, synchronized with `origin/main`)  
Public frontend: `https://gaming-platform-frontend-vert.vercel.app`  
Public API: `https://gaming-platform-backend.onrender.com`

## 1. Executive verdict

The platform is a substantial, working tournament product rather than a
prototype. Identity, player social features, Team formation, free Quick Match
entry, sequential Events, Match operations, staff role separation, chat,
notifications, referral credit, wallet accounting, and sandbox payment flows
all have real code and broad automated contract coverage.

The correct release classification is:

| Release mode | Verdict | Reason |
| --- | --- | --- |
| Free-entry controlled tournaments | **Conditionally ready** | Core flow exists, but the active deployment currently requires game-account verification again, has one known Team concurrency error, and still needs one authenticated end-to-end production rehearsal after the latest auth changes. |
| Small invited beta/community use | **Ready with monitoring** | Player, staff, social, chat, notification, and free competition surfaces are present. Operate manually and keep participant counts controlled. |
| Sandbox paid-tournament testing | **Partially ready** | Ledger-backed code and manual governance reconciliation exist, but the payment worker is not deployed and the database currently contains queued and failed reconciliation jobs. |
| Unrestricted real-money launch | **Not ready** | Payout provider, deployed workers, callback certification, monitoring, recovery drills, and formal release approval remain open. |

No evidence of an authentication bypass, privilege escalation, double-credit,
or production dependency vulnerability was found in this pass. This was a
code/configuration/operational audit, not a penetration test, accessibility
certification, or load test.

## 2. Evidence levels

- **Verified now**: inspected in current code and passed a fresh automated or
  live read-only check during this audit.
- **Previously verified**: current HEAD contains the same implementation and
  the project records a completed focused/integration proof, but the proof was
  not rerun end to end in this audit.
- **Code present, external proof open**: implementation exists, but provider,
  browser, worker, or deployment evidence is incomplete.
- **Not production-ready**: intentionally disabled or missing a mandatory
  release dependency.

## 3. Current deployed state

Read-only production snapshot against the `e-gaming` database:

| Area | Current state |
| --- | --- |
| Accounts | 29 total: 24 verified, non-banned players and 5 verified, non-banned staff accounts |
| Staff authority | 12 active assignments: 1 Super Admin, 1 Platform Admin, 2 Tournament Managers, 2 Event Managers, 2 Game Managers, 4 Match Operators |
| Game catalog | 2 Games |
| Quick Matches | 1 active offering: `BGMI QUICK MATCH SQUAD`, Squad/Erangal, exact Team size 4, 100 player seats, free entry, INR 300 prize pool |
| Active Room | 1 waiting Room with one complete squad: 4 members, 4/100 seats |
| Game-account waiver | Expired at 2026-08-31 12:00 PM IST |
| Game accounts | 0 identity links and 0 pending verification requests |
| Events | 0 Templates, 0 Runs, 0 registrations, 0 Matches |
| Social | 10 Teams, 1 Clan, 10 Friendships, 2 Global Chat messages |
| Referrals | 2 referrals, both awaiting the referred player's first tournament completion |
| Wallets | 16 wallets; INR 2,100 total available test balance; no entry-held, prize-pending, withdrawable, or withdrawal-pending funds |
| Payments | 7 Transactions: 2 completed, 3 pending, 2 failed; reconciliation jobs: 2 completed, 3 queued, 2 failed |
| Security/operations | 1 retained security event; 0 fraud cases; 0 Discord delivery jobs; 0 withdrawals |

Operational consequence: the already joined squad remains in its waiting Room,
but new joins should now fail game-account eligibility because the waiver has
expired and no player currently has a linked game account. Extend the waiver
only if another deliberate free tournament is planned; otherwise restore the
normal verification workflow.

## 4. Functional inventory

### Public identity and account recovery

| Function | State | Audit conclusion |
| --- | --- | --- |
| Signup and email OTP | Verified now / previously integrated | Pending registration, hashed six-digit OTP, expiry, attempt bound, resend cooldown, transactional promotion, and safe recovery state exist. |
| Cross-device pending-signup recovery | Verified now | A new username/password can be proposed and becomes authoritative only after the correct OTP. Secrets are not stored in browser persistence. |
| Login/session refresh/logout | Verified now with deployment caveat | Redis-backed single session, short access token, rotating refresh, auth version, logout revocation, and cross-site partitioned cookies exist. Live readiness/CORS are green. A fresh affected-device post-signup login remains required. |
| Password recovery/change | Previously verified | Non-enumerating request, expiring single-use link, password strength, auth-version increment, and session revocation are implemented. |
| Transactional email | Code present, external proof open | Resend sender domain and branded messages have delivered successfully. Bounce/failure monitoring and stronger DMARC enforcement remain open. |

### Player experience

| Function | State | Audit conclusion |
| --- | --- | --- |
| Compete discovery | Verified now | Events and Quick Matches use canonical Game-backed Redux reads and responsive cards. Current deployment exposes only one Quick Match and no Events. |
| Free Quick Match join | Previously verified | Exact solo/Team eligibility, waiting-Room idempotency, repeat Rooms, team-size enforcement, private lineup, and Match creation are implemented. Current deployment's verification waiver has expired. |
| Event registration/execution | Previously verified | Open/limited/invitation admission, sequential rounds, Team units, rankings, advancement, standings, and reward allocation exist. No Event is configured now and the Event worker is not deployed. |
| Matches | Previously verified | Live/completed history, Room/Match detail, protected lobby timing, private chat, dispute, and results views exist with bounded pagination. |
| Teams | Verified now; local concurrency fix pending deployment | Player-owned, friend-based Teams support overlapping rosters, exact-ready-roster uniqueness, batch invitations, reusable names, and active-participation leave/disband locks. Invitation decline now uses an atomic conditional update; a concurrent regression proves duplicate requests return one success and one stable `TEAM_INVITATION_NOT_FOUND`, with no `VersionError`. |
| Friends | Verified now | Search, incoming/accepted/sent tabs, public-profile actions, removal, and direct-chat cleanup exist. |
| Clans | Verified now | Creation, discovery, bookmarks, join requests, settings, role controls, chat, and member profiles exist. |
| Chats | Verified now / previously live-proven | Direct, Clan, Match, and opt-in Global Chat exist with bounded retention, delivery acknowledgements, safe thread reconciliation, unread direct-message counts, profile actions, and Clan invitations. |
| Notifications | Verified now | Durable owner-only history, exact unread total, mark-one/all-read, realtime reconciliation, mobile access, and cursor pagination exist. |
| Refer & Earn | Verified now | INR 10 tournament-only credit posts once after first completed competition. It is spendable from available funds and never withdrawable. Current two referrals have not qualified yet. |
| Profile and public profile | Previously verified | Lean private profile, safe public showcase, social links, image validation, clan/competition summary, and staff read-only mode exist. |
| Game accounts | Code present, external proof open | Unique ownership, COC verification, BGMI evidence, one controlled replacement, Game Manager review, and fraud escalation exist. Live S3 upload/review proof remains open, and deployed data currently has no linked accounts. |
| Wallet | Verified now / sandbox only | Five-bucket projection, immutable owner ledger, top-up, payout destinations, withdrawal request/history, and explicit test-money labeling exist. Production withdrawal capability remains disabled. |

### Staff and governance

| Workspace | State | Authority boundary |
| --- | --- | --- |
| Staff Home | Verified now | Shows only active assignment-derived workspaces. |
| Role Management | Previously verified | Super/Platform Admin manage subordinate assignments, scope, suspension, revocation, reassignment, recommendations, reports, and history. |
| Player Management | Verified now | Bounded search/filter/read view of registered players; no generic delete or ban shortcut. |
| Game Catalog | Previously verified | Platform Admin owns Game definition and lifecycle; Game Manager is scoped operationally. |
| Tournament Manager | Previously verified | Owns Quick Match offerings only within assigned Game scopes. Governance identity alone cannot mutate offerings. |
| Event Manager | Previously verified | Owns scoped drafts, invitations, registration closure, sequential rounds, room/operator coordination, and sporting results after initial approval. |
| Game Manager | Previously verified | Scoped health/read views, Match schedule/lobby setup, and game-account verification only. |
| Match Operator | Previously verified | Scoped claim, start, chat, ordered result, and verification actions for assigned Matches. |
| Governance reviews | Previously verified | Independent Event approval, disputes/recovery, prize release, withdrawal review, payment reconciliation, fraud decision, and security attention are separated from operations. |
| Discord staff/community | Code present, external proof open | Local OAuth/role sync and live community publication were proven, but deployed OAuth secrets/redirect and supervised delivery worker proof remain open. |

## 5. Architecture and API assessment

The current modular monolith remains the right architecture. There is no
measured reason to split services yet.

- Frontend: React 18, Vite, React Router, Redux Toolkit, Axios, Socket.IO.
  Current inventory is 199 source files, 35 pages, and 65 store-related files.
- Backend: Express, Mongoose/MongoDB, Redis/Valkey, Socket.IO, transactional
  services, and leased background jobs. Current inventory is 28 root models,
  21 route files plus domain module routes, 46 services, and 84 test files.
- API documentation: fresh check passed for all **220 mounted operations**.
- Route security: public, authenticated, verified-player, staff, and governance
  mounts are separated; operational roles and Game scope are rechecked by the
  backend.
- Financial model: integer INR minor units, append-only balanced ledger,
  immutable execution snapshots, idempotency, and Mongo transactions are
  materially stronger than a typical early-stage tournament platform.

Architecture debt still present:

- `GameAccounts`, the public `/coc` utility, and `ClanVerify` still call Axios
  directly instead of using a Redux boundary.
- The `/coc` page is registered as public but its API is authenticated, so an
  anonymous visitor reaches a tool that can only fail with 401. It also renders
  raw response JSON and logs errors to the console.
- Legacy compatibility remains at backend `/`, `/api/users/dashboard`, and in
  several direct `res.json` controller responses. A scan found 59 direct JSON
  response sites, so the documented shared envelope is not yet universal.
- Social/compatibility pagination work remains; not every list boundary has
  the same opaque-cursor contract as competition, notifications, staff, and
  ledger reads.

## 6. Security assessment

### Strong controls

- Host-only `HttpOnly`, `Secure`, `SameSite=None`, partitioned cookies for the
  current Vercel-to-Render topology.
- Explicit Origin allowlist and trusted-origin checks on unsafe cookie-auth
  requests provide CSRF protection.
- Session rotation, versioning, Redis validation, replay/fingerprint security
  events, and single-session replacement.
- Password/OTP/reset credentials are hashed or server-only; browser persistence
  excludes auth secrets.
- Player participation is denied to staff even when staff inspect safe player
  pages.
- Staff authority comes from active assignments, not browser state or a broad
  user role.
- Money and competition mutations use server-derived identities, amounts,
  rosters, scopes, and outcomes.
- Upload type/signature/size checks and bounded upstream requests exist.
- Both fresh production dependency audits report zero known vulnerabilities.
- Backend responses include HSTS, frame denial, MIME-sniff prevention,
  referrer policy, and a restrictive camera/microphone/geolocation policy.

### Open security risks

1. **P1 – Frontend response headers require deployment proof.** The live Vercel
   document has HSTS but lacks the remaining baseline headers. Locally,
   `vercel.json` now adds clickjacking, MIME-sniffing, referrer, permissions,
   and narrowly scoped CSP protections without restricting API/WebSocket
   origins. Deploy and verify the actual response headers before closing this.
2. **P1 – MFA/passkeys are absent.** Password reauthentication protects
   sensitive staff commands, but governance accounts still need a second
   factor and recovery codes before real-money launch.
3. **P1 – Cross-site cookie recovery still needs device proof.** The newest
   login fix is deployed and silently verifies cookie delivery, but must be
   proven on the exact affected browsers. Because login creates the new single
   Redis session before cookie proof, a browser that blocks the cookie can
   still replace a valid session on another device even though the failing
   browser stays logged out. Prefer provisional activation: confirm the cookie,
   then revoke/promote the prior session.
4. **P1 – Proxy trust requires deployment proof.** Rate limits depend on
   `req.ip`. The Blueprint now declares `TRUST_PROXY_HOPS=1` for the Render web
   service and has a regression assertion, but the live service still needs a
   deployment and two-network rate-limit check before this is closed.
5. **P2 – Security operations are incomplete.** Denied-access coverage,
   actionable alerts, incident procedures, periodic access review, secret
   rotation evidence, and a production penetration test remain open.
6. **P2 – Privacy/compliance needs a formal pass.** Login activity stores
   recent IP addresses and user-agent/device history. Define retention,
   user-facing disclosure, access controls, and deletion/export procedures
   before broad public onboarding.

## 7. Reliability, scale, and operations

### Live checks that passed

- Vercel frontend returned 200 and SPA deep links returned the application
  document.
- Render latest backend deployment is `live` at commit `f0e43bc`.
- `/healthz` returned 200.
- `/readyz` returned 200 with MongoDB and Redis both `ready`.
- Anonymous session read returned the expected 401 shared error envelope.
- Credentialed CORS and preflight returned the exact canonical frontend origin
  and allowed credentials.
- Render is running one non-suspended web instance and the Key Value instance
  is available.

### Open operational risks

1. **P0 for paid automation – Workers are not provisioned.** `render.yaml`
   declares Event and payment workers, but Render currently lists only the API
   web service. Three payment reconciliation jobs are queued and two failed.
   Keep manual sandbox reconciliation and all live-money modes closed until
   both workers, alerts, restart behavior, and provider idempotency are proven.
2. **P1 – Redis has persistence disabled.** Sessions, rate-limit counters,
   cache epochs, presence, and ephemeral coordination can disappear on a Redis
   restart. The database remains authoritative for durable business records,
   but users can be logged out and protection windows reset.
3. **P1 – One free API instance provides no high availability.** Cold-start
   delay was observed during the direct audit probe. There is no autoscaling,
   redundant instance, or zero-downtime capacity proof.
4. **P1 – API web shutdown is not graceful.** Worker shutdown is handled, but
   the web entry point has no SIGTERM/SIGINT path that stops accepting traffic,
   drains Socket.IO/HTTP, and closes Redis/Mongo cleanly.
5. **Resolved locally; deployment pending – Team invitation concurrency.**
   Render recorded a DELETE Team invitation request failing with Mongoose
   `VersionError` and HTTP 500 on 2026-08-29. Decline is now an atomic
   conditional update with a concurrent regression test; production remains
   unchanged until the backend revision is deployed.
6. **P1 – No central service objectives or alerts.** Structured request IDs and
   safe logs exist, but there are no documented alert thresholds, error-rate/
   latency dashboards, auth SLO, queue-join SLO, payment reconciliation SLO,
   or on-call procedure.
7. **P2 – Recovery has not been rehearsed.** Backup/restore, Redis-loss,
   Mongo failover, worker crash, and dependency-timeout drills are missing.
8. **P2 – Metrics evidence was unavailable.** Render returned no CPU, memory,
   request-count, or p95 latency data for the queried window, so capacity and
   latency cannot be rated from this audit.

## 8. Engineering quality

### Fresh frontend results

- State/contract tests: **164/164 passed**.
- ESLint: passed.
- Production build: passed, 578 modules transformed.
- Route smoke: passed.
- API-error/toast smoke: passed.
- Production dependency audit: 0 known vulnerabilities.
- `git diff --check`: passed.

Build warning: one minified shared chunk is **594.79 kB** (178.33 kB gzip),
above Vite's 500 kB warning threshold.

### Backend results

- API documentation coverage: **220/220 mounted operations passed**.
- Production dependency audit: 0 known vulnerabilities.
- `git diff --check`: passed.
- The current revisions previously recorded **430/430** backend tests passing.
- A fresh aggregate rerun was **inconclusive**, not failed: with no local Redis
  daemon, the imported Redis client retried `ECONNREFUSED` indefinitely before
  the first group could terminate. The command was stopped without contacting
  production Redis. Isolate/mock Redis in tests or provide a documented local
  test service so one clean command works from a clean checkout.

### CI/reproducibility repair applied locally

The frontend workflow runs `npm ci`. `package-lock.json` is no longer ignored,
has been regenerated from the current manifest, and a clean `npm ci` completed
with zero dependency advisories. The lockfile is tracked in frontend commit
`18eb202`; the backend lockfile is already tracked.

The tracked frontend `dump.rdb` is a valid but tiny (89-byte) Redis dump. It
appears empty, but generated datastore artifacts should not be versioned;
remove it and ignore `*.rdb` after confirming no required fixture depends on it.

## 9. Priority action plan

### Before the next public tournament

1. Decide whether game-account verification should be restored or extend the
   free-only waiver for the exact tournament period. At present, new entry is
   effectively blocked.
2. Deploy the locally verified Team invitation concurrency fix, then confirm
   duplicate decline requests no longer produce a 500 in Render logs.
3. Run one real production journey on the affected class of device:
   signup -> OTP -> login -> refresh -> Compete -> Team picker -> join ->
   socket reconnect. Confirm no duplicate session-expired notifications.
4. Confirm both GitHub Actions workflows pass with the committed frontend
   lockfile.
5. Deploy the Blueprint-managed `TRUST_PROXY_HOPS`, then test login/signup limits from two
   different client networks and two accounts.

### Before scaling the free platform

1. Deploy and live-verify the locally configured Vercel security headers and
   narrow CSP.
2. Add graceful API shutdown and test a deploy while sockets/requests are
   active.
3. Move Game Accounts, COC utility, and Clan verification behind Redux-owned
   request boundaries; retire or protect the public COC utility.
4. Finish bounded pagination for remaining social/compatibility reads.
5. Add Playwright/Cypress end-to-end journeys, an accessibility gate, and
   measured mobile performance budgets.
6. Establish dashboards and alerts for auth failures, 429s, 5xx, p95 latency,
   queue joins, stale Matches, worker backlog, email failures, and provider
   reconciliation.
7. Upgrade Redis to a persistent operational plan or document and rehearse the
   accepted session-loss behavior.

### Before any live-money launch

1. Provision and supervise Event and payment workers.
2. Drain or resolve every queued/failed sandbox reconciliation job and prove
   callback plus polling idempotency.
3. Integrate and certify the real payout adapter, signed provider callbacks,
   retries, terminal failure release, and reconciliation.
4. Add MFA/passkeys for governance and independent finance reviewers.
5. Complete load/failure tests, backup restoration, incident response,
   security testing, financial reconciliation sign-off, and explicit go-live
   approval.

## 10. Overall scorecard

These scores summarize readiness, not feature count:

| Dimension | Rating |
| --- | --- |
| Core product depth | 8/10 |
| Free competition readiness | 7/10 |
| Authorization and money model | 8/10 |
| Player/staff UX completeness | 7/10 |
| Automated contract coverage | 8/10 |
| Browser/E2E/accessibility evidence | 4/10 |
| Reliability and observability | 4/10 |
| Deployment scalability | 3/10 |
| Real-money launch readiness | 4/10 |

Recommended product stance: run a controlled free tournament after the five
pre-tournament actions above, keep sandbox money clearly labelled, and do not
open unrestricted payments or withdrawals yet.
