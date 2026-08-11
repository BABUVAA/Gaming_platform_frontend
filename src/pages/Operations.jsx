import { useCallback, useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  FiActivity,
  FiAlertTriangle,
  FiArrowRight,
  FiCheckCircle,
  FiChevronDown,
  FiClock,
  FiRadio,
  FiRefreshCw,
  FiShield,
  FiUsers,
  FiWifi,
} from "react-icons/fi";
import useSocket from "../context/useSocket";
import {
  claimOperatorMatch,
  executeOperatorMatchCommand,
  fetchOperatorWorkspace,
  publishOperatorLobby,
} from "../store/slices/operatorOperationsSlice";
import {
  selectOperatorActiveAction,
  selectOperatorDashboard,
  selectOperatorMatches,
  selectOperatorWorkspaceError,
  selectOperatorWorkspaceStatus,
  selectUnassignedOperatorMatches,
} from "../store/selectors/operatorOperationsSelectors";

const operatorCommands = Object.freeze({
  operator_assigned: {
    command: "prepare",
    description: "Open this room for player check-in and lobby preparation.",
    label: "Open check-in",
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
    label: "Check-in",
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

const emptyLobby = {
  roomCode: "",
  roomPassword: "",
  instructions: "",
};

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

const Operations = () => {
  const { competitionRevision, connected } = useSocket();
  const dispatch = useDispatch();
  const dashboard = useSelector(selectOperatorDashboard);
  const matches = useSelector(selectOperatorMatches);
  const unassignedMatches = useSelector(selectUnassignedOperatorMatches);
  const workspaceStatus = useSelector(selectOperatorWorkspaceStatus);
  const error = useSelector(selectOperatorWorkspaceError);
  const activeAction = useSelector(selectOperatorActiveAction);
  const [lobbyDrafts, setLobbyDrafts] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [expandedMatchId, setExpandedMatchId] = useState("");

  const syncLobbyDrafts = useCallback((incomingMatches) => {
    // Drafts are keyed by match so opening one command panel never overwrites
    // unsent lobby values prepared for another match.
    const drafts = incomingMatches.reduce((result, match) => {
      result[match._id] = {
        roomCode: match.lobby?.roomCode || "",
        roomPassword: match.lobby?.roomPassword || "",
        instructions: match.lobby?.instructions || "",
      };
      return result;
    }, {});
    setLobbyDrafts(drafts);
  }, []);

  useEffect(() => {
    const request = dispatch(fetchOperatorWorkspace());
    return () => request.abort();
  }, [competitionRevision, dispatch]);

  useEffect(() => {
    syncLobbyDrafts(matches);
  }, [matches, syncLobbyDrafts]);

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

  const claimMatch = async (matchId) => {
    const action = await dispatch(claimOperatorMatch(matchId));
    if (claimOperatorMatch.fulfilled.match(action)) {
      dispatch(fetchOperatorWorkspace());
    }
  };

  const executeCommand = async (matchId, command) => {
    const action = await dispatch(
      executeOperatorMatchCommand({ matchId, command }),
    );
    if (executeOperatorMatchCommand.fulfilled.match(action)) {
      dispatch(fetchOperatorWorkspace());
    }
  };

  const updateLobbyDraft = (matchId, field, value) => {
    setLobbyDrafts((current) => ({
      ...current,
      [matchId]: {
        ...(current[matchId] || emptyLobby),
        [field]: value,
      },
    }));
  };

  const publishLobby = async (matchId) => {
    const action = await dispatch(
      publishOperatorLobby({
        matchId,
        lobby: lobbyDrafts[matchId] || emptyLobby,
      }),
    );
    if (publishOperatorLobby.fulfilled.match(action)) {
      dispatch(fetchOperatorWorkspace());
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
    <main className="relative isolate space-y-5 overflow-hidden pb-8 text-slate-100">
      <div className="pointer-events-none absolute -right-32 top-24 -z-10 h-80 w-80 rounded-full bg-cyan-400/10 blur-[100px]" />

      <header className="relative overflow-hidden rounded-[30px] border border-slate-700/80 bg-[radial-gradient(circle_at_85%_20%,rgba(34,211,238,0.16),transparent_25%),linear-gradient(135deg,#101b2d_0%,#0b1322_55%,#080f1c_100%)] p-5 shadow-[0_24px_70px_rgba(2,8,23,0.38)] sm:p-7">
        <div className="absolute right-8 top-1/2 hidden h-36 w-36 -translate-y-1/2 rounded-full border border-cyan-300/10 lg:block">
          <div className="absolute inset-5 rounded-full border border-cyan-300/10" />
          <div className="absolute inset-12 rounded-full bg-cyan-300/10 shadow-[0_0_45px_rgba(34,211,238,0.2)]" />
        </div>

        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_12px_#6ee7b7]" />
                Shift active
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-bold text-slate-400">
                <FiWifi className={connected ? "text-cyan-300" : "text-rose-300"} />
                {connected ? "Live updates on" : "Reconnecting"}
              </span>
            </div>
            <h1 className="mt-5 text-4xl font-black tracking-[-0.045em] text-white sm:text-5xl">
              Match <span className="text-cyan-300">Control</span>
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-300">
              Pick up ready matches, watch your shift, and keep every room
              moving from one focused desk.
            </p>
          </div>

          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-900/70 px-4 py-3 text-sm font-black text-white transition hover:border-cyan-300/40 hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"
            disabled={isRefreshing}
            onClick={() => dispatch(fetchOperatorWorkspace())}
            type="button"
          >
            <FiRefreshCw className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Syncing" : "Refresh"}
          </button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {metrics.map((metric) => (
          <MetricCard key={metric.label} {...metric} />
        ))}
      </section>

      {error ? (
        <StatusMessage
          icon={<FiAlertTriangle />}
          message={error}
          tone="error"
        />
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-amber-300/15 bg-[linear-gradient(135deg,rgba(120,53,15,0.13),rgba(15,23,42,0.88)_42%)] shadow-[0_18px_50px_rgba(2,8,23,0.26)]">
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
        </div>
      </section>

      <section className="rounded-[28px] border border-slate-700/80 bg-slate-950/55 shadow-[0_18px_50px_rgba(2,8,23,0.26)]">
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
          {filteredMatches.map((match) => (
            <AssignedMatchCard
              activeAction={activeAction}
              expanded={expandedMatchId === match._id}
              key={match._id}
              lobbyDraft={lobbyDrafts[match._id] || emptyLobby}
              match={match}
              onPublishLobby={publishLobby}
              onToggle={() =>
                setExpandedMatchId((current) =>
                  current === match._id ? "" : match._id,
                )
              }
              onUpdateLobbyDraft={updateLobbyDraft}
              onExecuteCommand={executeCommand}
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
        </div>
      </section>
    </main>
  );
};

const MetricCard = ({ icon: Icon, label, tone, value }) => {
  const tones = {
    amber: "bg-amber-300/10 text-amber-200",
    cyan: "bg-cyan-300/10 text-cyan-200",
    emerald: "bg-emerald-300/10 text-emerald-200",
    rose: "bg-rose-300/10 text-rose-200",
  };

  return (
    <article className="group rounded-2xl border border-slate-700/80 bg-slate-900/75 p-4 transition hover:-translate-y-0.5 hover:border-slate-600 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <span className={`rounded-xl p-2.5 ${tones[tone]}`}>
          <Icon />
        </span>
        <span className="text-3xl font-black tracking-[-0.04em] text-white">
          {value}
        </span>
      </div>
      <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
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
      New full rooms will appear here automatically while your shift is
      active.
    </p>
  </div>
);

const AssignedMatchCard = ({
  activeAction,
  expanded,
  lobbyDraft,
  match,
  onPublishLobby,
  onToggle,
  onUpdateLobbyDraft,
  onExecuteCommand,
}) => {
  const checkedInCount = (match.participants || []).filter(
    (participant) => participant.checkedIn,
  ).length;
  const participantCount = match.participants?.length || 0;
  const presentation =
    statusPresentation[match.status] || statusPresentation.scheduled;
  const availableCommand = operatorCommands[match.status] || null;
  const canEditLobby = ["scheduled", "check_in", "lobby_ready"].includes(
    match.status,
  );
  const isCommandBusy = activeAction === `${match._id}:command`;
  const isLobbyBusy = activeAction === `${match._id}:lobby`;

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-900/65">
      <button
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
        <div className="border-t border-slate-700/80 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <MatchFact
              icon={<FiClock />}
              label="Schedule"
              value={formatDateTime(match.scheduledFor)}
            />
            <MatchFact
              icon={<FiUsers />}
              label="Check-ins"
              value={`${checkedInCount}/${participantCount}`}
            />
            <MatchFact
              icon={<FiShield />}
              label="Match ID"
              value={String(match._id).slice(-8).toUpperCase()}
            />
          </div>

          <div className="mt-4 grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-2xl border border-slate-700 bg-slate-950/45 p-4">
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
                  The next action depends on player check-in, result submission,
                  dispute review, or platform administration.
                </p>
              )}

              <p className="mt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
                Player readiness
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
                    <span
                      className={
                        participant.checkedIn
                          ? "text-emerald-300"
                          : "text-slate-500"
                      }
                    >
                      {participant.checkedIn ? "Ready" : "Waiting"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {canEditLobby ? (
              <LobbyEditor
                isBusy={isLobbyBusy}
                lobbyDraft={lobbyDraft}
                match={match}
                onPublish={onPublishLobby}
                onUpdate={onUpdateLobbyDraft}
              />
            ) : (
              <div className="rounded-2xl border border-slate-700 bg-slate-950/45 p-5">
                <FiCheckCircle className="text-2xl text-cyan-300" />
                <h4 className="mt-4 font-black text-white">
                  Operations are stage controlled
                </h4>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Lobby credentials can be changed only while the room is being
                  prepared. Completed and live stages remain protected.
                </p>
              </div>
            )}
          </div>

          {match.resultSummary?.submittedBy || match.status === "disputed" ? (
            <ResultEvidence match={match} />
          ) : null}
        </div>
      ) : null}
    </article>
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
          <span className="font-black text-white">Player evidence:</span>{" "}
          {result.proofNote}
        </p>
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

const LobbyEditor = ({
  isBusy,
  lobbyDraft,
  match,
  onPublish,
  onUpdate,
}) => (
  <div className="rounded-2xl border border-slate-700 bg-slate-950/45 p-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-cyan-300">
          Lobby access
        </p>
        <h4 className="mt-1 font-black text-white">Room details</h4>
      </div>
      {match.lobby?.publishedAt ? (
        <span className="text-[10px] font-bold text-emerald-300">
          Shared {formatDateTime(match.lobby.publishedAt)}
        </span>
      ) : null}
    </div>

    <div className="mt-4 grid gap-3 sm:grid-cols-2">
      <OperatorInput
        label="Room code"
        onChange={(value) => onUpdate(match._id, "roomCode", value)}
        placeholder="ROOM-1234"
        value={lobbyDraft.roomCode}
      />
      <OperatorInput
        label="Password"
        onChange={(value) => onUpdate(match._id, "roomPassword", value)}
        placeholder="PASS123"
        value={lobbyDraft.roomPassword}
      />
    </div>

    <label className="mt-3 block text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
      Player instructions
      <textarea
        className="mt-2 min-h-24 w-full resize-y rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
        onChange={(event) =>
          onUpdate(match._id, "instructions", event.target.value)
        }
        placeholder="Lobby timing and room notes"
        value={lobbyDraft.instructions}
      />
    </label>

    <button
      className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-wait disabled:bg-slate-700 disabled:text-slate-400"
      disabled={isBusy}
      onClick={() => onPublish(match._id)}
      type="button"
    >
      <FiRadio />
      {isBusy ? "Sharing lobby..." : "Share with players"}
    </button>
  </div>
);

const OperatorInput = ({ label, onChange, placeholder, value }) => (
  <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-400">
    {label}
    <input
      className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-sm font-medium normal-case tracking-normal text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50"
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  </label>
);

const OperationsSkeleton = () => (
  <div className="animate-pulse space-y-5">
    <div className="h-64 rounded-[30px] bg-slate-800/80" />
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <div className="h-32 rounded-2xl bg-slate-800/80" key={index} />
      ))}
    </div>
    <div className="h-72 rounded-[28px] bg-slate-800/80" />
  </div>
);

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
  lobby: PropTypes.shape({
    publishedAt: PropTypes.string,
    roomCode: PropTypes.string,
    roomPassword: PropTypes.string,
    instructions: PropTypes.string,
  }),
  map: PropTypes.string,
  mode: PropTypes.string,
  participants: PropTypes.arrayOf(
    PropTypes.shape({
      checkedIn: PropTypes.bool,
      displayName: PropTypes.string,
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
  activeAction: PropTypes.string.isRequired,
  expanded: PropTypes.bool.isRequired,
  lobbyDraft: PropTypes.shape({
    instructions: PropTypes.string,
    roomCode: PropTypes.string,
    roomPassword: PropTypes.string,
  }).isRequired,
  match: matchPropType.isRequired,
  onPublishLobby: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
  onUpdateLobbyDraft: PropTypes.func.isRequired,
  onExecuteCommand: PropTypes.func.isRequired,
};

ResultEvidence.propTypes = {
  match: matchPropType.isRequired,
};

MatchFact.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

LobbyEditor.propTypes = {
  isBusy: PropTypes.bool.isRequired,
  lobbyDraft: PropTypes.shape({
    instructions: PropTypes.string,
    roomCode: PropTypes.string,
    roomPassword: PropTypes.string,
  }).isRequired,
  match: matchPropType.isRequired,
  onPublish: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
};

OperatorInput.propTypes = {
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default Operations;
