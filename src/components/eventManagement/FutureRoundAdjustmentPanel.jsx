import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchManagedStageAdjustments,
  proposeManagedStageAdjustment,
} from "../../store/slices/eventStageAdjustmentSlice.js";

const eligibleStatuses = new Set([
  "scheduled", "registration_open", "registration_closed", "stages_ready", "in_progress",
]);

const getRunId = (run) => String(run?._id || run?.id || "");
const toDraft = (stage = {}) => ({
  advanceCount: String(stage.advanceCount ?? 1),
  batchSpacingMinutes: String(stage.batchSpacingMinutes ?? 0),
  checkInMinutesBefore: String(stage.checkInMinutesBefore ?? 15),
  participantsPerMatch: String(stage.participantsPerMatch ?? 100),
  stageDelayMinutes: String(stage.stageDelayMinutes ?? 0),
});

const FutureRoundAdjustmentPanel = ({ runs }) => {
  const dispatch = useDispatch();
  const eligibleRuns = useMemo(() => runs.filter((run) =>
    run.executionPlan?.format === "ranked_stages" && eligibleStatuses.has(run.status)), [runs]);
  const [runId, setRunId] = useState("");
  const [stageNumber, setStageNumber] = useState("2");
  const [definition, setDefinition] = useState(toDraft());
  const state = useSelector((root) => root.eventStageAdjustments);
  const run = eligibleRuns.find((item) => getRunId(item) === runId);
  const stages = useMemo(() => run?.executionPlan?.stages || [], [run]);
  const history = state.managedByRunId[runId] || [];

  useEffect(() => {
    if (!runId && eligibleRuns.length) setRunId(getRunId(eligibleRuns[0]));
  }, [eligibleRuns, runId]);

  useEffect(() => {
    if (!runId) return undefined;
    const request = dispatch(fetchManagedStageAdjustments(runId));
    return () => request.abort();
  }, [dispatch, runId]);

  useEffect(() => {
    const available = stages.filter((stage) => stage.number >= 2);
    const nextNumber = available.some((stage) => String(stage.number) === stageNumber)
      ? stageNumber
      : String(available[0]?.number || 2);
    setStageNumber(nextNumber);
    setDefinition(toDraft(available.find((stage) => String(stage.number) === nextNumber)));
  }, [runId, stageNumber, stages]);

  const chooseStage = (value) => {
    setStageNumber(value);
    setDefinition(toDraft(stages.find((stage) => String(stage.number) === value)));
  };

  const update = (field, value) => setDefinition((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    const number = Number(stageNumber);
    const isFinal = number === stages.length;
    try {
      await dispatch(proposeManagedStageAdjustment({
        definition: {
          advanceCount: isFinal ? 0 : Number(definition.advanceCount),
          batchSpacingMinutes: Number(definition.batchSpacingMinutes),
          checkInMinutesBefore: Number(definition.checkInMinutesBefore),
          participantsPerMatch: Number(definition.participantsPerMatch),
          qualificationRule: isFinal ? "final_ranking" : "top_n",
          stageDelayMinutes: Number(definition.stageDelayMinutes),
        },
        runId,
        stageNumber: number,
      })).unwrap();
    } catch {
      // The server owns scope, timing, convergence, and generated-stage checks.
    }
  };

  if (!eligibleRuns.length) return null;
  const finalStage = Number(stageNumber) === stages.length;

  return (
    <section className="rounded-3xl border border-cyan-300/15 bg-slate-950/90 p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Future-round control</p>
      <h2 className="mt-1 font-black text-white">Propose a round adjustment</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Change room size, top-N, or timing only before that round is generated. Platform Admin independently reviews every proposal; generated rounds remain immutable.
      </p>

      <form className="mt-4 grid gap-3" onSubmit={submit}>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-300">Event Run
            <select className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3" onChange={(event) => setRunId(event.target.value)} value={runId}>
              {eligibleRuns.map((item) => <option key={getRunId(item)} value={getRunId(item)}>{item.title}</option>)}
            </select>
          </label>
          <label className="text-sm text-slate-300">Future round
            <select className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3" onChange={(event) => chooseStage(event.target.value)} value={stageNumber}>
              {stages.filter((stage) => stage.number >= 2).map((stage) => <option key={stage.number} value={stage.number}>Round {stage.number}{stage.number === stages.length ? " / Final" : ""}</option>)}
            </select>
          </label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <NumberField label="Players per room" max={100} min={2} onChange={(value) => update("participantsPerMatch", value)} value={definition.participantsPerMatch} />
          {finalStage ? <div className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300"><span className="block text-xs text-slate-500">Qualification</span>Final ranking</div> : <NumberField label="Top players per room" max={99} min={1} onChange={(value) => update("advanceCount", value)} value={definition.advanceCount} />}
          <NumberField label="Room spacing" max={1440} min={0} onChange={(value) => update("batchSpacingMinutes", value)} value={definition.batchSpacingMinutes} />
          <NumberField label="Check-in before" max={1440} min={0} onChange={(value) => update("checkInMinutesBefore", value)} value={definition.checkInMinutesBefore} />
          <NumberField label="Next-round delay" max={10080} min={0} onChange={(value) => update("stageDelayMinutes", value)} value={definition.stageDelayMinutes} />
        </div>
        <button className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={!runId || state.actionByRunId[runId] === "loading"}>
          {state.actionByRunId[runId] === "loading" ? "Submitting..." : "Submit adjustment for review"}
        </button>
      </form>

      {history.length ? (
        <div className="mt-4 space-y-2 border-t border-slate-800 pt-4">
          {history.map((item) => (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800 px-3 py-2 text-xs" key={item.id}>
              <span className="font-bold text-white">Round {item.stageNumber} / revision {item.revision}</span>
              <span className="capitalize text-cyan-200">{item.status.replaceAll("_", " ")}</span>
              {item.reviewNote ? <span className="w-full text-slate-400">Reviewer: {item.reviewNote}</span> : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
};

const NumberField = ({ label, max, min, onChange, value }) => (
  <label className="text-xs font-bold text-slate-400">{label} (minutes where applicable)
    <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white" max={max} min={min} onChange={(event) => onChange(event.target.value)} required type="number" value={value} />
  </label>
);

NumberField.propTypes = { label: PropTypes.string.isRequired, max: PropTypes.number.isRequired, min: PropTypes.number.isRequired, onChange: PropTypes.func.isRequired, value: PropTypes.string.isRequired };
FutureRoundAdjustmentPanel.propTypes = { runs: PropTypes.arrayOf(PropTypes.object).isRequired };

export default FutureRoundAdjustmentPanel;
