# Project Agent Instructions

Use `CURRENT_CHECKPOINT.md` as the fast-resume operational index and
`PROJECT_STATUS.md` as the complete source of truth for the frontend and paired
backend project.

On a new task/thread, after handoff or context loss, or whenever the current
tracker revision has not already been read, read `PROJECT_STATUS.md` completely
and then read `CURRENT_CHECKPOINT.md` completely. On later turns in the same
uninterrupted working session, read `CURRENT_CHECKPOINT.md` completely and only
the relevant `PROJECT_STATUS.md` sections. Re-read the full tracker before
changing roles, scopes, authorization, architecture, route ownership, money
contracts, roadmap order, or completion state. If the two files disagree,
`PROJECT_STATUS.md` is authoritative and the fast path is suspended until the
checkpoint is corrected.

Treat its `User, Role, Scope, and UI Contract` as authoritative. Do not create
new roles, user types, scopes, dashboards, or route access paths without first
updating that contract and recording the backend authorization rule.

Work in complete vertical slices: inspect the relevant code, implement the
documented end-to-end outcome, verify it, and update both `PROJECT_STATUS.md`
and `CURRENT_CHECKPOINT.md` before finishing. Use focused checks during
development and run expensive aggregate gates once after the stable slice. Do
not replace documented architecture or reopen completed decisions without
explaining the reason and recording the new decision.

Keep code readable, follow existing Redux Toolkit patterns, add concise
comments where behavior is not self-explanatory, and do not use direct API
calls from feature components when a Redux boundary exists.

When backend work is needed, read:
`C:\Users\HP\Desktop\Gaming_platform_backend\AGENTS.md`
