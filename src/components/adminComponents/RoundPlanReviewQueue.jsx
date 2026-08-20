import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventRoundPlanQueue, reviewEventRoundPlan } from "../../store/slices/eventRoundPlanSlice.js";

const RoundPlanReviewQueue = () => {
  const dispatch = useDispatch();
  const { queue, queueError, queueNextCursor, queueStatus, reviewById } = useSelector((state) => state.eventRoundPlans);
  const [notes, setNotes] = useState({});
  useEffect(() => { const request = dispatch(fetchEventRoundPlanQueue()); return () => request.abort(); }, [dispatch]);

  const decide = (proposalId, action) => dispatch(reviewEventRoundPlan({ action, proposalId, note: notes[proposalId] || "" }));

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-4">
      <div className="flex items-center justify-between gap-3"><div><h3 className="font-black text-white">Round plans</h3><p className="text-xs text-slate-500">{queue.length} awaiting review</p></div><button className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold" onClick={() => dispatch(fetchEventRoundPlanQueue())} type="button">Refresh</button></div>
      {queueError ? <p className="mt-3 text-sm text-rose-200">{queueError}</p> : null}
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {queue.map((item) => {
          const busy = reviewById[item.id] === "loading";
          return <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4" key={item.id}>
            <div className="flex flex-wrap justify-between gap-2"><div><p className="font-black text-white">{item.eventRun?.title || "Event"}</p><p className="text-xs text-slate-500">{item.expectedParticipantCount.toLocaleString("en-IN")} registered players / revision {item.revision}</p></div><span className="text-xs font-bold text-amber-200">Independent review</span></div>
            <div className="mt-3 space-y-1 rounded-xl border border-slate-800 p-3 text-xs text-slate-300">{item.executionPlan?.projection?.map((row) => <p key={row.number}>Round {row.number}: {row.participantCount.toLocaleString("en-IN")} players / {row.batchCount.toLocaleString("en-IN")} rooms / {row.qualifiedCount ? `${row.qualifiedCount.toLocaleString("en-IN")} advance` : "final ranking"}</p>)}</div>
            <textarea className="mt-3 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm" maxLength={1000} onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Note required for changes or rejection" value={notes[item.id] || ""} />
            <div className="mt-3 grid grid-cols-3 gap-2">{[["approved", "Approve"], ["changes_requested", "Changes"], ["rejected", "Reject"]].map(([action, label]) => <button className="rounded-xl border border-cyan-300/25 px-2 py-2 text-xs font-black text-cyan-100 disabled:opacity-50" disabled={busy} key={action} onClick={() => decide(item.id, action)} type="button">{label}</button>)}</div>
          </article>;
        })}
        {queueStatus !== "loading" && !queue.length ? <p className="col-span-full rounded-xl border border-dashed border-slate-800 p-5 text-center text-xs text-slate-500">No round plans waiting</p> : null}
      </div>
      {queueNextCursor ? <button className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm" onClick={() => dispatch(fetchEventRoundPlanQueue({ cursor: queueNextCursor }))} type="button">Load more</button> : null}
    </section>
  );
};

export default RoundPlanReviewQueue;
