import { useEffect, useState } from "react";
import { FiAlertTriangle, FiClock, FiRadio, FiRefreshCw, FiUsers } from "react-icons/fi";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { fetchManagedGameOperations, fetchManagedMatch, scheduleManagedMatch } from "../store/slices/gameManagementSlice";
import ManagedMatchDetails from "../components/gameManagement/ManagedMatchDetails.jsx";
import ManagedRoomDetails from "../components/gameManagement/ManagedRoomDetails.jsx";
import { getStoredErrorMessage } from "../api/apiError";
import GameManagerEventDetails from "../components/gameManagement/GameManagerEventDetails.jsx";
import GameAccountVerificationQueue from "../components/gameManagement/GameAccountVerificationQueue.jsx";
import StaffWorkspaceHeader from "../components/common/StaffWorkspaceHeader.jsx";
import StaffWorkspaceTabs from "../components/common/StaffWorkspaceTabs.jsx";

const formatSchedule = (value) => {
  if (!value) return "Schedule pending";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Schedule pending";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", hour: "numeric", minute: "2-digit", month: "short" }).format(date);
};

const toLocalDateTimeInput = (value) => {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

const formatAction = (entry) => {
  if (entry.command) return entry.command.replaceAll("_", " ");
  return entry.action?.replaceAll("_", " ").toLowerCase() || "operation updated";
};

const Metric = ({ label, value, warning = false }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-3">
    <p className="text-xs font-bold text-slate-500">{label}</p>
    <p className={warning ? "mt-1 text-xl font-black text-amber-300" : "mt-1 text-xl font-black text-white"}>{value}</p>
  </div>
);

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
  warning: PropTypes.bool,
};

