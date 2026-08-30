import { combineReducers } from "@reduxjs/toolkit";
import { sessionInvalidated } from "./actions/sessionActions";
import accountSlice from "./slices/accountSlice";
import accessControlSlice from "./slices/accessControlSlice";
import adminSlice from "./slices/adminSlice";
import authSlice, { logout } from "./slices/authSlice";
import clanSlice from "./slices/clanSlice";
import gameSlice from "./slices/gameSlice";
import gameManagementSlice from "./slices/gameManagementSlice";
import loadingSlice from "./slices/loadingSlice";
import matchmakingSlice from "./slices/matchmakingSlice";
import matchActivitySlice from "./slices/matchActivitySlice";
import notificationSlice from "./slices/notificationSlice";
import paymentSlice from "./slices/paymentSlice";
import playerSlice from "./slices/playerSlice";
import requestScopeSlice, {
  isPrivateRequestAction,
} from "./slices/requestScopeSlice";
import socialSlice from "./slices/socialSlice";
import toastSlice from "./slices/toastSlice";
import eventManagementSlice from "./slices/eventManagementSlice";
import eventReviewSlice from "./slices/eventReviewSlice";
import quickMatchOfferingSlice from "./slices/quickMatchOfferingSlice";
import operatorOperationsSlice from "./slices/operatorOperationsSlice";
import prizeReleaseReviewSlice from "./slices/prizeReleaseReviewSlice.js";
import withdrawalSlice from "./slices/withdrawalSlice.js";
import withdrawalReviewSlice from "./slices/withdrawalReviewSlice.js";
import hostQuickMatchProposalSlice from "./slices/hostQuickMatchProposalSlice.js";
import eventRegistrationSlice from "./slices/eventRegistrationSlice.js";
import eventInvitationSlice from "./slices/eventInvitationSlice.js";
import eventStageSlice from "./slices/eventStageSlice.js";
import securityAttentionSlice from "./slices/securityAttentionSlice.js";
import verificationRequestSlice from "./slices/verificationRequestSlice.js";
import paymentReconciliationReviewSlice from "./slices/paymentReconciliationReviewSlice.js";
import matchChatSlice from "./slices/matchChatSlice.js";
import discordOperationsSlice from "./slices/discordOperationsSlice.js";
import sensitiveActionSlice from "./slices/sensitiveActionSlice.js";
import playerManagementSlice from "./slices/playerManagementSlice.js";
import referralSlice from "./slices/referralSlice.js";
import globalChatSlice from "./slices/globalChatSlice.js";

// The root reducer is separated from store creation so reducer composition
// stays readable and can grow independently from middleware/persistence setup.
// Each key here becomes a top-level branch in the global Redux state tree.
//
// When new slices are added later, register them here first so the global
// state shape stays explicit and easy to discover from one file.
const combinedReducer = combineReducers({
  account: accountSlice.reducer,
  accessControl: accessControlSlice.reducer,
  admin: adminSlice.reducer,
  auth: authSlice.reducer,
  games: gameSlice.reducer,
  gameManagement: gameManagementSlice.reducer,
  eventManagement: eventManagementSlice.reducer,
  eventReview: eventReviewSlice.reducer,
  quickMatchOfferings: quickMatchOfferingSlice.reducer,
  operatorOperations: operatorOperationsSlice.reducer,
  prizeReleaseReview: prizeReleaseReviewSlice.reducer,
  withdrawals: withdrawalSlice.reducer,
  withdrawalReview: withdrawalReviewSlice.reducer,
  hostQuickMatchProposal: hostQuickMatchProposalSlice.reducer,
  eventRegistration: eventRegistrationSlice,
  eventInvitations: eventInvitationSlice.reducer,
  eventStages: eventStageSlice.reducer,
  securityAttention: securityAttentionSlice.reducer,
  verificationRequests: verificationRequestSlice,
  paymentReconciliationReview: paymentReconciliationReviewSlice.reducer,
  loading: loadingSlice.reducer,
  matchmaking: matchmakingSlice.reducer,
  matchActivity: matchActivitySlice.reducer,
  matchChat: matchChatSlice,
  discordOperations: discordOperationsSlice.reducer,
  payment: paymentSlice.reducer,
  player: playerSlice.reducer,
  clan: clanSlice.reducer,
  toast: toastSlice.reducer,
  notifications: notificationSlice.reducer,
  requestScope: requestScopeSlice.reducer,
  sensitiveAction: sensitiveActionSlice.reducer,
  playerManagement: playerManagementSlice.reducer,
  social: socialSlice.reducer,
  referrals: referralSlice.reducer,
  globalChat: globalChatSlice,
});

const privateSliceKeys = [
  "account",
  "accessControl",
  "admin",
  "clan",
  "notifications",
  "payment",
  "player",
  "social",
  "referrals",
  "matchmaking",
  "matchActivity",
  "matchChat",
  "eventManagement",
  "eventReview",
  "quickMatchOfferings",
  "gameManagement",
  "operatorOperations",
  "prizeReleaseReview",
  "withdrawals",
  "withdrawalReview",
  "hostQuickMatchProposal",
  "eventRegistration",
  "eventInvitations",
  "eventStages",
  "securityAttention",
  "verificationRequests",
  "paymentReconciliationReview",
  "discordOperations",
  "sensitiveAction",
  "playerManagement",
  "globalChat",
];

const clearPrivateSlices = (state) => {
  if (!state) return state;

  const publicState = { ...state };
  privateSliceKeys.forEach((sliceKey) => {
    // Passing undefined lets combineReducers restore the slice's initial state.
    publicState[sliceKey] = undefined;
  });
  return publicState;
};

const rootReducer = (state, action) => {
  const isPrivateCompletion =
    isPrivateRequestAction(action) &&
    (action.type.endsWith("/fulfilled") ||
      action.type.endsWith("/rejected"));
  const isActiveRequest =
    state?.requestScope?.activeRequestIds?.[action.meta?.requestId];

  // A completion whose pending action belonged to a cleared session must not
  // reach any private reducer, even if the browser could not abort its network
  // request before the server responded.
  if (state && isPrivateCompletion && !isActiveRequest) {
    return state;
  }

  const shouldClearPrivateState =
    logout.pending.match(action) || sessionInvalidated.match(action);
  const safeState = shouldClearPrivateState
    ? clearPrivateSlices(state)
    : state;

  return combinedReducer(safeState, action);
};

export default rootReducer;
