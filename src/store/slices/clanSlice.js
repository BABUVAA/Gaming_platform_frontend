import { createSlice } from "@reduxjs/toolkit";
import addThunkLifecycleMatchers from "../reducers/addThunkLifecycleMatchers";
import createApiThunk from "../thunks/createApiThunk";
import { logout } from "./authSlice";

export const createClan = createApiThunk("clan/create", {
  path: "/api/clan/createClan",
  method: "post",
  errorMessage: "Unable to create clan.",
  toast: { success: true, error: true },
});

export const fetchUserClan = createApiThunk("clan/fetchUserClan", {
  path: "/api/clan/fetchClan",
  errorMessage: "Unable to load your clan.",
  toast: { error: true },
});

export const fetchClanBookmarks = createApiThunk(
  "clan/fetchBookmarks",
  {
    path: "/api/clan/bookmarks",
    errorMessage: "Unable to load saved clans.",
    toast: { error: true },
  },
);

export const fetchClanSuggestions = createApiThunk(
  "clan/fetchSuggestions",
  {
    path: "/api/clan/discover?limit=8",
    errorMessage: "Unable to load clan suggestions.",
    toast: { error: true },
  },
);

export const addClanBookmark = createApiThunk(
  "clan/addBookmark",
  {
    path: ({ arg }) =>
      `/api/clan/bookmarks/${encodeURIComponent(arg)}`,
    method: "post",
    getBody: () => undefined,
    toast: { success: true, error: true },
  },
);

export const removeClanBookmark = createApiThunk(
  "clan/removeBookmark",
  {
    path: ({ arg }) =>
      `/api/clan/bookmarks/${encodeURIComponent(arg)}`,
    method: "delete",
    getBody: () => undefined,
    toast: { success: true, error: true },
  },
);

export const searchClan = createApiThunk("clan/searchClan", {
  path: "/api/clan/searchClan",
  method: "post",
  errorMessage: "Unable to find that clan tag.",
  toast: { error: true },
});

export const joinClan = createApiThunk("clan/joinClan", {
  path: "/api/clan/joinClan",
  method: "post",
  errorMessage: "Unable to join clan.",
  toast: { success: true, error: true },
});

export const leaveClan = createApiThunk("clan/leaveClan", {
  path: "/api/clan/leaveClan",
  method: "post",
  getBody: () => undefined,
  errorMessage: "Unable to leave clan.",
  toast: { success: true, error: true },
});

// Changes one member rank at a time. The backend derives the destination role
// so the browser can never appoint a leader or skip hierarchy levels.
export const changeClanMemberRole = createApiThunk(
  "clan/changeMemberRole",
  {
    path: ({ arg }) =>
      `/api/clan/members/${encodeURIComponent(arg.playerId)}/role`,
    method: "patch",
    getBody: ({ direction }) => ({ direction }),
    toast: {
      success: true,
      error: true,
    },
  },
);

// Removes a member through the dedicated clan boundary. Rank permissions and
// active-team checks are enforced again by the backend.
export const kickClanMember = createApiThunk("clan/kickMember", {
  path: ({ arg }) =>
    `/api/clan/members/${encodeURIComponent(arg.playerId)}`,
  method: "delete",
  getBody: () => undefined,
  toast: {
    success: true,
    error: true,
  },
});

// Updates the complete editable clan-settings contract. The API accepts only
// description, location, and membership type from this request.
export const updateClanSettings = createApiThunk(
  "clan/updateSettings",
  {
    path: "/api/clan/settings",
    method: "patch",
    toast: {
      success: true,
      error: true,
    },
  },
);

export const requestClanJoin = createApiThunk(
  "clan/requestJoin",
  {
    path: "/api/clan/join-requests",
    method: "post",
    toast: {
      success: true,
      error: true,
    },
  },
);

export const fetchMyClanJoinRequests = createApiThunk(
  "clan/fetchMyJoinRequests",
  {
    path: "/api/clan/join-requests/mine",
    errorMessage: "Unable to load your clan requests.",
    toast: { error: true },
  },
);

export const cancelMyClanJoinRequest = createApiThunk(
  "clan/cancelMyJoinRequest",
  {
    path: ({ arg }) =>
      `/api/clan/join-requests/clans/${encodeURIComponent(arg)}/mine`,
    method: "delete",
    getBody: () => undefined,
    toast: { success: true, error: true },
  },
);

// Fetches only the manager moderation queue. The socket reconnect path uses
// this lightweight request once to recover events missed while offline.
export const fetchClanJoinRequests = createApiThunk(
  "clan/fetchJoinRequests",
  {
    path: "/api/clan/join-requests",
  },
);

export const acceptClanJoinRequest = createApiThunk(
  "clan/acceptJoinRequest",
  {
    path: ({ arg }) =>
      `/api/clan/join-requests/${encodeURIComponent(arg)}/accept`,
    method: "post",
    getBody: () => undefined,
    toast: {
      success: true,
      error: true,
    },
  },
);

