import { createSlice } from "@reduxjs/toolkit";
import createApiThunk from "../thunks/createApiThunk";

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

export const fetchClanTeams = createApiThunk("social/fetchClanTeams", {
  path: "/api/clan/teams",
  selectData: (response) => response.data?.data?.teams || [],
  errorMessage: "Unable to load clan teams.",
  toast: { error: true },
});

export const createClanTeam = createApiThunk("social/createClanTeam", {
  path: "/api/clan/teams",
  method: "post",
  errorMessage: "Unable to create this team.",
  toast: socialMutationToast,
});

export const inviteTeamMember = createApiThunk(
  "social/inviteTeamMember",
  {
    path: ({ arg }) => `/api/clan/teams/${arg.teamId}/invitations`,
    method: "post",
    getBody: ({ playerId }) => ({ playerId }),
    errorMessage: "Unable to invite this clan member.",
    toast: socialMutationToast,
  },
);

export const acceptTeamInvitation = createApiThunk(
  "social/acceptTeamInvitation",
  {
    path: ({ arg }) => `/api/clan/teams/${arg}/invitations/accept`,
    method: "post",
    getBody: () => undefined,
    errorMessage: "Unable to accept this team invitation.",
    toast: socialMutationToast,
  },
);

export const declineTeamInvitation = createApiThunk(
  "social/declineTeamInvitation",
  {
    path: ({ arg }) => `/api/clan/teams/${arg}/invitations`,
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
      `/api/clan/teams/${arg.teamId}/members/${arg.playerId}`,
    method: "delete",
    getBody: () => undefined,
    errorMessage: "Unable to remove this team member.",
    toast: socialMutationToast,
  },
);

export const leaveClanTeam = createApiThunk("social/leaveClanTeam", {
  path: ({ arg }) => `/api/clan/teams/${arg}/leave`,
  method: "post",
  getBody: () => undefined,
  errorMessage: "Unable to leave this team.",
  toast: socialMutationToast,
});

export const disbandClanTeam = createApiThunk(
  "social/disbandClanTeam",
  {
    path: ({ arg }) => `/api/clan/teams/${arg}`,
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
  createClanTeam,
  declineFriendRequest,
  declineTeamInvitation,
  disbandClanTeam,
  inviteTeamMember,
  leaveClanTeam,
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
      .addCase(fetchClanTeams.pending, (state) => {
        state.teamsStatus = "loading";
        state.error = null;
      })
      .addCase(fetchClanTeams.fulfilled, (state, action) => {
        state.teams = action.payload;
        state.teamsStatus = "succeeded";
      })
      .addCase(fetchClanTeams.rejected, (state, action) => {
        state.teamsStatus = "failed";
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      })
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
      );
  },
});

export const socialActions = socialSlice.actions;
export default socialSlice;
