# Gaming Platform Operations Roadmap

## Product Model
- Platform: hosts tournaments, monitors events, and controls financial operations.
- Players: participate in matches, maintain profiles, use wallets/rewards, chat, and climb rankings.
- Clans: persistent team identities for community and clan-based competition.
- Teams: mini-squads created for tournament/match participation.
- Operators: run real lobbies, handle check-in/lobby flow, disputes, and result handling.
- Admin: full governance across operations, finance, trust, and compliance.

## Current Progress Snapshot
- In progress: Match Room v1 flow (check-in/result/dispute UX + backend endpoints).
- In progress: Verification queue UI and review actions with audit fields.
- In progress: Clan/social foundations (friend graph, bookmarks, profile preview).
- In progress: Public profile API and profile preview integration.
- In progress: Seeded realistic dummy data for users/clans/friends/matches/tournaments.
- Not started: settlement-grade finance orchestration, operator console UI, ranking engine.
- Not started: comprehensive observability dashboards and SLA reporting.

## Operational Modules

### 1) Identity and Verification Ops
- Scope:
  - Game account linking (manual/API verification).
  - Verification review queues and reviewer audit notes.
  - Eligibility gates for tournaments/matches.
  - Re-verification on risky account changes.
- Status: In progress.
- KPIs:
  - Pending verification count.
  - Avg verification turnaround time.
  - Approval/rejection ratio.
  - % players blocked by verification policy.

### 2) Tournament Ops
- Scope:
  - Tournament templates, scheduling, lifecycle control.
  - Registration windows, participation constraints, and capacity management.
  - Match generation and tournament health monitoring.
- Status: In progress (seed + base listing); advanced controls not started.
- KPIs:
  - Tournaments created/live/completed.
  - Fill rate by category.
  - Tournament cancellation rate.

### 3) Match and Operator Ops
- Scope:
  - Operator assignment and match ownership.
  - Lobby credential publishing and readiness control.
  - Check-in and no-show handling.
  - Result submission, verification, and dispute resolution.
- Status: In progress (API + player UI); operator console not started.
- KPIs:
  - Check-in completion rate.
  - Avg match closure time.
  - Disputes per 100 matches.
  - Avg dispute resolution time.

### 4) Financial Ops
- Scope:
  - Wallet ledger consistency and transactional audit trail.
  - Entry fee lock/release, rewards payout, refunds, reversals.
  - Admin reconciliation and anomaly detection.
- Status: Partially started in UI; settlement pipeline not started.
- KPIs:
  - Settlement success rate.
  - Payout turnaround time.
  - Refund turnaround time.
  - Ledger mismatch count.

### 5) Player Experience Ops
- Scope:
  - Profile lifecycle, social links, history, and activity summaries.
  - Notifications and real-time event awareness.
  - Chat and social operations.
- Status: In progress.
- KPIs:
  - Active users/day.
  - Match participation conversion.
  - Friend request acceptance rate.
  - Chat engagement rate.

### 6) Clan and Team Ops
- Scope:
  - Clan creation/join/leave governance.
  - Team creation and roster locks for matches.
  - Clan and team participation controls.
- Status: In progress for clan basics; team ops not started.
- KPIs:
  - Active clans/week.
  - Clan join conversion rate.
  - Team formation rate.
  - Clan-based tournament participation rate.

### 7) Ranking and Integrity Ops
- Scope:
  - Player/clan ranking models and updates.
  - Anti-abuse checks (collusion/smurfing patterns).
  - Integrity moderation workflows.
- Status: Not started.
- KPIs:
  - Ranking refresh latency.
  - Integrity flags per 100 matches.
  - False-positive moderation rate.

### 8) Admin Governance Ops
- Scope:
  - Central admin dashboards and queue controls.
  - Role/permission boundaries.
  - Policy enforcement and incident notes.
- Status: In progress (admin screens); governance depth not started.
- KPIs:
  - Queue backlog by type.
  - SLA breaches by queue.
  - Admin action audit completeness.

### 9) Observability and Reporting Ops
- Scope:
  - Live system dashboards.
  - SLA dashboards (verification/dispute/settlement).
  - Funnel reporting (signup to settled player).
- Status: Not started.
- KPIs:
  - Data freshness.
  - Alert time-to-detect.
  - Funnel conversion by stage.

## Sprint Plan

### Sprint 1 (Execution Focus)
- Verification Hardening v1:
  - Enforce eligibility checks from verification state.
  - Stabilize verification queue with clear SLA buckets.
  - Ensure complete audit fields on every review action.
- Match Flow Hardening v1:
  - Lock stage transitions server-side.
  - Validate proof/result payloads consistently.
  - Track dispute metadata in a timeline-safe structure.

### Sprint 2 (Operations Focus)
- Operator Console v1:
  - Assigned matches board.
  - Lobby credential publish/edit workflow.
  - Match watch panel for check-in/dispute/result progression.
- Finance Settlement v1:
  - Match outcome to payout state machine.
  - Admin settlement queue and reconciliation snapshot.

## Definition of Done (Per Module)
- Product behavior complete for target scope.
- Error/loading/empty states handled.
- Role and permission checks applied server-side.
- Audit fields captured for sensitive actions.
- Basic regression tests/smoke checks updated.
- KPI instrumentation added for each shipped operation.
