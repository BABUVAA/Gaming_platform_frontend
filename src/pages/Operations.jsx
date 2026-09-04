import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiMessageSquare,
  FiX,
  FiRadio,
  FiRefreshCw,
  FiShield,
  FiUsers,
  FiWifi,
} from "react-icons/fi";
import useSocket from "../context/useSocket";
import MatchChat from "../components/competition/MatchChat.jsx";
import StaffWorkspaceHeader from "../components/common/StaffWorkspaceHeader.jsx";
import StaffWorkspaceTabs from "../components/common/StaffWorkspaceTabs.jsx";
import {
  getCompetitionRankingGroups,
  usesRankingKeys,
  usesTeamRanking,
} from "../utils/competitionUnits.js";
import {
  claimOperatorMatch,
  executeOperatorMatchCommand,
  fetchMoreOperatorMatches,
  fetchOperatorWorkspace,
} from "../store/slices/operatorOperationsSlice";
import {
  selectOperatorActiveAction,
  selectOperatorDashboard,
  selectOperatorMatches,
  selectOperatorActiveRooms,
  selectOperatorMatchPages,
  selectOperatorMatchPageStatus,
  selectOperatorWorkspaceError,
  selectOperatorWorkspaceStatus,
  selectUnassignedOperatorMatches,
} from "../store/selectors/operatorOperationsSelectors";

const operatorCommands = Object.freeze({
  scheduled: {
    command: "start",
    description: "Start at the confirmed schedule after the ten-minute lobby window.",
    label: "Start match",
  },
  lobby_ready: {
    command: "start",
    description: "Start the match after lobby access has been shared.",
    label: "Start match",
  },
  result_pending: {
    command: "verify_result",
    description: "Confirm the submitted result after checking its evidence.",
    label: "Verify result",
  },
});

const matchFilters = [
  { id: "all", label: "All matches" },
  { id: "live", label: "Live now" },
  { id: "attention", label: "Needs attention" },
];

const statusPresentation = Object.freeze({
  awaiting_operator: {
    label: "Needs operator",
    style: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  },
  operator_assigned: {
    label: "Assigned",
    style: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  },
  scheduled: {
    label: "Scheduled",
    style: "border-slate-500/30 bg-slate-500/10 text-slate-200",
  },
  check_in: {
    label: "Lobby access",
    style: "border-amber-300/25 bg-amber-300/10 text-amber-200",
  },
  lobby_ready: {
    label: "Lobby ready",
    style: "border-sky-300/25 bg-sky-300/10 text-sky-200",
  },
  live: {
    label: "Live",
    style: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  },
  result_pending: {
    label: "Result pending",
    style: "border-orange-300/25 bg-orange-300/10 text-orange-200",
  },
  verified: {
    label: "Verified",
    style: "border-cyan-300/25 bg-cyan-300/10 text-cyan-200",
  },
  settled: {
    label: "Completed",
    style: "border-violet-300/25 bg-violet-300/10 text-violet-200",
  },
  cancelled: {
    label: "Cancelled",
    style: "border-slate-500/30 bg-slate-500/10 text-slate-300",
  },
  disputed: {
    label: "Disputed",
    style: "border-rose-300/25 bg-rose-300/10 text-rose-200",
  },
});

const getParticipantId = (participant) =>
  String(participant?.user?._id || participant?.user || "");

const getParticipantName = (participant) =>
  participant?.user?.profile?.username || participant?.displayName || "Player";

const formatDateTime = (value) => {
  if (!value) return "Schedule pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule pending";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
  }).format(date);
};

const getMatchGameLabel = (match) =>
  match.gameRef?.name || match.gameKey || match.game || "Game";
const isEventMatch = (match) =>
  match.source === "event" || Boolean(match.eventBatch);
const getRoomOperationalLabel = (room, percentage) => {
  if (room.status !== "full") return `${percentage}% filled`;
  if (!room.match) return "Preparing match";
  if (room.match.assignedToViewer) return "Assigned to you";
  if (room.match.status === "awaiting_operator") return "Ready for operator pickup";
  if (room.match.status === "operator_assigned") return "Operator assigned";
  if (room.match.status === "scheduled") return "Scheduled";
  if (room.match.status === "live") return "Live";
  if (["result_pending", "disputed"].includes(room.match.status)) return "Results pending";
  return "Match created";
};

const operatorActionPriority = Object.freeze({
  result_pending: 0,
  live: 1,
  lobby_ready: 2,
  scheduled: 3,
  operator_assigned: 4,
  disputed: 5,
});

const formatCountdown = (scheduledFor, nowMs) => {
  if (!scheduledFor) return "Schedule pending";
  const scheduledMs = new Date(scheduledFor).getTime();
  if (Number.isNaN(scheduledMs)) return "Schedule pending";
  const difference = scheduledMs - nowMs;
  const absoluteMinutes = Math.max(1, Math.ceil(Math.abs(difference) / 60_000));
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  const days = Math.floor(hours / 24);
  const duration = days ? `${days}d ${hours % 24}h` : hours ? `${hours}h ${minutes}m` : `${minutes}m`;
  return difference > 0 ? `Starts in ${duration}` : `Start overdue by ${duration}`;
};

const formatMatchSchedule = (match, nowMs) => {
  if (!match.scheduledFor) return "Schedule pending";
  const schedule = formatDateTime(match.scheduledFor);
  if (["scheduled", "lobby_ready"].includes(match.status)) {
    return `${schedule} · ${formatCountdown(match.scheduledFor, nowMs)}`;
  }
  if (match.status === "live") return `${schedule} · Match live`;
  return schedule;
};

const getNextActionCopy = (match, nowMs) => {
  if (match.status === "result_pending") return "Review the saved ranking and verify the result.";
  if (match.status === "live") return "Record the complete room ranking when play finishes.";
  if (["scheduled", "lobby_ready"].includes(match.status)) {
    if (nowMs - new Date(match.scheduledFor).getTime() >= 86_400_000) {
      return `${formatCountdown(match.scheduledFor, nowMs)}. Confirm the schedule with the Game Manager before starting this delayed match.`;
    }
    return `${formatCountdown(match.scheduledFor, nowMs)}. Open the lobby details before starting.`;
  }
  if (match.status === "operator_assigned") return "Waiting for the Game Manager to publish the schedule and lobby.";
  return "A dispute is open for governance review. Monitor the evidence and Match chat.";
};

