import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import RankedStagePlanEditor from "./RankedStagePlanEditor.jsx";
import { buildDefaultRankedStages, projectRankedStages } from "./rankedStagePlanUtils.js";
import { proposeEventRoundPlan } from "../../store/slices/eventRoundPlanSlice.js";
import { fetchManagedEvents } from "../../store/slices/eventManagementSlice.js";

const idOf = (run) => String(run?._id || run?.id || "");

const PostRegistrationRoundPlan = ({ runs }) => {
  const dispatch = useDispatch();
  const eligibleRuns = useMemo(() => runs.filter((run) =>
    run.status === "registration_closed" && run.roundPlanStatus !== "approved" && !run.rosterFrozenAt), [runs]);
  const [runId, setRunId] = useState("");
  const run = eligibleRuns.find((item) => idOf(item) === runId);
  const participantCount = run?.registrationSummary?.registeredCount || 0;
  const [stages, setStages] = useState([]);
  const busy = useSelector((state) => state.eventRoundPlans.actionByRunId[runId] === "loading");

  useEffect(() => {
    if (!runId && eligibleRuns.length) setRunId(idOf(eligibleRuns[0]));
  }, [eligibleRuns, runId]);

  useEffect(() => {
    setStages(participantCount >= 2 ? buildDefaultRankedStages(participantCount) : []);
  }, [participantCount, runId]);

  if (!eligibleRuns.length) return null;
  const projection = projectRankedStages(participantCount, stages);

  const submit = async (event) => {
    event.preventDefault();
    if (projection.error) return;
    try {
      await dispatch(proposeEventRoundPlan({
        runId,
        executionPlan: {
          format: "ranked_stages",
          stages: stages.map((stage, index) => ({
            advanceCount: index === stages.length - 1 ? 0 : Number(stage.advanceCount),
            batchSpacingMinutes: Number(stage.batchSpacingMinutes),
            checkInMinutesBefore: Number(stage.checkInMinutesBefore),
            participantsPerMatch: Number(stage.participantsPerMatch),
            qualificationRule: index === stages.length - 1 ? "final_ranking" : "top_n",
            stageDelayMinutes: Number(stage.stageDelayMinutes),
          })),
        },
      })).unwrap();
      await dispatch(fetchManagedEvents());
    } catch {
      // The server rechecks scope, final roster count and plan convergence.
    }
  };

  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-slate-950/90 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Registration closed</p>
          <h2 className="mt-1 text-xl font-black text-white">Plan rounds from the final player list</h2>
        </div>
        <label className="text-sm text-slate-300">Event
          <select className="ml-2 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2" onChange={(event) => setRunId(event.target.value)} value={runId}>
            {eligibleRuns.map((item) => <option key={idOf(item)} value={idOf(item)}>{item.title}</option>)}
          </select>
        </label>
      </div>
      <div className="my-4 grid gap-3 sm:grid-cols-3">
        <Fact label="Registered players" value={participantCount.toLocaleString("en-IN")} />
        <Fact label="Plan status" value={(run?.roundPlanStatus || "not configured").replaceAll("_", " ")} />
        <Fact label="Projected rounds" value={stages.length} />
      </div>
      {participantCount >= 2 ? (
        <form onSubmit={submit}>
          <RankedStagePlanEditor capacity={participantCount} onChange={setStages} stages={stages} />
          <button className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={busy || Boolean(projection.error)}>
            {busy ? "Submitting..." : "Submit round plan for review"}
          </button>
        </form>
      ) : <p className="rounded-xl border border-amber-300/20 p-4 text-sm text-amber-100">At least two registered players are required.</p>}
    </section>
  );
};

const Fact = ({ label, value }) => <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 font-black capitalize text-white">{value}</p></div>;
Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired };
PostRegistrationRoundPlan.propTypes = { runs: PropTypes.arrayOf(PropTypes.object).isRequired };

export default PostRegistrationRoundPlan;
