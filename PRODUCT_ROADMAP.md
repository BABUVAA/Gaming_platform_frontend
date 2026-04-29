# Gaming Platform Product Roadmap

## Vision
Build a reliable competitive gaming platform with strong trust, clear operations, and scalable growth loops.

## Milestone 1: Product Foundation
- Finalize route naming and navigation consistency.
- Stabilize auth/role guards for player/admin journeys.
- Standardize API error handling and toast behavior.
- Add baseline route smoke tests and CI build checks.

## Milestone 2: Player Core Experience
- Tournament discovery and join flow hardening.
- Match lifecycle v1:
  - match feed,
  - match detail page,
  - check-in and result submission surfaces.
- Wallet basics: balance, transactions, and request visibility.

## Milestone 3: Trust and Integrity
- Account verification end-to-end:
  - player submission,
  - admin review and decision notes,
  - clear status feedback.
- Dispute flow v1 with evidence upload placeholders and status tracking.
- Guardrails for duplicate joins and suspicious activity flags.

## Milestone 4: Social and Retention
- Clan operations hardening (create/join/manage roles).
- Chat resilience (presence, unread state, reconnect behavior).
- Referral and invite tracking with transparent reward states.

## Milestone 5: Admin Operations
- Admin command center with actionable queues.
- Tournament operations controls (create/edit/cancel/settle).
- Wallet and verification moderation tools with audit clarity.

## Milestone 6: Release Readiness
- Mobile QA pass across all critical routes.
- Performance pass (bundle split, lazy loading, heavy asset trim).
- Security and observability pass (auth handling, validation, error tracking).

## Immediate Next Sprint (Current)
1. Complete route and text correctness cleanup.
2. Implement `/dashboard/matches/:id` Match Room v1 page scaffold.
3. Polish verification management states (loading/empty/error/success).
4. Add route smoke tests for auth, dashboard, and admin paths.