const Operations = () => {
  const { competitionRevision, connected } = useSocket();
  const dispatch = useDispatch();
  const dashboard = useSelector(selectOperatorDashboard);
  const matches = useSelector(selectOperatorMatches);
  const activeRooms = useSelector(selectOperatorActiveRooms);
  const unassignedMatches = useSelector(selectUnassignedOperatorMatches);
  const workspaceStatus = useSelector(selectOperatorWorkspaceStatus);
  const error = useSelector(selectOperatorWorkspaceError);
  const activeAction = useSelector(selectOperatorActiveAction);
  const matchPages = useSelector(selectOperatorMatchPages);
  const matchPageStatus = useSelector(selectOperatorMatchPageStatus);
  const [resultDrafts, setResultDrafts] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeDesk, setActiveDesk] = useState("rooms");
  const [expandedMatchId, setExpandedMatchId] = useState("");
  const [matchTabs, setMatchTabs] = useState({});
  const [openRequest, setOpenRequest] = useState(null);
  const lastScrolledRequest = useRef(null);
  const [chatMatchId, setChatMatchId] = useState("");
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [revealedLobbyIds, setRevealedLobbyIds] = useState({});
  const [copiedLobbyValue, setCopiedLobbyValue] = useState("");

  useEffect(() => {
    if (!openRequest || lastScrolledRequest.current === openRequest || activeDesk !== "matches") return;
    const card = document.getElementById(`assigned-match-${openRequest.matchId}`);
    // Wait for React to mount the selected desk and expanded card before navigating.
    if (card) {
      lastScrolledRequest.current = openRequest;
      card.scrollIntoView({ block: "start", behavior: "smooth" });
      card.focus({ preventScroll: true });
    }
  }, [openRequest, activeDesk, matches]);

  useEffect(() => {
    const request = dispatch(fetchOperatorWorkspace());
    return () => request.abort();
  }, [competitionRevision, dispatch]);

  useEffect(() => {
    setResultDrafts((current) => Object.fromEntries(matches.map((match) => {
      const existing = current[match._id];
      const serverRanking = (match.resultSummary?.rankingIds || []).map((entry) => String(entry?._id || entry));
      const keyRanking = (match.resultSummary?.placementRanking || []).map((row) => String(row.key || row.team?._id || row.team || row.playerIds?.[0]?._id || row.playerIds?.[0] || ""));
      const rankingGroups = getCompetitionRankingGroups(match);
      const keyBased = usesRankingKeys(match);
      return [match._id, existing || {
        proofNote: match.resultSummary?.proofNote || "",
        rankingIds: !keyBased && serverRanking.length
          ? serverRanking
          : !keyBased ? (match.participants || []).map(getParticipantId).filter(Boolean) : [],
        rankingKeys: keyBased
          ? (keyRanking.length ? keyRanking : rankingGroups.map((group) => group.key))
          : [],
        rankingUnit: usesTeamRanking(match) ? "team" : "player",
        usesRankingKeys: keyBased,
        score: match.resultSummary?.finalScore || "",
      }];
    })));
  }, [matches]);

  useEffect(() => {
    const timer = window.setInterval(() => setNowMs(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!copiedLobbyValue) return undefined;
    const timer = window.setTimeout(() => setCopiedLobbyValue(""), 2_000);
    return () => window.clearTimeout(timer);
  }, [copiedLobbyValue]);

  const orderedMatches = useMemo(
    () =>
      [...matches].sort(
        (first, second) =>
          new Date(first.scheduledFor || first.createdAt) -
          new Date(second.scheduledFor || second.createdAt),
      ),
    [matches],
  );

  const filteredMatches = useMemo(() => {
    if (activeFilter === "live") {
      return orderedMatches.filter((match) => match.status === "live");
    }
    if (activeFilter === "attention") {
      return orderedMatches.filter((match) =>
        ["disputed", "result_pending"].includes(match.status),
      );
    }
    return orderedMatches;
  }, [activeFilter, orderedMatches]);

  const nextActionMatch = useMemo(
    () => [...orderedMatches]
      .filter((match) => Object.hasOwn(operatorActionPriority, match.status))
      .sort((first, second) => {
        const priorityDifference = operatorActionPriority[first.status] - operatorActionPriority[second.status];
        if (priorityDifference) return priorityDifference;
        return new Date(first.scheduledFor || first.createdAt) - new Date(second.scheduledFor || second.createdAt);
      })[0] || null,
    [orderedMatches],
  );

  const claimMatch = async (matchId) => {
    const action = await dispatch(claimOperatorMatch(matchId));
    if (claimOperatorMatch.fulfilled.match(action)) {
      dispatch(fetchOperatorWorkspace());
    }
  };

  const loadMoreMatches = (kind) => {
    const cursor = matchPages[kind]?.nextCursor;
    if (!cursor || matchPageStatus[kind] === "loading") return;
    dispatch(fetchMoreOperatorMatches({ cursor, kind }));
  };

  const executeCommand = async (matchId, command, body) => {
    const action = await dispatch(
      executeOperatorMatchCommand({ matchId, command, body }),
    );
    if (executeOperatorMatchCommand.fulfilled.match(action)) {
      dispatch(fetchOperatorWorkspace());
    }
  };

  const updateResultDraft = (matchId, changes) => {
    setResultDrafts((current) => ({
      ...current,
      [matchId]: { ...current[matchId], ...changes },
    }));
  };

  const moveRankedPlayer = (matchId, playerId, direction) => {
    const field = resultDrafts[matchId]?.usesRankingKeys ? "rankingKeys" : "rankingIds";
    const rankingIds = [...(resultDrafts[matchId]?.[field] || [])];
    const currentIndex = rankingIds.indexOf(playerId);
    const nextIndex = currentIndex + direction;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= rankingIds.length) return;
    [rankingIds[currentIndex], rankingIds[nextIndex]] = [rankingIds[nextIndex], rankingIds[currentIndex]];
    updateResultDraft(matchId, { [field]: rankingIds });
  };

  const moveRankedPlayerToPosition = (matchId, playerId, position) => {
    const field = resultDrafts[matchId]?.usesRankingKeys ? "rankingKeys" : "rankingIds";
    const rankingIds = [...(resultDrafts[matchId]?.[field] || [])];
    const currentIndex = rankingIds.indexOf(playerId);
    const nextIndex = Number(position) - 1;
    if (currentIndex < 0 || nextIndex < 0 || nextIndex >= rankingIds.length || currentIndex === nextIndex) return;
    rankingIds.splice(currentIndex, 1);
    rankingIds.splice(nextIndex, 0, playerId);
    updateResultDraft(matchId, { [field]: rankingIds });
  };

  const openAssignedMatch = (matchId) => {
    const id = String(matchId);
    const selected = matches.find((match) => String(match._id) === id);
    setActiveDesk("matches");
    setActiveFilter("all");
    setExpandedMatchId(id);
    setMatchTabs((current) => ({ ...current, [id]: ["scheduled", "lobby_ready"].includes(selected?.status) ? "lobby" : ["live", "result_pending", "disputed"].includes(selected?.status) ? "results" : "overview" }));
    // A fresh request also scrolls when the same already-open Match is selected again.
    setOpenRequest({ matchId: id });
  };

  const openRoomWork = (room) => {
    if (room.match?.assignedToViewer) openAssignedMatch(room.match.id);
    else if (room.match?.status === "awaiting_operator") setActiveDesk("queue");
  };

  const copyLobbyValue = async (matchId, field, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedLobbyValue(`${matchId}:${field}`);
    } catch {
      setCopiedLobbyValue("");
    }
  };

  if (
    workspaceStatus === "idle" ||
    (workspaceStatus === "loading" && !dashboard)
  ) {
    return <OperationsSkeleton />;
  }

  const isRefreshing = workspaceStatus === "loading";

  const metrics = [
    {
      icon: FiShield,
      label: "Assigned",
      tone: "cyan",
      value: dashboard?.totalAssignedMatches || 0,
    },
    {
      icon: FiActivity,
      label: "Live",
      tone: "emerald",
      value: dashboard?.liveMatches || 0,
    },
    {
      icon: FiAlertTriangle,
      label: "Disputes",
      tone: "rose",
      value: dashboard?.disputedMatches || 0,
    },
    {
      icon: FiClock,
      label: "Results",
      tone: "amber",
      value: dashboard?.resultPendingMatches || 0,
    },
  ];

  return (
    <main className="space-y-4 pb-8 text-slate-100">
      <StaffWorkspaceHeader
        actions={<>
          <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
            <FiWifi className={connected ? "text-emerald-300" : "text-rose-300"} />
            {connected ? "Live" : "Reconnecting"}
          </span>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            disabled={isRefreshing}
            onClick={() => dispatch(fetchOperatorWorkspace())}
            type="button"
          >
            <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing" : "Refresh"}
          </button>
        </>}
        description="Rooms, assigned matches and results."
        title="Match Operator"
      />

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {nextActionMatch ? (
        <NextActionCard
          match={nextActionMatch}
          nowMs={nowMs}
          onOpen={() => openAssignedMatch(nextActionMatch._id)}
        />
      ) : null}

      <StaffWorkspaceTabs activeId={activeDesk} ariaLabel="Match Operator responsibilities" items={[
        { count: activeRooms.length, id: "rooms", label: "Active rooms" },
        { count: unassignedMatches.length, id: "queue", label: "Full rooms" },
        { count: matches.length, id: "matches", label: "Assigned matches" },
      ]} onChange={setActiveDesk} />

      {error ? (
        <StatusMessage
          icon={<FiAlertTriangle />}
          message={error}
          tone="error"
        />
      ) : null}

      {activeDesk === "rooms" ? <section className="rounded-[28px] border border-slate-700/80 bg-slate-950/55 p-4 shadow-[0_18px_50px_rgba(2,8,23,0.26)] sm:p-6">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {activeRooms.map((room) => {
            const percentage = room.capacity ? Math.min(100, Math.round((room.joinedCount / room.capacity) * 100)) : 0;
            return <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-4" key={room.id}>
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-black text-white">{room.title}</h2><p className="mt-1 text-xs capitalize text-slate-400">{room.gameKey} / {room.mode} / {room.map}</p></div><span className="text-sm font-black text-cyan-200">{room.joinedCount}/{room.capacity}</span></div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${percentage}%` }} /></div>
              <p className="mt-3 text-xs font-bold text-slate-400">{room.earlyClosed && room.status === "full" ? "Entry closed · " : ""}{getRoomOperationalLabel(room, percentage)}</p>
              {room.match?.assignedToViewer || room.match?.status === "awaiting_operator" ? (
                <button className="mt-4 w-full rounded-xl border border-cyan-300/25 px-3 py-2 text-xs font-black text-cyan-100 hover:bg-cyan-300/10" onClick={() => openRoomWork(room)} type="button">
                  {room.match.assignedToViewer ? "Open assigned match" : "View assignment queue"}
                </button>
              ) : null}
            </article>;
          })}
          {!activeRooms.length ? <p className="text-sm text-slate-500">No active rooms in your assigned games.</p> : null}
        </div>
      </section> : null}

      {activeDesk === "queue" ? <section className="overflow-hidden rounded-[28px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(120,53,15,0.13),rgba(15,23,42,0.88)_42%)] shadow-[0_18px_50px_rgba(2,8,23,0.26)]">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-700/70 px-5 py-5 sm:px-6">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-200">
              <FiRadio />
              Assignment queue
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Ready for pickup
            </h2>
          </div>
          <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-black text-amber-100">
            {unassignedMatches.length} waiting
          </span>
        </div>

        <div className="p-4 sm:p-6">
          {unassignedMatches.length > 0 ? (
            <div className="grid gap-4 xl:grid-cols-2">
              {unassignedMatches.map((match) => (
                <AssignmentCard
                  actionBusy={Boolean(activeAction)}
                  isClaiming={activeAction === `${match._id}:claim`}
                  key={match._id}
                  match={match}
                  onClaim={claimMatch}
                />
              ))}
            </div>
          ) : (
            <AssignmentEmptyState />
          )}
          {matchPages.unassigned.hasMore ? (
            <button
              className="mt-5 rounded-xl border border-amber-300/30 px-5 py-3 text-sm font-black text-amber-100 disabled:opacity-50"
              disabled={matchPageStatus.unassigned === "loading"}
              onClick={() => loadMoreMatches("unassigned")}
              type="button"
            >
              {matchPageStatus.unassigned === "loading" ? "Loading..." : "Load more available matches"}
            </button>
          ) : null}
        </div>
      </section> : null}

      {activeDesk === "matches" ? <section className="rounded-[28px] border border-slate-700/80 bg-slate-950/55 shadow-[0_18px_50px_rgba(2,8,23,0.26)]">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-700/70 px-5 py-5 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              Your shift
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Assigned matches
            </h2>
          </div>
          <div className="flex max-w-full gap-1 overflow-x-auto rounded-xl border border-slate-700 bg-slate-900/80 p-1">
            {matchFilters.map((filter) => (
              <button
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-black transition ${
                  activeFilter === filter.id
                    ? "bg-cyan-300 text-slate-950"
                    : "text-slate-400 hover:text-white"
                }`}
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                type="button"
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4 sm:p-6">
          {openRequest && !matches.some((match) => String(match._id) === openRequest.matchId) ? (
            <p role="status" className="rounded-xl bg-amber-300/10 p-3 text-sm text-amber-100">
              This assigned match is not in the loaded page. Load more assigned matches below, or refresh if its assignment has changed.
            </p>
          ) : null}
          {filteredMatches.map((match) => (
            <AssignedMatchCard
              activeAction={activeAction}
              expanded={expandedMatchId === match._id}
              key={match._id}
              match={match}
              resultDraft={resultDrafts[match._id] || { proofNote: "", rankingIds: [], score: "" }}
              onToggle={() =>
                setExpandedMatchId((current) =>
                  current === match._id ? "" : match._id,
                )
              }
              onUpdateResultDraft={updateResultDraft}
              onMoveRankedPlayer={moveRankedPlayer}
              onMoveRankedPlayerToPosition={moveRankedPlayerToPosition}
              onExecuteCommand={executeCommand}
              copiedLobbyValue={copiedLobbyValue}
              lobbyRevealed={Boolean(revealedLobbyIds[match._id])}
              nowMs={nowMs}
              activeTab={matchTabs[match._id] || "overview"}
              onTabChange={(tab) => setMatchTabs((current) => ({ ...current, [match._id]: tab }))}
              onOpenChat={() => setChatMatchId(String(match._id))}
              onCopyLobbyValue={copyLobbyValue}
              onToggleLobby={() => setRevealedLobbyIds((current) => ({ ...current, [match._id]: !current[match._id] }))}
            />
          ))}

          {filteredMatches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/35 px-5 py-10 text-center">
              <FiShield className="mx-auto text-3xl text-slate-600" />
              <p className="mt-3 font-black text-white">
                {matches.length === 0
                  ? "Your shift is clear"
                  : "Nothing in this view"}
              </p>
              <p className="mt-1 text-sm text-slate-400">
                {matches.length === 0
                  ? "Take a match from the assignment queue when one arrives."
                  : "Choose another filter to see your assigned matches."}
              </p>
            </div>
          ) : null}
          {matchPages.assigned.hasMore ? (
            <button
              className="rounded-xl border border-cyan-300/30 px-5 py-3 text-sm font-black text-cyan-100 disabled:opacity-50"
              disabled={matchPageStatus.assigned === "loading"}
              onClick={() => loadMoreMatches("assigned")}
              type="button"
            >
              {matchPageStatus.assigned === "loading" ? "Loading..." : "Load more assigned matches"}
            </button>
          ) : null}
        </div>
      </section> : null}
      {chatMatchId && matches.some((match) => String(match._id) === chatMatchId) ? (
        <OperatorChatWindow
          match={matches.find((match) => String(match._id) === chatMatchId)}
          onClose={() => setChatMatchId("")}
        />
      ) : null}
    </main>
  );
};

const NextActionCard = ({ match, nowMs, onOpen }) => (
  <section className="overflow-hidden rounded-2xl border border-cyan-300/25 bg-[linear-gradient(120deg,rgba(8,145,178,0.16),rgba(15,23,42,0.92)_55%)] shadow-[0_16px_44px_rgba(2,8,23,0.24)]">
    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
          <FiRadio /> Next action
        </p>
        <h2 className="mt-2 truncate text-lg font-black text-white">{match.title || "Assigned match"}</h2>
        <p className="mt-1 text-sm leading-6 text-slate-300">{getNextActionCopy(match, nowMs)}</p>
      </div>
      <button className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200" onClick={onOpen} type="button">
        Open match <FiArrowRight />
      </button>
    </div>
  </section>
);

const MetricCard = ({ icon: Icon, label, tone, value }) => {
  const tones = {
    amber: "bg-amber-300/10 text-amber-200",
    cyan: "bg-cyan-300/10 text-cyan-200",
    emerald: "bg-emerald-300/10 text-emerald-200",
    rose: "bg-rose-300/10 text-rose-200",
  };

  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
      <div className="flex items-center justify-between gap-3">
        <span className={`rounded-lg p-2 ${tones[tone]}`}>
          <Icon />
        </span>
        <span className="text-xl font-black text-white">
          {value}
        </span>
      </div>
      <p className="mt-2 text-xs font-bold text-slate-400">
        {label}
      </p>
    </article>
  );
};

const StatusMessage = ({ icon, message, tone }) => (
  <div
    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-bold ${
      tone === "error"
        ? "border-rose-300/25 bg-rose-300/10 text-rose-100"
        : "border-emerald-300/25 bg-emerald-300/10 text-emerald-100"
    }`}
  >
    <span className="text-lg">{icon}</span>
    {message}
  </div>
);

const AssignmentCard = ({
  actionBusy,
  isClaiming,
  match,
  onClaim,
}) => (
  <article className="relative overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/85 p-5">
    <div className="absolute inset-y-0 left-0 w-1 bg-amber-300" />
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.17em] text-amber-200">
          {isEventMatch(match)
            ? `Event batch ${match.eventBatch?.ordinal || ""} / `
            : ""}
          {getMatchGameLabel(match)} / {match.mode || "Format"}
        </p>
        <h3 className="mt-2 truncate text-xl font-black text-white">
          {match.title || "Tournament match"}
        </h3>
      </div>
      <span className="shrink-0 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-amber-100">
        Ready
      </span>
    </div>

    <div className="mt-5 flex flex-wrap gap-2 text-xs font-bold text-slate-300">
      <span className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2">
        <FiUsers className="text-cyan-300" />
        {match.participants?.length || 0} players
      </span>
      <span className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 capitalize">
        <FiActivity className="text-cyan-300" />
        {match.map && match.map !== "none" ? match.map : "Map pending"}
      </span>
    </div>

    <button
      className="mt-5 inline-flex w-full items-center justify-between rounded-xl bg-amber-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-amber-200 disabled:cursor-wait disabled:opacity-60"
      disabled={actionBusy}
      onClick={() => onClaim(match._id)}
      type="button"
    >
      {isClaiming ? "Adding to your shift..." : "Take this match"}
      <FiArrowRight />
    </button>
  </article>
);

const AssignmentEmptyState = () => (
  <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-700 bg-slate-900/35 px-5 py-10 text-center">
    <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-full border border-cyan-300/10">
      <span className="absolute inset-3 rounded-full border border-cyan-300/10" />
      <span className="absolute inset-7 rounded-full bg-cyan-300/10 shadow-[0_0_30px_rgba(34,211,238,0.15)]" />
      <FiRadio className="relative text-2xl text-cyan-300" />
    </div>
    <h3 className="mt-5 text-xl font-black text-white">Queue is clear</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-400">
      New rooms ready for play will appear here automatically while your shift is
      active.
    </p>
  </div>
);

const AssignedMatchCard = ({
  activeAction,
  activeTab,
  copiedLobbyValue,
  expanded,
  lobbyRevealed,
  match,
  nowMs,
  onCopyLobbyValue,
  resultDraft,
  onMoveRankedPlayer,
  onMoveRankedPlayerToPosition,
  onToggle,
  onToggleLobby,
  onUpdateResultDraft,
  onExecuteCommand,
  onTabChange,
  onOpenChat,
}) => {
  const participantCount = match.participants?.length || 0;
  const presentation =
    statusPresentation[match.status] || statusPresentation.scheduled;
  const availableCommand = operatorCommands[match.status] || null;
  const isCommandBusy = activeAction === `${match._id}:command`;
  const rankedEvent = match.eventBatch?.format === "ranked_stages";

  return (
    <article id={`assigned-match-${match._id}`} tabIndex={-1} className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/65 focus:outline-none focus:ring-2 focus:ring-cyan-300/60">
      <button
        aria-expanded={expanded}
        aria-controls={`match-details-${match._id}`}
        className="flex w-full flex-wrap items-center justify-between gap-4 p-4 text-left sm:p-5"
        onClick={onToggle}
        type="button"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-300/10 font-black text-cyan-200">
            {getMatchGameLabel(match).slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-black text-white">{match.title}</h3>
            <p className="mt-1 truncate text-xs capitalize text-slate-400">
              {isEventMatch(match)
                ? `Event batch ${match.eventBatch?.ordinal || ""} / `
                : ""}
              {match.mode || "Format"} /{" "}
              {match.map && match.map !== "none" ? match.map : "Map pending"}
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className={`rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.13em] ${presentation.style}`}
          >
            {presentation.label}
          </span>
          <FiChevronDown
            className={`text-slate-400 transition ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded ? (
        <div id={`match-details-${match._id}`} className="border-t border-slate-700/80 p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="min-w-0 flex-1">
              <StaffWorkspaceTabs
                activeId={activeTab}
                ariaLabel={`Match sections for ${match.title}`}
                items={[{ id: "overview", label: "Overview" }, { id: "players", label: "Players", count: participantCount }, { id: "lobby", label: "Lobby" }, { id: "results", label: "Results" }]}
                onChange={onTabChange}
              />
            </div>
            <button type="button" onClick={onOpenChat} className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 px-3 py-3 text-sm font-bold text-cyan-200">
              <FiMessageSquare /> Open chat
            </button>
          </div>
          {activeTab === "overview" ? <div className="grid gap-3 sm:grid-cols-3">
            <MatchFact
              icon={<FiClock />}
              label="Schedule"
              value={formatMatchSchedule(match, nowMs)}
            />
            <MatchFact
              icon={<FiUsers />}
              label="Lineup"
              value={`${participantCount} players`}
            />
            <MatchFact
              icon={<FiShield />}
              label="Match ID"
              value={String(match._id).slice(-8).toUpperCase()}
            />
          </div> : null}

          <div className="mt-4 space-y-4">
            {activeTab === "overview" || (activeTab === "lobby" && availableCommand?.command === "start") || (activeTab === "results" && availableCommand?.command === "verify_result") ? <div className="rounded-2xl border border-slate-700 bg-slate-950/45 p-4">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Current stage
              </p>
              <p className="mt-2 text-lg font-black text-white">
                {presentation.label}
              </p>

              {availableCommand ? (
                <div className="mt-4 rounded-xl border border-cyan-300/20 bg-cyan-300/5 p-3">
                  <p className="text-sm leading-6 text-slate-300">
                    {availableCommand.description}
                  </p>
                  <button
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 disabled:cursor-wait disabled:opacity-60"
                    disabled={isCommandBusy}
                    onClick={() =>
                      onExecuteCommand(match._id, availableCommand.command)
                    }
                    type="button"
                  >
                    {isCommandBusy ? "Working..." : availableCommand.label}
                    <FiArrowRight />
                  </button>
                </div>
              ) : (
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {match.status === "operator_assigned"
                    ? "Waiting for the Game Manager to confirm schedule and lobby access."
                    : "The next action depends on the Match result or platform review."}
                </p>
              )}

            </div> : null}
            {activeTab === "players" ? <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Player lineup
              </p>
              <div className="mt-2 max-h-52 space-y-2 overflow-y-auto pr-1">
                {(match.participants || []).map((participant) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2.5 text-xs"
                    key={participant.user?._id || participant.displayName}
                  >
                    <span className="truncate font-bold text-slate-200">
                      {participant.user?.profile?.username ||
                        participant.displayName}
                    </span>
                    <span className="text-slate-500">Seat</span>
                  </div>
                ))}
              </div>
            </div> : null}

            {activeTab === "lobby" ? <div className="rounded-2xl border border-slate-700 bg-slate-950/45 p-5">
              <LobbyAccess
                copiedValue={copiedLobbyValue}
                match={match}
                nowMs={nowMs}
                onCopy={onCopyLobbyValue}
                onToggle={onToggleLobby}
                revealed={lobbyRevealed}
              />
            </div> : null}
          </div>

          {activeTab === "results" && (rankedEvent || match.quickMatchOffering) && match.status === "live" ? (
            <RankedResultEditor
              isBusy={isCommandBusy}
              match={match}
              onMove={onMoveRankedPlayer}
              onMoveToPosition={onMoveRankedPlayerToPosition}
              onSubmit={(body) => onExecuteCommand(match._id, "record_result", body)}
              onUpdate={onUpdateResultDraft}
              resultDraft={resultDraft}
              tournament={Boolean(match.quickMatchOffering)}
            />
          ) : null}

          {activeTab === "results" && (match.resultSummary?.submittedBy || match.status === "disputed") ? (
            <ResultEvidence match={match} />
          ) : null}
          {activeTab === "results" && !match.resultSummary?.submittedBy && match.status !== "disputed" && !((rankedEvent || match.quickMatchOffering) && match.status === "live") ? (
            <p className="py-6 text-sm text-slate-400">No result has been submitted. Ranking entry becomes available for supported matches once play is live.</p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
};

const OperatorChatWindow = ({ match, onClose }) => {
  const dialogRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);
  return createPortal(
    <dialog ref={dialogRef} onCancel={onClose} aria-labelledby="operator-chat-title" className="m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-4 text-white shadow-2xl backdrop:bg-black/70 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 id="operator-chat-title" className="break-words font-black">{match.title} — Match chat</h2>
          <p className="mt-1 text-xs text-slate-400">Private conversation with this Match’s participants</p>
        </div>
        <button type="button" aria-label="Close match chat" onClick={onClose} className="shrink-0 rounded-lg border border-slate-700 p-2"><FiX /></button>
      </div>
      <MatchChat audience="operator" matchId={String(match._id)} />
    </dialog>, document.body,
  );
};

OperatorChatWindow.propTypes = { match: PropTypes.object.isRequired, onClose: PropTypes.func.isRequired };

const LobbyAccess = ({ copiedValue, match, nowMs, onCopy, onToggle, revealed }) => {
  const roomCode = match.lobby?.roomCode || "";
  const roomPassword = match.lobby?.roomPassword || "";
  const hasLobby = Boolean(roomCode || roomPassword || match.lobby?.instructions);
  const copied = (field) => copiedValue === `${match._id}:${field}`;

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-200">Lobby access</p>
          <h4 className="mt-1 font-black text-white">Game Manager schedule</h4>
        </div>
        {roomPassword ? (
          <button aria-label={revealed ? "Hide lobby password" : "Reveal lobby password"} className="rounded-lg border border-slate-700 p-2 text-slate-300 hover:text-white" onClick={onToggle} type="button">
            {revealed ? <FiEyeOff /> : <FiEye />}
          </button>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        {match.scheduledFor ? formatMatchSchedule(match, nowMs) : "Schedule and lobby access are pending."}
      </p>
      {hasLobby ? (
        <div className="mt-4 space-y-2">
          <LobbyCredential label="Room ID" onCopy={() => onCopy(match._id, "room", roomCode)} value={roomCode} copied={copied("room")} />
          <LobbyCredential label="Password" onCopy={() => onCopy(match._id, "password", roomPassword)} value={roomPassword ? (revealed ? roomPassword : "••••••••") : "Not provided"} copied={copied("password")} copyDisabled={!roomPassword} />
          {match.lobby?.instructions ? <p className="rounded-xl bg-slate-900 px-3 py-2 text-xs leading-5 text-slate-300"><strong className="text-white">Instructions:</strong> {match.lobby.instructions}</p> : null}
        </div>
      ) : (
        <p className="mt-4 rounded-xl border border-dashed border-slate-700 px-3 py-3 text-xs text-slate-500">Lobby ID and password will appear here after the Game Manager publishes them.</p>
      )}
    </>
  );
};

const LobbyCredential = ({ copied, copyDisabled = false, label, onCopy, value }) => (
  <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-3 py-2">
    <div className="min-w-0">
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-1 truncate font-mono text-sm font-bold text-white">{value || "Not provided"}</p>
    </div>
    <button className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-700 px-2.5 py-2 text-xs font-bold text-slate-300 disabled:opacity-40" disabled={copyDisabled || !value} onClick={onCopy} type="button">
      <FiCopy /> {copied ? "Copied" : "Copy"}
    </button>
  </div>
);

const RankedResultEditor = ({ isBusy, match, onMove, onMoveToPosition, onSubmit, onUpdate, resultDraft, tournament = false }) => {
  const participantById = new Map(
    (match.participants || []).map((participant) => [getParticipantId(participant), participant]),
  );
  const teamRanking = usesTeamRanking(match);
  const keyBased = usesRankingKeys(match);
  const groups = keyBased ? getCompetitionRankingGroups(match) : [];
  const groupById = new Map(groups.map((group) => [group.key, group]));
  const rankingIds = keyBased ? (resultDraft.rankingKeys || []) : (resultDraft.rankingIds || []);
  const expectedSize = keyBased ? groupById.size : participantById.size;
  const canSubmit =
    resultDraft.score.trim().length > 0 &&
    rankingIds.length === expectedSize &&
    new Set(rankingIds).size === expectedSize;

  return (
    <section className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-200">Ranked room result</p>
          <h4 className="mt-1 font-black text-white">Order every {teamRanking ? "team" : "player"} from first to last</h4>
          <p className="mt-1 text-xs text-slate-400">
            {tournament ? "Configured place rewards are applied only after governance verification and settlement." : `Top ${match.eventBatch?.stage?.advanceCount || 0} ${teamRanking ? "teams" : "players"} will qualify after verification and the dispute window.`}
          </p>
        </div>
        <span className="rounded-full border border-emerald-300/20 px-3 py-1 text-xs font-bold text-emerald-100">
          {rankingIds.length}/{expectedSize} ranked
        </span>
      </div>

      <div className="mt-4 max-h-80 space-y-2 overflow-y-auto pr-1">
        {rankingIds.map((playerId, index) => (
          <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-slate-700 bg-slate-950/70 px-3 py-2" key={playerId}>
            <span className="text-center text-sm font-black text-emerald-200">#{index + 1}</span>
            <span className="min-w-0 text-sm font-bold text-white">{keyBased ? <><span className="block truncate">{groupById.get(playerId)?.name || "Team"}</span>{teamRanking ? <small className="block truncate font-medium text-slate-500">{(groupById.get(playerId)?.participants || []).map(getParticipantName).join(", ")}</small> : null}</> : getParticipantName(participantById.get(playerId))}</span>
            <div className="flex items-center gap-1">
              <label className="sr-only" htmlFor={`rank-${match._id}-${playerId}`}>Placement for {keyBased ? groupById.get(playerId)?.name || "team" : getParticipantName(participantById.get(playerId))}</label>
              <select className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-white" id={`rank-${match._id}-${playerId}`} onChange={(event) => onMoveToPosition(match._id, playerId, event.target.value)} value={index + 1}>
                {rankingIds.map((_, position) => <option key={position + 1} value={position + 1}>#{position + 1}</option>)}
              </select>
              <button aria-label={`Move ${playerId} up`} className="rounded-lg border border-slate-700 px-2 py-1 text-xs disabled:opacity-30" disabled={index === 0} onClick={() => onMove(match._id, playerId, -1)} type="button">Up</button>
              <button aria-label={`Move ${playerId} down`} className="rounded-lg border border-slate-700 px-2 py-1 text-xs disabled:opacity-30" disabled={index === rankingIds.length - 1} onClick={() => onMove(match._id, playerId, 1)} type="button">Down</button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          Result summary
          <input className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm normal-case tracking-normal text-white" maxLength={200} onChange={(event) => onUpdate(match._id, { score: event.target.value })} placeholder="Example: Room 12 final ranking" value={resultDraft.score} />
        </label>
        <label className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
          Evidence note
          <input className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm normal-case tracking-normal text-white" maxLength={1000} onChange={(event) => onUpdate(match._id, { proofNote: event.target.value })} placeholder="Observed scoreboard or evidence" value={resultDraft.proofNote} />
        </label>
      </div>
      <button className="mt-4 w-full rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={isBusy || !canSubmit} onClick={() => onSubmit({ proofNote: resultDraft.proofNote, ...(keyBased ? { rankingKeys: rankingIds } : { rankingIds }), score: resultDraft.score })} type="button">
        {isBusy ? "Saving ranking..." : "Save ranked result"}
      </button>
    </section>
  );
};

const ResultEvidence = ({ match }) => {
  const result = match.resultSummary || {};
  const deadline = result.disputeDeadline
    ? formatDateTime(result.disputeDeadline)
    : "Not opened";

  return (
    <div className="mt-4 rounded-2xl border border-orange-300/20 bg-orange-300/5 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-orange-200">
        Result and dispute evidence
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MatchFact
          icon={<FiActivity />}
          label="Submitted score"
          value={result.finalScore || "Awaiting score"}
        />
        <MatchFact
          icon={<FiClock />}
          label="Dispute deadline"
          value={deadline}
        />
        <MatchFact
          icon={<FiAlertTriangle />}
          label="Dispute"
          value={result.disputeNote || "No dispute raised"}
        />
        <MatchFact
          icon={<FiCheckCircle />}
          label="Resolution"
          value={result.disputeResolutionNote || "Not resolved"}
        />
      </div>
      {result.proofNote ? (
        <p className="mt-3 rounded-xl bg-slate-950/50 px-3 py-3 text-sm leading-6 text-slate-300">
          <span className="font-black text-white">Result evidence:</span>{" "}
          {result.proofNote}
        </p>
      ) : null}
      {result.placementRanking?.length || result.rankingIds?.length ? (
        <div className="mt-3 rounded-xl border border-orange-300/15 bg-slate-950/50 p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-orange-200">Verified room order</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {(result.placementRanking?.length ? result.placementRanking : result.rankingIds).map((entry, index) => {
              if (result.placementRanking?.length) {
                const key = String(entry.key || entry.team?._id || entry.team || entry.playerIds?.[0] || index);
                return <span className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-200" key={key}>#{entry.place || index + 1} {entry.name || "Team"}</span>;
              }
              const playerId = String(entry?._id || entry);
              const participant = match.participants?.find((item) => getParticipantId(item) === playerId);
              return <span className="rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-bold text-slate-200" key={playerId}>#{index + 1} {getParticipantName(participant)}</span>;
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
};

const MatchFact = ({ icon, label, value }) => (
  <div className="rounded-xl border border-slate-700 bg-slate-950/40 p-3">
    <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
      <span className="text-cyan-300">{icon}</span>
      {label}
    </p>
    <p className="mt-2 truncate text-sm font-black text-white">{value}</p>
  </div>
);

const OperationsSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-20 rounded-2xl bg-slate-800/80" />
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="h-20 rounded-xl bg-slate-800/80" key={index} />
      ))}
    </div>
    <div className="h-72 rounded-[28px] bg-slate-800/80" />
  </div>
);

NextActionCard.propTypes = {
  match: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    createdAt: PropTypes.string,
    scheduledFor: PropTypes.string,
    status: PropTypes.string.isRequired,
    title: PropTypes.string,
  }).isRequired,
  nowMs: PropTypes.number.isRequired,
  onOpen: PropTypes.func.isRequired,
};

MetricCard.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["amber", "cyan", "emerald", "rose"]).isRequired,
  value: PropTypes.number.isRequired,
};

StatusMessage.propTypes = {
  icon: PropTypes.node.isRequired,
  message: PropTypes.string.isRequired,
  tone: PropTypes.oneOf(["error", "success"]).isRequired,
};

const matchPropType = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  createdAt: PropTypes.string,
  game: PropTypes.string,
  gameKey: PropTypes.string,
  gameRef: PropTypes.shape({ name: PropTypes.string }),
  // Queue refreshes may carry only the safe EventBatch ID; expanded detail
  // populates the same field with its bounded Event execution summary.
  eventBatch: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      _id: PropTypes.string,
      format: PropTypes.string,
      eventRun: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      ordinal: PropTypes.number,
      stage: PropTypes.oneOfType([PropTypes.string, PropTypes.shape({
        _id: PropTypes.string,
        advanceCount: PropTypes.number,
        number: PropTypes.number,
        participantsPerMatch: PropTypes.number,
        qualificationRule: PropTypes.string,
        teamSize: PropTypes.number,
      })]),
    }),
  ]),
  source: PropTypes.string,
  lobby: PropTypes.shape({
    publishedAt: PropTypes.string,
    roomCode: PropTypes.string,
    roomPassword: PropTypes.string,
    instructions: PropTypes.string,
  }),
  map: PropTypes.string,
  mode: PropTypes.string,
  quickMatchOffering: PropTypes.shape({
    rewardPolicy: PropTypes.string,
    teamSize: PropTypes.number,
  }),
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      checkedIn: PropTypes.bool,
      competitionUnitKey: PropTypes.string,
      competitionUnitName: PropTypes.string,
      displayName: PropTypes.string,
      team: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      // Queue summaries intentionally keep participant identity as an ID,
      // while assigned-match detail may populate the safe display profile.
      user: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.shape({
          _id: PropTypes.string,
          profile: PropTypes.shape({ username: PropTypes.string }),
        }),
      ]),
    }),
  ),
  scheduledFor: PropTypes.string,
  resultSummary: PropTypes.shape({
    disputeDeadline: PropTypes.string,
    disputeNote: PropTypes.string,
    disputeResolutionNote: PropTypes.string,
    finalScore: PropTypes.string,
    proofNote: PropTypes.string,
    placementRanking: PropTypes.arrayOf(PropTypes.object),
    rankingIds: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object])),
    submittedBy: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  }),
  status: PropTypes.string,
  title: PropTypes.string,
});

AssignmentCard.propTypes = {
  actionBusy: PropTypes.bool.isRequired,
  isClaiming: PropTypes.bool.isRequired,
  match: matchPropType.isRequired,
  onClaim: PropTypes.func.isRequired,
};

AssignedMatchCard.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onTabChange: PropTypes.func.isRequired,
  onOpenChat: PropTypes.func.isRequired,
  activeAction: PropTypes.string.isRequired,
  copiedLobbyValue: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
  lobbyRevealed: PropTypes.bool.isRequired,
  match: matchPropType.isRequired,
  nowMs: PropTypes.number.isRequired,
  onCopyLobbyValue: PropTypes.func.isRequired,
  resultDraft: PropTypes.shape({
    proofNote: PropTypes.string.isRequired,
    rankingIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    rankingKeys: PropTypes.arrayOf(PropTypes.string),
    rankingUnit: PropTypes.oneOf(["player", "team"]),
    score: PropTypes.string.isRequired,
    usesRankingKeys: PropTypes.bool,
  }).isRequired,
  onMoveRankedPlayer: PropTypes.func.isRequired,
  onMoveRankedPlayerToPosition: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onToggleLobby: PropTypes.func.isRequired,
  onUpdateResultDraft: PropTypes.func.isRequired,
  onExecuteCommand: PropTypes.func.isRequired,
};

LobbyAccess.propTypes = {
  copiedValue: PropTypes.string.isRequired,
  match: matchPropType.isRequired,
  nowMs: PropTypes.number.isRequired,
  onCopy: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  revealed: PropTypes.bool.isRequired,
};

LobbyCredential.propTypes = {
  copied: PropTypes.bool.isRequired,
  copyDisabled: PropTypes.bool,
  label: PropTypes.string.isRequired,
  onCopy: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

RankedResultEditor.propTypes = {
  isBusy: PropTypes.bool.isRequired,
  match: matchPropType.isRequired,
  onMove: PropTypes.func.isRequired,
  onMoveToPosition: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
  resultDraft: PropTypes.shape({
    proofNote: PropTypes.string.isRequired,
    rankingIds: PropTypes.arrayOf(PropTypes.string).isRequired,
    rankingKeys: PropTypes.arrayOf(PropTypes.string),
    rankingUnit: PropTypes.oneOf(["player", "team"]),
    score: PropTypes.string.isRequired,
    usesRankingKeys: PropTypes.bool,
  }).isRequired,
  tournament: PropTypes.bool,
};

ResultEvidence.propTypes = {
  match: matchPropType.isRequired,
};

MatchFact.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default Operations;
