import { getStoredErrorMessage } from "../../api/apiError";

export const selectHostProposal = (state) =>
  state.hostQuickMatchProposal.proposal;
export const selectHostProposalStatus = (state) =>
  state.hostQuickMatchProposal.status;
export const selectHostProposalError = (state) =>
  getStoredErrorMessage(state.hostQuickMatchProposal.error);
