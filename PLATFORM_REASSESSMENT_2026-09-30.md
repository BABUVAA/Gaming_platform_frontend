# Platform reassessment — 2026-09-30

## Result and scope

This is a fresh paired-repository code, dependency, configuration and automated
regression audit, with local fixes. It is not a production certification or a
claim that every possible defect has been eliminated. Authenticated deployed
browser journeys, production logs and production database state were not verified.

Baseline: frontend `91d0460`, backend `8d1e513`, both on `main` with clean working
trees at the start. Changes below are local; this request did not commit, push,
deploy, alter cloud settings, enable real money or mutate production data.

Stack: React 18, Vite 6, Redux Toolkit and Socket.IO client; Express 5 modular
monolith, Mongoose/MongoDB, Redis sessions/locks/pub-sub, Socket.IO, Razorpay test
checkout and PhonePe compatibility. Existing roles, game scopes, route ownership,
integer-minor-unit ledger contracts and release gates are unchanged.

## Confirmed issues fixed

| Area | Defect | Repair and regression evidence |
| --- | --- | --- |
| Session handling | Every protected HTTP 401 was treated as lost player authentication. A `PAYMENT_PROVIDER_AUTH_FAILED` response could trigger refresh, replay checkout and then clear the player's session. | Transport and session middleware now share explicit authentication-error classification. A runtime Redux/transport test proves provider 401 is surfaced once without session invalidation; genuine session failure still invalidates access. This does not prove the cause of every historical device-specific login report. |
| Wallet refreshes | Older wallet/availability responses could overwrite newer state; status checks had no per-order request identity or duplicate-click guard. | Latest-request guards for balance, availability and per-order checks, plus suppression of concurrent duplicate checks. Regression tests cover out-of-order success/error and repeated clicks. |
| Payment history | PhonePe order insertion, unlike Razorpay insertion, could be erased by an older in-flight history response. | Both provider paths invalidate the stale list request when the new order arrives. |
| Private chat authorization | Querying only accepted canonical friendships allowed fallback to stale legacy friend arrays even when a canonical record was removed, declined, cancelled or pending. | The canonical record now always wins. Legacy fallback applies only when no canonical record exists. MongoDB integration tests cover all non-accepted states. |
| Payment callback idempotency | PhonePe callback redelivery unconditionally set reconciliation status to queued, bypassing an active processing lease or reopening a failed/completed job. | Callback metadata can update, but queued status is set only on insert. Integration tests prove active/terminal status, lease, attempts and failure evidence survive redelivery without ledger writes. |
| Backend test isolation | Session tests loaded application `.env`, required undeclared Redis and could wait indefinitely. CI supplied neither Redis nor test signing keys. | Disposable random test keys, explicit `TEST_REDIS_URL` instead of application Redis configuration, three-second connection deadline and reliable cleanup. CI supplies health-checked Redis. Actual Redis/Lua session tests pass; deliberately unavailable Redis exits with a clear failure. |
| Missing test coverage | Email canonicalization, game catalog schema and upload-security tests were omitted from aggregate npm test. | Added all three (15 tests) and a test-inventory guard that checks reachability through aggregate scripts. |
| Dependencies and CI | Newly reported vulnerable dependency versions and Node 20 CI baseline. | Updated lockfiles to Axios 1.20.0 in both projects, backend Engine.IO 6.6.11, frontend brace-expansion 1.1.21 and js-yaml 4.3.2. Added dependency-audit gates, backend API-doc coverage gate, bounded CI duration and Node 24 CI baseline. |
| Secret-file hygiene | `.env.production` and `.env.test` were not covered by the generic ignore policy. | Both repositories ignore `.env.*` while preserving `.env.example`. No real environment values were changed or copied into source. |

