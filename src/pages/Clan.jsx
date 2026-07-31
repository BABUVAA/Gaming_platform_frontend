import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Form } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios-api";
import {
  FiBookmark,
  FiCopy,
  FiMapPin,
  FiSearch,
  FiSettings,
  FiShield,
  FiUserMinus,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import { FaCrown, FaRegBookmark } from "react-icons/fa6";
import { Button, Input } from "../components";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { states } from "../utils/states";
import { formData } from "../utils/utility";
import {
  addClanBookmark,
  acceptClanJoinRequest,
  cancelMyClanJoinRequest,
  clanAction,
  createClan,
  changeClanMemberRole,
  declineClanJoinRequest,
  fetchClanBookmarks,
  fetchClanSuggestions,
  fetchMyClanJoinRequests,
  fetchUserClan,
  joinClan,
  kickClanMember,
  leaveClan,
  requestClanJoin,
  removeClanBookmark,
  searchClan,
  updateClanSettings,
} from "../store/slices/clanSlice";
import {
  searchPlayer,
} from "../store/slices/playerSlice";
import {
  acceptFriendRequest,
  acceptTeamInvitation,
  cancelFriendRequest,
  createClanTeam,
  declineFriendRequest,
  declineTeamInvitation,
  disbandClanTeam,
  fetchClanTeams,
  fetchSocialConnections,
  inviteTeamMember,
  leaveClanTeam,
  removeFriend,
  removeTeamMember,
  sendFriendRequest,
  socialActions,
} from "../store/slices/socialSlice";

const Clan = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { summary } = useSelector((store) => store.player);
  const {
    bookmarkedClans = [],
    bookmarksStatus = "idle",
    clanSuggestions = [],
    clanSuggestionsStatus = "idle",
    myJoinRequests = {},
    myJoinRequestsStatus = "idle",
    searchClanData,
    userClanData,
    userClanStatus,
  } = useSelector((store) => store.clan);
  const {
    connections,
    connectionsStatus,
    mutationStatus,
    teams,
    teamsStatus,
  } = useSelector((store) => store.social);
  const { globalLoading } = useSelector((store) => store.loading);
  const [activeTab, setActiveTab] = useState("myClan");
  const [isCreatingClan, setIsCreatingClan] = useState(false);
  const [searchTag, setSearchTag] = useState("");
  const [searchingPlayer, setSearchingPlayer] = useState(false);
  const [searchingClan, setSearchingClan] = useState(false);
  const [playerQuery, setPlayerQuery] = useState("");
  const [playerCard, setPlayerCard] = useState(null);
  const [playerError, setPlayerError] = useState("");
  const [clanError, setClanError] = useState("");
  const [previewTag, setPreviewTag] = useState("");
  const [previewPlayer, setPreviewPlayer] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [changingMemberId, setChangingMemberId] = useState("");
  const [kickCandidate, setKickCandidate] = useState(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const clanData = userClanData?.data || null;
  const currentUserId = String(summary?.userId || "");
  const hasClan = Boolean(clanData);
  const activeClanId = String(clanData?._id || "");
  const currentClanMember = clanData?.members?.find(
    (member) => getEntityId(member.user) === currentUserId,
  );
  const currentClanRole = currentClanMember?.role || "MEMBER";
  const canEditClanSettings = ["LEADER", "COLEADER"].includes(
    currentClanRole,
  );

  useEffect(() => {
    if (userClanStatus !== "succeeded") return;
    setActiveTab(hasClan ? "myClan" : "createClan");
  }, [hasClan, userClanStatus]);

  useEffect(() => {
    if (userClanStatus === "idle") {
      dispatch(fetchUserClan());
    }
  }, [dispatch, userClanStatus]);

  useEffect(() => {
    if (bookmarksStatus === "idle") {
      dispatch(fetchClanBookmarks());
    }
  }, [bookmarksStatus, dispatch]);

  useEffect(() => {
    if (clanSuggestionsStatus === "idle") {
      dispatch(fetchClanSuggestions());
    }
  }, [clanSuggestionsStatus, dispatch]);

  useEffect(() => {
    if (myJoinRequestsStatus === "idle") {
      dispatch(fetchMyClanJoinRequests());
    }
  }, [dispatch, myJoinRequestsStatus]);

  useEffect(() => {
    if (connectionsStatus === "idle") {
      dispatch(fetchSocialConnections());
    }
  }, [connectionsStatus, dispatch]);

  useEffect(() => {
    if (activeClanId) {
      dispatch(fetchClanTeams());
    } else {
      dispatch(socialActions.clearTeams());
    }
  }, [activeClanId, dispatch]);

  useEffect(() => {
    if (activeTab === "settings" && !canEditClanSettings) {
      setActiveTab("myClan");
    }
  }, [activeTab, canEditClanSettings]);

  useEffect(() => {
    const activeRequests = clanData?.joinRequests || [];
    if (!canEditClanSettings || activeRequests.length === 0) {
      return undefined;
    }

    const nextExpiry = Math.min(
      ...activeRequests
        .map((request) => new Date(request.expiresAt).getTime())
        .filter(Number.isFinite),
    );
    if (!Number.isFinite(nextExpiry)) return undefined;

    // One timer removes the earliest expiry. The updated queue schedules the
    // next timer, avoiding both polling and one timer per request.
    const expiryTimer = window.setTimeout(
      () =>
        dispatch(
          clanAction.removeExpiredJoinRequests(Date.now()),
        ),
      Math.max(0, nextExpiry - Date.now() + 50),
    );

    return () => window.clearTimeout(expiryTimer);
  }, [
    canEditClanSettings,
    clanData?.joinRequests,
    dispatch,
  ]);

  const friends = connections.friends;
  const friendRequests = connections.incomingRequests;
  const sentRequests = connections.outgoingRequests;
  const bookmarkedClanIds = new Set(
    bookmarkedClans.map((clan) => String(clan._id)),
  );

  const overviewStats = useMemo(
    () => [
      { label: "Clan", value: clanData ? "Joined" : "Not joined" },
      { label: "Friends", value: friends.length || 0 },
      { label: "Requests", value: friendRequests.length || 0 },
      { label: "Teams", value: teams.length || 0 },
    ],
    [clanData, friendRequests.length, friends.length, teams.length]
  );

  // Keeping navigation metadata together makes new clan areas easy to add
  // without duplicating button markup or visual rules.
  const navigationTabs = [
    ...(hasClan
      ? [
          { id: "myClan", label: "My Clan", icon: <FiShield /> },
          {
            id: "teams",
            label: "Teams",
            count: teams.length,
            icon: <FiUsers />,
          },
          ...(canEditClanSettings
            ? [
                {
                  id: "settings",
                  label: "Settings",
                  icon: <FiSettings />,
                },
              ]
            : []),
        ]
      : [{ id: "createClan", label: "Create Clan", icon: <FiShield /> }]),
    {
      id: "bookmarks",
      label: "Saved",
      count: bookmarkedClans.length,
      icon: <FiBookmark />,
    },
    { id: "searchClan", label: "Discover", icon: <FiSearch /> },
    {
      id: "social",
      label: "Friends",
      count: friendRequests.length,
      icon: <FiUserPlus />,
    },
  ];

  const handleCreateClan = async (event) => {
    event.preventDefault();
    setIsCreatingClan(true);
    try {
      await dispatch(createClan(formData(event))).unwrap();
      setActiveTab("myClan");
    } catch (error) {
      console.error("Clan creation failed:", error);
    } finally {
      setIsCreatingClan(false);
    }
  };

  const handleClanSearch = async () => {
    if (!searchTag.trim()) return;
    setSearchingClan(true);
    setClanError("");
    try {
      await dispatch(searchClan({ clanTag: searchTag.trim() })).unwrap();
    } catch (error) {
      console.error("Clan search failed:", error);
      setClanError("Clan not found.");
    } finally {
      setSearchingClan(false);
    }
  };

  const handleJoinClan = async (clanTag) => {
    if (!clanTag) return;
    try {
      await dispatch(joinClan({ clanTag })).unwrap();
      setActiveTab("myClan");
    } catch (error) {
      console.error("Join clan failed:", error);
    }
  };

  const handleRequestClanJoin = async (clanTag) => {
    if (!clanTag) return;
    try {
      await dispatch(requestClanJoin({ clanTag })).unwrap();
    } catch (error) {
      console.error("Clan join request failed:", error);
    }
  };

  const handleCancelClanJoinRequest = async (clanId) => {
    if (!clanId) return;
    try {
      await dispatch(cancelMyClanJoinRequest(clanId)).unwrap();
    } catch (error) {
      console.error("Clan join request cancellation failed:", error);
    }
  };

  const handleExpireClanJoinRequest = (clanId) => {
    dispatch(clanAction.removeMyJoinRequest(clanId));
  };

  const handleLeaveClan = async () => {
    try {
      await dispatch(leaveClan()).unwrap();
      setActiveTab("createClan");
    } catch (error) {
      console.error("Leave clan failed:", error);
    }
  };

  // Refresh the authoritative clan document after a rank change so every
  // member sees the same role and co-leader count returned by the backend.
  const handleMemberRoleChange = async (playerId, direction) => {
    setChangingMemberId(String(playerId));
    try {
      await dispatch(
        changeClanMemberRole({ playerId, direction }),
      ).unwrap();
      await dispatch(fetchUserClan()).unwrap();
    } catch (error) {
      console.error("Clan role change failed:", error);
    } finally {
      setChangingMemberId("");
    }
  };

  const handleUpdateClanSettings = async (settings) => {
    setIsSavingSettings(true);
    try {
      await dispatch(updateClanSettings(settings)).unwrap();
      await dispatch(fetchUserClan()).unwrap();
    } catch (error) {
      console.error("Clan settings update failed:", error);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleReviewJoinRequest = async (playerId, decision) => {
    setChangingMemberId(String(playerId));
    try {
      const operation =
        decision === "accept"
          ? acceptClanJoinRequest(playerId)
          : declineClanJoinRequest(playerId);
      await dispatch(operation).unwrap();
      await dispatch(fetchUserClan()).unwrap();
    } catch (error) {
      console.error("Clan join request review failed:", error);
    } finally {
      setChangingMemberId("");
    }
  };

  // Member removal requires a separate confirmation step because it clears
  // the target player's clan membership, not only their display role.
  const handleKickMember = async () => {
    if (!kickCandidate) return;

    const playerId = getEntityId(kickCandidate.user);
    setChangingMemberId(playerId);
    try {
      await dispatch(kickClanMember({ playerId })).unwrap();
      await dispatch(fetchUserClan()).unwrap();
      setKickCandidate(null);
    } catch (error) {
      console.error("Clan member removal failed:", error);
    } finally {
      setChangingMemberId("");
    }
  };

  const toggleBookmark = async (clanId, isBookmarked) => {
    if (!clanId) return;
    try {
      const operation = isBookmarked
        ? removeClanBookmark(clanId)
        : addClanBookmark(clanId);
      await dispatch(operation).unwrap();
    } catch (error) {
      console.error("Bookmark update failed:", error);
    }
  };

  const runPlayerSearch = async () => {
    if (!playerQuery.trim()) return;
    setSearchingPlayer(true);
    setPlayerError("");
    setPlayerCard(null);

    try {
      const response = await dispatch(
        searchPlayer({ playerTag: playerQuery.trim() })
      ).unwrap();
      setPlayerCard(response.data);
    } catch (error) {
      console.error("Player search failed:", error);
      setPlayerError("Player not found.");
    } finally {
      setSearchingPlayer(false);
    }
  };

  const runSocialMutation = async (operation) => {
    await dispatch(operation).unwrap();
    await dispatch(fetchSocialConnections()).unwrap();
  };

  const handleAddFriend = async (friendId) => {
    if (!friendId) return;
    try {
      await runSocialMutation(sendFriendRequest({ playerId: friendId }));
      setPlayerCard((prev) =>
        prev ? { ...prev, friendshipStatus: "request_sent" } : prev
      );
    } catch (error) {
      console.error("Add friend failed:", error);
    }
  };

  const handleCancelRequest = async (friendId) => {
    if (!friendId) return;
    try {
      await runSocialMutation(cancelFriendRequest(friendId));
      setPlayerCard((prev) =>
        prev ? { ...prev, friendshipStatus: "not_friends" } : prev
      );
    } catch (error) {
      console.error("Cancel request failed:", error);
    }
  };

  const handleAcceptRequest = async (friendId) => {
    if (!friendId) return;
    try {
      await runSocialMutation(acceptFriendRequest(friendId));
      setPlayerCard((prev) =>
        prev ? { ...prev, friendshipStatus: "friends" } : prev
      );
    } catch (error) {
      console.error("Accept request failed:", error);
    }
  };

  const handleRejectRequest = async (requesterId) => {
    if (!requesterId) return;
    try {
      await runSocialMutation(declineFriendRequest(requesterId));
    } catch (error) {
      console.error("Reject request failed:", error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!friendId) return;
    try {
      await runSocialMutation(removeFriend(friendId));
    } catch (error) {
      console.error("Remove friend failed:", error);
    }
  };

  const runTeamMutation = async (operation) => {
    await dispatch(operation).unwrap();
    await dispatch(fetchClanTeams()).unwrap();
  };

  const handleCreateTeam = async (teamData) => {
    try {
      await runTeamMutation(createClanTeam(teamData));
    } catch (error) {
      console.error("Create team failed:", error);
    }
  };

  const handleInviteTeamMember = async (teamId, playerId) => {
    try {
      await runTeamMutation(inviteTeamMember({ teamId, playerId }));
    } catch (error) {
      console.error("Team invitation failed:", error);
    }
  };

  const handleAcceptTeamInvitation = async (teamId) => {
    try {
      await runTeamMutation(acceptTeamInvitation(teamId));
    } catch (error) {
      console.error("Accept team invitation failed:", error);
    }
  };

  const handleDeclineTeamInvitation = async (teamId) => {
    try {
      await runTeamMutation(declineTeamInvitation(teamId));
    } catch (error) {
      console.error("Decline team invitation failed:", error);
    }
  };

  const handleRemoveTeamMember = async (teamId, playerId) => {
    try {
      await runTeamMutation(removeTeamMember({ teamId, playerId }));
    } catch (error) {
      console.error("Remove team member failed:", error);
    }
  };

  const handleLeaveTeam = async (teamId) => {
    try {
      await runTeamMutation(leaveClanTeam(teamId));
    } catch (error) {
      console.error("Leave team failed:", error);
    }
  };

  const handleDisbandTeam = async (teamId) => {
    try {
      await runTeamMutation(disbandClanTeam(teamId));
    } catch (error) {
      console.error("Disband team failed:", error);
    }
  };

  const copyTag = async (value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  const openPlayerPreview = async (tag) => {
    if (!tag) return;
    setPreviewTag(tag);
    setPreviewLoading(true);
    setPreviewPlayer(null);
    try {
      const response = await api.get(`/api/users/public/${encodeURIComponent(tag)}`);
      setPreviewPlayer(response?.data?.data || null);
    } catch (error) {
      console.error("Profile preview failed:", error);
      setPreviewPlayer(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  if (
    globalLoading ||
    ["idle", "loading"].includes(userClanStatus)
  ) {
    return <LoadingSpinner />;
  }

  return (
    <div className="clan-page space-y-5">
      <section className="clan-nav" aria-label="Clan navigation">
        <div className="clan-nav__track">
          {navigationTabs.map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {typeof tab.count === "number" && tab.count > 0 ? (
                <span className="clan-tab__count">{tab.count}</span>
              ) : null}
            </TabButton>
          ))}
        </div>
      </section>

      {!hasClan ? (
        <section className="clan-hero">
          <div className="clan-hero__content">
            <div className="clan-kicker">
              <span className="clan-kicker__dot" />
              Clan Arena
            </div>
            <h1 className="clan-hero__title">
              Find your squad.
              <span> Build your legacy.</span>
            </h1>
            <p className="clan-hero__copy">
              Team up with players, create lineups, and compete together.
            </p>

            <div className="clan-hero__stats">
              {overviewStats.map((stat) => (
                <MetricCard
                  key={stat.label}
                  label={stat.label}
                  value={stat.value}
                />
              ))}
            </div>
          </div>

          <div className="clan-hero__visual" aria-hidden="true">
            <div className="clan-hero__glow" />
            <img
              className="clan-hero__badge"
              src="/clan-badge.png"
              alt=""
            />
            <div className="clan-hero__identity">
              <span>Your next chapter</span>
              <strong>Build a crew</strong>
              <small>Play better together</small>
            </div>
          </div>
        </section>
      ) : null}

      <div className="clan-panel-enter" key={activeTab}>
      {hasClan && activeTab === "myClan" ? (
        <ClanOverviewPanel
          clanData={clanData}
          hasClan={hasClan}
          bookmarkedClanIds={bookmarkedClanIds}
          onToggleBookmark={toggleBookmark}
          onLeaveClan={handleLeaveClan}
          onCopyTag={copyTag}
          currentUserId={currentUserId}
          changingMemberId={changingMemberId}
          onMemberRoleChange={handleMemberRoleChange}
          onKickMember={setKickCandidate}
          onReviewJoinRequest={handleReviewJoinRequest}
        />
      ) : null}

      {!hasClan && activeTab === "createClan" ? (
        <CreateClanPanel
          onSubmit={handleCreateClan}
          isCreatingClan={isCreatingClan}
        />
      ) : null}

      {hasClan && activeTab === "teams" ? (
        <TeamPanel
          clanMembers={clanData?.members || []}
          currentUserId={currentUserId}
          isBusy={mutationStatus === "loading"}
          isLoading={teamsStatus === "loading"}
          onAcceptInvitation={handleAcceptTeamInvitation}
          onCreateTeam={handleCreateTeam}
          onDeclineInvitation={handleDeclineTeamInvitation}
          onDisbandTeam={handleDisbandTeam}
          onInviteMember={handleInviteTeamMember}
          onLeaveTeam={handleLeaveTeam}
          onRemoveMember={handleRemoveTeamMember}
          teams={teams}
        />
      ) : null}

      {hasClan && canEditClanSettings && activeTab === "settings" ? (
        <ClanSettingsPanel
          clanData={clanData}
          isSaving={isSavingSettings}
          onSubmit={handleUpdateClanSettings}
        />
      ) : null}

      {activeTab === "bookmarks" ? (
        <BookmarkedClanPanel
          bookmarkedClans={bookmarkedClans}
          onToggleBookmark={toggleBookmark}
          onJoinClan={handleJoinClan}
          onRequestJoin={handleRequestClanJoin}
          onCancelJoinRequest={handleCancelClanJoinRequest}
          onExpireJoinRequest={handleExpireClanJoinRequest}
          myJoinRequests={myJoinRequests}
          hasClan={hasClan}
        />
      ) : null}

      {activeTab === "searchClan" ? (
        <SearchClanPanel
          searchTag={searchTag}
          setSearchTag={setSearchTag}
          onSearch={handleClanSearch}
          result={searchClanData?.data}
          clanError={clanError}
          searchingClan={searchingClan}
          onJoinClan={handleJoinClan}
          onRequestJoin={handleRequestClanJoin}
          onCancelJoinRequest={handleCancelClanJoinRequest}
          onExpireJoinRequest={handleExpireClanJoinRequest}
          onToggleBookmark={toggleBookmark}
          bookmarkedClanIds={bookmarkedClanIds}
          myJoinRequests={myJoinRequests}
          hasClan={hasClan}
          suggestions={clanSuggestions}
          suggestionsLoading={clanSuggestionsStatus === "loading"}
        />
      ) : null}

      {activeTab === "social" ? (
        <SocialPanel
          friends={friends}
          friendRequests={friendRequests}
          sentRequests={sentRequests}
          playerCard={playerCard}
          playerError={playerError}
          playerQuery={playerQuery}
          searchingPlayer={searchingPlayer}
          setPlayerQuery={setPlayerQuery}
          onSearchPlayer={runPlayerSearch}
          onAddFriend={handleAddFriend}
          onCancelRequest={handleCancelRequest}
          onAcceptRequest={handleAcceptRequest}
          onRejectRequest={handleRejectRequest}
          onRemoveFriend={handleRemoveFriend}
          onViewProfile={openPlayerPreview}
          currentUserId={currentUserId}
        />
      ) : null}
      </div>

      {kickCandidate ? (
        <KickClanMemberDialog
          busy={changingMemberId === getEntityId(kickCandidate.user)}
          member={kickCandidate}
          onCancel={() => setKickCandidate(null)}
          onConfirm={handleKickMember}
        />
      ) : null}

      {previewTag ? (
        <PlayerPreviewModal
          player={previewPlayer}
          loading={previewLoading}
          playerTag={previewTag}
          onClose={() => {
            setPreviewTag("");
            setPreviewPlayer(null);
          }}
          onOpenFullProfile={(tag) => {
            navigate(`/dashboard/profile?playerTag=${encodeURIComponent(tag)}`);
            setPreviewTag("");
            setPreviewPlayer(null);
          }}
        />
      ) : null}
    </div>
  );
};

const CreateClanPanel = ({ onSubmit, isCreatingClan }) => (
  <section className="clan-surface clan-create">
    <div className="clan-create__intro">
      <img src="/clan-badge.png" alt="" className="clan-create__badge" />
      <div>
        <p className="clan-eyebrow">New Clan</p>
        <h2 className="clan-heading">Create your clan</h2>
        <p className="clan-subcopy">
          Choose a name, set who can join, and start building your roster.
        </p>
      </div>
    </div>

    <Form onSubmit={onSubmit} className="clan-form grid gap-5 xl:grid-cols-2">
      <div className="xl:col-span-1">
        <Input
          type="text"
          name="clanName"
          placeholder="Enter your clan name"
          label="Clan name"
          required
        />
      </div>

      <label className="block xl:col-span-1">
        <span className="mb-2 block text-sm font-semibold text-slate-300">
          Clan type
        </span>
        <select
          name="clanType"
          className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        >
          <option>Anyone Can Join</option>
          <option>Invite Only</option>
          <option>Closed</option>
        </select>
      </label>

      <label className="block xl:col-span-2">
        <span className="mb-2 block text-sm font-semibold text-slate-300">
          Description
        </span>
        <textarea
          name="description"
          placeholder="Tell players what your clan focuses on."
          rows={5}
          className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        />
      </label>

      <label className="block xl:col-span-1">
        <span className="mb-2 block text-sm font-semibold text-slate-300">
          Location
        </span>
        <select
          name="location"
          defaultValue=""
          className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
        >
          <option value="" disabled>
            Select state
          </option>
          {states.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-end xl:col-span-1">
        <Button
          type="submit"
          isLoading={isCreatingClan}
          className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-cyan-200"
        >
          Create Clan
        </Button>
      </div>
    </Form>
  </section>
);

const CLAN_TYPE_OPTIONS = [
  {
    value: "Anyone Can Join",
    title: "Anyone Can Join",
    copy: "Players can join instantly while space is available.",
  },
  {
    value: "Invite Only",
    title: "Invite Only",
    copy: "Only players accepted through a clan invitation can enter.",
  },
  {
    value: "Closed",
    title: "Closed",
    copy: "Pause all new memberships without affecting current members.",
  },
];

const ClanSettingsPanel = ({ clanData, isSaving, onSubmit }) => {
  const [draft, setDraft] = useState({
    clanType: clanData?.stats?.type || "Anyone Can Join",
    description: clanData?.bio || "",
    location: clanData?.location || "Any",
  });

  useEffect(() => {
    setDraft({
      clanType: clanData?.stats?.type || "Anyone Can Join",
      description: clanData?.bio || "",
      location: clanData?.location || "Any",
    });
  }, [
    clanData?.bio,
    clanData?.location,
    clanData?.stats?.type,
  ]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const submitSettings = async (event) => {
    event.preventDefault();
    await onSubmit(draft);
  };

  return (
    <section className="clan-surface clan-settings">
      <div className="clan-settings__header">
        <div>
          <p className="clan-eyebrow">Clan Settings</p>
          <h2 className="clan-heading">Manage your clan</h2>
          <p className="clan-subcopy">
            Update how players discover and join your clan.
          </p>
        </div>
        <div className="clan-settings__identity">
          <img src="/clan-badge.png" alt="" />
          <div>
            <strong>{clanData.clanName}</strong>
            <span>{clanData.clanTag}</span>
          </div>
        </div>
      </div>

      <form className="clan-settings__form" onSubmit={submitSettings}>
        <label className="clan-settings__field">
          <span>Description</span>
          <textarea
            maxLength={200}
            onChange={(event) =>
              updateDraft("description", event.target.value)
            }
            placeholder="What is your clan about?"
            rows={4}
            value={draft.description}
          />
          <small>{draft.description.length}/200</small>
        </label>

        <label className="clan-settings__field">
          <span>Location</span>
          <select
            onChange={(event) =>
              updateDraft("location", event.target.value)
            }
            value={draft.location}
          >
            <option value="Any">Any</option>
            {states.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
          <small>Helps players find clans in their region.</small>
        </label>

        <fieldset className="clan-settings__types">
          <legend>Who can join?</legend>
          <div className="clan-settings__type-grid">
            {CLAN_TYPE_OPTIONS.map((option) => (
              <label
                className={`clan-type-option ${
                  draft.clanType === option.value
                    ? "clan-type-option--selected"
                    : ""
                }`}
                key={option.value}
              >
                <input
                  checked={draft.clanType === option.value}
                  name="clanType"
                  onChange={() => updateDraft("clanType", option.value)}
                  type="radio"
                  value={option.value}
                />
                <span className="clan-type-option__mark" />
                <strong>{option.title}</strong>
                <small>{option.copy}</small>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="clan-settings__footer">
          <p>
            Clan name and tag cannot be changed from these settings.
          </p>
          <Button
            className="clan-settings__save"
            isLoading={isSaving}
            type="submit"
          >
            Save Changes
          </Button>
        </div>
      </form>
    </section>
  );
};

const ClanOverviewPanel = ({
  clanData,
  hasClan,
  bookmarkedClanIds,
  onToggleBookmark,
  onLeaveClan,
  onCopyTag,
  currentUserId,
  changingMemberId,
  onMemberRoleChange,
  onKickMember,
  onReviewJoinRequest,
}) => {
  const [selectedMember, setSelectedMember] = useState(null);

  if (hasClan && !clanData) {
    return (
      <EmptyPanel
        title="Loading your clan details"
        copy="You are already in a clan. Syncing full roster data now."
      />
    );
  }

  if (!clanData) {
    return (
      <EmptyPanel
        title="You are not in a clan yet"
        copy="Create a new clan or search existing ones to start building your roster."
      />
    );
  }

  const isBookmarked = bookmarkedClanIds.has(String(clanData._id));
  const roleOrder = {
    LEADER: 0,
    COLEADER: 1,
    ELDER: 2,
    MEMBER: 3,
  };
  const members = [...(clanData.members || [])].sort(
    (first, second) =>
      (roleOrder[first.role] ?? 99) - (roleOrder[second.role] ?? 99),
  );
  const currentMember = members.find(
    (member) => getEntityId(member.user) === String(currentUserId),
  );
  const currentRole = currentMember?.role || "MEMBER";
  const coLeaderCount = members.filter(
    (member) => member.role === "COLEADER",
  ).length;
  const elderCount = members.filter((member) => member.role === "ELDER").length;
  const joinRequests = clanData.joinRequests || [];
  const clanBadgeSource =
    !clanData.badge || clanData.badge === "clan-badge.png"
      ? "/clan-badge.png"
      : clanData.badge;

  // A single controlled member menu prevents several destructive action sets
  // from remaining open while the leader reviews the roster.
  const toggleMemberActions = (member) => {
    const memberId = getEntityId(member.user);
    setSelectedMember((current) =>
      getEntityId(current?.user) === memberId ? null : member,
    );
  };

  return (
    <div className="space-y-5">
      <section className="clan-surface clan-profile-card">
        <div className="clan-profile-card__main">
          <img
            src={clanBadgeSource}
            alt=""
            className="clan-profile-card__badge"
          />
          <div className="min-w-0 flex-1">
            <p className="clan-eyebrow">Your Clan</p>
            <h2 className="mt-1 truncate text-3xl font-black text-white md:text-4xl">
              {clanData.clanName}
            </h2>
            <button
              type="button"
              onClick={() => onCopyTag(clanData.clanTag)}
              className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-cyan-200 transition hover:text-cyan-100"
            >
              <FiCopy />
              {clanData.clanTag}
            </button>
          </div>

          <div className="clan-profile-card__actions">
            <button
              type="button"
              onClick={() => onToggleBookmark(clanData._id, isBookmarked)}
              className="clan-secondary-action"
            >
              {isBookmarked ? <FiBookmark /> : <FaRegBookmark />}
              {isBookmarked ? "Saved" : "Save"}
            </button>
            {currentRole !== "LEADER" ? (
              <button
                type="button"
                onClick={onLeaveClan}
                className="clan-danger-action"
              >
                Leave
              </button>
            ) : null}
          </div>
        </div>

        <p className="clan-description">
          {clanData.bio || "No clan description has been added yet."}
        </p>

        <div className="clan-detail-grid">
          <InfoBlock icon={<FiMapPin />} label="Location" value={clanData.location || "Not set"} />
          <InfoBlock
            icon={<FaCrown />}
            label="Leader"
            value={clanData?.leader?.leaderName || "Unknown"}
          />
          <InfoBlock
            icon={<FiUsers />}
            label="Members"
            value={`${members.length}/${clanData?.stats?.maxMembers || 50}`}
          />
          <InfoBlock
            icon={<FiShield />}
            label="Clan Type"
            value={clanData?.stats?.type || "Anyone Can Join"}
          />
        </div>
      </section>

      {joinRequests.length > 0 ? (
        <section className="clan-surface clan-join-requests">
          <div className="clan-roster__header">
            <div>
              <p className="clan-eyebrow">Join Requests</p>
              <h2 className="clan-heading">
                Players waiting for approval
              </h2>
            </div>
            <span className="clan-join-requests__count">
              {joinRequests.length} pending
            </span>
          </div>

          <div className="clan-join-requests__list">
            {joinRequests.map((request) => {
              const playerId = getEntityId(request.user);
              const isBusy = changingMemberId === playerId;

              return (
                <div className="clan-join-request" key={playerId}>
                  <div className="clan-member-row__avatar">
                    {String(request.playerName || "P")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                  <div className="clan-member-row__identity">
                    <strong>{request.playerName || "Player"}</strong>
                    <span>{request.playerTag || "Platform player"}</span>
                  </div>
                  <span className="clan-join-request__date">
                    {request.requestedAt
                      ? `Requested ${new Date(
                          request.requestedAt,
                        ).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : "Pending"}
                  </span>
                  <div className="clan-join-request__actions">
                    <button
                      disabled={isBusy}
                      onClick={() =>
                        onReviewJoinRequest(playerId, "decline")
                      }
                      type="button"
                    >
                      Decline
                    </button>
                    <button
                      className="clan-join-request__accept"
                      disabled={isBusy}
                      onClick={() =>
                        onReviewJoinRequest(playerId, "accept")
                      }
                      type="button"
                    >
                      {isBusy ? "Updating..." : "Accept"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="clan-surface clan-roster">
        <div className="clan-roster__header">
          <div>
            <p className="clan-eyebrow">Members</p>
            <h2 className="clan-heading">Clan roster</h2>
          </div>
          <div className="clan-role-summary">
            <span><FaCrown /> 1 Leader</span>
            <span>{coLeaderCount}/5 Co-leaders</span>
            <span>{elderCount} Elders</span>
          </div>
        </div>

        <div className="clan-roster__list">
          <div className="clan-roster__columns" aria-hidden="true">
            <span>#</span>
            <span>Player</span>
            <span>Role</span>
            <span>Joined</span>
          </div>
          {members.map((member, index) => (
            <ClanMemberRow
              actorRole={currentRole}
              actionsOpen={
                getEntityId(selectedMember?.user) === getEntityId(member.user)
              }
              busy={changingMemberId === getEntityId(member.user)}
              currentUserId={currentUserId}
              index={index}
              key={getEntityId(member.user)}
              member={member}
              onToggleActions={toggleMemberActions}
            />
          ))}
        </div>
      </section>

      {selectedMember ? (
        <ClanMemberActionsDialog
          actorRole={currentRole}
          busy={
            changingMemberId === getEntityId(selectedMember.user)
          }
          member={selectedMember}
          onClose={() => setSelectedMember(null)}
          onDemote={() => {
            setSelectedMember(null);
            onMemberRoleChange(
              getEntityId(selectedMember.user),
              "demote",
            );
          }}
          onKick={() => {
            setSelectedMember(null);
            onKickMember(selectedMember);
          }}
          onPromote={() => {
            setSelectedMember(null);
            onMemberRoleChange(
              getEntityId(selectedMember.user),
              "promote",
            );
          }}
        />
      ) : null}
    </div>
  );
};

const formatClanRole = (role) =>
  ({
    LEADER: "Leader",
    COLEADER: "Co-leader",
    ELDER: "Elder",
    MEMBER: "Member",
  })[role] || "Member";

const ClanMemberRow = ({
  actionsOpen,
  actorRole,
  busy,
  currentUserId,
  index,
  member,
  onToggleActions,
}) => {
  const memberId = getEntityId(member.user);
  const isCurrentPlayer = memberId === String(currentUserId);
  const leaderCanManage =
    actorRole === "LEADER" && member.role !== "LEADER";
  const coLeaderCanManage =
    actorRole === "COLEADER" &&
    ["MEMBER", "ELDER"].includes(member.role);
  const canManage = !isCurrentPlayer && (leaderCanManage || coLeaderCanManage);
  const toggleActions = () => {
    if (canManage && !busy) onToggleActions(member);
  };

  return (
    <div
      className={`clan-member-row ${
        isCurrentPlayer ? "clan-member-row--current" : ""
      } ${canManage ? "clan-member-row--manageable" : ""} ${
        actionsOpen ? "clan-member-row--actions-open" : ""
      }`}
    >
      <div className="clan-member-row__rank">{index + 1}</div>
      <div className="clan-member-row__avatar">
        {String(member.clanMemberName || "P").charAt(0).toUpperCase()}
      </div>
      <button
        aria-expanded={canManage ? actionsOpen : undefined}
        className="clan-member-row__identity"
        disabled={!canManage || busy}
        onClick={toggleActions}
        type="button"
      >
        <strong>
          {member.clanMemberName || "Player"}
          {isCurrentPlayer ? <small>You</small> : null}
        </strong>
        <span>{member.clanMemberTag || "Platform player"}</span>
      </button>
      <span className={`clan-role clan-role--${member.role.toLowerCase()}`}>
        {member.role === "LEADER" ? <FaCrown /> : <FiShield />}
        {formatClanRole(member.role)}
      </span>
      <span className="clan-member-row__joined">
        {member.joinedAt
          ? new Date(member.joinedAt).toLocaleDateString()
          : "-"}
      </span>
    </div>
  );
};

const ClanMemberActionsDialog = ({
  actorRole,
  busy,
  member,
  onClose,
  onDemote,
  onKick,
  onPromote,
}) => {
  const canPromote =
    member.role === "MEMBER" ||
    (actorRole === "LEADER" && member.role === "ELDER");
  const canDemote =
    member.role === "ELDER" ||
    (actorRole === "LEADER" && member.role === "COLEADER");

  useEffect(() => {
    const closeOnEscape = (event) => {
      if (event.key === "Escape" && !busy) onClose();
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [busy, onClose]);

  return (
    <div
      className="clan-dialog-backdrop"
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
      role="presentation"
    >
      <section
        aria-labelledby="member-actions-title"
        aria-modal="true"
        className="clan-member-dialog"
        role="dialog"
      >
        <div className="clan-member-dialog__header">
          <div className="clan-member-dialog__avatar">
            {String(member.clanMemberName || "P").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="clan-eyebrow">Manage Player</p>
            <h2 className="clan-heading truncate" id="member-actions-title">
              {member.clanMemberName || "Player"}
            </h2>
            <p className="clan-member-dialog__tag">
              {member.clanMemberTag || "Platform player"}
            </p>
          </div>
          <button
            aria-label="Close member options"
            className="clan-member-dialog__close"
            disabled={busy}
            onClick={onClose}
            type="button"
          >
            Close
          </button>
        </div>

        <div className="clan-member-dialog__role">
          <span>Current role</span>
          <strong>{formatClanRole(member.role)}</strong>
        </div>

        <div className="clan-member-dialog__actions">
          {canPromote ? (
            <button
              autoFocus
              className="clan-member-dialog__promote"
              disabled={busy}
              onClick={onPromote}
              type="button"
            >
              <FiUserPlus />
              Promote
              <small>Move up one clan rank</small>
            </button>
          ) : null}
          {canDemote ? (
            <button
              autoFocus={!canPromote}
              disabled={busy}
              onClick={onDemote}
              type="button"
            >
              <FiUserMinus />
              Demote
              <small>Move down one clan rank</small>
            </button>
          ) : null}
          <button
            className="clan-member-dialog__kick"
            disabled={busy}
            onClick={onKick}
            type="button"
          >
            <FiUserMinus />
            Kick Out
            <small>Remove this player from the clan</small>
          </button>
        </div>
      </section>
    </div>
  );
};

const KickClanMemberDialog = ({
  busy,
  member,
  onCancel,
  onConfirm,
}) => (
  <div
    className="clan-dialog-backdrop"
    onClick={(event) => {
      if (event.target === event.currentTarget && !busy) onCancel();
    }}
    role="presentation"
  >
    <section
      aria-describedby="kick-member-description"
      aria-labelledby="kick-member-title"
      aria-modal="true"
      className="clan-kick-dialog"
      role="dialog"
    >
      <div className="clan-kick-dialog__icon">
        <FiUserMinus />
      </div>
      <p className="clan-eyebrow">Remove Member</p>
      <h2 className="clan-heading" id="kick-member-title">
        Kick {member.clanMemberName || "this player"}?
      </h2>
      <p className="clan-subcopy" id="kick-member-description">
        They will leave the clan immediately. They can join again later if the
        clan rules allow it.
      </p>
      <div className="clan-kick-dialog__actions">
        <button disabled={busy} onClick={onCancel} type="button">
          Cancel
        </button>
        <button
          autoFocus
          className="clan-kick-dialog__confirm"
          disabled={busy}
          onClick={onConfirm}
          type="button"
        >
          {busy ? "Removing..." : "Kick Out"}
        </button>
      </div>
    </section>
  </div>
);

const TEAM_MODES_BY_GAME = {
  bgmi: ["duo", "squad"],
  coc: ["5v5", "10v10", "15v15", "20v20"],
};

const getEntityId = (entity) => String(entity?._id || entity || "");

const TeamPanel = ({
  clanMembers,
  currentUserId,
  isBusy,
  isLoading,
  onAcceptInvitation,
  onCreateTeam,
  onDeclineInvitation,
  onDisbandTeam,
  onInviteMember,
  onLeaveTeam,
  onRemoveMember,
  teams,
}) => {
  const [draft, setDraft] = useState({
    game: "bgmi",
    mode: "squad",
    teamName: "",
  });
  const [inviteSelections, setInviteSelections] = useState({});

  const updateDraft = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
      // Changing games resets mode so an incompatible hidden value is never
      // submitted to the backend.
      ...(field === "game"
        ? { mode: TEAM_MODES_BY_GAME[value][0] }
        : {}),
    }));
  };

  const submitTeam = async (event) => {
    event.preventDefault();
    if (!draft.teamName.trim()) return;

    await onCreateTeam({
      ...draft,
      teamName: draft.teamName.trim(),
    });
    setDraft((current) => ({ ...current, teamName: "" }));
  };

  if (isLoading) {
    return (
      <EmptyPanel
        title="Loading clan teams"
        copy="Syncing accepted players and pending invitations."
      />
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
      <section className="clan-surface clan-team-builder">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
          New Team
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">
          Start a clan lineup
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Create the roster first, then invite clan members. A team becomes
          ready only after every place is accepted.
        </p>

        <form className="mt-6 space-y-4" onSubmit={submitTeam}>
          <Input
            label="Team name"
            name="teamName"
            onChange={(event) => updateDraft("teamName", event.target.value)}
            placeholder="Enter team name"
            required
            type="text"
            value={draft.teamName}
          />

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-300">
              Game
            </span>
            <select
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              onChange={(event) => updateDraft("game", event.target.value)}
              value={draft.game}
            >
              <option value="bgmi">BGMI</option>
              <option value="coc">Clash of Clans</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-300">
              Format
            </span>
            <select
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/90 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
              onChange={(event) => updateDraft("mode", event.target.value)}
              value={draft.mode}
            >
              {TEAM_MODES_BY_GAME[draft.game].map((mode) => (
                <option key={mode} value={mode}>
                  {mode.toUpperCase()}
                </option>
              ))}
            </select>
          </label>

          <Button
            className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-cyan-200"
            isLoading={isBusy}
            type="submit"
          >
            Create Team
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        {teams.length === 0 ? (
          <EmptyPanel
            title="No clan teams yet"
            copy="Create the first lineup and invite players from your clan roster."
          />
        ) : (
          teams.map((team) => {
            const captainId = getEntityId(team.createdBy);
            const isCaptain = captainId === String(currentUserId);
            const acceptedIds = new Set(team.players.map(getEntityId));
            const pendingIds = new Set(team.pendingInvites.map(getEntityId));
            const hasAccepted = acceptedIds.has(String(currentUserId));
            const hasPendingInvite = pendingIds.has(String(currentUserId));
            const availableMembers = clanMembers.filter((member) => {
              const memberId = getEntityId(member.user);
              return (
                memberId &&
                !acceptedIds.has(memberId) &&
                !pendingIds.has(memberId)
              );
            });
            const selectedInvite = inviteSelections[team._id] || "";

            return (
              <article
                className="clan-surface clan-team-card"
                key={team._id}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
                      {team.game} {team.mode}
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-white">
                      {team.teamName}
                    </h3>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] ${
                      team.status === "ready"
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-amber-400/15 text-amber-200"
                    }`}
                  >
                    {team.status}
                  </span>
                </div>

                <div className="mt-5 grid gap-3">
                  {team.players.map((player) => {
                    const playerId = getEntityId(player);
                    const playerIsCaptain = playerId === captainId;

                    return (
                      <div
                        className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                        key={playerId}
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {player.profile?.username || "Player"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-slate-500">
                            {playerIsCaptain ? "Captain" : "Accepted"}
                          </p>
                        </div>
                        {isCaptain && !playerIsCaptain ? (
                          <button
                            className="text-sm font-bold text-rose-300 hover:text-rose-200"
                            disabled={isBusy}
                            onClick={() =>
                              onRemoveMember(team._id, playerId)
                            }
                            type="button"
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    );
                  })}

                  {team.pendingInvites.map((player) => {
                    const playerId = getEntityId(player);
                    return (
                      <div
                        className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/5 px-4 py-3"
                        key={playerId}
                      >
                        <div>
                          <p className="font-semibold text-white">
                            {player.profile?.username || "Player"}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-amber-200/70">
                            Invitation pending
                          </p>
                        </div>
                        {playerId === String(currentUserId) ? (
                          <div className="flex gap-2">
                            <button
                              className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950"
                              disabled={isBusy}
                              onClick={() => onAcceptInvitation(team._id)}
                              type="button"
                            >
                              Accept
                            </button>
                            <button
                              className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300"
                              disabled={isBusy}
                              onClick={() => onDeclineInvitation(team._id)}
                              type="button"
                            >
                              Decline
                            </button>
                          </div>
                        ) : isCaptain ? (
                          <button
                            className="text-sm font-bold text-rose-300 hover:text-rose-200"
                            disabled={isBusy}
                            onClick={() =>
                              onRemoveMember(team._id, playerId)
                            }
                            type="button"
                          >
                            Cancel invite
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {isCaptain &&
                team.status === "forming" &&
                availableMembers.length > 0 ? (
                  <div className="mt-5 flex flex-col gap-2 sm:flex-row">
                    <select
                      className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-200"
                      onChange={(event) =>
                        setInviteSelections((current) => ({
                          ...current,
                          [team._id]: event.target.value,
                        }))
                      }
                      value={selectedInvite}
                    >
                      <option value="">Choose clan member</option>
                      {availableMembers.map((member) => (
                        <option
                          key={getEntityId(member.user)}
                          value={getEntityId(member.user)}
                        >
                          {member.clanMemberName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-white hover:bg-white/15 disabled:opacity-50"
                      disabled={!selectedInvite || isBusy}
                      onClick={() =>
                        onInviteMember(team._id, selectedInvite)
                      }
                      type="button"
                    >
                      Invite
                    </button>
                  </div>
                ) : null}

                <div className="mt-5 flex justify-end">
                  {isCaptain ? (
                    <button
                      className="text-sm font-bold text-rose-300 hover:text-rose-200"
                      disabled={isBusy}
                      onClick={() => onDisbandTeam(team._id)}
                      type="button"
                    >
                      Disband team
                    </button>
                  ) : hasAccepted ? (
                    <button
                      className="text-sm font-bold text-rose-300 hover:text-rose-200"
                      disabled={isBusy}
                      onClick={() => onLeaveTeam(team._id)}
                      type="button"
                    >
                      Leave team
                    </button>
                  ) : hasPendingInvite ? null : (
                    <span className="text-xs text-slate-500">
                      Clan roster
                    </span>
                  )}
                </div>
              </article>
            );
          })
        )}
      </section>
    </div>
  );
};

const SearchClanPanel = ({
  searchTag,
  setSearchTag,
  onSearch,
  result,
  clanError,
  searchingClan,
  onJoinClan,
  onRequestJoin,
  onCancelJoinRequest,
  onExpireJoinRequest,
  onToggleBookmark,
  bookmarkedClanIds,
  myJoinRequests,
  hasClan,
  suggestions,
  suggestionsLoading,
}) => {
  const isBookmarked = result ? bookmarkedClanIds.has(String(result._id)) : false;
  const joinRequest = result
    ? myJoinRequests[String(result._id)]
    : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="clan-surface">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
          Discovery
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Search by clan tag</h2>
        <div className="mt-6 space-y-3">
          <Input
            type="text"
            name="searchClan"
            label="Clan tag"
            placeholder="#CLAN123"
            value={searchTag}
            onChange={(event) => setSearchTag(event.target.value)}
            iconStart={<FiSearch />}
          />
          <Button
            onClick={onSearch}
            isLoading={searchingClan}
            className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-cyan-200"
          >
            Search Clan
          </Button>
        </div>
        </section>

        <section className="clan-surface">
        {result ? (
          <>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
              Search Result
            </p>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-black text-white">{result.clanName}</h2>
                <p className="mt-2 text-sm text-slate-400">{result.clanTag}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(result._id, isBookmarked)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
                >
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
                {hasClan ? (
                  <button
                    type="button"
                    disabled
                    className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-400"
                  >
                    Already in a clan
                  </button>
                ) : result?.stats?.type === "Invite Only" ? (
                  <ClanJoinRequestAction
                    clanId={String(result._id)}
                    clanTag={result.clanTag}
                    request={joinRequest}
                    onCancel={onCancelJoinRequest}
                    onExpire={onExpireJoinRequest}
                    onRequest={onRequestJoin}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onJoinClan(result.clanTag)}
                    disabled={result?.stats?.type === "Closed"}
                    className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
                  >
                    {result?.stats?.type === "Anyone Can Join"
                      ? "Join Clan"
                      : "Closed"}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoBlock
                icon={<FiUsers />}
                label="Members"
                value={String(
                  result?.memberCount || result?.members?.length || 0
                )}
              />
              <InfoBlock
                icon={<FiShield />}
                label="Type"
                value={result?.stats?.type || result?.clanType || "Open"}
              />
            </div>
          </>
        ) : (
          <EmptyPanel
            title={clanError || "No clan selected"}
            copy="Search with a clan tag to preview details and join from here."
          />
        )}
        </section>
      </div>

      <section className="clan-surface">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
              Suggested clans
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Find your next squad
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            Active clans with room for new members
          </p>
        </div>

        {suggestionsLoading ? (
          <p className="mt-6 text-sm text-slate-400">
            Finding clans for you...
          </p>
        ) : suggestions.length > 0 ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {suggestions.map((clan) => (
              <ClanSuggestionCard
                key={clan._id}
                bookmarked={bookmarkedClanIds.has(String(clan._id))}
                clan={clan}
                hasClan={hasClan}
                onCancelJoinRequest={onCancelJoinRequest}
                onExpireJoinRequest={onExpireJoinRequest}
                onJoinClan={onJoinClan}
                onRequestJoin={onRequestJoin}
                onToggleBookmark={onToggleBookmark}
                request={myJoinRequests[String(clan._id)]}
              />
            ))}
          </div>
        ) : (
          <EmptyPanel
            title="No suggestions right now"
            copy="New clans with available spaces will appear here."
          />
        )}
      </section>
    </div>
  );
};

const ClanSuggestionCard = ({
  bookmarked,
  clan,
  hasClan,
  onCancelJoinRequest,
  onExpireJoinRequest,
  onJoinClan,
  onRequestJoin,
  onToggleBookmark,
  request,
}) => {
  const memberCount = Number(clan.memberCount || 0);
  const maxMembers = Number(clan.stats?.maxMembers || 50);
  const capacity = Math.min(100, (memberCount / maxMembers) * 100);

  return (
    <article className="rounded-[26px] border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-cyan-300 text-xl font-black text-slate-950">
            {clan.clanName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-black text-white">
              {clan.clanName}
            </h3>
            <p className="mt-1 text-sm text-slate-400">{clan.clanTag}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label={bookmarked ? "Remove bookmark" : "Bookmark clan"}
          onClick={() => onToggleBookmark(clan._id, bookmarked)}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
        >
          {bookmarked ? <FiBookmark /> : <FaRegBookmark />}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
        <span className="rounded-full bg-white/5 px-3 py-1.5">
          {clan.stats?.type}
        </span>
        <span className="rounded-full bg-white/5 px-3 py-1.5">
          {clan.location || "Any location"}
        </span>
      </div>

      <div className="mt-5">
        <div className="flex justify-between text-xs text-slate-400">
          <span>Members</span>
          <span>{memberCount}/{maxMembers}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-cyan-300"
            style={{ width: `${capacity}%` }}
          />
        </div>
      </div>

      <div className="mt-5">
        {hasClan ? (
          <p className="text-sm font-semibold text-slate-500">
            You are already in a clan
          </p>
        ) : clan.stats?.type === "Invite Only" ? (
          <ClanJoinRequestAction
            clanId={String(clan._id)}
            clanTag={clan.clanTag}
            request={request}
            onCancel={onCancelJoinRequest}
            onExpire={onExpireJoinRequest}
            onRequest={onRequestJoin}
          />
        ) : (
          <button
            type="button"
            onClick={() => onJoinClan(clan.clanTag)}
            className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
          >
            Join Clan
          </button>
        )}
      </div>
    </article>
  );
};

const SocialPanel = ({
  friends,
  friendRequests,
  sentRequests,
  playerCard,
  playerError,
  playerQuery,
  searchingPlayer,
  setPlayerQuery,
  onSearchPlayer,
  onAddFriend,
  onCancelRequest,
  onAcceptRequest,
  onRejectRequest,
  onRemoveFriend,
  onViewProfile,
  currentUserId,
}) => (
  <div className="space-y-6">
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="clan-surface">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
            Search
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Find players by tag</h2>
          <div className="mt-6 space-y-3">
            <Input
              type="text"
              name="searchFriend"
              label="Player tag"
              placeholder="Enter username or player tag"
              value={playerQuery}
              onChange={(event) => setPlayerQuery(event.target.value)}
              iconStart={<FiSearch />}
            />
            <Button
              onClick={onSearchPlayer}
              isLoading={searchingPlayer}
              className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-cyan-200"
            >
              Search Player
            </Button>
          </div>
        </section>

        <section className="clan-surface">
          {playerCard ? (
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                  Player Result
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <img
                    src={playerCard.avatar || "/profile-pic.png"}
                    alt={playerCard.username}
                    className="h-20 w-20 rounded-[24px] object-cover"
                  />
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {playerCard.username}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      Friendship status: {playerCard.friendshipStatus}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {playerCard.friendshipStatus === "not_friends" &&
                currentUserId !== playerCard._id ? (
                  <ActionButton onClick={() => onAddFriend(playerCard._id)}>
                    <FiUserPlus />
                    Add Friend
                  </ActionButton>
                ) : null}

                {playerCard.friendshipStatus === "request_received" ? (
                  <ActionButton onClick={() => onAcceptRequest(playerCard._id)}>
                    <FiUserPlus />
                    Accept Request
                  </ActionButton>
                ) : null}

                {playerCard.friendshipStatus === "request_sent" ? (
                  <ActionButton onClick={() => onCancelRequest(playerCard._id)}>
                    <FiUserMinus />
                    Cancel Request
                  </ActionButton>
                ) : null}

                {playerCard.friendshipStatus === "friends" ? (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        onViewProfile(playerCard.playerTag || playerQuery.trim())
                      }
                      className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
                    >
                      View Profile
                    </button>
                    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200">
                      Already friends
                    </div>
                  </>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyPanel
              title={playerError || "No player selected"}
              copy="Search for a player to see their current relationship state and connect from here."
            />
          )}
        </section>
    </div>

    {friendRequests.length > 0 ? (
      <RosterPanel
        title={`Incoming requests (${friendRequests.length})`}
        emptyCopy="No incoming friend requests right now."
      >
        {friendRequests.map((requester) => (
          <div
            key={requester._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <img
                src={
                  requester.avatar ||
                  requester?.profile?.avatar ||
                  "/profile-pic.png"
                }
                alt={
                  requester.username ||
                  requester?.profile?.username ||
                  "Player"
                }
                className="h-12 w-12 rounded-2xl object-cover"
              />
              <div>
                <p className="font-semibold text-white">
                  {requester.username ||
                    requester?.profile?.username ||
                    "Player"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Wants to connect
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  onViewProfile(
                    requester.playerTag ||
                      requester.profileTag ||
                      requester.profile?.profileTag
                  )
                }
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
              >
                View Profile
              </button>
              <button
                type="button"
                onClick={() => onAcceptRequest(requester._id)}
                className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
              >
                Accept
              </button>
              <button
                type="button"
                onClick={() => onRejectRequest(requester._id)}
                className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/15"
              >
                Reject
              </button>
            </div>
          </div>
        ))}
      </RosterPanel>
    ) : null}

    <div className="grid gap-6 xl:grid-cols-2">
      <RosterPanel title={`Friends (${friends.length})`} emptyCopy="Your friends list will appear here.">
        {friends.map((friend) => (
          <PersonRow
            key={friend._id}
            name={friend.username || friend.profile?.username || "Player"}
            avatar={friend.avatar || friend.profile?.avatar}
            subtitle="Connected player"
            actionLabel="Remove"
            actionIcon={<FiUserMinus />}
            actionTone="danger"
            onAction={() => onRemoveFriend(friend._id)}
            secondaryActionLabel="View Profile"
            onSecondaryAction={() =>
              onViewProfile(friend.playerTag || friend.profile?.profileTag)
            }
          />
        ))}
      </RosterPanel>

      <RosterPanel
        title={`Sent requests (${sentRequests.length})`}
        emptyCopy="Outgoing requests are shown here until they are accepted or cancelled."
      >
        {sentRequests.map((request) => (
          <PersonRow
            key={request._id}
            name={request.username || request.profile?.username || "Player"}
            avatar={request.avatar || request.profile?.avatar}
            subtitle="Pending request"
            actionLabel="Cancel"
            actionIcon={<FiUserMinus />}
            actionTone="danger"
            onAction={() => onCancelRequest(request._id)}
          />
        ))}
      </RosterPanel>
    </div>
  </div>
);

const RosterPanel = ({ title, emptyCopy, children }) => {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);

  return (
    <section className="clan-surface">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
        Social
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      <div className="mt-6 grid gap-3">
        {hasItems ? items : <EmptyPanel title={title} copy={emptyCopy} />}
      </div>
    </section>
  );
};

const PersonRow = ({
  name,
  avatar,
  subtitle,
  actionLabel,
  actionIcon,
  actionTone = "default",
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
    <div className="flex items-center gap-3">
      <img
        src={avatar || "/default-avatar.png"}
        alt={name}
        className="h-12 w-12 rounded-2xl object-cover"
      />
      <div>
        <p className="font-semibold text-white">{name}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {secondaryActionLabel ? (
        <button
          type="button"
          onClick={onSecondaryAction}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
        >
          {secondaryActionLabel}
        </button>
      ) : null}
      <button
        type="button"
        onClick={onAction}
        className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition ${
          actionTone === "danger"
            ? "border border-rose-500/20 bg-rose-500/10 text-rose-200 hover:bg-rose-500/15"
            : "bg-cyan-300 text-slate-950 hover:bg-cyan-200"
        }`}
      >
        {actionIcon}
        {actionLabel}
      </button>
    </div>
  </div>
);

const BookmarkedClanPanel = ({
  bookmarkedClans,
  onToggleBookmark,
  onJoinClan,
  onRequestJoin,
  onCancelJoinRequest,
  onExpireJoinRequest,
  myJoinRequests,
  hasClan,
}) => (
  <section className="clan-surface">
    <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
      Bookmarked Clans
    </p>
    <h2 className="mt-2 text-2xl font-black text-white">Saved for later</h2>

    <div className="mt-6 grid gap-4">
      {bookmarkedClans.length > 0 ? (
        bookmarkedClans.map((clan) => (
          <div
            key={clan._id || clan.clanTag}
            className="rounded-[24px] border border-white/10 bg-black/20 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-bold text-white">{clan.clanName || "Clan"}</p>
                <p className="mt-1 text-sm text-slate-400">{clan.clanTag || "-"}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-500">
                  {clan?.stats?.type || "Open"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
              {!hasClan && clan?.stats?.type !== "Closed" ? (
                clan?.stats?.type === "Invite Only" ? (
                  <ClanJoinRequestAction
                    clanId={String(clan._id)}
                    clanTag={clan.clanTag}
                    request={myJoinRequests[String(clan._id)]}
                    onCancel={onCancelJoinRequest}
                    onExpire={onExpireJoinRequest}
                    onRequest={onRequestJoin}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => onJoinClan(clan.clanTag)}
                    className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
                  >
                    Join Clan
                  </button>
                )
                ) : null}
                <button
                  type="button"
                  onClick={() => onToggleBookmark(clan._id, true)}
                  className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/15"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <EmptyPanel
          title="No bookmarked clans"
          copy="Bookmark clans from the search tab and they will appear here."
        />
      )}
    </div>
  </section>
);

const formatRequestTime = (milliseconds) => {
  const totalSeconds = Math.max(
    0,
    Math.ceil(milliseconds / 1000),
  );
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
};

const ClanJoinRequestAction = ({
  clanId,
  clanTag,
  onCancel,
  onExpire,
  onRequest,
  request,
}) => {
  const [now, setNow] = useState(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const deadline =
    request?.status === "PENDING"
      ? new Date(request.expiresAt).getTime()
      : new Date(request?.retryAt).getTime();

  useEffect(() => {
    if (!request || !Number.isFinite(deadline)) return undefined;

    const timer = window.setInterval(
      () => setNow(Date.now()),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [deadline, request]);

  useEffect(() => {
    if (
      request &&
      Number.isFinite(deadline) &&
      deadline <= now
    ) {
      onExpire(clanId);
    }
  }, [clanId, deadline, now, onExpire, request]);

  const runAction = async (action) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await action();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (request?.status === "PENDING") {
    return (
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-xl border border-amber-300/20 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-100">
          Pending {formatRequestTime(deadline - now)}
        </span>
        <button
          type="button"
          onClick={() => runAction(() => onCancel(clanId))}
          disabled={isSubmitting}
          className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-slate-200 transition hover:border-rose-300/30 hover:text-rose-200 disabled:cursor-wait disabled:opacity-60"
        >
          {isSubmitting ? "Cancelling..." : "Cancel"}
        </button>
      </div>
    );
  }

  if (request?.status === "REJECTED_COOLDOWN") {
    return (
      <button
        type="button"
        disabled
        className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-bold text-slate-400"
      >
        Try again in {formatRequestTime(deadline - now)}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => runAction(() => onRequest(clanTag))}
      disabled={isSubmitting}
      className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:opacity-60"
    >
      {isSubmitting ? "Sending..." : "Request to Join"}
    </button>
  );
};

const MetricCard = ({ label, value }) => (
  <div className="clan-metric">
    <p>{label}</p>
    <strong>{value}</strong>
  </div>
);

const InfoBlock = ({ icon, label, value }) => (
  <div className="clan-info-block">
    <div className="flex items-center gap-2 text-cyan-300">
      {icon}
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
    </div>
    <p className="mt-3 text-lg font-bold text-white">{value}</p>
  </div>
);

const TabButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`clan-tab ${active ? "clan-tab--active" : ""}`}
  >
    {children}
  </button>
);

const ActionButton = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
  >
    {children}
  </button>
);

const EmptyPanel = ({ title, copy }) => (
  <div className="clan-empty">
    <div className="clan-empty__mark">
      <FiShield />
    </div>
    <p className="font-semibold text-white">{title}</p>
    <p className="mt-2 text-sm leading-6 text-slate-400">{copy}</p>
  </div>
);

const PlayerPreviewModal = ({
  player,
  loading,
  playerTag,
  onClose,
  onOpenFullProfile,
}) => (
  <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
    <div className="w-full max-w-2xl rounded-[32px] border border-white/10 bg-slate-950 p-6 shadow-[0_24px_80px_rgba(2,8,23,0.55)]">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-2xl font-black text-white">Player Preview</h3>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white"
        >
          Close
        </button>
      </div>

      {loading ? (
        <p className="mt-6 text-sm text-slate-300">Loading player details...</p>
      ) : !player ? (
        <p className="mt-6 text-sm text-slate-300">
          Unable to load player details right now.
        </p>
      ) : (
        <div className="mt-6 space-y-5">
          <div className="flex items-center gap-4">
            <img
              src={player.avatar || "/profile-pic.png"}
              alt={player.username || "Player"}
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xl font-black text-white">{player.username}</p>
              <p className="text-sm text-slate-400">{player.playerTag || playerTag}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-300/80">
                {player.friendshipStatus || "not_friends"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <InfoBlock label="Friends" value={player.stats?.friends ?? 0} />
            <InfoBlock label="Games" value={player.stats?.linkedGames ?? 0} />
            <InfoBlock
              label="Tournaments"
              value={player.stats?.tournaments ?? 0}
            />
            <InfoBlock
              label="Bookmarks"
              value={player.stats?.bookmarkedClans ?? 0}
            />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onOpenFullProfile(player.playerTag || playerTag)}
              className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
            >
              Open Full Profile
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);

const entityReferenceType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({ _id: PropTypes.string }),
]);

const socialPlayerType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  playerTag: PropTypes.string,
  profile: PropTypes.shape({
    avatar: PropTypes.string,
    profileTag: PropTypes.string,
    username: PropTypes.string,
  }),
  username: PropTypes.string,
});

const clanMemberType = PropTypes.shape({
  clanMemberName: PropTypes.string,
  clanMemberTag: PropTypes.string,
  joinedAt: PropTypes.string,
  role: PropTypes.string,
  user: entityReferenceType.isRequired,
});

const clanJoinRequestType = PropTypes.shape({
  playerName: PropTypes.string,
  playerTag: PropTypes.string,
  requestedAt: PropTypes.string,
  user: entityReferenceType.isRequired,
});

const applicantJoinRequestType = PropTypes.shape({
  clanId: PropTypes.string.isRequired,
  expiresAt: PropTypes.string,
  resourceVersion: PropTypes.number.isRequired,
  retryAt: PropTypes.string,
  status: PropTypes.oneOf(["PENDING", "REJECTED_COOLDOWN"]).isRequired,
});

const clanType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  badge: PropTypes.string,
  bio: PropTypes.string,
  clanName: PropTypes.string.isRequired,
  clanTag: PropTypes.string.isRequired,
  clanType: PropTypes.string,
  createdAt: PropTypes.string,
  leader: PropTypes.shape({
    leaderName: PropTypes.string,
  }),
  location: PropTypes.string,
  joinRequests: PropTypes.arrayOf(clanJoinRequestType),
  memberCount: PropTypes.number,
  members: PropTypes.arrayOf(clanMemberType),
  stats: PropTypes.shape({
    maxMembers: PropTypes.number,
    type: PropTypes.string,
  }),
});

const teamPlayerType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  profile: PropTypes.shape({
    avatar: PropTypes.string,
    username: PropTypes.string,
  }),
  profileTag: PropTypes.string,
});

const teamType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  createdBy: entityReferenceType.isRequired,
  game: PropTypes.string.isRequired,
  mode: PropTypes.string.isRequired,
  pendingInvites: PropTypes.arrayOf(teamPlayerType).isRequired,
  players: PropTypes.arrayOf(teamPlayerType).isRequired,
  status: PropTypes.oneOf(["forming", "ready"]).isRequired,
  teamName: PropTypes.string.isRequired,
});

CreateClanPanel.propTypes = {
  isCreatingClan: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ClanSettingsPanel.propTypes = {
  clanData: clanType.isRequired,
  isSaving: PropTypes.bool.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

ClanOverviewPanel.propTypes = {
  bookmarkedClanIds: PropTypes.instanceOf(Set).isRequired,
  changingMemberId: PropTypes.string.isRequired,
  clanData: clanType,
  currentUserId: PropTypes.string,
  hasClan: PropTypes.bool.isRequired,
  onCopyTag: PropTypes.func.isRequired,
  onLeaveClan: PropTypes.func.isRequired,
  onKickMember: PropTypes.func.isRequired,
  onMemberRoleChange: PropTypes.func.isRequired,
  onReviewJoinRequest: PropTypes.func.isRequired,
  onToggleBookmark: PropTypes.func.isRequired,
};

ClanMemberRow.propTypes = {
  actionsOpen: PropTypes.bool.isRequired,
  actorRole: PropTypes.string.isRequired,
  busy: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string,
  index: PropTypes.number.isRequired,
  member: clanMemberType.isRequired,
  onToggleActions: PropTypes.func.isRequired,
};

ClanMemberActionsDialog.propTypes = {
  actorRole: PropTypes.string.isRequired,
  busy: PropTypes.bool.isRequired,
  member: clanMemberType.isRequired,
  onClose: PropTypes.func.isRequired,
  onDemote: PropTypes.func.isRequired,
  onKick: PropTypes.func.isRequired,
  onPromote: PropTypes.func.isRequired,
};

KickClanMemberDialog.propTypes = {
  busy: PropTypes.bool.isRequired,
  member: clanMemberType.isRequired,
  onCancel: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
};

TeamPanel.propTypes = {
  clanMembers: PropTypes.arrayOf(clanMemberType).isRequired,
  currentUserId: PropTypes.string,
  isBusy: PropTypes.bool.isRequired,
  isLoading: PropTypes.bool.isRequired,
  onAcceptInvitation: PropTypes.func.isRequired,
  onCreateTeam: PropTypes.func.isRequired,
  onDeclineInvitation: PropTypes.func.isRequired,
  onDisbandTeam: PropTypes.func.isRequired,
  onInviteMember: PropTypes.func.isRequired,
  onLeaveTeam: PropTypes.func.isRequired,
  onRemoveMember: PropTypes.func.isRequired,
  teams: PropTypes.arrayOf(teamType).isRequired,
};

SearchClanPanel.propTypes = {
  bookmarkedClanIds: PropTypes.instanceOf(Set).isRequired,
  clanError: PropTypes.string.isRequired,
  hasClan: PropTypes.bool.isRequired,
  myJoinRequests: PropTypes.objectOf(applicantJoinRequestType).isRequired,
  onCancelJoinRequest: PropTypes.func.isRequired,
  onExpireJoinRequest: PropTypes.func.isRequired,
  onJoinClan: PropTypes.func.isRequired,
  onRequestJoin: PropTypes.func.isRequired,
  onSearch: PropTypes.func.isRequired,
  onToggleBookmark: PropTypes.func.isRequired,
  result: clanType,
  searchingClan: PropTypes.bool.isRequired,
  searchTag: PropTypes.string.isRequired,
  setSearchTag: PropTypes.func.isRequired,
  suggestions: PropTypes.arrayOf(clanType).isRequired,
  suggestionsLoading: PropTypes.bool.isRequired,
};

ClanSuggestionCard.propTypes = {
  bookmarked: PropTypes.bool.isRequired,
  clan: clanType.isRequired,
  hasClan: PropTypes.bool.isRequired,
  onCancelJoinRequest: PropTypes.func.isRequired,
  onExpireJoinRequest: PropTypes.func.isRequired,
  onJoinClan: PropTypes.func.isRequired,
  onRequestJoin: PropTypes.func.isRequired,
  onToggleBookmark: PropTypes.func.isRequired,
  request: applicantJoinRequestType,
};

SocialPanel.propTypes = {
  currentUserId: PropTypes.string,
  friendRequests: PropTypes.arrayOf(socialPlayerType).isRequired,
  friends: PropTypes.arrayOf(socialPlayerType).isRequired,
  onAcceptRequest: PropTypes.func.isRequired,
  onAddFriend: PropTypes.func.isRequired,
  onCancelRequest: PropTypes.func.isRequired,
  onRejectRequest: PropTypes.func.isRequired,
  onRemoveFriend: PropTypes.func.isRequired,
  onSearchPlayer: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
  playerCard: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    avatar: PropTypes.string,
    friendshipStatus: PropTypes.string.isRequired,
    playerTag: PropTypes.string,
    username: PropTypes.string.isRequired,
  }),
  playerError: PropTypes.string.isRequired,
  playerQuery: PropTypes.string.isRequired,
  searchingPlayer: PropTypes.bool.isRequired,
  sentRequests: PropTypes.arrayOf(socialPlayerType).isRequired,
  setPlayerQuery: PropTypes.func.isRequired,
};

RosterPanel.propTypes = {
  children: PropTypes.node,
  emptyCopy: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

PersonRow.propTypes = {
  actionIcon: PropTypes.node,
  actionLabel: PropTypes.string.isRequired,
  actionTone: PropTypes.string,
  avatar: PropTypes.string,
  name: PropTypes.string.isRequired,
  onAction: PropTypes.func.isRequired,
  onSecondaryAction: PropTypes.func,
  secondaryActionLabel: PropTypes.string,
  subtitle: PropTypes.string.isRequired,
};

BookmarkedClanPanel.propTypes = {
  bookmarkedClans: PropTypes.arrayOf(clanType).isRequired,
  hasClan: PropTypes.bool.isRequired,
  myJoinRequests: PropTypes.objectOf(applicantJoinRequestType).isRequired,
  onCancelJoinRequest: PropTypes.func.isRequired,
  onExpireJoinRequest: PropTypes.func.isRequired,
  onJoinClan: PropTypes.func.isRequired,
  onRequestJoin: PropTypes.func.isRequired,
  onToggleBookmark: PropTypes.func.isRequired,
};

ClanJoinRequestAction.propTypes = {
  clanId: PropTypes.string.isRequired,
  clanTag: PropTypes.string.isRequired,
  onCancel: PropTypes.func.isRequired,
  onExpire: PropTypes.func.isRequired,
  onRequest: PropTypes.func.isRequired,
  request: applicantJoinRequestType,
};

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

InfoBlock.propTypes = {
  icon: PropTypes.node,
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

TabButton.propTypes = {
  active: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

ActionButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

EmptyPanel.propTypes = {
  copy: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

PlayerPreviewModal.propTypes = {
  loading: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onOpenFullProfile: PropTypes.func.isRequired,
  player: PropTypes.shape({
    avatar: PropTypes.string,
    friendshipStatus: PropTypes.string,
    playerTag: PropTypes.string,
    stats: PropTypes.shape({
      bookmarkedClans: PropTypes.number,
      friends: PropTypes.number,
      linkedGames: PropTypes.number,
      tournaments: PropTypes.number,
    }),
    username: PropTypes.string,
  }),
  playerTag: PropTypes.string.isRequired,
};

export default Clan;
