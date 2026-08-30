import { createSlice } from "@reduxjs/toolkit";
import {
  forgetUnauthenticatedSession,
  hasUnauthenticatedSessionHint,
  rememberUnauthenticatedSession,
} from "../authSessionHint";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";
import { sessionInvalidated } from "../actions/sessionActions";
import createApiThunk from "../thunks/createApiThunk";
import { fetchAccount } from "./accountSlice";

// Session status represents what the frontend knows about the server session.
// `unknown` is intentionally different from unauthenticated because the
// browser cookie has not been checked yet when the application first starts.
export const SESSION_STATUS = Object.freeze({
  UNKNOWN: "unknown",
  CHECKING: "checking",
  AUTHENTICATED: "authenticated",
  UNAUTHENTICATED: "unauthenticated",
  ERROR: "error",
});

const selectAuthIdentity = (responseData = {}) => {
  // Login nests identity under `data`, while session verification returns it at
  // the response root. Redux exposes one stable authenticated identity shape.
  const userId = responseData.data?.userId || responseData.userId;
  if (!userId) {
    throw new Error("Authentication response did not include a user ID.");
  }

  return {
    userId,
    // Verification is an account capability, not proof of authentication.
    // Keeping it in identity state lets the UI explain restricted operations.
    isVerified: responseData.data?.isVerified ?? responseData.isVerified ?? false,
  };
};

const selectPendingRegistration = (responseData = {}) => {
  const registration = responseData.data || responseData;

  if (!registration.email || !registration.requiresEmailVerification) {
    throw new Error(
      "Signup response did not include pending verification details.",
    );
  }

  return {
    email: registration.email,
    isVerified: false,
    referralApplied: registration.referralApplied === true,
    recovered: registration.recovered === true,
    resendAvailableAt: registration.resendAvailableAt || null,
    requiresEmailVerification: true,
    verificationEmailSent: registration.verificationEmailSent === true,
  };
};

// Session verification uses the shared transport/error pipeline while these
// hooks retain the browser-specific unauthenticated-session hint behavior.
export const verifySession = createApiThunk(
  "auth/verifySession",
  {
    // Bootstrap checks the access token first. Axios invokes the dedicated
    // refresh endpoint only when this request returns an expiry-related 401.
    path: "/api/auth/session",
    selectData: (response) => selectAuthIdentity(response.data),
    errorMessage: "Unable to verify the current session.",
    onSuccess: () => {
      forgetUnauthenticatedSession();
    },
    onError: ({ normalizedError }) => {
      // A 401 is the server's authoritative confirmation that this tab has no
      // valid session, so remember it and avoid the same request after refresh.
      if (normalizedError.status === 401) {
        rememberUnauthenticatedSession();
      }
    },
    toast: {
      // Invalid sessions are a normal bootstrap result; only operational
      // failures need a visible notification.
      error: ({ normalizedError }) =>
        normalizedError.status === 401 ? false : normalizedError.message,
    },
  },
  {
    condition: (_, { getState }) => {
      const { sessionStatus } = getState().auth;

      // An unknown session must be checked because an HttpOnly cookie may
      // contain a valid server session that JavaScript cannot inspect.
      if (
        sessionStatus === SESSION_STATUS.UNKNOWN ||
        sessionStatus === SESSION_STATUS.ERROR
      ) {
        return true;
      }

      // An authenticated session may be revalidated before a sensitive action
      // or after enough time has passed to confirm it is still valid.
      return sessionStatus === SESSION_STATUS.AUTHENTICATED;
    },
  },
);

export const logout = createApiThunk("auth/logout", {
  // Logout closes local access before waiting for the backend so private UI
  // cannot remain open during a slow or failed session-destruction request.
  request: ({ api, signal }) => {
    rememberUnauthenticatedSession();
    return api.post("/api/auth/logout", {}, { signal });
  },
  errorMessage: "Unable to logout.",
  toast: {
    success: true,
    error: true,
  },
});

export const login = createApiThunk(
  "auth/login",
  {
    path: "/api/auth/login",
    method: "post",
    selectData: (response) => selectAuthIdentity(response.data),
    errorMessage: "Login failed.",
    onSuccess: () => {
      forgetUnauthenticatedSession();
    },
    toast: {
      success: true,
      error: true,
    },
  },
);

export const reauthenticate = createApiThunk("auth/reauthenticate", {
  path: "/api/auth/reauthenticate",
  method: "post",
  selectData: (response) => response.data.data,
  errorMessage: "Password confirmation failed.",
  toast: { success: "Sensitive actions are unlocked for 15 minutes.", error: false },
});

export const register = createApiThunk(
  "auth/signup",
  {
    path: "/api/auth/signup",
    method: "post",
    selectData: (response) => selectPendingRegistration(response.data),
    errorMessage: "Signup failed.",
    onSuccess: () => {
      // Registration creates an account but intentionally does not establish
      // a Redis session. Login remains the only credential-session boundary.
      rememberUnauthenticatedSession();
    },
    toast: {
      success: ({ response }) =>
        response.data.message || "Signup completed successfully.",
      error: true,
    },
  },
);

export const resendEmailVerification = createApiThunk(
  "auth/resendEmailVerification",
  {
    path: "/api/auth/email-verification/resend",
    method: "post",
    selectData: (response) => response.data.data,
    errorMessage: "Unable to resend the verification code.",
    toast: { success: true, error: true },
  },
);

