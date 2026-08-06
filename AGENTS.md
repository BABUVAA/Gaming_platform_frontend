# Project Agent Instructions

Before any investigation, plan, or code change, read `PROJECT_STATUS.md` in
this repository completely. It is the current source of truth for the frontend
and the paired backend project.

Treat its `User, Role, Scope, and UI Contract` as authoritative. Do not create
new roles, user types, scopes, dashboards, or route access paths without first
updating that contract and recording the backend authorization rule.

Work in complete vertical slices: inspect the relevant code, make the smallest
safe end-to-end change, verify it, and update `PROJECT_STATUS.md` before
finishing. Do not replace documented architecture or reopen completed decisions
without explaining the reason and recording the new decision.

Keep code readable, follow existing Redux Toolkit patterns, add concise
comments where behavior is not self-explanatory, and do not use direct API
calls from feature components when a Redux boundary exists.

When backend work is needed, read:
`C:\Users\HP\Desktop\Gaming_platform_backend\AGENTS.md`
