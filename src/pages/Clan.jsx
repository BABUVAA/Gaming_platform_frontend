import { useEffect, useMemo, useState } from "react";
import { Form } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import api from "../api/axios-api";
import {
  FiBookmark,
  FiCopy,
  FiMapPin,
  FiPlusCircle,
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
import {
  createClan,
  fetchUserClan,
  joinClan,
  leaveClan,
  searchClan,
} from "../store/clanSlice";
import {
  profile_data_update,
  searchPlayer,
  user_profile,
} from "../store/authSlice";

const Clan = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile } = useSelector((store) => store.auth);
  const { userClanData, searchClanData } = useSelector((store) => store.clan);
  const { globalLoading } = useSelector((store) => store.loading);
  const [activeTab, setActiveTab] = useState(profile?.clan ? "myClan" : "createClan");
  const [socialTab, setSocialTab] = useState("friends");
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

  const clanData = userClanData?.data || null;
  const hasClan = Boolean(profile?.clan || clanData);

  useEffect(() => {
    setActiveTab(hasClan ? "myClan" : "createClan");
  }, [hasClan]);

  useEffect(() => {
    if (hasClan && !userClanData) {
      dispatch(fetchUserClan());
    }
  }, [dispatch, hasClan, userClanData]);

  const playerProfile = profile?.profile || {};
  const friends = playerProfile.friends || [];
  const friendRequests = playerProfile.friendRequests || [];
  const sentRequests = playerProfile.sentRequests || [];
  const bookmarkedClanIds = new Set(
    (playerProfile.bookmarkedClans || []).map((clan) => String(clan._id || clan))
  );
  const bookmarkedClans = (playerProfile.bookmarkedClans || []).filter(
    (clan) => typeof clan === "object" && clan !== null
  );

  const overviewStats = useMemo(
    () => [
      { label: "Clan Status", value: clanData ? "Enlisted" : "Open slot" },
      { label: "Friends", value: friends.length || 0 },
      { label: "Requests", value: friendRequests.length || 0 },
      { label: "Bookmarks", value: bookmarkedClanIds.size || 0 },
    ],
    [bookmarkedClanIds.size, clanData, friendRequests.length, friends.length]
  );

  const handleCreateClan = async (event) => {
    event.preventDefault();
    setIsCreatingClan(true);
    try {
      await dispatch(createClan(formData(event))).unwrap();
      await dispatch(user_profile());
      await dispatch(fetchUserClan());
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
      await dispatch(user_profile());
      await dispatch(fetchUserClan());
      setActiveTab("myClan");
    } catch (error) {
      console.error("Join clan failed:", error);
    }
  };

  const handleLeaveClan = async () => {
    try {
      await dispatch(leaveClan()).unwrap();
      await dispatch(user_profile());
      setActiveTab("createClan");
    } catch (error) {
      console.error("Leave clan failed:", error);
    }
  };

  const toggleBookmark = async (clanId, isBookmarked) => {
    if (!clanId) return;
    try {
      await dispatch(
        profile_data_update({
          action: isBookmarked ? "remove" : "add",
          field: "profile.bookmarkedClans",
          data: clanId,
        })
      ).unwrap();
      await dispatch(user_profile());
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

  const syncSocialState = async (updates) => {
    await Promise.all(updates.map((payload) => dispatch(profile_data_update(payload)).unwrap()));
    await dispatch(user_profile());
  };

  const handleAddFriend = async (friendId) => {
    if (!friendId) return;
    try {
      await syncSocialState([
        {
          action: "add",
          field: "profile.sentRequests",
          data: friendId,
        },
        {
          action: "add",
          field: "profile.friendRequests",
          data: profile._id,
          playerId: friendId,
        },
      ]);
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
      await syncSocialState([
        {
          action: "remove",
          field: "profile.sentRequests",
          data: friendId,
        },
        {
          action: "remove",
          field: "profile.friendRequests",
          data: profile._id,
          playerId: friendId,
        },
      ]);
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
      await syncSocialState([
        {
          action: "remove",
          field: "profile.friendRequests",
          data: friendId,
        },
        {
          action: "remove",
          field: "profile.sentRequests",
          data: profile._id,
          playerId: friendId,
        },
        {
          action: "add",
          field: "profile.friends",
          data: friendId,
        },
        {
          action: "add",
          field: "profile.friends",
          data: profile._id,
          playerId: friendId,
        },
      ]);
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
      await syncSocialState([
        {
          action: "remove",
          field: "profile.friendRequests",
          data: requesterId,
        },
        {
          action: "remove",
          field: "profile.sentRequests",
          data: profile._id,
          playerId: requesterId,
        },
      ]);
    } catch (error) {
      console.error("Reject request failed:", error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    if (!friendId) return;
    try {
      await syncSocialState([
        {
          action: "remove",
          field: "profile.friends",
          data: friendId,
        },
        {
          action: "remove",
          field: "profile.friends",
          data: profile._id,
          playerId: friendId,
        },
      ]);
    } catch (error) {
      console.error("Remove friend failed:", error);
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

  if (globalLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_26%),linear-gradient(180deg,_rgba(8,15,28,0.96),_rgba(2,6,17,0.98))] p-6 shadow-[0_24px_70px_rgba(2,8,23,0.45)] md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
          Clan Command
        </p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">
              Build squads, find teammates, and manage clan identity.
            </h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300">
              This is your social and roster hub for the platform. Create a clan,
              manage your current group, search for other communities, and keep
              friend requests moving without leaving the competition shell.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {overviewStats.map((stat) => (
              <MetricCard key={stat.label} label={stat.label} value={stat.value} />
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
        <div className="flex flex-wrap gap-2">
          {[
            ...(hasClan
              ? [
                  {
                    id: "myClan",
                    label: "My Clan",
                  },
                ]
              : [{ id: "createClan", label: "Create Clan" }]),
            { id: "bookmarks", label: `Bookmarks (${bookmarkedClans.length})` },
            { id: "searchClan", label: "Search Clan" },
            { id: "social", label: "Social" },
          ].map((tab) => (
            <TabButton
              key={tab.id}
              active={activeTab === tab.id}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </TabButton>
          ))}
        </div>
      </section>

      {hasClan && activeTab === "myClan" ? (
        <ClanOverviewPanel
          clanData={clanData}
          hasClan={hasClan}
          bookmarkedClanIds={bookmarkedClanIds}
          onToggleBookmark={toggleBookmark}
          onLeaveClan={handleLeaveClan}
          onCopyTag={copyTag}
        />
      ) : null}

      {!hasClan && activeTab === "createClan" ? (
        <CreateClanPanel
          onSubmit={handleCreateClan}
          isCreatingClan={isCreatingClan}
        />
      ) : null}

      {activeTab === "bookmarks" ? (
        <BookmarkedClanPanel
          bookmarkedClans={bookmarkedClans}
          onToggleBookmark={toggleBookmark}
          onJoinClan={handleJoinClan}
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
          onToggleBookmark={toggleBookmark}
          bookmarkedClanIds={bookmarkedClanIds}
        />
      ) : null}

      {activeTab === "social" ? (
        <SocialPanel
          activeTab={socialTab}
          setActiveTab={setSocialTab}
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
          currentUserId={profile?._id}
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
  <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
    <div className="mb-6">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
        New Clan
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">Create your clan</h2>
      <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">
        Start with the basics. We can layer in richer roster controls and
        tournament-specific lineups on top of this foundation.
      </p>
    </div>

    <Form onSubmit={onSubmit} className="grid gap-5 xl:grid-cols-2">
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

const ClanOverviewPanel = ({
  clanData,
  hasClan,
  bookmarkedClanIds,
  onToggleBookmark,
  onLeaveClan,
  onCopyTag,
}) => {
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

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
      <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
              Active Clan
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">
              {clanData.clanName}
            </h2>
            <button
              type="button"
              onClick={() => onCopyTag(clanData.clanTag)}
              className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
            >
              <FiCopy />
              {clanData.clanTag}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onToggleBookmark(clanData._id, isBookmarked)}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
            >
              {isBookmarked ? <FiBookmark /> : <FaRegBookmark />}
              {isBookmarked ? "Bookmarked" : "Bookmark"}
            </button>
            <button
              type="button"
              onClick={onLeaveClan}
              className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/15"
            >
              Leave Clan
            </button>
          </div>
        </div>

        <p className="mt-6 text-sm leading-7 text-slate-300">
          {clanData.bio || "No clan description has been added yet."}
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoBlock icon={<FiMapPin />} label="Location" value={clanData.location || "Not set"} />
          <InfoBlock
            icon={<FaCrown />}
            label="Leader"
            value={clanData?.leader?.leaderName || "Unknown"}
          />
          <InfoBlock
            icon={<FiUsers />}
            label="Members"
            value={String(clanData?.members?.length || 0)}
          />
          <InfoBlock
            icon={<FiShield />}
            label="Created"
            value={new Date(clanData.createdAt).toLocaleDateString()}
          />
        </div>
      </section>

      <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
          Member Roster
        </p>
        <h2 className="mt-2 text-2xl font-black text-white">Current lineup</h2>

        <div className="mt-6 grid gap-3">
          {(clanData.members || []).map((member, index) => (
            <div
              key={`${member.user}-${index}`}
              className="flex items-center justify-between rounded-[24px] border border-white/10 bg-black/20 px-4 py-4"
            >
              <div>
                <p className="font-semibold text-white">
                  {member.clanMemberName || "Player"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  {member.role}
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">
                Member
              </span>
            </div>
          ))}
        </div>
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
  onToggleBookmark,
  bookmarkedClanIds,
}) => {
  const isBookmarked = result ? bookmarkedClanIds.has(String(result._id)) : false;

  return (
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
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

      <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleBookmark(result._id, isBookmarked)}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-200"
                >
                  {isBookmarked ? "Bookmarked" : "Bookmark"}
                </button>
                <button
                  type="button"
                  onClick={() => onJoinClan(result.clanTag)}
                  className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
                >
                  Join Clan
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <InfoBlock
                icon={<FiUsers />}
                label="Members"
                value={String(result?.members?.length || 0)}
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
  );
};

const SocialPanel = ({
  activeTab,
  setActiveTab,
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
    <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-4 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
      <div className="flex flex-wrap gap-2">
        {[
          { id: "friends", label: `Friends (${friends.length})` },
          { id: "friendRequests", label: `Requests (${friendRequests.length})` },
          { id: "searchPlayers", label: "Search Players" },
        ].map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </TabButton>
        ))}
      </div>
    </section>

    {activeTab === "friends" ? (
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <RosterPanel title="Friends" emptyCopy="Your friends list will appear here.">
          {friends.map((friend) => (
            <PersonRow
              key={friend._id}
              name={friend.profile.username}
              avatar={friend.profile.avatar}
              subtitle="Connected player"
              actionLabel="Remove"
              actionIcon={<FiUserMinus />}
              actionTone="danger"
              onAction={() => onRemoveFriend(friend._id)}
              secondaryActionLabel="View Profile"
              onSecondaryAction={() =>
                onViewProfile(friend.profileTag || friend.profile?.profileTag)
              }
            />
          ))}
        </RosterPanel>

        <RosterPanel
          title="Sent requests"
          emptyCopy="Outgoing requests are shown here until they are accepted or cancelled."
        >
          {sentRequests.map((request) => (
            <PersonRow
              key={request._id}
              name={request.profile.username}
              avatar={request.profile.avatar}
              subtitle="Pending request"
              actionLabel="Cancel"
              actionIcon={<FiUserMinus />}
              actionTone="danger"
              onAction={() => onCancelRequest(request._id)}
            />
          ))}
        </RosterPanel>
      </div>
    ) : null}

    {activeTab === "friendRequests" ? (
      <RosterPanel
        title="Incoming requests"
        emptyCopy="No incoming friend requests right now."
      >
        {friendRequests.map((requester) => (
          <div
            key={requester._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4"
          >
            <div className="flex items-center gap-3">
              <img
                src={requester?.profile?.avatar || "/profile-pic.png"}
                alt={requester?.profile?.username || "Player"}
                className="h-12 w-12 rounded-2xl object-cover"
              />
              <div>
                <p className="font-semibold text-white">
                  {requester?.profile?.username || "Player"}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                  Wants to connect
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  onViewProfile(requester.profileTag || requester.profile?.profileTag)
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

    {activeTab === "searchPlayers" ? (
      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
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

        <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
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
    ) : null}
  </div>
);

const RosterPanel = ({ title, emptyCopy, children }) => {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);

  return (
    <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
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
    <div className="flex items-center gap-2">
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
  hasClan,
}) => (
  <section className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
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
              <div className="flex items-center gap-2">
                {!hasClan ? (
                  <button
                    type="button"
                    onClick={() => onJoinClan(clan.clanTag)}
                    className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black uppercase tracking-[0.14em] text-slate-950 transition hover:bg-cyan-200"
                  >
                    Join Clan
                  </button>
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

const MetricCard = ({ label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <p className="mt-3 text-lg font-black text-white">{value}</p>
  </div>
);

const InfoBlock = ({ icon, label, value }) => (
  <div className="rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
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
    className={`rounded-full px-4 py-3 text-sm font-bold transition ${
      active
        ? "bg-cyan-300 text-slate-950"
        : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
    }`}
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
  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-5 py-6">
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

export default Clan;
