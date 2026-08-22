export const selectOperatorDashboard = (state) =>
  state.operatorOperations.dashboard;
export const selectOperatorMatches = (state) =>
  state.operatorOperations.matches;
export const selectOperatorActiveRooms = (state) =>
  state.operatorOperations.rooms;
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
export const selectOperatorMatchPages = (state) =>
  state.operatorOperations.pages;
export const selectOperatorMatchPageStatus = (state) =>
  state.operatorOperations.pageStatus;
import { getStoredErrorMessage } from "../../api/apiError.js";
