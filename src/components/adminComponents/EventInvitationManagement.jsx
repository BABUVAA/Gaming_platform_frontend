import { useEffect, useState } from "react";
import { FiRefreshCw, FiSearch, FiSend, FiUserMinus } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEventInvitations,
  fetchInvitationRuns,
  inviteEventPlayers,
  revokeEventInvitation,
  searchInvitationCandidates,
} from "../../store/slices/eventInvitationSlice.js";

const getId = (record) => record?.id || record?._id;
const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not set"
    : new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
};

const EventInvitationManagement = () => {
  const dispatch = useDispatch();
  const state = useSelector((root) => root.eventInvitations);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [search, setSearch] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const invitations = state.invitationsByRunId[selectedRunId] || [];
  const candidates = state.candidatesByRunId[selectedRunId] || [];
  const loadStatus = state.statusByRunId[selectedRunId] || "idle";
  const candidateStatus = state.candidateStatusByRunId[selectedRunId] || "idle";
  const selectedRun = state.invitationRuns.find(
    (run) => getId(run) === selectedRunId,
  );

  useEffect(() => {
    const request = dispatch(fetchInvitationRuns());
    return () => request.abort();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedRunId && state.invitationRuns.length > 0) {
      setSelectedRunId(getId(state.invitationRuns[0]));
    } else if (
      selectedRunId &&
      !state.invitationRuns.some((run) => getId(run) === selectedRunId)
    ) {
      setSelectedRunId(
        state.invitationRuns[0] ? getId(state.invitationRuns[0]) : "",
      );
    }
  }, [selectedRunId, state.invitationRuns]);

  useEffect(() => {
    setSearch("");
    setSelectedPlayerIds([]);
    if (!selectedRunId) return undefined;
    const request = dispatch(fetchEventInvitations({ runId: selectedRunId }));
    return () => request.abort();
  }, [dispatch, selectedRunId]);

  const findPlayers = (event) => {
    event.preventDefault();
    const query = search.trim();
    if (query.length < 2 || query.length > 80) return;
    setSelectedPlayerIds([]);
    dispatch(searchInvitationCandidates({ runId: selectedRunId, search: query }));
  };

  const toggleCandidate = (playerId) => {
    setSelectedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter((id) => id !== playerId)
        : [...current, playerId],
    );
  };

  const submitInvitations = async () => {
    if (selectedPlayerIds.length < 1 || selectedPlayerIds.length > 100) return;
    try {
      await dispatch(
        inviteEventPlayers({
          playerIds: selectedPlayerIds,
          runId: selectedRunId,
        }),
      ).unwrap();
      setSelectedPlayerIds([]);
      if (search.trim().length >= 2) {
        dispatch(
          searchInvitationCandidates({
            runId: selectedRunId,
            search: search.trim(),
          }),
        );
      }
    } catch {
      // The shared request boundary displays the server-owned policy error.
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Admission control
          </p>
          <h3 className="mt-1 text-lg font-black text-white">
            Invitation-only Events
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Search eligible verified players and manage each invitation roster.
          </p>
        </div>
        {state.invitationRuns.length > 0 ? (
          <label className="text-xs font-bold text-slate-400">
            Event Run
            <select
              className="mt-2 block w-full min-w-64 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              onChange={(event) => setSelectedRunId(event.target.value)}
              value={selectedRunId}
            >
              {state.invitationRuns.map((run) => (
                <option key={getId(run)} value={getId(run)}>
                  {run.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {state.runStatus === "loading" && state.invitationRuns.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">Loading invitation Events...</p>
      ) : null}
      {state.runStatus === "failed" ? (
        <button
          className="mt-5 rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-100"
          onClick={() => dispatch(fetchInvitationRuns())}
          type="button"
        >
          Retry: {state.runError}
        </button>
      ) : null}
      {state.runStatus === "succeeded" && state.invitationRuns.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
          No invitation-only Event is currently accepting invitations.
        </p>
      ) : null}

      {selectedRun ? (
        <div className="mt-5 space-y-5">
          <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-xs text-slate-400">
            <span className="font-bold text-white">{selectedRun.title}</span>
            <span>{selectedRun.game?.name || "Game"}</span>
            <span>Registration closes {formatDate(selectedRun.registrationClosesAt)}</span>
            <span>Starts {formatDate(selectedRun.startsAt)}</span>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <p className="font-black text-white">Find eligible players</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Search by username or profile tag. Results are server-filtered,
                bounded to 20, and exclude active or consumed invitees.
              </p>
              <form className="mt-3 flex gap-2" onSubmit={findPlayers}>
                <input
                  aria-label="Search eligible players"
                  className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
                  maxLength={80}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Username or profile tag"
                  value={search}
                />
                <button
                  className="rounded-xl border border-cyan-300/30 p-3 text-cyan-200 disabled:opacity-50"
                  disabled={
                    search.trim().length < 2 || candidateStatus === "loading"
                  }
                  title="Search players"
                  type="submit"
                >
                  <FiSearch />
                </button>
              </form>
              {candidateStatus === "failed" ? (
                <p className="mt-3 text-xs text-rose-200">
                  {state.candidateErrorByRunId[selectedRunId]}
                </p>
              ) : null}
              <div className="mt-3 divide-y divide-slate-800">
                {candidates.map((player) => {
                  const playerId = getId(player);
                  return (
                    <label
                      className="flex cursor-pointer items-center gap-3 py-3"
                      key={playerId}
                    >
                      <input
                        checked={selectedPlayerIds.includes(playerId)}
                        onChange={() => toggleCandidate(playerId)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-white">
                          {player.username}
                        </span>
                        <span className="block truncate text-xs text-slate-500">
                          {player.profileTag}
                        </span>
                      </span>
                    </label>
                  );
                })}
                {candidateStatus === "succeeded" && candidates.length === 0 ? (
                  <p className="py-4 text-sm text-slate-500">
                    No eligible players matched this search.
                  </p>
                ) : null}
              </div>
              <button
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50"
                disabled={
                  selectedPlayerIds.length === 0 ||
                  state.actionByRunId[selectedRunId] === "saving"
                }
                onClick={submitInvitations}
                type="button"
              >
                <FiSend />
                {state.actionByRunId[selectedRunId] === "saving"
                  ? "Saving..."
                  : `Invite ${selectedPlayerIds.length || "selected"}`}
              </button>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-black text-white">Invitation roster</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {invitations.length} invitation records loaded
                  </p>
                </div>
                <button
                  className="rounded-xl border border-slate-700 p-2 text-slate-300 disabled:opacity-50"
                  disabled={loadStatus === "loading"}
                  onClick={() =>
                    dispatch(fetchEventInvitations({ runId: selectedRunId }))
                  }
                  title="Refresh invitations"
                  type="button"
                >
                  <FiRefreshCw />
                </button>
              </div>
              {loadStatus === "loading" && invitations.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">Loading invitations...</p>
              ) : null}
              {loadStatus === "failed" ? (
                <p className="mt-4 text-sm text-rose-200">
                  {state.errorByRunId[selectedRunId]}
                </p>
              ) : null}
              <div className="mt-4 divide-y divide-slate-800">
                {invitations.map((invitation) => {
                  const invitationId = getId(invitation);
                  const player = invitation.player || {};
                  return (
                    <div
                      className="flex items-center justify-between gap-3 py-3"
                      key={invitationId}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">
                          {player.username || "Player"}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {player.profileTag}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-bold uppercase text-slate-400">
                          {invitation.status}
                        </span>
                        {invitation.status === "active" ? (
                          <button
                            className="rounded-lg border border-rose-400/30 p-2 text-rose-200 disabled:opacity-50"
                            disabled={
                              state.actionByRunId[selectedRunId] === invitationId
                            }
                            onClick={() =>
                              dispatch(
                                revokeEventInvitation({
                                  invitationId,
                                  runId: selectedRunId,
                                }),
                              )
                            }
                            title="Revoke invitation"
                            type="button"
                          >
                            <FiUserMinus />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                {loadStatus === "succeeded" && invitations.length === 0 ? (
                  <p className="py-5 text-sm text-slate-500">
                    No players have been invited yet.
                  </p>
                ) : null}
              </div>
              {state.nextInvitationCursorByRunId[selectedRunId] ? (
                <button
                  className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
                  disabled={loadStatus === "loading"}
                  onClick={() =>
                    dispatch(
                      fetchEventInvitations({
                        cursor:
                          state.nextInvitationCursorByRunId[selectedRunId],
                        runId: selectedRunId,
                      }),
                    )
                  }
                  type="button"
                >
                  Load more invitations
                </button>
              ) : null}
            </div>
          </div>
          {state.nextRunCursor ? (
            <button
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
              disabled={state.runStatus === "loading"}
              onClick={() =>
                dispatch(fetchInvitationRuns({ cursor: state.nextRunCursor }))
              }
              type="button"
            >
              Load more Events
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

export default EventInvitationManagement;
