import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { cancelManagedRoom, closeManagedRoomEarly, fetchManagedGameOperations, fetchManagedRoom } from "../../store/slices/gameManagementSlice";
import { getStoredErrorMessage } from "../../api/apiError";

const ManagedRoomDetails = ({ roomId, onClose, onOpenMatch }) => {
  const dispatch = useDispatch();
  const entry = useSelector((state) => state.gameManagement.roomDetails?.[roomId]);
  const [command, setCommand] = useState("");
  const [reason, setReason] = useState("");
  const panel = useRef(null);
  useEffect(() => {
    const request = dispatch(fetchManagedRoom({ roomId }));
    panel.current?.scrollIntoView({ block: "start", behavior: "smooth" });
    panel.current?.focus({ preventScroll: true });
    return () => request.abort();
  }, [dispatch, roomId]);
  const room = entry?.room;
  const busy = entry?.actionStatus === "loading";
  const error = getStoredErrorMessage(entry?.actionError || entry?.detailError);
  const confirm = async (event) => {
    event.preventDefault();
    const thunk = command === "cancel" ? cancelManagedRoom : closeManagedRoomEarly;
    const action = await dispatch(thunk({ roomId, reason: reason.trim() }));
    if (thunk.fulfilled.match(action)) {
      setCommand("");
      setReason("");
      dispatch(fetchManagedGameOperations());
    }
    dispatch(fetchManagedRoom({ roomId }));
  };
  return <section ref={panel} tabIndex={-1} className="scroll-mt-24 rounded-2xl border border-cyan-300/30 bg-slate-950 p-4 focus:outline-none focus:ring-2 focus:ring-cyan-300/40">
    <div className="flex flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 break-words text-lg font-black">{room?.title || "Room details"}</h2><button type="button" disabled={busy} onClick={onClose} className="rounded-lg border border-slate-700 px-3 py-2 text-sm disabled:opacity-50">Close details</button></div>
    {entry?.detailStatus === "loading" ? <p role="status" className="mt-3 text-sm text-slate-400">Loading current room details…</p> : null}
    {error ? <p role="alert" className="mt-3 text-sm text-rose-200">{error}</p> : null}
    {entry?.detailStatus === "failed" ? <button type="button" onClick={() => dispatch(fetchManagedRoom({ roomId }))} className="mt-2 text-cyan-200">Retry room details</button> : null}
    {room && entry?.detailStatus === "succeeded" ? <>
      <p className="mt-2 text-sm capitalize text-cyan-200">{room.earlyClosed && room.status === "full" ? "Entry closed" : room.status.replaceAll("_", " ")} · {room.memberCount}/{room.maxPlayers} players</p>
      <p className="mt-3 text-sm text-slate-400">Minimum {room.minimumParticipants} players. {room.teamSize > 1 ? `Every team must contain exactly ${room.teamSize} players; incomplete teams cannot be included.` : "Solo entry rules still apply."}</p>
      <p className="mt-2 text-sm text-slate-400">Closing entry seals this room’s lineup; it does not start gameplay. Assign an operator and schedule at least ten minutes ahead so players receive lobby access at T-10.</p>
      {room.reason ? <p className="mt-3 break-words text-sm text-amber-200">Recorded reason: {room.reason}</p> : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {room.canCloseEarly ? <button type="button" disabled={busy} onClick={() => { setCommand("close"); setReason(""); }} className="rounded-lg border border-cyan-300/30 px-3 py-2 text-sm font-bold text-cyan-200 disabled:opacity-50">Close entry early</button> : null}
        {room.canCancel ? <button type="button" disabled={busy} onClick={() => { setCommand("cancel"); setReason(""); }} className="rounded-lg border border-rose-300/30 px-3 py-2 text-sm font-bold text-rose-200 disabled:opacity-50">Cancel this room</button> : null}
        {room.matchId && room.status !== "cancelled" ? <button type="button" disabled={busy} onClick={() => onOpenMatch(room.matchId)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-cyan-200">Open match details</button> : null}
      </div>
      {!room.canCancel && !room.canCloseEarly ? <p className="mt-3 text-xs text-slate-500">Room controls are unavailable in its current state. Live gameplay cannot be cancelled here.</p> : null}
      {command && (command === "cancel" ? room.canCancel : room.canCloseEarly) ? <form onSubmit={confirm} className="mt-4 space-y-3 rounded-xl border border-amber-300/25 p-3">
        <h3 className="font-bold">{command === "cancel" ? "Confirm room cancellation" : "Confirm early entry closure"}</h3>
        <p className="text-sm text-slate-400">{command === "cancel" ? "Only this room and its linked match will be cancelled. Entry holds return to their original payers, players are notified, and history is retained. Other rooms stay unchanged." : "No more players can join this room. Only a valid, complete lineup meeting the minimum can proceed. Published prizes stay unchanged; operator assignment and the lobby notice window still apply."}</p>
        <label className="block text-sm">Reason<textarea required minLength={5} maxLength={200} value={reason} disabled={busy} onChange={(event) => setReason(event.target.value)} className="mt-1 block w-full resize-y rounded-lg border border-slate-700 bg-slate-900 p-2" rows={2} /></label>
        <div className="flex flex-wrap gap-2"><button type="submit" disabled={busy || reason.trim().length < 5} className="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">{busy ? "Saving…" : command === "cancel" ? "Confirm cancellation" : "Confirm early closure"}</button><button type="button" disabled={busy} onClick={() => setCommand("")} className="rounded-lg border border-slate-700 px-3 py-2 text-sm">Go back</button></div>
      </form> : null}
    </> : null}
  </section>;
};
ManagedRoomDetails.propTypes = { roomId: PropTypes.string.isRequired, onClose: PropTypes.func.isRequired, onOpenMatch: PropTypes.func.isRequired };
export default ManagedRoomDetails;
