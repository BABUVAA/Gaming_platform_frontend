export const selectOperatorDashboard = (state) =>
  state.operatorOperations.dashboard;
export const selectOperatorMatches = (state) =>
  state.operatorOperations.matches;
export const selectUnassignedOperatorMatches = (state) =>
  state.operatorOperations.unassigned;
export const selectOperatorWorkspaceStatus = (state) =>
  state.operatorOperations.status;
export const selectOperatorWorkspaceError = (state) =>
  getStoredErrorMessage(
    state.operatorOperations.error || state.operatorOperations.actionError,
  );
export const selectOperatorActiveAction = (state) =>
  state.operatorOperations.activeAction;
import { getStoredErrorMessage } from "../../api/apiError.js";