const GameManagerDashboard = () => {
  const dispatch = useDispatch();
  const { error, operations, status } = useSelector((state) => state.gameManagement);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [scheduleDrafts, setScheduleDrafts] = useState({});
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [nowMs, setNowMs] = useState(Date.now);

  useEffect(() => {
    // This read model contains only games inside the active assignment scope.
    dispatch(fetchManagedGameOperations());
  }, [dispatch]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
      if (document.visibilityState === "visible") dispatch(fetchManagedGameOperations());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [dispatch]);

  const openMatch = (id) => { setSelectedRoomId(""); setSelectedMatchId(String(id)); };
  const openRoom = (id) => { setSelectedMatchId(""); setSelectedRoomId(String(id)); };
  const delayLabel = (match) => {
    const minutes = Math.floor((nowMs - new Date(match.scheduledFor).getTime()) / 60_000);
    if (!["scheduled", "lobby_ready"].includes(match.status) || !Number.isFinite(minutes) || minutes < 1) return "";
    return minutes >= 1440 ? `Start delayed ${Math.floor(minutes / 1440)}d ${Math.floor(minutes % 1440 / 60)}h` : `Start delayed ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const updateScheduleDraft = (matchId, field, value) => setScheduleDrafts((current) => ({
    ...current,
    [matchId]: { ...(current[matchId] || {}), [field]: value },
  }));

  const saveSchedule = async (matchId) => {
    const draft = scheduleDrafts[matchId] || {};
    const action = await dispatch(scheduleManagedMatch({
      matchId,
      instructions: draft.instructions || "",
      roomCode: draft.roomCode || "",
      roomPassword: draft.roomPassword || "",
      scheduledFor: draft.scheduledFor ? new Date(draft.scheduledFor).toISOString() : "",
    }));
    if (scheduleManagedMatch.fulfilled.match(action)) {
      dispatch(fetchManagedGameOperations());
      if (selectedMatchId === matchId) dispatch(fetchManagedMatch({ matchId }));
      setScheduleDrafts((current) => { const next = { ...current }; delete next[matchId]; return next; });
    }
  };

  const total = operations.reduce(
    (summary, item) => ({
      activeMatches: summary.activeMatches + item.metrics.activeMatches,
      attentionNeeded: summary.attentionNeeded + item.metrics.attentionNeeded,
      liveMatches: summary.liveMatches + item.metrics.liveMatches,
      operators: summary.operators + item.operators.length,
    }),
    { activeMatches: 0, attentionNeeded: 0, liveMatches: 0, operators: 0 },
  );

  return (
    <main className="min-w-0 text-slate-100">
      <div className="mx-auto max-w-[1500px] space-y-4">
        <StaffWorkspaceHeader
          actions={<button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 hover:bg-slate-800 disabled:opacity-60" disabled={status === "loading"} onClick={() => dispatch(fetchManagedGameOperations())} type="button"><FiRefreshCw /> Refresh</button>}
          description="Rooms, schedules, Events and account verification."
          title="Game Manager"
        />

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Active matches" value={total.activeMatches} />
          <Metric label="Live now" value={total.liveMatches} />
          <Metric label="Needs attention" value={total.attentionNeeded} warning />
          <Metric label="Assigned operators" value={total.operators} />
        </section>

        <StaffWorkspaceTabs activeId={activeSection} ariaLabel="Game Manager responsibilities" items={[
          { id: "overview", label: "Overview" },
          { id: "rooms", label: "Rooms & schedules" },
          { id: "events", label: "Events" },
          { id: "attention", label: "Attention" },
          { id: "operators", label: "Operators" },
          { id: "verification", label: "Account verification" },
          { id: "history", label: "History" },
        ]} onChange={setActiveSection} />

        {error && <section className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{getStoredErrorMessage(error)}</section>}
        {selectedMatchId ? <ManagedMatchDetails key={selectedMatchId} matchId={selectedMatchId} onClose={() => setSelectedMatchId("")} onOpenRoom={openRoom} renderSchedule={(match) => <ScheduleRoomForm draft={scheduleDrafts[match.id] || {}} match={match} onChange={updateScheduleDraft} onSave={saveSchedule} />} /> : null}
        {selectedRoomId ? <ManagedRoomDetails key={selectedRoomId} roomId={selectedRoomId} onClose={() => setSelectedRoomId("")} onOpenMatch={openMatch} /> : null}
        {status === "loading" && operations.length === 0 && <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-8 text-slate-400">Loading assigned game operations...</section>}
        {status !== "loading" && operations.length === 0 && !error && <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-8 text-slate-400">No active game scope is available for this assignment. Ask a Platform Admin to review the assignment.</section>}

        {activeSection === "verification" ? <GameAccountVerificationQueue /> : null}

        {activeSection !== "verification" ? <section className="grid gap-5 xl:grid-cols-2">
          {activeSection === "events" && selectedEvent ? <GameManagerEventDetails event={selectedEvent} onClose={() => setSelectedEvent(null)} /> : null}
          {operations.map((item) => (
            <article className="rounded-2xl border border-slate-800 bg-[#07111f] p-4" key={item.game._id}>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-xs font-bold capitalize text-cyan-300">{item.game.status}</p><h2 className="mt-1 text-lg font-black text-white">{item.game.name}</h2><p className="mt-1 text-xs text-slate-500">{item.game.link}</p></div>
                {item.metrics.attentionNeeded > 0 && <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-bold text-amber-200"><FiAlertTriangle /> {item.metrics.attentionNeeded} needs attention</span>}
              </div>

              {activeSection === "overview" ? <div className="mt-5 grid grid-cols-2 gap-3">
                <Metric label="Awaiting operator" value={item.metrics.awaitingOperator} warning={item.metrics.awaitingOperator > 0} />
                <Metric label="Live matches" value={item.metrics.liveMatches} />
                <Metric label="Active Event runs" value={item.eventReadiness.activeRuns} />
                <Metric label="Upcoming Event runs" value={item.eventReadiness.upcomingRuns} />
              </div> : null}

              {activeSection === "rooms" ? <div className="mt-5 space-y-3">
                {(item.activeRooms || []).map((room) => (
                  <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4" key={room.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-black text-white">{room.title}</h3><p className="mt-1 text-xs capitalize text-slate-500">{room.mode} / {room.map} / {room.earlyClosed && room.status === "full" ? "Entry closed" : room.status}</p></div><span className="text-sm font-black text-cyan-200">{room.joinedCount}/{room.capacity}</span></div>
                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-cyan-300" style={{ width: `${Math.min(100, Math.round((room.joinedCount / room.capacity) * 100))}%` }} /></div>
                    <div className="mt-3 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{room.lineup.map((player) => <span className="rounded-lg bg-slate-900 px-2 py-1 text-xs text-slate-300" key={`${room.id}:${player.seat}`}>#{player.seat} {player.username}</span>)}</div>
                    <button type="button" onClick={() => openRoom(room.id)} className="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-cyan-200">Open room controls</button>
                    {room.match ? <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-amber-200">{delayLabel(room.match) || (room.match.assignedOperator ? room.match.assignedOperator.username : "Needs operator assignment")}</span><button type="button" onClick={() => openMatch(room.match.id)} className="rounded-lg border border-cyan-300/30 px-3 py-2 text-sm font-bold text-cyan-200">Open match details</button></div> : room.status === "full" ? <p className="mt-4 text-sm font-bold text-amber-200">Preparing Match for operator assignment.</p> : null}
                  </article>
                ))}
                {!(item.activeRooms || []).length ? <p className="text-sm text-slate-500">No active rooms.</p> : null}
              </div> : null}

              {activeSection === "events" ? <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Events</p>
                <div className="mt-3 space-y-2">
                  {(item.events || []).map((event) => <button className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3 text-left hover:border-cyan-300/30" key={event.id} onClick={() => setSelectedEvent(event)} type="button"><span className="min-w-0"><strong className="block truncate text-sm text-slate-100">{event.title}</strong><small className="text-slate-500">{event.registeredCount.toLocaleString("en-IN")} registered / {formatSchedule(event.startsAt)}</small></span><span className="shrink-0 text-xs font-bold capitalize text-cyan-200">{event.status.replaceAll("_", " ")}</span></button>)}
                  {(item.events || []).length === 0 ? <p className="text-sm text-slate-500">No Events for this game.</p> : null}
                </div>
              </div> : null}

              {activeSection === "attention" ? <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Attention queue</p>
                <div className="mt-3 space-y-2">
                  {(item.attention || []).map((match) => (
                    <div className="rounded-xl border border-amber-300/20 bg-amber-300/5 px-3 py-3" key={match._id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-100">{match.title}</p>
                          <p className="mt-1 text-xs text-amber-200">{match.reason}</p>
                        </div>
                        <span className="shrink-0 text-xs font-bold capitalize text-slate-400">{match.status.replaceAll("_", " ")}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        {formatSchedule(match.scheduledFor)} / {match.assignedOperator?.username || "Unassigned"}
                      </p>
                      {delayLabel(match) ? <p className="mt-2 text-xs font-bold text-amber-200">{delayLabel(match)}</p> : null}
                      <button type="button" onClick={() => openMatch(match._id)} className="mt-3 rounded-lg border border-cyan-300/30 px-3 py-2 text-sm font-bold text-cyan-200">Review match</button>
                    </div>
                  ))}
                  {(item.attention || []).length === 0 && <p className="text-sm text-slate-500">No delayed or disputed work needs attention.</p>}
                </div>
              </div> : null}

              {activeSection === "operators" ? <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Operator workload</p>
                <div className="mt-3 space-y-2">
                  {item.operators.map(({ activeMatches, operator }) => <div className="flex items-center justify-between rounded-xl bg-slate-950/70 px-3 py-3" key={operator._id}><span className="inline-flex items-center gap-2 text-sm font-bold text-slate-200"><FiUsers className="text-cyan-300" />{operator.username}</span><span className="text-sm text-slate-400">{activeMatches} active</span></div>)}
                  {item.operators.length === 0 && <p className="text-sm text-slate-500">No assigned operator workload yet.</p>}
                </div>
              </div> : null}

              {activeSection === "history" ? <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Operational history</p>
                <div className="mt-3 space-y-2">
                  {(item.recentActivity || []).map((entry) => (
                    <div className="flex items-start justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3" key={entry._id}>
                      <div className="min-w-0">
                        <p className="text-sm font-bold capitalize text-slate-200">{formatAction(entry)}</p>
                        <p className="mt-1 truncate text-xs text-slate-500">{entry.operator?.username || "System"}{entry.toStatus ? ` / ${entry.toStatus.replaceAll("_", " ")}` : ""}</p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs text-slate-500"><FiClock />{formatSchedule(entry.createdAt)}</span>
                    </div>
                  ))}
                  {(item.recentActivity || []).length === 0 && <p className="text-sm text-slate-500">No recent operator actions for this game.</p>}
                </div>
              </div> : null}

              {activeSection === "history" ? <div className="mt-6 border-t border-slate-800 pt-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">Recent match activity</p>
                <div className="mt-3 space-y-2">
                  {item.recentMatches.map((match) => <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 px-3 py-3" key={match._id}><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-200">{match.title}</p><p className="mt-1 text-xs text-slate-500">{formatSchedule(match.scheduledFor)}</p></div><span className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-cyan-200"><FiRadio />{match.status.replaceAll("_", " ")}</span></div>)}
                  {item.recentMatches.length === 0 && <p className="text-sm text-slate-500">No match activity for this game.</p>}
                </div>
              </div> : null}
            </article>
          ))}
        </section> : null}

      </div>
    </main>
  );
};

const ScheduleRoomForm = ({ draft, match, onChange, onSave }) => {
  const schedule = useSelector((state) => state.gameManagement.schedule);
  const busy = schedule.status === "loading";
  return (
  <div className="mt-4 grid gap-2 border-t border-slate-800 pt-4 sm:grid-cols-2">
    <p className="text-sm text-slate-400 sm:col-span-2">Schedule at least ten minutes ahead. Enter the full lobby details again when rescheduling; existing passwords are not exposed here.</p>
    <input aria-label="Scheduled start" className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" min={toLocalDateTimeInput(Date.now() + 10 * 60_000)} onChange={(event) => onChange(match.id, "scheduledFor", event.target.value)} type="datetime-local" value={draft.scheduledFor || ""} />
    <input className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" onChange={(event) => onChange(match.id, "roomCode", event.target.value)} placeholder="Room ID" value={draft.roomCode || ""} />
    <input aria-label="Lobby password" type="password" autoComplete="new-password" maxLength={100} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" onChange={(event) => onChange(match.id, "roomPassword", event.target.value)} placeholder="Password" value={draft.roomPassword || ""} />
    <input className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white" onChange={(event) => onChange(match.id, "instructions", event.target.value)} placeholder="Lobby note (optional)" value={draft.instructions || ""} />
    <button className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50 sm:col-span-2" disabled={busy || !draft.scheduledFor || !draft.roomCode || !draft.roomPassword} onClick={() => onSave(match.id)} type="button">{busy ? "Saving…" : "Save schedule / lobby opens at T-10"}</button>
    {match.scheduledFor ? <p className="text-xs text-slate-500 sm:col-span-2">Current: {formatSchedule(match.scheduledFor)}</p> : null}
  </div>
  );
};

ScheduleRoomForm.propTypes = {
  draft: PropTypes.shape({ instructions: PropTypes.string, roomCode: PropTypes.string, roomPassword: PropTypes.string, scheduledFor: PropTypes.string }).isRequired,
  match: PropTypes.shape({ id: PropTypes.string.isRequired, scheduledFor: PropTypes.string }).isRequired,
  onChange: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default GameManagerDashboard;
