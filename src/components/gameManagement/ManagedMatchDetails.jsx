import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { assignManagedMatchOperator, fetchManagedMatch, fetchManagedMatchOperators, fetchManagedGameOperations } from "../../store/slices/gameManagementSlice";
import { getStoredErrorMessage } from "../../api/apiError";

const formatTime = (value) => value ? new Date(value).toLocaleString("en-IN") : "Not set";

const ManagedMatchDetails = ({ matchId, onClose, onOpenRoom, renderSchedule }) => {
  const dispatch = useDispatch();
  const entry = useSelector((state) => state.gameManagement.matchDetails[matchId]);
  const [operatorId, setOperatorId] = useState("");
  const panel = useRef(null);
  useEffect(() => {
    const request = dispatch(fetchManagedMatch({ matchId }));
    panel.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    panel.current?.focus({ preventScroll: true });
    return () => request.abort();
  }, [dispatch, matchId]);
  const match = entry?.match;
  const assign = async () => {
    const action = await dispatch(assignManagedMatchOperator({ matchId, operatorId }));
    if (assignManagedMatchOperator.fulfilled.match(action)) {
      setOperatorId("");
      dispatch(fetchManagedGameOperations());
      dispatch(fetchManagedMatch({ matchId }));
    }
  };
  const error = getStoredErrorMessage(entry?.detailError || entry?.operatorsError || entry?.assignError);
  return <section ref={panel} tabIndex={-1} className="scroll-mt-24 rounded-2xl border border-cyan-300/30 bg-slate-950 p-4 focus:outline-none focus:ring-2 focus:ring-cyan-300/40">
    <div className="flex items-start justify-between gap-3"><h2 className="break-words text-lg font-black">{match?.title || "Match details"}</h2><button type="button" onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-sm">Close details</button></div>
    {entry?.detailStatus === "loading" ? <p role="status" className="mt-3 text-sm text-slate-400">Loading current Match details…</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p> : null}
    {entry?.detailStatus === "failed" ? <button type="button" onClick={() => dispatch(fetchManagedMatch({ matchId }))} className="mt-2 text-cyan-200">Retry details</button> : null}
    {match && entry?.detailStatus === "succeeded" ? <>
      <p className="mt-2 text-sm capitalize text-cyan-200">{match.gameKey} · {match.mode} · {match.map} · {match.status.replaceAll("_", " ")}</p>
      {match.roomId && onOpenRoom ? <button type="button" onClick={() => onOpenRoom(match.roomId)} className="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-sm text-cyan-200">Open room controls</button> : null}
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div><dt className="text-slate-500">Operator</dt><dd>{match.assignedOperator?.username || "Unassigned"}</dd></div>
        <div><dt className="text-slate-500">Scheduled start</dt><dd>{formatTime(match.scheduledFor)}</dd></div>
        <div><dt className="text-slate-500">Lobby readiness</dt><dd>{match.lobbyConfigured ? `Configured · player access ${formatTime(match.lobbyRevealAt)}` : "Needs configuration"}</dd></div>
      </dl>
      {match.canAssignOperator ? <div className="mt-4 rounded-xl border border-slate-700 p-3">
        <h3 className="font-bold">Assign operator · Quick Match</h3>
        <p className="mt-1 text-xs text-slate-400">Choose a verified, active operator scoped to this game. This cannot replace an existing assignment.</p>
        {!entry.operators ? <button type="button" disabled={entry.operatorsStatus === "loading"} onClick={() => dispatch(fetchManagedMatchOperators({ matchId }))} className="mt-3 text-sm font-bold text-cyan-200">{entry.operatorsStatus === "loading" ? "Loading operators…" : "Load eligible operators"}</button> : <>
          <label className="mt-3 block text-sm">Match Operator<select value={operatorId} onChange={(event) => setOperatorId(event.target.value)} className="mt-1 block w-full rounded-lg border border-slate-700 bg-slate-900 p-2"><option value="">Select operator</option>{entry.operators.items.map((operator) => <option value={operator.id} key={operator.id}>{operator.username}</option>)}</select></label>
          {!entry.operators.items.length ? <p className="mt-2 text-sm text-amber-200">No eligible operators on this page. Ask Platform Admin to check game scopes if none are available.</p> : null}
          {entry.operators.page?.nextCursor ? <button type="button" disabled={entry.operatorsStatus === "loading"} onClick={() => dispatch(fetchManagedMatchOperators({ matchId, cursor: entry.operators.page.nextCursor }))} className="mt-2 text-sm text-cyan-200">Load more operators</button> : null}
          <button type="button" disabled={!operatorId || entry.assignStatus === "loading"} onClick={assign} className="mt-3 rounded-lg bg-cyan-300 px-4 py-2 font-bold text-slate-950 disabled:opacity-50">{entry.assignStatus === "loading" ? "Assigning…" : "Confirm operator assignment"}</button>
        </>}
      </div> : match.source === "event" && !match.assignedOperator ? <p className="mt-4 text-sm text-amber-200">Event Manager owns operator assignment for this Event match.</p> : null}
      {match.assignedOperator && ["operator_assigned", "scheduled"].includes(match.status) ? renderSchedule(match) : null}
      <details className="mt-4 rounded-xl border border-slate-800 p-3"><summary className="cursor-pointer font-bold">Player lineup · {match.lineup.length}</summary><div className="mt-3 grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">{match.lineup.map((player) => <div className="rounded-lg bg-slate-900 p-2 text-sm" key={player.seat}>#{player.seat} {player.username}{player.team ? <span className="block text-xs text-slate-400">{player.team}</span> : null}</div>)}</div></details>
      {["live", "result_pending", "disputed"].includes(match.status) ? <p className="mt-3 text-sm text-slate-400">{match.status === "disputed" ? "Governance reviews this dispute; Game Manager cannot override the result." : "The assigned Match Operator owns play and result entry. Contact them for operational delays."}</p> : null}
    </> : null}
  </section>;
};
ManagedMatchDetails.propTypes = { matchId: PropTypes.string.isRequired, onClose: PropTypes.func.isRequired, onOpenRoom: PropTypes.func, renderSchedule: PropTypes.func.isRequired };
export default ManagedMatchDetails;
