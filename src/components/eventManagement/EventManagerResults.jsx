import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { fetchManagedEventStandings } from "../../store/slices/eventManagementSlice.js";
import { fetchManagedEventPrizeStatus, fetchManagedEventStages } from "../../store/slices/eventStageSlice.js";

const idOf = (item) => item?._id || item?.id || "";
const label = (value) => value?.replaceAll("_", " ") || "Pending";

const EventManagerResults = ({ runs }) => {
  const dispatch = useDispatch();
  const eligibleRuns = useMemo(() => runs.filter((run) => !["draft", "in_review", "changes_requested", "rejected"].includes(run.status)), [runs]);
  const [runId, setRunId] = useState("");
  const stages = useSelector((state) => state.eventStages.overviewByRunId[runId]);
  const reward = useSelector((state) => state.eventStages.prizeByRunId[runId]);
  const standings = useSelector((state) => state.eventManagement.standingsByRunId[runId]);
  const selected = eligibleRuns.find((run) => idOf(run) === runId);

  useEffect(() => {
    if (!runId || !eligibleRuns.some((run) => idOf(run) === runId)) setRunId(idOf(eligibleRuns[0]));
  }, [eligibleRuns, runId]);

  useEffect(() => {
    if (!runId) return undefined;
    const requests = [
      dispatch(fetchManagedEventStages({ runId })),
      dispatch(fetchManagedEventStandings({ runId })),
    ];
    if (selected?.status === "completed") requests.push(dispatch(fetchManagedEventPrizeStatus(runId)));
    return () => requests.forEach((request) => request.abort());
  }, [dispatch, runId, selected?.status]);

  if (!eligibleRuns.length) return <section className="rounded-2xl border border-dashed border-slate-800 p-5 text-sm text-slate-500">No approved Event results yet.</section>;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 p-4">
        <div><h2 className="font-black text-white">Results & Rewards</h2><p className="mt-1 text-xs capitalize text-slate-500">{label(selected?.status)}</p></div>
        <label className="text-xs font-bold text-slate-400">Event<select className="mt-1 block min-w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white" onChange={(event) => setRunId(event.target.value)} value={runId}>{eligibleRuns.map((run) => <option key={idOf(run)} value={idOf(run)}>{run.title}</option>)}</select></label>
      </header>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <h3 className="font-black text-white">Rounds</h3>
          <div className="mt-3 space-y-2">{(stages?.stages || []).map((stage) => <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-sm" key={stage.id}><span className="font-bold text-slate-200">Round {stage.number}</span><span className="capitalize text-cyan-200">{label(stage.status)} · {stage.matchCount} matches</span></div>)}{!(stages?.stages || []).length ? <p className="text-sm text-slate-500">Round results will appear here.</p> : null}</div>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
          <div className="flex items-center justify-between gap-3"><h3 className="font-black text-white">Rewards</h3><span className="text-xs font-bold capitalize text-emerald-200">{reward ? label(reward.status) : "Awaiting completion"}</span></div>
          <div className="mt-3 space-y-2">{(selected?.rewardTerms?.placements || []).map((row) => <div className="flex items-center justify-between rounded-xl bg-slate-900 px-3 py-2 text-sm" key={row.place}><span className="text-slate-300">Place {row.place}</span><strong className="text-white">₹{(row.amountMinor / 100).toFixed(2)}</strong></div>)}{!(selected?.rewardTerms?.placements || []).length ? <p className="text-sm text-slate-500">No placement rewards configured.</p> : null}</div>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <h3 className="font-black text-white">Final standings</h3>
        <div className="mt-3 divide-y divide-slate-800">{(standings?.standings || []).map((row) => <div className="grid grid-cols-[3rem_1fr_auto] gap-3 py-2 text-sm" key={`${row.placement}:${row.player?.profileTag || row.player?.displayName}`}><strong className="text-cyan-200">#{row.placement}</strong><span className="truncate text-white">{row.player?.displayName || row.player?.username || "Player"}</span><span className="capitalize text-slate-400">{label(row.result)}</span></div>)}{!(standings?.standings || []).length ? <p className="py-3 text-sm text-slate-500">Final standings appear after verified results.</p> : null}</div>
        {standings?.nextCursor ? <button className="mt-3 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200" onClick={() => dispatch(fetchManagedEventStandings({ cursor: standings.nextCursor, runId }))} type="button">Load more</button> : null}
      </section>
    </section>
  );
};

EventManagerResults.propTypes = { runs: PropTypes.arrayOf(PropTypes.object).isRequired };

export default EventManagerResults;
