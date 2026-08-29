import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  FiClock,
  FiRefreshCw,
  FiSearch,
  FiUserMinus,
  FiUserPlus,
  FiUsers,
} from "react-icons/fi";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { ROUTES } from "../routes/routeConstants";
import { searchPlayer } from "../store/slices/playerSlice";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  declineFriendRequest,
  fetchSocialConnections,
  removeFriend,
  sendFriendRequest,
} from "../store/slices/socialSlice";
import { applyAvatarFallback } from "../utils/imageFallbacks";

const resolvePlayerName = (player) =>
  player?.username || player?.profile?.username || "Player";

const resolvePlayerAvatar = (player) =>
  player?.avatar || player?.profile?.avatar || "/profile-pic.png";

const resolvePlayerTag = (player) =>
  player?.playerTag || player?.profileTag || player?.profile?.profileTag || "";

const Friends = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { summary } = useSelector((store) => store.player);
  const {
    connections,
    connectionsStatus,
    mutationStatus,
  } = useSelector((store) => store.social);
  const [playerQuery, setPlayerQuery] = useState("");
  const [playerCard, setPlayerCard] = useState(null);
  const [playerError, setPlayerError] = useState("");
  const [searchingPlayer, setSearchingPlayer] = useState(false);
  const [activeList, setActiveList] = useState("friends");

  const friends = connections?.friends || [];
  const incomingRequests = connections?.incomingRequests || [];
  const outgoingRequests = connections?.outgoingRequests || [];
  const currentUserId = String(summary?.userId || "");
  const isMutating = mutationStatus === "loading";

  useEffect(() => {
    if (connectionsStatus === "idle") {
      dispatch(fetchSocialConnections());
    }
  }, [connectionsStatus, dispatch]);

  const openProfile = (player) => {
    const playerTag = resolvePlayerTag(player);
    if (!playerTag) return;
    navigate(`${ROUTES.PROFILE}?playerTag=${encodeURIComponent(playerTag)}`);
  };

  const refreshConnections = () => dispatch(fetchSocialConnections()).unwrap();

  const runSocialMutation = async (operation, nextSearchStatus) => {
    try {
      await dispatch(operation).unwrap();
      await refreshConnections();
      if (nextSearchStatus) {
        setPlayerCard((current) =>
          current ? { ...current, friendshipStatus: nextSearchStatus } : current,
        );
      }
    } catch (error) {
      console.error("Friend action failed:", error);
    }
  };

  const handlePlayerSearch = async (event) => {
    event.preventDefault();
    const playerTag = playerQuery.trim();
    if (!playerTag) return;

    setSearchingPlayer(true);
    setPlayerError("");
    setPlayerCard(null);
    try {
      const response = await dispatch(searchPlayer({ playerTag })).unwrap();
      setPlayerCard(response.data);
    } catch (error) {
      console.error("Player search failed:", error);
      setPlayerError("Player not found.");
    } finally {
      setSearchingPlayer(false);
    }
  };

  if (
    ["idle", "loading"].includes(connectionsStatus) &&
    friends.length === 0 &&
    incomingRequests.length === 0 &&
    outgoingRequests.length === 0
  ) {
    return <LoadingSpinner />;
  }

  if (
    connectionsStatus === "failed" &&
    friends.length === 0 &&
    incomingRequests.length === 0 &&
    outgoingRequests.length === 0
  ) {
    return (
      <section className="rounded-xl border border-rose-300/15 bg-slate-950/70 p-5 text-center">
        <h1 className="text-lg font-black text-white">Friends are unavailable</h1>
        <p className="mt-2 text-sm text-slate-400">
          We could not load your connections. Try again.
        </p>
        <button
          type="button"
          onClick={() => dispatch(fetchSocialConnections())}
          className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-cyan-300 px-3 text-xs font-black text-slate-950"
        >
          <FiRefreshCw />
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-3">
      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-300/10 text-cyan-200">
            <FiUsers aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-white">Friends</h1>
            <p className="truncate text-xs text-slate-500">
              {friends.length} friends · {incomingRequests.length} incoming · {outgoingRequests.length} sent
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchSocialConnections())}
          className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-cyan-300/30 hover:text-cyan-100"
          aria-label="Refresh friends"
        >
          <FiRefreshCw />
        </button>
      </section>

      <section className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handlePlayerSearch}>
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Player tag</span>
            <FiSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              className="h-10 w-full rounded-lg border border-white/10 bg-slate-900 pl-9 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/40"
              name="searchFriend"
              onChange={(event) => setPlayerQuery(event.target.value)}
              placeholder="Search by username or player tag"
              type="text"
              value={playerQuery}
            />
          </label>
          <button
            className="h-10 rounded-lg bg-cyan-300 px-4 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={searchingPlayer || !playerQuery.trim()}
            type="submit"
          >
            {searchingPlayer ? "Searching..." : "Find player"}
          </button>
        </form>

        {playerCard ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
            <PlayerIdentity
              player={playerCard}
              subtitle={playerCard.friendshipStatus?.replaceAll("_", " ") || "Player"}
            />
            <div className="flex flex-wrap items-center gap-2">
              {String(playerCard._id) !== currentUserId && resolvePlayerTag(playerCard) ? (
                <SecondaryButton onClick={() => openProfile(playerCard)}>
                  Profile
                </SecondaryButton>
              ) : null}
              {playerCard.friendshipStatus === "not_friends" &&
              String(playerCard._id) !== currentUserId ? (
                <PrimaryButton
                  disabled={isMutating}
                  onClick={() =>
                    runSocialMutation(
                      sendFriendRequest({ playerId: playerCard._id }),
                      "request_sent",
                    )
                  }
                >
                  <FiUserPlus /> Add
                </PrimaryButton>
              ) : null}
              {playerCard.friendshipStatus === "request_received" ? (
                <PrimaryButton
                  disabled={isMutating}
                  onClick={() =>
                    runSocialMutation(
                      acceptFriendRequest(playerCard._id),
                      "friends",
                    )
                  }
                >
                  Accept
                </PrimaryButton>
              ) : null}
              {playerCard.friendshipStatus === "request_sent" ? (
                <DangerButton
                  disabled={isMutating}
                  onClick={() =>
                    runSocialMutation(
                      cancelFriendRequest(playerCard._id),
                      "not_friends",
                    )
                  }
                >
                  Cancel
                </DangerButton>
              ) : null}
              {playerCard.friendshipStatus === "friends" ? (
                <span className="rounded-lg border border-emerald-300/15 bg-emerald-300/5 px-2.5 py-2 text-xs font-bold text-emerald-200">
                  Friends
                </span>
              ) : null}
            </div>
          </div>
        ) : playerError ? (
          <p className="mt-3 border-t border-white/10 pt-3 text-sm text-rose-200">
            {playerError}
          </p>
        ) : null}
      </section>

      {incomingRequests.length > 0 ? (
        <ConnectionSection count={incomingRequests.length} icon={<FiUserPlus />} title="Incoming requests">
          {incomingRequests.map((player) => (
            <PlayerRow key={player._id} player={player} subtitle="Wants to connect">
              <SecondaryButton onClick={() => openProfile(player)}>
                Profile
              </SecondaryButton>
              <PrimaryButton
                disabled={isMutating}
                onClick={() => runSocialMutation(acceptFriendRequest(player._id))}
              >
                Accept
              </PrimaryButton>
              <DangerButton
                disabled={isMutating}
                onClick={() => runSocialMutation(declineFriendRequest(player._id))}
              >
                Reject
              </DangerButton>
            </PlayerRow>
          ))}
        </ConnectionSection>
      ) : null}

      <section className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
        <div
          aria-label="Friend lists"
          className="flex gap-1 border-b border-white/10 pb-2"
          role="tablist"
        >
          {[
            ["friends", "Friends", friends.length, <FiUsers key="friends-icon" />],
            ["sent", "Sent requests", outgoingRequests.length, <FiClock key="sent-icon" />],
          ].map(([id, label, count, icon]) => (
            <button
              aria-controls={`friend-panel-${id}`}
              aria-selected={activeList === id}
              className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-black transition ${
                activeList === id
                  ? "bg-cyan-300/10 text-cyan-100"
                  : "text-slate-500 hover:bg-white/5 hover:text-slate-300"
              }`}
              id={`friend-tab-${id}`}
              key={id}
              onClick={() => setActiveList(id)}
              role="tab"
              type="button"
            >
              {icon}
              {label}
              <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">
                {count}
              </span>
            </button>
          ))}
        </div>

        <div
          aria-labelledby={`friend-tab-${activeList}`}
          className="mt-3 grid gap-2"
          id={`friend-panel-${activeList}`}
          role="tabpanel"
        >
          {activeList === "friends" ? (
            friends.length > 0 ? (
              friends.map((player) => (
                <PlayerRow key={player._id} player={player} subtitle="Connected">
                  <SecondaryButton onClick={() => openProfile(player)}>
                    Profile
                  </SecondaryButton>
                  <DangerButton
                    disabled={isMutating}
                    onClick={() => runSocialMutation(removeFriend(player._id))}
                  >
                    <FiUserMinus /> Remove
                  </DangerButton>
                </PlayerRow>
              ))
            ) : (
              <EmptyState copy="No friends yet. Use search to find players." />
            )
          ) : outgoingRequests.length > 0 ? (
            outgoingRequests.map((player) => (
              <PlayerRow key={player._id} player={player} subtitle="Pending">
                <SecondaryButton onClick={() => openProfile(player)}>
                  Profile
                </SecondaryButton>
                <DangerButton
                  disabled={isMutating}
                  onClick={() => runSocialMutation(cancelFriendRequest(player._id))}
                >
                  Cancel
                </DangerButton>
              </PlayerRow>
            ))
          ) : (
            <EmptyState copy="No pending sent requests." />
          )}
        </div>
      </section>
    </div>
  );
};

const ConnectionSection = ({ title, count, icon, emptyCopy = "", children }) => {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);

  return (
    <section className="rounded-xl border border-white/10 bg-slate-950/70 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-sm font-black text-white">
          <span className="text-cyan-300" aria-hidden="true">{icon}</span>
          {title}
        </h2>
        <span className="rounded-md bg-white/5 px-2 py-1 text-xs font-bold text-slate-400">
          {count}
        </span>
      </div>
      <div className="grid gap-2">
        {hasItems ? items : <EmptyState copy={emptyCopy} />}
      </div>
    </section>
  );
};

const PlayerIdentity = ({ player, subtitle }) => (
  <div className="flex min-w-0 items-center gap-3">
    <img
      src={resolvePlayerAvatar(player)}
      onError={applyAvatarFallback}
      alt={resolvePlayerName(player)}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
    />
    <div className="min-w-0">
      <p className="truncate text-sm font-bold text-white">{resolvePlayerName(player)}</p>
      <p className="mt-0.5 truncate text-xs capitalize text-slate-500">{subtitle}</p>
    </div>
  </div>
);

const PlayerRow = ({ player, subtitle, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2.5">
    <PlayerIdentity player={player} subtitle={subtitle} />
    <div className="flex flex-wrap items-center gap-1.5">{children}</div>
  </div>
);

const PrimaryButton = ({ children, ...props }) => (
  <button
    type="button"
    className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-cyan-300 px-2.5 text-xs font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, ...props }) => (
  <button
    type="button"
    className="h-8 rounded-lg border border-white/10 bg-white/5 px-2.5 text-xs font-bold text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
    {...props}
  >
    {children}
  </button>
);

const DangerButton = ({ children, ...props }) => (
  <button
    type="button"
    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-rose-400/15 bg-rose-400/5 px-2.5 text-xs font-bold text-rose-200 transition hover:bg-rose-400/10 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const EmptyState = ({ copy }) => (
  <p className="rounded-lg border border-dashed border-white/10 px-3 py-4 text-center text-sm text-slate-500">
    {copy}
  </p>
);

const playerType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  avatar: PropTypes.string,
  playerTag: PropTypes.string,
  profileTag: PropTypes.string,
  profile: PropTypes.shape({
    avatar: PropTypes.string,
    profileTag: PropTypes.string,
    username: PropTypes.string,
  }),
  username: PropTypes.string,
});

ConnectionSection.propTypes = {
  children: PropTypes.node,
  count: PropTypes.number.isRequired,
  emptyCopy: PropTypes.string,
  icon: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

PlayerIdentity.propTypes = {
  player: playerType.isRequired,
  subtitle: PropTypes.string.isRequired,
};

PlayerRow.propTypes = {
  children: PropTypes.node,
  player: playerType.isRequired,
  subtitle: PropTypes.string.isRequired,
};

const actionButtonPropTypes = {
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

PrimaryButton.propTypes = actionButtonPropTypes;
SecondaryButton.propTypes = actionButtonPropTypes;
DangerButton.propTypes = actionButtonPropTypes;

EmptyState.propTypes = {
  copy: PropTypes.string.isRequired,
};

export default Friends;
