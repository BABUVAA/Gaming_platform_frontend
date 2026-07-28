import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../../api/axios-api";
import {
  getApiErrorMessage,
  normalizeApiError,
  rejectApiError,
} from "../../api/apiError";
import { showToast, types } from "./toastSlice";
import {
  forgetUnauthenticatedSession,
  hasUnauthenticatedSessionHint,
  rememberUnauthenticatedSession,
} from "../authSessionHint";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";
import { sessionInvalidated } from "../actions/sessionActions";

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
  // Login currently nests identity under `data`, while signup and verification
  // return it at the response root. Redux exposes one stable shape.
  const userId = responseData.data?.userId || responseData.userId;
  if (!userId) {
    throw new Error("Authentication response did not include a user ID.");
  }

  return { userId };
};

// Async thunk for session verification
export const verifySession = createAsyncThunk(
  "auth/verifySession",
  async (_, thunkAPI) => {
    try {
      // Keep the request body empty and pass axios config in the correct slot.
      const response = await api.post(
        "/api/auth/verifySession",
        {},
        { withCredentials: true }
      );
      forgetUnauthenticatedSession();
      return selectAuthIdentity(response.data);
    } catch (error) {
      const appError = normalizeApiError(
        error,
        "Unable to verify the current session.",
      );
      const statusCode = appError.status;
      const message = appError.message;

      if (statusCode !== 401) {
        thunkAPI.dispatch(
          showToast({
            message,
            type: types.DANGER,
            position: "bottom-right",
          })
        );
      }

      // A 401 is the server's authoritative confirmation that this tab has no
      // valid session, so remember it and avoid the same request after refresh.
      if (statusCode === 401) {
        rememberUnauthenticatedSession();
      }

      return rejectApiError(thunkAPI, error, message);
    }
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
  }
);

