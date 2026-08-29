import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Form, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  FiBookmark,
  FiEdit3,
  FiMapPin,
  FiSearch,
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
import { applyAvatarFallback } from "../utils/imageFallbacks";
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
  fetchPublicPlayerProfile,
} from "../store/slices/playerSlice";

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
  const { globalLoading } = useSelector((store) => store.loading);
  const [activeTab, setActiveTab] = useState("myClan");
  const [isCreatingClan, setIsCreatingClan] = useState(false);
  const [searchTag, setSearchTag] = useState("");
  const [searchingClan, setSearchingClan] = useState(false);
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

  const bookmarkedClanIds = new Set(
    bookmarkedClans.map((clan) => String(clan._id)),
  );

  const overviewStats = useMemo(
    () => [
      { label: "Clan", value: clanData ? "Joined" : "Not joined" },
      { label: "Saved", value: bookmarkedClans.length || 0 },
      { label: "Requests", value: Object.keys(myJoinRequests).length || 0 },
    ],
    [bookmarkedClans.length, clanData, myJoinRequests]
  );

  // Keeping navigation metadata together makes new clan areas easy to add
  // without duplicating button markup or visual rules.
  const navigationTabs = [
    ...(hasClan
      ? [
          { id: "myClan", label: "My Clan", icon: <FiShield /> },
        ]
      : [{ id: "createClan", label: "Create Clan", icon: <FiShield /> }]),
    {
      id: "bookmarks",
      label: "Saved",
      count: bookmarkedClans.length,
      icon: <FiBookmark />,
    },
    { id: "searchClan", label: "Discover", icon: <FiSearch /> },
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
      const player = await dispatch(fetchPublicPlayerProfile(tag)).unwrap();
      setPreviewPlayer(player || null);
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
    <div className="clan-page space-y-3 sm:space-y-5">
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
          onEditSettings={
            canEditClanSettings ? () => setActiveTab("settings") : null
          }
          currentUserId={currentUserId}
          changingMemberId={changingMemberId}
          onMemberRoleChange={handleMemberRoleChange}
          onKickMember={setKickCandidate}
          onReviewJoinRequest={handleReviewJoinRequest}
          onViewProfile={openPlayerPreview}
        />
      ) : null}

      {!hasClan && activeTab === "createClan" ? (
        <CreateClanPanel
          onSubmit={handleCreateClan}
          isCreatingClan={isCreatingClan}
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
  onEditSettings,
  currentUserId,
  changingMemberId,
  onMemberRoleChange,
  onKickMember,
  onReviewJoinRequest,
  onViewProfile,
}) => {
  const [selectedMember, setSelectedMember] = useState(null);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

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
  const joinRequests = clanData.joinRequests || [];
  const clanBadgeSource =
    !clanData.badge || clanData.badge === "clan-badge.png"
      ? "/clan-badge.png"
      : clanData.badge;
  const description = clanData.bio || "No clan description has been added yet.";
  const canCollapseDescription = description.length > 110;

  // A single controlled member menu prevents several destructive action sets
  // from remaining open while the leader reviews the roster.
  const toggleMemberActions = (member) => {
    const memberId = getEntityId(member.user);
    setSelectedMember((current) =>
      getEntityId(current?.user) === memberId ? null : member,
    );
  };

  return (
    <div className="space-y-3 sm:space-y-5">
      <section className="clan-surface clan-profile-card">
        <button
          aria-label={isBookmarked ? "Remove clan bookmark" : "Bookmark clan"}
          className={`clan-bookmark-strip ${isBookmarked ? "clan-bookmark-strip--active" : ""}`}
          onClick={() => onToggleBookmark(clanData._id, isBookmarked)}
          title={isBookmarked ? "Remove bookmark" : "Bookmark clan"}
          type="button"
        >
          {isBookmarked ? <FiBookmark /> : <FaRegBookmark />}
        </button>

        <div className="clan-profile-card__main">
          <img
            src={clanBadgeSource}
            alt=""
            className="clan-profile-card__badge"
          />
          <div className="min-w-0 flex-1">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="min-w-0 truncate text-2xl font-black text-white sm:text-3xl md:text-4xl">
                {clanData.clanName}
              </h2>
              <button
                className="shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2 py-0.5 text-[10px] font-black text-cyan-200 transition hover:bg-cyan-300/15"
                onClick={() => onCopyTag(clanData.clanTag)}
                title="Copy clan tag"
                type="button"
              >
                {clanData.clanTag}
              </button>
              {onEditSettings ? (
                <button
                  aria-label="Edit clan settings"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-200"
                  onClick={onEditSettings}
                  title="Edit clan settings"
                  type="button"
                >
                  <FiEdit3 aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <p
              className={`clan-description ${canCollapseDescription && !descriptionExpanded ? "clan-description--collapsed" : ""}`}
            >
              {description}
            </p>
            {canCollapseDescription ? (
              <button
                aria-expanded={descriptionExpanded}
                className="clan-description-toggle"
                onClick={() => setDescriptionExpanded((current) => !current)}
                type="button"
              >
                {descriptionExpanded ? "Show less" : "Read more"}
              </button>
            ) : null}
          </div>

          {currentRole !== "LEADER" ? (
            <div className="clan-profile-card__actions">
              <button
                type="button"
                onClick={onLeaveClan}
                className="clan-danger-action"
              >
                Leave
              </button>
            </div>
          ) : null}
        </div>

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
                      disabled={!request.playerTag}
                      onClick={() => onViewProfile(request.playerTag)}
                      type="button"
                    >
                      Profile
                    </button>
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
          <h2 className="text-xl font-black text-white sm:text-2xl">Members</h2>
        </div>

        <div className="clan-roster__list">
          <div className="clan-roster__columns" aria-hidden="true">
            <span>#</span>
            <span>Player</span>
            <span>Role</span>
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
              onViewProfile={onViewProfile}
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
  onViewProfile,
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
      </button>
      <span className={`clan-role clan-role--${member.role.toLowerCase()}`}>
        {member.role === "LEADER" ? <FaCrown /> : <FiShield />}
        {formatClanRole(member.role)}
      </span>
      <button
        className="clan-member-row__profile"
        disabled={!member.clanMemberTag}
        onClick={() => onViewProfile(member.clanMemberTag)}
        type="button"
      >
        Profile
      </button>
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

const suggestTeamSize = (mode) => {
  const normalized = String(mode || "").toLowerCase();
  if (normalized === "duo") return 2;
  if (normalized === "squad") return 4;
  const versusSize = normalized.match(/^(\d+)v\d+$/)?.[1];
  return versusSize ? Number(versusSize) : 2;
};

const getEntityId = (entity) => String(entity?._id || entity || "");

export const TeamPanel = ({
  catalogGames,
  inviteCandidates,
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
    gameId: "",
    mode: "",
    teamName: "",
    teamSize: 2,
  });
  const [inviteSelections, setInviteSelections] = useState({});
  const selectedGame = catalogGames.find(
    (game) => game._id === draft.gameId,
  );

  useEffect(() => {
    if (catalogGames.length === 0) return;
    const currentGame = catalogGames.find(
      (game) => game._id === draft.gameId,
    );
    if (currentGame?.supportedModes?.includes(draft.mode)) return;

    const game = currentGame || catalogGames[0];
    const mode = game.supportedModes?.[0] || "";
    setDraft((current) => ({
      ...current,
      gameId: game._id,
      mode,
      teamSize: suggestTeamSize(mode),
    }));
  }, [catalogGames, draft.gameId, draft.mode]);

  const updateDraft = (field, value) => {
    setDraft((current) => ({
      ...current,
      [field]: value,
      ...(field === "gameId"
        ? (() => {
            const game = catalogGames.find((item) => item._id === value);
            const mode = game?.supportedModes?.[0] || "";
            return { mode, teamSize: suggestTeamSize(mode) };
          })()
        : field === "mode"
          ? { teamSize: suggestTeamSize(value) }
          : {}),
    }));
  };

  const submitTeam = async (event) => {
    event.preventDefault();
    if (!draft.teamName.trim()) return;

    await onCreateTeam({
      ...draft,
      teamName: draft.teamName.trim(),
      teamSize: Number(draft.teamSize),
    });
    setDraft((current) => ({ ...current, teamName: "" }));
  };

  if (isLoading) {
    return (
      <EmptyPanel
        title="Loading teams"
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
          Create a lineup
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-400">
          Create the roster first, then invite friends. A team becomes
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
              disabled={catalogGames.length === 0}
              onChange={(event) => updateDraft("gameId", event.target.value)}
              value={draft.gameId}
            >
              {catalogGames.length === 0 ? (
                <option value="">No active games available</option>
              ) : null}
              {catalogGames.map((game) => (
                <option key={game._id} value={game._id}>
                  {game.name}
                </option>
              ))}
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
              {(selectedGame?.supportedModes || []).map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
          </label>

          <Input
            label="Players per team"
            max="100"
            min="2"
            name="teamSize"
            onChange={(event) => updateDraft("teamSize", event.target.value)}
            required
            type="number"
            value={draft.teamSize}
          />

          <Button
            className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-cyan-200"
            disabled={!draft.gameId || !draft.mode}
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
            title="No teams yet"
            copy="Create a lineup, then invite friends you want beside you."
          />
        ) : (
          teams.map((team) => {
            const captainId = getEntityId(team.createdBy);
            const isCaptain = captainId === String(currentUserId);
            const acceptedIds = new Set(team.players.map(getEntityId));
            const pendingIds = new Set(team.pendingInvites.map(getEntityId));
            const hasAccepted = acceptedIds.has(String(currentUserId));
            const hasPendingInvite = pendingIds.has(String(currentUserId));
            const availableMembers = inviteCandidates.filter((member) => {
              const memberId = getEntityId(member);
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
                      {team.gameName || team.gameKey || team.game} {team.mode}
                      {team.teamSize ? ` · ${team.teamSize} players` : ""}
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
                      <option value="">Choose player</option>
                      {availableMembers.map((member) => (
                        <option
                          key={getEntityId(member)}
                          value={getEntityId(member)}
                        >
                          {member.username || member.profile?.username || member.playerTag || "Player"}
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
                      Team roster
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
}) => {
  const identity = player?.identity || player || {};
  const worth = player?.worth || {};
  const gameCount = Array.isArray(player?.verifiedGames)
    ? player.verifiedGames.length
    : player?.stats?.linkedGames ?? 0;

  return (
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
              src={identity.avatar || "/profile-pic.png"}
              onError={applyAvatarFallback}
              alt={identity.username || "Player"}
              className="h-16 w-16 rounded-2xl object-cover"
            />
            <div>
              <p className="text-xl font-black text-white">{identity.username || "Player"}</p>
              <p className="text-sm text-slate-400">{identity.playerTag || playerTag}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.16em] text-cyan-300/80">
                {player.friendshipStatus || "not_friends"}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <InfoBlock label="Played" value={worth.competitionsCompleted ?? 0} />
            <InfoBlock label="Wins" value={worth.wins ?? 0} />
            <InfoBlock label="Podiums" value={worth.podiums ?? 0} />
            <InfoBlock label="Games" value={gameCount} />
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => onOpenFullProfile(identity.playerTag || playerTag)}
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
};

const entityReferenceType = PropTypes.oneOfType([
  PropTypes.string,
  PropTypes.shape({ _id: PropTypes.string }),
]);

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
  game: PropTypes.string,
  gameKey: PropTypes.string,
  gameName: PropTypes.string,
  mode: PropTypes.string.isRequired,
  pendingInvites: PropTypes.arrayOf(teamPlayerType).isRequired,
  players: PropTypes.arrayOf(teamPlayerType).isRequired,
  status: PropTypes.oneOf(["forming", "ready"]).isRequired,
  teamName: PropTypes.string.isRequired,
  teamSize: PropTypes.number,
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
  onEditSettings: PropTypes.func,
  onLeaveClan: PropTypes.func.isRequired,
  onKickMember: PropTypes.func.isRequired,
  onMemberRoleChange: PropTypes.func.isRequired,
  onReviewJoinRequest: PropTypes.func.isRequired,
  onToggleBookmark: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
};

ClanMemberRow.propTypes = {
  actionsOpen: PropTypes.bool.isRequired,
  actorRole: PropTypes.string.isRequired,
  busy: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string,
  index: PropTypes.number.isRequired,
  member: clanMemberType.isRequired,
  onToggleActions: PropTypes.func.isRequired,
  onViewProfile: PropTypes.func.isRequired,
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
  catalogGames: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      supportedModes: PropTypes.arrayOf(PropTypes.string).isRequired,
    }),
  ).isRequired,
  inviteCandidates: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      playerTag: PropTypes.string,
      username: PropTypes.string,
    }),
  ).isRequired,
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
    identity: PropTypes.object,
    playerTag: PropTypes.string,
    stats: PropTypes.shape({
      bookmarkedClans: PropTypes.number,
      friends: PropTypes.number,
      linkedGames: PropTypes.number,
      tournaments: PropTypes.number,
    }),
    username: PropTypes.string,
    verifiedGames: PropTypes.array,
    worth: PropTypes.object,
  }),
  playerTag: PropTypes.string.isRequired,
};

export default Clan;
