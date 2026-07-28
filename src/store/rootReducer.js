import { combineReducers } from "@reduxjs/toolkit";
import { sessionInvalidated } from "./actions/sessionActions";
import adminSlice from "./slices/adminSlice";
import authSlice, { logout } from "./slices/authSlice";
import clanSlice from "./slices/clanSlice";
import gameSlice from "./slices/gameSlice";
import loadingSlice from "./slices/loadingSlice";
import notificationSlice from "./slices/notificationSlice";
import paymentSlice from "./slices/paymentSlice";
import requestScopeSlice, {
  isPrivateRequestAction,
} from "./slices/requestScopeSlice";
import toastSlice from "./slices/toastSlice";
import tournamentSlice from "./slices/tournamentSlice";

// The root reducer is separated from store creation so reducer composition
// stays readable and can grow independently from middleware/persistence setup.
// Each key here becomes a top-level branch in the global Redux state tree.
//
// When new slices are added later, register them here first so the global
// state shape stays explicit and easy to discover from one file.
const combinedReducer = combineReducers({
  admin: adminSlice.reducer,
  auth: authSlice.reducer,
  games: gameSlice.reducer,
  tournament: tournamentSlice.reducer,
  loading: loadingSlice.reducer,
  payment: paymentSlice.reducer,
  clan: clanSlice.reducer,
  toast: toastSlice.reducer,
  notifications: notificationSlice.reducer,
  requestScope: requestScopeSlice.reducer,
});

const privateSliceKeys = ["admin", "clan", "notifications", "payment"];

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
