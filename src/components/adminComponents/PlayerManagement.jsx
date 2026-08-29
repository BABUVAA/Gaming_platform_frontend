import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FiRefreshCw, FiSearch, FiUsers } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchManagedPlayers } from "../../store/slices/playerManagementSlice.js";

const STATUS_OPTIONS = [
  ["all", "All players"],
  ["verified", "Verified"],
  ["pending_verification", "Pending verification"],
  ["under_review", "Under review"],
  ["banned", "Banned"],
];

const formatDate = (value) =>
  value ? new Date(value).toLocaleString() : "Never";

const accountLabel = (player) => {
  if (player.isBanned) return "Banned";
  if (player.securityStatus === "under_review") return "Under review";
  return player.isVerified ? "Verified" : "Pending verification";
};

const accountTone = (player) => {
  if (player.isBanned) return "border-rose-400/30 bg-rose-400/10 text-rose-200";
  if (player.securityStatus === "under_review") {
    return "border-amber-300/30 bg-amber-300/10 text-amber-100";
  }
  return player.isVerified
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : "border-slate-600 bg-slate-800 text-slate-300";
};

const PlayerManagement = () => {
  const dispatch = useDispatch();
  const { error, page, players, status: requestStatus, summary } = useSelector(
    (state) => state.playerManagement,
  );
  const [draftSearch, setDraftSearch] = useState("");
  const [query, setQuery] = useState({ search: "", status: "all" });

  useEffect(() => {
    dispatch(fetchManagedPlayers(query));
  }, [dispatch, query]);

  const submitSearch = (event) => {
    event.preventDefault();
    setQuery((current) => ({ ...current, search: draftSearch.trim() }));
  };

  const changeStatus = (event) => {
    const nextStatus = event.target.value;
    setQuery((current) => ({ ...current, status: nextStatus }));
  };

  const refresh = () => dispatch(fetchManagedPlayers(query));

  return (
    <section className="space-y-4" aria-labelledby="player-management-title">
      <header className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-black text-white" id="player-management-title">
              <FiUsers className="text-cyan-300" /> Registered players
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Find player accounts and review their current access state.
            </p>
          </div>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
            disabled={requestStatus === "loading"}
            onClick={refresh}
            type="button"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>

        <form className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_12rem_auto]" onSubmit={submitSearch}>
          <label className="relative">
            <span className="sr-only">Search registered players</span>
            <FiSearch className="pointer-events-none absolute left-3 top-3 text-slate-500" />
            <input
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-3 text-sm text-white outline-none focus:border-cyan-400"
              maxLength={80}
              onChange={(event) => setDraftSearch(event.target.value)}
              placeholder="Username, tag, or email"
              type="search"
              value={draftSearch}
            />
          </label>
          <label>
            <span className="sr-only">Filter by account status</span>
            <select
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
              onChange={changeStatus}
              value={query.status}
            >
              {STATUS_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button className="rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-black text-white hover:bg-cyan-500" type="submit">
            Search
          </button>
        </form>
      </header>

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Metric label="Registered" value={summary.total} />
        <Metric label="Verified" value={summary.verified} />
        <Metric label="Pending" value={summary.pendingVerification} />
        <Metric label="Under review" value={summary.underReview} />
        <Metric label="Banned" value={summary.banned} />
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
          {error.message || String(error)}
        </div>
      ) : null}

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950/45">
        <div className="hidden grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_auto_auto] gap-4 border-b border-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wide text-slate-500 md:grid">
          <span>Player</span><span>Account</span><span>Community</span><span>Last login</span>
        </div>
        {players.map((player) => (
          <PlayerRow key={player.id} player={player} />
        ))}
        {requestStatus === "loading" && players.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">Loading registered players...</p>
        ) : null}
        {requestStatus !== "loading" && players.length === 0 && !error ? (
          <p className="p-6 text-sm text-slate-500">No registered players match these filters.</p>
        ) : null}
      </div>

      {page.hasMore ? (
        <button
          className="w-full rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 disabled:opacity-50"
          disabled={requestStatus === "loading_more"}
          onClick={() => dispatch(fetchManagedPlayers({ ...query, cursor: page.nextCursor }))}
          type="button"
        >
          {requestStatus === "loading_more" ? "Loading..." : "Load more players"}
        </button>
      ) : null}
    </section>
  );
};

const Metric = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
    <p className="text-xs font-bold text-slate-500">{label}</p>
    <p className="mt-1 text-xl font-black text-white">{value}</p>
  </div>
);

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};

const PlayerRow = ({ player }) => (
  <article className="grid gap-3 border-t border-slate-800 p-4 first:border-t-0 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1.3fr)_auto_auto] md:items-center md:gap-4">
    <div className="min-w-0">
      <p className="truncate font-bold text-white">{player.username}</p>
      <p className="truncate text-xs text-slate-400">#{player.profileTag} · {player.email}</p>
      <p className="mt-1 text-xs text-slate-500">Registered {formatDate(player.createdAt)}</p>
    </div>
    <div>
      <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-black ${accountTone(player)}`}>
        {accountLabel(player)}
      </span>
      <p className="mt-2 text-xs text-slate-500">{player.linkedGameCount} linked game account{player.linkedGameCount === 1 ? "" : "s"}</p>
    </div>
    <p className="text-xs text-slate-400">
      {player.teamCount} team{player.teamCount === 1 ? "" : "s"} · {player.hasClan ? "In clan" : "No clan"}
    </p>
    <time className="text-xs text-slate-400">{formatDate(player.lastLoginAt)}</time>
  </article>
);

PlayerRow.propTypes = {
  player: PropTypes.shape({
    createdAt: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    hasClan: PropTypes.bool.isRequired,
    id: PropTypes.string.isRequired,
    isBanned: PropTypes.bool.isRequired,
    isVerified: PropTypes.bool.isRequired,
    lastLoginAt: PropTypes.string,
    linkedGameCount: PropTypes.number.isRequired,
    profileTag: PropTypes.string.isRequired,
    securityStatus: PropTypes.string.isRequired,
    teamCount: PropTypes.number.isRequired,
    username: PropTypes.string.isRequired,
  }).isRequired,
};

export default PlayerManagement;