export const declineClanJoinRequest = createApiThunk(
  "clan/declineJoinRequest",
  {
    path: ({ arg }) =>
      `/api/clan/join-requests/${encodeURIComponent(arg)}`,
    method: "delete",
    getBody: () => undefined,
    toast: {
      success: true,
      error: true,
    },
  },
);

// Every clan request writes failures to the same slice-level error field.
// Individual reducers below still own operation-specific data cleanup.
const clanThunks = [
  createClan,
  fetchUserClan,
  searchClan,
  joinClan,
  leaveClan,
  changeClanMemberRole,
  kickClanMember,
  updateClanSettings,
  requestClanJoin,
  acceptClanJoinRequest,
  declineClanJoinRequest,
  fetchClanBookmarks,
  fetchClanSuggestions,
  addClanBookmark,
  removeClanBookmark,
  fetchMyClanJoinRequests,
  cancelMyClanJoinRequest,
];

// Slice for game data
const clanSlice = createSlice({
  name: "clan",
  initialState: {
    createClanData: null,
    userClanData: null,
    userClanStatus: "idle",
    searchClanData: null,
    bookmarkedClans: [],
    bookmarksStatus: "idle",
    clanSuggestions: [],
    clanSuggestionsStatus: "idle",
    myJoinRequests: {},
    myJoinRequestsStatus: "idle",
    myJoinRequestRevisions: {},
    joinRequestsRevision: -1,
    loading: false, // Tracks loading state
    error: null, // Tracks any error
  },
  reducers: {
    setSearchClanData: (state) => {
      state.searchClanData = null;
    },
    setLiveJoinRequests: (state, action) => {
      const clan = state.userClanData?.data;
      const resourceVersion = Number(
        action.payload?.resourceVersion,
      );
      if (
        !clan ||
        String(clan._id) !== String(action.payload?.clanId) ||
        !Number.isInteger(resourceVersion) ||
        resourceVersion <= state.joinRequestsRevision
      ) {
        return;
      }

      clan.joinRequests = action.payload?.joinRequests || [];
      state.joinRequestsRevision = resourceVersion;
    },
    removeExpiredJoinRequests: (state, action) => {
      const clan = state.userClanData?.data;
      if (!clan?.joinRequests) return;

      const now = Number(action.payload);
      clan.joinRequests = clan.joinRequests.filter(
        (request) =>
          !request.expiresAt ||
          new Date(request.expiresAt).getTime() > now,
      );
    },
    setLiveMyJoinRequestStatus: (state, action) => {
      const clanId = String(action.payload?.clanId || "");
      const resourceVersion = Number(
        action.payload?.resourceVersion,
      );
      const currentRevision =
        state.myJoinRequestRevisions[clanId] ?? -1;
      if (
        !clanId ||
        !Number.isInteger(resourceVersion) ||
        resourceVersion <= currentRevision
      ) {
        return;
      }

      state.myJoinRequestRevisions[clanId] = resourceVersion;
      // Acceptance gives the player a clan and the backend removes every other
      // outstanding application, so no stale request action should remain.
      if (action.payload?.status === "ACCEPTED") {
        state.myJoinRequests = {};
        return;
      }

      if (action.payload?.request) {
        state.myJoinRequests[clanId] = action.payload.request;
      } else {
        delete state.myJoinRequests[clanId];
      }
    },
    removeMyJoinRequest: (state, action) => {
      delete state.myJoinRequests[String(action.payload)];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createClan.fulfilled, (state, action) => {
        state.createClanData = "clan created";
        const createdClan = action.payload?.data?.clan;
        state.userClanData = createdClan
          ? { data: createdClan }
          : null;
        state.joinRequestsRevision = Number(createdClan?.__v ?? -1);
        state.userClanStatus = "succeeded";
      })
      .addCase(createClan.pending, (state) => {
        state.createClanData = "Creating Clan....";
      })
      .addCase(createClan.rejected, (state) => {
        state.createClanData = null;
      })

      .addCase(joinClan.fulfilled, (state, action) => {
        const joinedClan = action.payload?.data?.clan;
        state.userClanData = joinedClan ? { data: joinedClan } : null;
        state.joinRequestsRevision = Number(joinedClan?.__v ?? -1);
        state.userClanStatus = "succeeded";
      })
      .addCase(leaveClan.fulfilled, (state) => {
        state.userClanData = null;
        state.joinRequestsRevision = -1;
        state.userClanStatus = "succeeded";
      })
      .addCase(fetchUserClan.fulfilled, (state, action) => {
        const incomingClan = action.payload?.data;
        const incomingRevision = Number(incomingClan?.__v ?? -1);
        const currentClan = state.userClanData?.data;
        const shouldPreserveNewerLiveQueue =
          currentClan &&
          String(currentClan._id) === String(incomingClan?._id) &&
          state.joinRequestsRevision > incomingRevision;
        const currentJoinRequests = currentClan?.joinRequests;

        state.userClanData = action.payload;
        if (shouldPreserveNewerLiveQueue) {
          state.userClanData.data.joinRequests = currentJoinRequests;
        } else {
          state.joinRequestsRevision = incomingRevision;
        }
        state.loading = false;
        state.userClanStatus = "succeeded";
      })
      .addCase(fetchUserClan.pending, (state) => {
        state.loading = true;
        state.userClanStatus = "loading";
      })
      .addCase(fetchUserClan.rejected, (state) => {
        state.loading = false;
        state.userClanData = null;
        state.userClanStatus = "failed";
      })
      .addCase(searchClan.fulfilled, (state, action) => {
        state.searchClanData = action.payload;
      })
      .addCase(searchClan.rejected, (state) => {
        state.searchClanData = null;
      })
      .addCase(fetchClanJoinRequests.fulfilled, (state, action) => {
        const incomingRevision = Number(
          action.payload?.data?.resourceVersion ?? -1,
        );
        if (
          state.userClanData?.data &&
          incomingRevision >= state.joinRequestsRevision
        ) {
          state.userClanData.data.joinRequests =
            action.payload?.data?.joinRequests || [];
          state.joinRequestsRevision = incomingRevision;
        }
      })
      .addCase(requestClanJoin.fulfilled, (state, action) => {
        const request = action.payload?.data?.request;
        if (request?.clanId) {
          state.myJoinRequests[request.clanId] = request;
          state.myJoinRequestRevisions[request.clanId] =
            Number(request.resourceVersion || 0);
        }
      })
      .addCase(fetchMyClanJoinRequests.pending, (state) => {
        state.myJoinRequestsStatus = "loading";
      })
      .addCase(fetchMyClanJoinRequests.fulfilled, (state, action) => {
        const requests = action.payload?.data?.requests || [];
        requests.forEach((request) => {
          const clanId = String(request.clanId);
          const incomingRevision = Number(request.resourceVersion || 0);
          const currentRevision =
            state.myJoinRequestRevisions[clanId] ?? -1;

          // A socket event may arrive while this request is in flight. Only
          // merge the snapshot when it is at least as recent as live state.
          if (incomingRevision >= currentRevision) {
            state.myJoinRequests[clanId] = request;
            state.myJoinRequestRevisions[clanId] = incomingRevision;
          }
        });
        state.myJoinRequestsStatus = "succeeded";
      })
      .addCase(fetchMyClanJoinRequests.rejected, (state) => {
        state.myJoinRequestsStatus = "failed";
      })
      .addCase(cancelMyClanJoinRequest.fulfilled, (state, action) => {
        const clanId = String(action.payload?.data?.clanId || "");
        state.myJoinRequestRevisions[clanId] = Number(
          action.payload?.data?.resourceVersion ??
            state.myJoinRequestRevisions[clanId] ??
            0,
        );
        delete state.myJoinRequests[clanId];
      })
      .addCase(fetchClanBookmarks.pending, (state) => {
        state.bookmarksStatus = "loading";
      })
      .addCase(fetchClanBookmarks.fulfilled, (state, action) => {
        state.bookmarkedClans =
          action.payload?.data?.bookmarks || [];
        state.bookmarksStatus = "succeeded";
      })
      .addCase(fetchClanBookmarks.rejected, (state) => {
        state.bookmarksStatus = "failed";
      })
      .addCase(fetchClanSuggestions.pending, (state) => {
        state.clanSuggestionsStatus = "loading";
      })
      .addCase(fetchClanSuggestions.fulfilled, (state, action) => {
        state.clanSuggestions =
          action.payload?.data?.suggestions || [];
        state.clanSuggestionsStatus = "succeeded";
      })
      .addCase(fetchClanSuggestions.rejected, (state) => {
        state.clanSuggestionsStatus = "failed";
      })
      .addCase(addClanBookmark.fulfilled, (state, action) => {
        const bookmark = action.payload?.data?.bookmark;
        if (
          bookmark &&
          !state.bookmarkedClans.some(
            (clan) => String(clan._id) === String(bookmark._id),
          )
        ) {
          state.bookmarkedClans.push(bookmark);
        }
      })
      .addCase(removeClanBookmark.fulfilled, (state, action) => {
        const clanId = action.payload?.data?.clanId;
        state.bookmarkedClans = state.bookmarkedClans.filter(
          (clan) => String(clan._id) !== String(clanId),
        );
      })
      .addCase(logout.fulfilled, (state) => {
        state.userClanData = null;
        state.userClanStatus = "idle";
        state.searchClanData = null;
        state.createClanData = null;
        state.bookmarkedClans = [];
        state.bookmarksStatus = "idle";
        state.clanSuggestions = [];
        state.clanSuggestionsStatus = "idle";
        state.myJoinRequests = {};
        state.myJoinRequestsStatus = "idle";
        state.myJoinRequestRevisions = {};
        state.joinRequestsRevision = -1;
        state.error = "";
      });

    addThunkLifecycleMatchers(builder, clanThunks, {
      pending: (state) => {
        state.error = null;
      },
      rejected: (state, action) => {
        // Navigation can abort a request after its local UI has closed.
        if (!action.meta.aborted && !action.meta.condition) {
          state.error = action.payload;
        }
      },
    });
  },
});

// Exporting actions and reducer
export const clanAction = clanSlice.actions;

export default clanSlice;
