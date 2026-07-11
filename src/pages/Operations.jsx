import { useEffect, useMemo, useState } from "react";
import { FaBroadcastTower, FaSyncAlt } from "react-icons/fa";
import api from "../api/axios-api";

const statusOptions = [
  "scheduled",
  "check_in",
  "lobby_ready",
  "live",
  "result_pending",
  "verified",
  "settled",
  "cancelled",
  "disputed",
];

const emptyLobby = {
  roomCode: "",
  roomPassword: "",
  instructions: "",
};

const Operations = () => {
  const [dashboard, setDashboard] = useState(null);
  const [matches, setMatches] = useState([]);
  const [lobbyDrafts, setLobbyDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeAction, setActiveAction] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const syncLobbyDrafts = (incomingMatches) => {
    const drafts = incomingMatches.reduce((acc, match) => {
      acc[match._id] = {
        roomCode: match.lobby?.roomCode || "",
        roomPassword: match.lobby?.roomPassword || "",
        instructions: match.lobby?.instructions || "",
      };
      return acc;
    }, {});
    setLobbyDrafts(drafts);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");
      const [dashboardRes, matchRes] = await Promise.all([
        api.get("/api/operator/dashboard"),
        api.get("/api/operator/matches"),
      ]);
      const incomingMatches = matchRes.data?.data || [];
      setDashboard(dashboardRes.data?.data || null);
      setMatches(incomingMatches);
      syncLobbyDrafts(incomingMatches);
    } catch (err) {
      setError(err?.response?.data?.message || "Unable to load operations data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const orderedMatches = useMemo(
    () =>
      [...matches].sort(
        (a, b) =>
          new Date(a.scheduledFor || a.createdAt) -
          new Date(b.scheduledFor || b.createdAt)
      ),
    [matches]
  );

  const updateMatchInState = (updatedMatch) => {
    setMatches((prev) =>
      prev.map((entry) => (entry._id === updatedMatch._id ? updatedMatch : entry))
    );
    setLobbyDrafts((prev) => ({
      ...prev,
      [updatedMatch._id]: {
        roomCode: updatedMatch.lobby?.roomCode || "",
        roomPassword: updatedMatch.lobby?.roomPassword || "",
        instructions: updatedMatch.lobby?.instructions || "",
      },
    }));
  };

  const refreshDashboard = async () => {
    const response = await api.get("/api/operator/dashboard");
    setDashboard(response.data?.data || null);
  };

  const updateStatus = async (matchId, status) => {
    try {
      setActiveAction(`${matchId}:status`);
      setError("");
      setNotice("");
      const response = await api.patch(`/api/operator/matches/${matchId}/status`, {
        status,
      });
      updateMatchInState(response.data?.data);
      await refreshDashboard();
      setNotice("Match status updated.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to update status.");
    } finally {
      setActiveAction("");
    }
  };

  const updateLobbyDraft = (matchId, field, value) => {
    setLobbyDrafts((prev) => ({
      ...prev,
      [matchId]: {
        ...(prev[matchId] || emptyLobby),
        [field]: value,
      },
    }));
  };

  const publishLobby = async (matchId) => {
    try {
      setActiveAction(`${matchId}:lobby`);
      setError("");
      setNotice("");
      const response = await api.patch(
        `/api/operator/matches/${matchId}/lobby`,
        lobbyDrafts[matchId] || emptyLobby
      );
      updateMatchInState(response.data?.data);
      await refreshDashboard();
      setNotice("Lobby data published for players.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to publish lobby data.");
    } finally {
      setActiveAction("");
    }
  };

  if (loading) {
    return <div className="text-slate-300">Loading operator operations...</div>;
  }

  return (
    <section className="space-y-4 text-slate-100">
      <header className="rounded-2xl border border-cyan-400/20 bg-slate-950/60 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Operator Control</h1>
            <p className="text-sm text-slate-400">
              Manage assigned lobbies, match status, and dispute flow.
            </p>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 transition hover:border-cyan-400/40 hover:text-cyan-200"
          >
            <FaSyncAlt />
            Refresh
          </button>
        </div>

        {dashboard && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
              Assigned: {dashboard.totalAssignedMatches}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
              Live: {dashboard.liveMatches}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
              Disputed: {dashboard.disputedMatches}
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-3 text-sm">
              Result Pending: {dashboard.resultPendingMatches}
            </div>
          </div>
        )}
      </header>

      {error ? (
        <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-3 text-sm text-emerald-200">
          {notice}
        </div>
      ) : null}

      <div className="space-y-3">
        {orderedMatches.map((match) => {
          const lobbyDraft = lobbyDrafts[match._id] || emptyLobby;
          const checkedInCount = (match.participants || []).filter(
            (participant) => participant.checkedIn
          ).length;
          const isLobbyBusy = activeAction === `${match._id}:lobby`;
          const isStatusBusy = activeAction === `${match._id}:status`;

          return (
            <article
              key={match._id}
              className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="font-semibold">{match.title}</h2>
                  <p className="mt-1 text-xs text-slate-400">
                    {match.game?.toUpperCase()} / {match.mode} / {match.map}
                  </p>
                </div>
                <span className="rounded-md bg-cyan-400/15 px-2 py-1 text-xs uppercase tracking-wide text-cyan-200">
                  {match.status}
                </span>
              </div>

              <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_1.2fr]">
                <div className="space-y-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 text-xs text-slate-400">
                    <p>
                      Scheduled:{" "}
                      {match.scheduledFor
                        ? new Date(match.scheduledFor).toLocaleString()
                        : "TBD"}
                    </p>
                    <p className="mt-1">
                      Check-ins: {checkedInCount}/{match.participants?.length || 0}
                    </p>
                  </div>

                  <label className="block text-xs text-slate-400">
                    Update Status
                    <select
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
                      value={match.status}
                      disabled={isStatusBusy}
                      onChange={(event) =>
                        updateStatus(match._id, event.target.value)
                      }
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="space-y-2">
                    {(match.participants || []).map((participant) => (
                      <div
                        key={participant.user?._id || participant.displayName}
                        className="flex items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2 text-xs"
                      >
                        <span className="truncate text-slate-200">
                          {participant.user?.profile?.username ||
                            participant.displayName}
                        </span>
                        <span
                          className={
                            participant.checkedIn
                              ? "text-emerald-300"
                              : "text-slate-500"
                          }
                        >
                          {participant.checkedIn ? "Checked in" : "Waiting"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-slate-100">
                      Lobby Data
                    </h3>
                    {match.lobby?.publishedAt ? (
                      <span className="text-[11px] text-slate-500">
                        Published {new Date(match.lobby.publishedAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <label className="block text-xs text-slate-400">
                      Room Code
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        value={lobbyDraft.roomCode}
                        onChange={(event) =>
                          updateLobbyDraft(match._id, "roomCode", event.target.value)
                        }
                        placeholder="ROOM-1234"
                      />
                    </label>
                    <label className="block text-xs text-slate-400">
                      Password
                      <input
                        className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                        value={lobbyDraft.roomPassword}
                        onChange={(event) =>
                          updateLobbyDraft(
                            match._id,
                            "roomPassword",
                            event.target.value
                          )
                        }
                        placeholder="PASS123"
                      />
                    </label>
                  </div>

                  <label className="mt-3 block text-xs text-slate-400">
                    Instructions
                    <textarea
                      className="mt-1 min-h-24 w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                      value={lobbyDraft.instructions}
                      onChange={(event) =>
                        updateLobbyDraft(match._id, "instructions", event.target.value)
                      }
                      placeholder="Share lobby timing, fair-play notes, and room rules."
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => publishLobby(match._id)}
                    disabled={isLobbyBusy}
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    <FaBroadcastTower />
                    {isLobbyBusy ? "Publishing..." : "Publish Lobby"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}

        {!orderedMatches.length ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">
            No assigned matches found.
          </div>
        ) : null}
      </div>
    </section>
  );
};

export default Operations;