export const verifyEmailRegistration = createApiThunk(
  "auth/verifyEmailRegistration",
  {
    path: "/api/auth/email-verification/verify",
    method: "post",
    selectData: (response) => response.data.data,
    errorMessage: "Unable to verify this email.",
    toast: { success: true, error: true },
  },
);

export const requestPasswordReset = createApiThunk(
  "auth/requestPasswordReset",
  {
    path: "/api/auth/password-reset/request",
    method: "post",
    selectData: (response) => ({ message: response.data.message }),
    errorMessage: "Unable to request a password reset.",
    toast: { error: true },
  },
);

export const confirmPasswordReset = createApiThunk(
  "auth/confirmPasswordReset",
  {
    path: "/api/auth/password-reset/confirm",
    method: "post",
    selectData: (response) => ({ message: response.data.message }),
    errorMessage: "Unable to reset this password.",
    toast: { success: true, error: true },
  },
);

// Login establishes a browser session. Registration only creates an account,
// while verification and logout retain their own lifecycle transitions.
const credentialThunks = [login];

const clearAuthenticatedState = (state) => {
  state.user = null;
  state.isAuthenticated = false;
  state.sessionStatus = SESSION_STATUS.UNAUTHENTICATED;
};

// Auth slice
const authSlice = createSlice({
  name: "auth",
  initialState: {
    user: null,
    isAuthenticated: false,
    // A server-confirmed logged-out hint prevents another verification request
    // when this same browser tab refreshes.
    sessionStatus: hasUnauthenticatedSessionHint()
      ? SESSION_STATUS.UNAUTHENTICATED
      : SESSION_STATUS.UNKNOWN,
    sessionVerificationRequestId: null,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(verifySession.pending, (state, action) => {
        // Route guards wait during this state instead of redirecting a returning
        // user before the backend has checked the secure session cookie.
        state.sessionStatus = SESSION_STATUS.CHECKING;
        state.sessionVerificationRequestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(verifySession.fulfilled, (state, action) => {
        if (state.sessionVerificationRequestId !== action.meta.requestId) return;
        state.user = action.payload;
        state.isAuthenticated = true;
        state.sessionStatus = SESSION_STATUS.AUTHENTICATED;
        state.sessionVerificationRequestId = null;
        state.error = null;
      })
      .addCase(verifySession.rejected, (state, action) => {
        if (state.sessionVerificationRequestId !== action.meta.requestId) return;
        state.sessionVerificationRequestId = null;
        if (action.meta.aborted || action.meta.condition) {
          state.sessionStatus = state.isAuthenticated
            ? SESSION_STATUS.AUTHENTICATED
            : SESSION_STATUS.ERROR;
          return;
        }

        if (action.payload?.status === 401) {
          clearAuthenticatedState(state);
        } else {
          // Temporary network and server failures must not destroy a valid
          // local session or permanently suppress future verification.
          state.sessionStatus = state.isAuthenticated
            ? SESSION_STATUS.AUTHENTICATED
            : SESSION_STATUS.ERROR;
        }
        state.error = action.payload;
      })
      .addCase(logout.pending, (state) => {
        // Private frontend state is cleared immediately so sockets and guarded
        // screens close even while the backend invalidates the Redis session.
        clearAuthenticatedState(state);
        state.sessionVerificationRequestId = null;
        state.sessionStatus = SESSION_STATUS.CHECKING;
      })
      .addCase(logout.fulfilled, (state) => {
        clearAuthenticatedState(state);
      })
      .addCase(logout.rejected, (state, action) => {
        // Local access stays closed when server logout fails. A later page load
        // will verify whether the HttpOnly cookie still represents a session.
        state.sessionStatus = SESSION_STATUS.UNAUTHENTICATED;
        state.error = action.payload;
      })
      .addCase(sessionInvalidated, (state, action) => {
        clearAuthenticatedState(state);
        state.sessionVerificationRequestId = null;
        state.error = action.payload || null;
      })
      .addCase(register.pending, (state) => {
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        // Account creation does not imply authentication.
        clearAuthenticatedState(state);
      })
      .addCase(register.rejected, (state, action) => {
        clearAuthenticatedState(state);
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      })
      .addCase(fetchAccount.fulfilled, (state, action) => {
        if (!state.user) return;

        // The account endpoint reads current database state, so its verified
        // flag refreshes route access without replacing session identity.
        state.user.isVerified = action.payload.isVerified === true;
      });

    addThunkLifecycleMatchers(builder, credentialThunks, {
      pending: (state) => {
        // A credential attempt supersedes any anonymous bootstrap check that
        // started before the player submitted Login.
        state.sessionVerificationRequestId = null;
        state.sessionStatus = SESSION_STATUS.CHECKING;
        state.error = null;
      },
      fulfilled: (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.sessionStatus = SESSION_STATUS.AUTHENTICATED;
        state.error = null;
      },
      rejected: (state, action) => {
        clearAuthenticatedState(state);

        // Cancellation should close the checking state without presenting an
        // intentional abort as invalid credentials.
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      },
    });
  },
});

export const authAction = authSlice.actions;
export default authSlice;