The backend dependency update covers the published
[Engine.IO protocol-mismatch denial-of-service advisory](https://github.com/socketio/socket.io/security/advisories/GHSA-2gc4-cqfq-p2gv).
The CI runtime change follows the [official Node release status](https://nodejs.org/en/about/previous-releases),
which lists Node 20 as EOL and Node 24 as LTS. Local verification used Node 24.15.0;
this is not evidence of the production runtime version.

## System coverage

| Subsystem | Evidence exercised | Remaining evidence boundary |
| --- | --- | --- |
| Registration, OTP, recovery, login | OTP expiry/retry limits, resumable signup, canonical email, password reset consumption, real Redis refresh rotation/replay detection, recent auth and private-state races | No real email delivery/inbox test or cross-device cookie matrix |
| Staff and player authority | Role/game scopes, independent approvals, assigned operator ownership, player-only mutation guards, safe staff utility reads, navigation contracts | No authenticated production role-by-role browser walkthrough |
| Friends, teams, clans, chat, notifications | Invitations/consent, exact team roster, active-participation leave/disband locks, unfriending cleanup, canonical chat denial, bounded history/unread totals, realtime contracts | No live multi-device Socket.IO load or reconnect drill; concurrent chat creation/send remains a targeted future stress-test area |
| Quick Matches | Idempotent joins, next-room entry, exact team seats, free verification waiver, paid holds, immutable terms, operator assignment, schedule/early closure/cancellation, original-payer refunds | No production tournament was created, joined, cancelled or edited |
| Events | Concurrent registration/waitlist, private invitation admission, team units, scoped operations, round review/generation/advancement, crash/retry rollback, operator and result boundaries | Unattended deployed worker operation not verified |
| Wallet, referral, payouts | Signature/provider evidence, owner-only history, manual recovery, exactly-once ledger/holds, independent prize release, referral credit, withdrawal policy | No real payment or payout executed; live-money release remains closed |
| Uploads and external services | JPEG/PNG validation, private evidence access, CoC request validation/redacted errors, Discord delivery/assignment contracts | No real S3, Discord or email-provider delivery proof |
| Runtime and delivery | Shutdown/config policies, mounted API documentation, CI test inventory, dependency audits, production frontend build and source smoke checks | Readiness/logs/worker heartbeat, restore, alert delivery, security/load testing and deployed runtime still require live evidence |

## Verification record

- Frontend: **191/191 tests passed**, ESLint passed, Vite production build passed
  (579 modules), route smoke and API-error/toast smoke passed.
- Backend aggregate: **477/477 passed**, exit code 0. Group totals: auth 64,
  auth integration 9, social 25, social integration 12, competition 137,
  competition integration 148, payments 13, payment integration 39,
  realtime 15, additional coverage 15.
- Post-dependency-update focused backend run: **26/26 passed**, including CoC,
  callback/provider policy, friendship cleanup and payment-order integration.
- API documentation: **230/230 mounted operations covered**.
- Full `npm audit` (including dev dependencies): **zero reported vulnerabilities
  in either repository** after updates. This is a point-in-time advisory scan,
  not a guarantee of absence of vulnerabilities.
- Both repository whitespace/diff checks pass. Environment ignore behavior was
  checked with `.env`, `.env.production`, `.env.test` and `.env.example`.
- Intentional negative test: missing test Redis fails within the three-second
  connection deadline (approximately five seconds including Node startup),
  instead of hanging or silently skipping authentication tests.
- Initial aggregate attempt failed only because local Redis was not running;
  verification then used an isolated, non-persistent Redis on port 6391 plus
  temporary MongoDB databases/replica sets. No application database was used.
- MongoDB test harness occasionally reports forced teardown after its normal
  SIGINT grace period on Windows. Assertions pass; this is not production
  shutdown proof. The existing production-build warning remains: largest shared
  JavaScript chunk is about **609 kB minified / 181 kB gzip**.

## Live checks and remaining launch work

The public frontend returned HTTP 200 with `X-Frame-Options: DENY` and
`X-Content-Type-Options: nosniff`. Its public bundle points to the recorded Render
API origin. API health/readiness probes experienced timeout/DNS failures from
this environment; DNS subsequently resolved, but a bounded repeat of both HTTP
probes still timed out. These observations alone do not
establish a service outage or healthy readiness.

The read-only Render monitoring connection returned `UNAUTHORIZED` and explicitly
requires reauthentication. No current deployment, service inventory, logs, worker
presence or infrastructure setting can be certified from that failed connection.
Earlier tracker statements about deployed workers/Redis settings are historical,
not fresh September 30 evidence.

Priority remaining work:

1. Reconnect Render; verify the actual API deployment, runtime, `/readyz`, error
   logs, worker heartbeat and database/Redis health. Then deploy the local fixes
   through the normal release process when requested.
2. Run authenticated mobile/desktop flows: fresh signup/recovery, login/logout,
   team creation/invitation/join, assigned operator work, direct/global/clan chat,
   and sandbox checkout/check-to-credit recovery. Include blocked-cookie and
   interrupted-network devices. Source tests are not substitutes for these runs.
3. Rotate every previously shared credential before release. Confirm backups,
   restore drill, alerts, bounded load behavior and current Redis durability.
4. Keep real-money/withdrawal gates closed. Explicit player/staff checks provide
   sandbox recovery without a worker; unattended reconciliation and Event work
   need separately verified operation. Do not provision paid workers or enable
   live keys without the owner's release decision and required payment proofs.
5. Profile/code-split the large shared frontend chunk in a dedicated performance
   slice, with measurements and browser regression proof rather than merely
   hiding Vite's warning.

## File map

Frontend: `.github/workflows/ci.yml`, `.gitignore`, `package-lock.json`,
`src/api/apiError.js`, `src/api/axios-api.js`,
`src/store/middleware/sessionLifecycleMiddleware.js`,
`src/store/slices/paymentSlice.js`, `tests/paymentSlice.test.mjs`,
`tests/sessionErrorClassification.test.mjs`, this report and both project trackers.

Backend: `.github/workflows/ci.yml`, `.gitignore`, `README.md`, `package.json`,
`package-lock.json`, `scripts/validateTestInventory.js`,
`services/paymentCallbackService.js`, `sockets/events/personalChat.js`,
`tests/authSession.test.js`, `tests/friendshipCleanup.integration.test.js`,
`tests/paymentOrder.integration.test.js`.
