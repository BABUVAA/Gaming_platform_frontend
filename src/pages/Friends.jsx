import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiRefreshCw, FiSearch, FiUserMinus, FiUserPlus } from "react-icons/fi";
import { Button, Input } from "../components";
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
      <section className="clan-surface text-center">
        <h1 className="text-2xl font-black text-white">Friends are unavailable</h1>
        <p className="mt-2 text-sm text-slate-400">
          We could not load your connections. Try again.
        </p>
        <button
          type="button"
          onClick={() => dispatch(fetchSocialConnections())}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
        >
          <FiRefreshCw />
          Retry
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <section className="clan-surface flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.22em] text-cyan-300/70">
            Player connections
          </p>
          <h1 className="mt-2 text-2xl font-black text-white">Friends</h1>
          <p className="mt-2 text-sm text-slate-400">
            Find players, review requests, and manage the friends you build teams with.
          </p>
        </div>
        <button
          type="button"
          onClick={() => dispatch(fetchSocialConnections())}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-100"
          aria-label="Refresh friends"
        >
          <FiRefreshCw />
        </button>
      </section>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <section className="clan-surface">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
            Search
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Find players by tag</h2>
          <form className="mt-6 space-y-3" onSubmit={handlePlayerSearch}>
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
              type="submit"
              isLoading={searchingPlayer}
              className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.14em] text-slate-950 hover:bg-cyan-200"
            >
              Search Player
            </Button>
          </form>
        </section>

        <section className="clan-surface">
          {playerCard ? (
            <div className="flex h-full flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
                  Player result
                </p>
                <div className="mt-6 flex items-center gap-4">
                  <img
                    src={resolvePlayerAvatar(playerCard)}
                    onError={applyAvatarFallback}
                    alt={resolvePlayerName(playerCard)}
                    className="h-20 w-20 rounded-[24px] object-cover"
                  />
                  <div>
                    <h3 className="text-2xl font-black text-white">
                      {resolvePlayerName(playerCard)}
                    </h3>
                    <p className="mt-1 text-sm capitalize text-slate-400">
                      {playerCard.friendshipStatus?.replaceAll("_", " ")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-wrap gap-2">
                {String(playerCard._id) !== currentUserId && resolvePlayerTag(playerCard) ? (
                  <SecondaryButton onClick={() => openProfile(playerCard)}>
                    View Profile
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
                    <FiUserPlus /> Add Friend
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
                    <FiUserPlus /> Accept Request
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
                    <FiUserMinus /> Cancel Request
                  </DangerButton>
                ) : null}
                {playerCard.friendshipStatus === "friends" ? (
                  <span className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200">
                    Already friends
                  </span>
                ) : null}
              </div>
            </div>
          ) : (
            <EmptyState
              title={playerError || "No player selected"}
              copy="Search for a player to see their current relationship and connect."
            />
          )}
        </section>
      </div>

      {incomingRequests.length > 0 ? (
        <ConnectionSection title={`Incoming requests (${incomingRequests.length})`}>
          {incomingRequests.map((player) => (
            <PlayerRow key={player._id} player={player} subtitle="Wants to connect">
              <SecondaryButton onClick={() => openProfile(player)}>
                View Profile
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

      <div className="grid gap-4 xl:grid-cols-2">
        <ConnectionSection
          title={`Friends (${friends.length})`}
          emptyCopy="Your friends list will appear here."
        >
          {friends.map((player) => (
            <PlayerRow key={player._id} player={player} subtitle="Connected player">
              <SecondaryButton onClick={() => openProfile(player)}>
                View Profile
              </SecondaryButton>
              <DangerButton
                disabled={isMutating}
                onClick={() => runSocialMutation(removeFriend(player._id))}
              >
                <FiUserMinus /> Remove
              </DangerButton>
            </PlayerRow>
          ))}
        </ConnectionSection>

        <ConnectionSection
          title={`Sent requests (${outgoingRequests.length})`}
          emptyCopy="Outgoing requests stay here until accepted or cancelled."
        >
          {outgoingRequests.map((player) => (
            <PlayerRow key={player._id} player={player} subtitle="Pending request">
              <SecondaryButton onClick={() => openProfile(player)}>
                View Profile
              </SecondaryButton>
              <DangerButton
                disabled={isMutating}
                onClick={() => runSocialMutation(cancelFriendRequest(player._id))}
              >
                <FiUserMinus /> Cancel
              </DangerButton>
            </PlayerRow>
          ))}
        </ConnectionSection>
      </div>
    </div>
  );
};

const ConnectionSection = ({ title, emptyCopy = "", children }) => {
  const items = Array.isArray(children) ? children.filter(Boolean) : children;
  const hasItems = Array.isArray(items) ? items.length > 0 : Boolean(items);

  return (
    <section className="clan-surface">
      <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
        Social
      </p>
      <h2 className="mt-2 text-2xl font-black text-white">{title}</h2>
      <div className="mt-6 grid gap-3">
        {hasItems ? items : <EmptyState title={title} copy={emptyCopy} />}
      </div>
    </section>
  );
};

const PlayerRow = ({ player, subtitle, children }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] border border-white/10 bg-black/20 px-4 py-4">
    <div className="flex min-w-0 items-center gap-3">
      <img
        src={resolvePlayerAvatar(player)}
        onError={applyAvatarFallback}
        alt={resolvePlayerName(player)}
        className="h-12 w-12 shrink-0 rounded-2xl object-cover"
      />
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{resolvePlayerName(player)}</p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
          {subtitle}
        </p>
      </div>
    </div>
    <div className="flex flex-wrap items-center gap-2">{children}</div>
  </div>
);

const PrimaryButton = ({ children, ...props }) => (
  <button
    type="button"
    className="inline-flex items-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const SecondaryButton = ({ children, ...props }) => (
  <button
    type="button"
    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-slate-200 transition hover:border-cyan-300/30 hover:text-cyan-100"
    {...props}
  >
    {children}
  </button>
);

const DangerButton = ({ children, ...props }) => (
  <button
    type="button"
    className="inline-flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-200 transition hover:bg-rose-500/15 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  >
    {children}
  </button>
);

const EmptyState = ({ title, copy }) => (
  <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 p-6 text-center">
    <p className="font-bold text-white">{title}</p>
    <p className="mt-2 text-sm text-slate-400">{copy}</p>
  </div>
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
  emptyCopy: PropTypes.string,
  title: PropTypes.string.isRequired,
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
  title: PropTypes.string.isRequired,
};

export default Friends;
