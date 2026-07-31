import { createSlice } from "@reduxjs/toolkit";
import { rememberUnauthenticatedSession } from "../authSessionHint";
import { sessionInvalidated } from "../actions/sessionActions";
import createApiThunk from "../thunks/createApiThunk";

const selectAccountData = (response) => {
  const account = response.data?.data;

  // Fail at the API boundary when identity fields are missing instead of
  // letting Account Settings silently display incomplete account data.
  if (
    !account?.userId ||
    !account.email ||
    typeof account.isVerified !== "boolean"
  ) {
    throw new Error("Account response did not include a valid identity.");
  }

  return account;
};

export const fetchAccount = createApiThunk(
  "account/fetchAccount",
  {
    path: "/api/users/account",
    // The backend uses the shared `{ success, message, data }` envelope.
    // Redux stores only the account payload that components consume.
    selectData: selectAccountData,
    errorMessage: "Unable to load account information.",
    toast: { error: true },
  },
  {
    condition: (_, { getState }) => {
      const { account, auth } = getState();

      // Account information is private. Reject unauthenticated and duplicate
      // in-flight requests before they reach Axios.
      return auth.isAuthenticated && account.status !== "loading";
    },
  },
);

export const changePassword = createApiThunk("account/changePassword", {
  path: "/api/auth/password",
  method: "post",
  errorMessage: "Unable to change your password.",
  onSuccess: ({ thunkAPI }) => {
    // The backend revokes Redis and clears both cookies. Mirror that result
    // immediately so no private page remains visible in this browser tab.
    rememberUnauthenticatedSession();
    thunkAPI.dispatch(sessionInvalidated());
  },
  toast: {
    success: ({ response }) =>
      response.data.message || "Password changed. Please sign in again.",
    error: true,
  },
});

const createInitialState = () => ({
  data: null,
  status: "idle",
  error: null,
  requestId: null,
});

const resetAccountState = () => createInitialState();

const accountSlice = createSlice({
  name: "account",
  initialState: createInitialState(),
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAccount.pending, (state, action) => {
        state.status = "loading";
        state.error = null;
        state.requestId = action.meta.requestId;
      })
      .addCase(fetchAccount.fulfilled, (state, action) => {
        // Ignore a stale response if a newer account request replaced it.
        if (state.requestId !== action.meta.requestId) return;

        state.data = action.payload;
        state.status = "succeeded";
        state.error = null;
        state.requestId = null;
      })
      .addCase(fetchAccount.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;

        state.status = "failed";
        state.requestId = null;

        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      })
      .addCase(sessionInvalidated, resetAccountState)
      .addMatcher(
        (action) =>
          action.type === "auth/login/pending" ||
          action.type === "auth/logout/pending" ||
          action.type === "auth/signup/pending",
        resetAccountState,
      );
  },
});

export const accountActions = accountSlice.actions;
export default accountSlice;
