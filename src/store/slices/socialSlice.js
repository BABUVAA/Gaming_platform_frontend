import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk";
import { sessionInvalidated } from "../actions/sessionActions.js";

const socialMutationToast = {
  success: true,
  error: true,
};

export const fetchSocialConnections = createApiThunk(
  "social/fetchConnections",
  {
    path: "/api/users/social",
    selectData: (response) => response.data?.data,
    errorMessage: "Unable to load friends right now.",
    toast: { error: true },
  },
);

export const sendFriendRequest = createApiThunk(
  "social/sendFriendRequest",
  {
    path: "/api/users/friends/requests",
    method: "post",
    errorMessage: "Unable to send the friend request.",
    toast: socialMutationToast,
  },
);

export const acceptFriendRequest = createApiThunk(
  "social/acceptFriendRequest",
  {
    path: ({ arg }) =>
      `/api/users/friends/requests/${arg}/accept`,
    method: "post",
    getBody: () => undefined,
    errorMessage: "Unable to accept the friend request.",
    toast: socialMutationToast,
  },
);

export const cancelFriendRequest = createApiThunk(
  "social/cancelFriendRequest",
  {
    path: ({ arg }) =>
      `/api/users/friends/requests/outgoing/${arg}`,
    method: "delete",
    getBody: () => undefined,
    errorMessage: "Unable to cancel the friend request.",
    toast: socialMutationToast,
  },
);

export const declineFriendRequest = createApiThunk(
  "social/declineFriendRequest",
  {
    path: ({ arg }) =>
      `/api/users/friends/requests/incoming/${arg}`,
    method: "delete",
    getBody: () => undefined,
    errorMessage: "Unable to decline the friend request.",
    toast: socialMutationToast,
  },
);

export const removeFriend = createApiThunk("social/removeFriend", {
  path: ({ arg }) => `/api/users/friends/${arg}`,
  method: "delete",
  getBody: () => undefined,
  errorMessage: "Unable to remove this friend.",
  toast: socialMutationToast,
});

export const fetchTeams = createApiThunk("social/fetchTeams", {
  path: "/api/player/teams",
  selectData: (response) => response.data?.data?.teams || [],
  errorMessage: "Unable to load teams.",
  toast: { error: true },
});

export const createTeam = createApiThunk("social/createTeam", {
  path: "/api/player/teams",
  method: "post",
  getBody: ({ gameId, mode, teamName }) => ({ gameId, mode, teamName }),
  errorMessage: "Unable to create this team.",
  toast: socialMutationToast,
});

export const inviteTeamMembers = createApiThunk(
  "social/inviteTeamMembers",
  {
    path: ({ arg }) => `/api/player/teams/${arg.teamId}/invitations`,
    method: "post",
    getBody: ({ playerIds }) => ({ playerIds }),
    errorMessage: "Unable to invite the selected players.",
    toast: socialMutationToast,
  },
);

export const acceptTeamInvitation = createApiThunk(
  "social/acceptTeamInvitation",
  {
    path: ({ arg }) => `/api/player/teams/${arg}/invitations/accept`,
    method: "post",
    getBody: () => undefined,
    errorMessage: "Unable to accept this team invitation.",
    toast: socialMutationToast,
  },
);

export const declineTeamInvitation = createApiThunk(
  "social/declineTeamInvitation",
  {
    path: ({ arg }) => `/api/player/teams/${arg}/invitations`,
    method: "delete",
    getBody: () => undefined,
    errorMessage: "Unable to decline this team invitation.",
    toast: socialMutationToast,
  },
);

export const removeTeamMember = createApiThunk(
  "social/removeTeamMember",
  {
    path: ({ arg }) =>
      `/api/player/teams/${arg.teamId}/members/${arg.playerId}`,
    method: "delete",
    getBody: () => undefined,
    errorMessage: "Unable to remove this team member.",
    toast: socialMutationToast,
  },
);

export const leaveTeam = createApiThunk("social/leaveTeam", {
  path: ({ arg }) => `/api/player/teams/${arg}/leave`,
  method: "post",
  getBody: () => undefined,
  errorMessage: "Unable to leave this team.",
  toast: socialMutationToast,
});

export const disbandTeam = createApiThunk(
  "social/disbandTeam",
  {
    path: ({ arg }) => `/api/player/teams/${arg}`,
    method: "delete",
    getBody: () => undefined,
    errorMessage: "Unable to disband this team.",
    toast: socialMutationToast,
  },
);

const socialMutationThunks = [
  acceptFriendRequest,
  acceptTeamInvitation,
  cancelFriendRequest,
  createTeam,
  declineFriendRequest,
  declineTeamInvitation,
  disbandTeam,
  inviteTeamMembers,
  leaveTeam,
  removeFriend,
  removeTeamMember,
  sendFriendRequest,
];

const createInitialState = () => ({
  connections: {
    friends: [],
    incomingRequests: [],
    outgoingRequests: [],
  },
  connectionsStatus: "idle",
  error: null,
  mutationStatus: "idle",
  teams: [],
  teamsStatus: "idle",
});

const socialSlice = createSlice({
  name: "social",
  initialState: createInitialState(),
  reducers: {
    clearTeams: (state) => {
      state.teams = [];
      state.teamsStatus = "idle";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSocialConnections.pending, (state) => {
        state.connectionsStatus = "loading";
        state.error = null;
      })
      .addCase(fetchSocialConnections.fulfilled, (state, action) => {
        state.connections = action.payload;
        state.connectionsStatus = "succeeded";
      })
      .addCase(fetchSocialConnections.rejected, (state, action) => {
        state.connectionsStatus = "failed";
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      })
      .addCase(fetchTeams.pending, (state) => {
        state.teamsStatus = "loading";
        state.error = null;
      })
      .addCase(fetchTeams.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.teamsStatus = "succeeded";
      })
      .addCase(fetchTeams.rejected, (state, action) => {
        state.teamsStatus = "failed";
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      })
      .addCase(sessionInvalidated, () => createInitialState())
      .addMatcher(
        (action) =>
          socialMutationThunks.some((thunk) => thunk.pending.match(action)),
        (state) => {
          state.mutationStatus = "loading";
          state.error = null;
        },
      )
      .addMatcher(
        (action) =>
          socialMutationThunks.some((thunk) => thunk.fulfilled.match(action)),
        (state) => {
          state.mutationStatus = "succeeded";
        },
      )
      .addMatcher(
        (action) =>
          socialMutationThunks.some((thunk) => thunk.rejected.match(action)),
        (state, action) => {
          state.mutationStatus = "failed";
          if (!action.meta.aborted && !action.meta.condition) {
            state.error = action.payload;
          }
        },
      )
      .addMatcher(
        (action) =>
          action.type === "auth/logout/pending" ||
          action.type === "auth/login/pending" ||
          action.type === "auth/signup/pending",
        () => createInitialState(),
      );
  },
});

export const socialActions = socialSlice.actions;
export default socialSlice;
