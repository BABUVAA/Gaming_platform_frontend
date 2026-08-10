import assert from "node:assert/strict";
import test from "node:test";
import accessControlSlice, {
  changeAccessAssignmentStatus,
  fetchAccessAssignments,
} from "../src/store/slices/accessControlSlice.js";
import {
  buildStaffReassignmentPayload,
  isStaffDirectoryAssignment,
} from "../src/utils/staffDirectory.js";

test("reassignment reuses the revoked role identity and prior game scope", () => {
  assert.deepEqual(
    buildStaffReassignmentPayload({
      gameScopes: [{ _id: "game-1" }, { _id: "game-2" }],
      role: "game_manager",
      user: { _id: "user-1" },
    }),
    {
      gameIds: ["game-1", "game-2"],
      role: "game_manager",
      userId: "user-1",
    },
  );
});

test("Role Management Directory keeps revoked rows available for reassignment", () => {
  assert.equal(isStaffDirectoryAssignment({ status: "active" }), true);
  assert.equal(isStaffDirectoryAssignment({ status: "suspended" }), true);
  assert.equal(isStaffDirectoryAssignment({ status: "revoked" }), true);
  assert.equal(isStaffDirectoryAssignment({}), false);
});

test("revoking a role keeps it in Staff Directory state", () => {
  const assignments = [
    { _id: "role-1", role: "match_operator", status: "active" },
    { _id: "role-2", role: "event_manager", status: "active" },
  ];
  let state = accessControlSlice.reducer(
    undefined,
    fetchAccessAssignments.fulfilled(assignments, "load-1"),
  );

  state = accessControlSlice.reducer(
    state,
    changeAccessAssignmentStatus.fulfilled(
      { ...assignments[0], status: "revoked" },
      "revoke-1",
      { assignmentId: "role-1", status: "revoked" },
    ),
  );

  assert.deepEqual(state.assignments, [
    { ...assignments[0], status: "revoked" },
    assignments[1],
  ]);
});

test("suspending a role keeps it visible for restoration", () => {
  const assignment = { _id: "role-1", role: "match_operator", status: "active" };
  let state = accessControlSlice.reducer(
    undefined,
    fetchAccessAssignments.fulfilled([assignment], "load-1"),
  );

  state = accessControlSlice.reducer(
    state,
    changeAccessAssignmentStatus.fulfilled(
      { ...assignment, status: "suspended" },
      "suspend-1",
      { assignmentId: "role-1", status: "suspended" },
    ),
  );

  assert.equal(state.assignments.length, 1);
  assert.equal(state.assignments[0].status, "suspended");
});
