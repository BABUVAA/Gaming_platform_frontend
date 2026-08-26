import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchEventExecutionRuns, fetchEventPrizeRelease, releaseEventPrizes } from "../../store/slices/eventStageSlice.js";

const EventPrizeGovernanceReview = () => {
  const dispatch = useDispatch();
  const state = useSelector((root) => root.eventStages);
  const completed = useMemo(() => state.executionRuns.filter((run) => run.status === "completed"), [state.executionRuns]);
  const [runId, setRunId] = useState("");
  const release = state.prizeByRunId[runId];

  useEffect(() => {
    const request = dispatch(fetchEventExecutionRuns());
    return () => request.abort();
  }, [dispatch]);

  useEffect(() => {
    if (!runId || !completed.some((run) => (run.id || run._id) === runId)) setRunId(completed[0]?.id || completed[0]?._id || "");
  }, [completed, runId]);

  useEffect(() => {
    if (!runId) return undefined;
    const request = dispatch(fetchEventPrizeRelease(runId));
    return () => request.abort();
  }, [dispatch, runId]);

  return (
    <section className="mt-4 rounded-2xl border border-slate-800 bg-[#07111f] p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h2 className="font-black text-white">Event prize release</h2><p className="mt-1 text-xs text-slate-500">Independent financial review</p></div>
        {completed.length ? <select className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" onChange={(event) => setRunId(event.target.value)} value={runId}>{completed.map((run) => <option key={run.id || run._id} value={run.id || run._id}>{run.title}</option>)}</select> : null}
      </div>
      {!completed.length ? <p className="mt-4 text-sm text-slate-500">No completed Event is waiting for prize review.</p> : null}
      {release ? <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-xl bg-slate-950/70 p-3"><div><strong className="text-white">₹{(release.totalMinor / 100).toFixed(2)}</strong><p className="mt-1 text-xs capitalize text-slate-500">{release.status} · {release.allocations.length} allocations</p></div><button className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50" disabled={!release.canRelease || state.prizeActionByRunId[runId] === "loading"} onClick={() => dispatch(releaseEventPrizes(runId))} type="button">{release.status === "released" ? "Released" : release.canRelease ? "Release prizes" : "Independent reviewer required"}</button></div> : null}
      {state.nextRunCursor ? <button className="mt-4 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200" disabled={state.runStatus === "loading"} onClick={() => dispatch(fetchEventExecutionRuns({ cursor: state.nextRunCursor }))} type="button">Load more Events</button> : null}
    </section>
  );
};

export default EventPrizeGovernanceReview;