// Async thunk for logout
export const logout = createAsyncThunk("auth/logout", async (_, thunkAPI) => {
  // Close local access immediately and preserve that decision across refreshes,
  // even if the request that destroys the server session later fails.
  rememberUnauthenticatedSession();

  try {
    const response = await api.post(
      "/api/auth/logout",
      {},
      { withCredentials: true }
    );
      thunkAPI.dispatch(
        showToast({
          message: response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
    return selectAuthIdentity(response.data);
  } catch (error) {
    const message = getApiErrorMessage(error, "Unable to logout.");
    thunkAPI.dispatch(
      showToast({
        message,
        type: types.DANGER,
        position: "bottom-right",
      })
    );
    return rejectApiError(thunkAPI, error, message);
  }
});

// Async thunk for user login
export const login = createAsyncThunk(
  "auth/login",
  async (credentials, thunkAPI) => {
    try {
      const response = await api.post("/api/auth/login", credentials, {
        withCredentials: true,
      });
      const identity = selectAuthIdentity(response.data);
      forgetUnauthenticatedSession();
      thunkAPI.dispatch(
        showToast({
          message: response.data.message,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return identity;
    } catch (error) {
      const message = getApiErrorMessage(error, "Login failed.");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(thunkAPI, error, message);
    }
  }
);

// Async thunk for user registration
export const register = createAsyncThunk(
  "auth/signup",
  async (userData, thunkAPI) => {
    try {
      const response = await api.post("/api/auth/signup", userData);
      const identity = selectAuthIdentity(response.data);
      forgetUnauthenticatedSession();
      thunkAPI.dispatch(
        showToast({
          message:
            response.data.message ||
            response.data.errors?.username ||
            response.data.errors?.email ||
            response.data.errors?.password ||
            response.data.errors?.dob ||
            "Signup completed successfully.",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      return identity;
    } catch (error) {
      const message = getApiErrorMessage(error, "Signup failed.");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(thunkAPI, error, message);
    }
  }
);

// Async thunk for user Profile
export const user_profile = createAsyncThunk(
  "users/profile",
  async (_, thunkAPI) => {
    try {
      const response = await api.get("/api/users/profile");
      return selectAuthIdentity(response.data);
    } catch (error) {
      const message = getApiErrorMessage(
        error,
        "Unable to load player profile.",
      );
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );
      return rejectApiError(thunkAPI, error, message);
    }
  },
  {
    condition: (_, { getState }) => {
      // App bootstrap and route guards can mount together. Refuse only an
      // overlapping request while still allowing deliberate later refreshes.
      const authState = getState().auth;
      return (
        authState.isAuthenticated &&
        authState.profileStatus !== "loading"
      );
    },
  }
);

//Async thunk to Search Clan
export const searchPlayer = createAsyncThunk(
  "users/searchPlayer", // action type
  async (playerTag, thunkAPI) => {
    try {
      const response = await api.post("/api/users/searchPlayer", playerTag);
      if (!response) {
        throw new Error("Failed to fetch player data");
      }
      return response.data; // return data to be used in the reducer
    } catch (error) {
      return rejectApiError(thunkAPI, error, "Unable to find that player.");
    }
  }
);

// Async thunk for updating profile data
export const profile_file_update = createAsyncThunk(
  "users/profile_file_update",
  async (data, thunkAPI) => {
    try {
      // Send POST request with form data
      const response = await api.post("/api/users/profile_file_update", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Show success toast notification
      thunkAPI.dispatch(
        showToast({
          message: "Profile Updated",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data;
    } catch (error) {
      // Show error toast notification
      const message = getApiErrorMessage(error, "Failed to update profile");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      // Reducers and callers receive the same normalized error shown above.
      return rejectApiError(thunkAPI, error, message);
    }
  }
);

// Async thunk for updating profile data
export const profile_data_update = createAsyncThunk(
  "users/profile_data_update",
  async (data, thunkAPI) => {
    try {
      // Send POST request with form data
      const response = await api.post("/api/users/profile_data_update", data);

      // Show success toast notification
      thunkAPI.dispatch(
        showToast({
          message: "Profile Updated",
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      return response.data;
    } catch (error) {
      // Show error toast notification
      const message = getApiErrorMessage(error, "Failed to update profile");
      thunkAPI.dispatch(
        showToast({
          message,
          type: types.DANGER,
          position: "bottom-right",
        })
      );

      // Reducers and callers receive the same normalized error shown above.
      return rejectApiError(thunkAPI, error, message);
    }
  }
);

// Login and registration both establish a new authenticated browser session.
// Session verification and logout remain explicit because their transitions
// intentionally differ from credential-based authentication.
const credentialThunks = [login, register];

const clearAuthenticatedState = (state) => {
  state.user = null;
  state.isAuthenticated = false;
  state.sessionStatus = SESSION_STATUS.UNAUTHENTICATED;
  state.profile = null;
  state.profileStatus = "idle";
  state.profileRequestId = null;
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
    profile: null,
    profileStatus: "idle",
    // The request ID prevents a profile response from an old session writing
    // private data after logout or after another account signs in.
    profileRequestId: null,
    error: null,
  },
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    addJoinedTournament: (state, action) => {
      const newTournament = action.payload;

      // Live socket events can arrive before the profile bootstrap finishes.
      // Bail out safely instead of trying to write through a null profile object.
      if (!state.profile?.profile) {
        return;
      }

      // Ensure tournaments array exists before we insert/update the record.
      if (!state.profile.profile.tournaments) {
        state.profile.profile.tournaments = [];
      }

      // Find index of existing tournament by _id
      const index = state.profile.profile.tournaments.findIndex(
        (t) => t._id === newTournament._id
      );

      if (index === -1) {
        // Tournament not found, add new
        state.profile.profile.tournaments.push(newTournament);
      } else {
        // Tournament exists, update it
        state.profile.profile.tournaments[index] = {
          ...state.profile.profile.tournaments[index],
          ...newTournament,
        };
      }
    },
    upsertActiveChat: (state, action) => {
      if (!state.profile) return;

      if (!Array.isArray(state.profile.activeChats)) {
        state.profile.activeChats = [];
      }

      const incomingChat = action.payload;
      if (!incomingChat?.userId) return;

      const existingIndex = state.profile.activeChats.findIndex(
        (chat) =>
          chat?.userId === incomingChat.userId ||
          chat?._id === incomingChat.userId ||
          chat?.id === incomingChat.userId
      );

      if (existingIndex === -1) {
        state.profile.activeChats.unshift(incomingChat);
      } else {
        state.profile.activeChats[existingIndex] = {
          ...state.profile.activeChats[existingIndex],
          ...incomingChat,
        };
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(verifySession.pending, (state) => {
        // Route guards wait during this state instead of redirecting a returning
        // user before the backend has checked the secure session cookie.
        state.sessionStatus = SESSION_STATUS.CHECKING;
        state.error = null;
      })
      .addCase(verifySession.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.sessionStatus = SESSION_STATUS.AUTHENTICATED;
        state.error = null;
      })
      .addCase(verifySession.rejected, (state, action) => {
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
      .addCase(user_profile.pending, (state, action) => {
        // We track profile bootstrap separately so route guards can tell the
        // difference between "still loading" and "failed, show recovery UI".
        state.profileStatus = "loading";
        state.profileRequestId = action.meta.requestId;
        state.error = null;
      })
      .addCase(user_profile.fulfilled, (state, action) => {
        if (
          !state.isAuthenticated ||
          state.profileRequestId !== action.meta.requestId
        ) {
          return;
        }

        state.profile = action.payload;
        state.profileStatus = "succeeded";
        state.profileRequestId = null;
      })
      .addCase(user_profile.rejected, (state, action) => {
        if (state.profileRequestId !== action.meta.requestId) return;

        state.profileStatus = "failed";
        state.profileRequestId = null;
        state.error = action.payload;
      })
      .addCase(sessionInvalidated, (state, action) => {
        clearAuthenticatedState(state);
        state.error = action.payload || null;
      });

    addThunkLifecycleMatchers(builder, credentialThunks, {
      pending: (state) => {
        state.sessionStatus = SESSION_STATUS.CHECKING;
        // Any profile request belongs to the previous credential generation.
        state.profileRequestId = null;
        state.error = null;
      },
      fulfilled: (state, action) => {
        state.user = action.payload;
        state.isAuthenticated = true;
        state.sessionStatus = SESSION_STATUS.AUTHENTICATED;
        state.profile = null;
        state.profileStatus = "idle";
        state.profileRequestId = null;
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
