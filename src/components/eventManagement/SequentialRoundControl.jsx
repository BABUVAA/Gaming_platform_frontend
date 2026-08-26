import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  configureManagedEventRound,
  fetchManagedEventStages,
  fetchManagedRoundResults,
  processManagedEventRound,
} from "../../store/slices/eventStageSlice.js";

const runIdOf = (run) => run?._id || run?.id || "";
const activeStatuses = new Set([
  "scheduled",
  "registration_open",
  "registration_closed",
  "stages_ready",
  "in_progress",
]);

const initialDefinition = {
  advanceCount: "10",
  batchSpacingMinutes: "0",
  checkInMinutesBefore: "0",
  finalRound: false,
  participantsPerMatch: "100",
  stageDelayMinutes: "0",
};

const SequentialRoundControl = ({ runs }) => {
  const dispatch = useDispatch();
  const eligibleRuns = useMemo(
    () => runs.filter((run) => activeStatuses.has(run.status)),
    [runs],
  );
  const [runId, setRunId] = useState("");
  const [definition, setDefinition] = useState(initialDefinition);
  const [resultView, setResultView] = useState("promoted");
  const state = useSelector((root) => root.eventStages);
  const overview = state.overviewByRunId[runId];
  const run = eligibleRuns.find((item) => runIdOf(item) === runId);
  const stages = overview?.stages || [];
  const latest = stages.at(-1);
  const teamSize = Number(
    overview?.run?.format?.teamSize || run?.format?.teamSize ||
      run?.formatSnapshot?.teamSize || run?.template?.teamSize || 1,
  );
  const teamEvent = teamSize > 1;
  const firstRound = !latest;
  const registrationClosed = run && new Date(run.registrationClosesAt).getTime() <= Date.now();
  const priorRoundReady = latest && latest.completedBatchCount === latest.batchCount;
  const canConfigure = firstRound ? registrationClosed : priorRoundReady && latest.qualificationRule !== "final_ranking";
  const currentPlayers = firstRound
    ? run?.registrationSummary?.registeredCount || 0
    : latest?.promotedCount || 0;
  const currentTeams = teamEvent
    ? (firstRound ? currentPlayers / teamSize : latest?.promotedTeamCount || currentPlayers / teamSize)
    : currentPlayers;
  const nextRoundNumber = (latest?.number || 0) + 1;
  const actionBusy = state.actionByRunId[runId] === "loading";
  const resultKey = latest ? `${runId}:${latest.number}:${resultView}` : "";
  const resultPage = state.roundResultsByKey[resultKey] || { items: [], status: "idle" };
  const playersPerRoom = Number(definition.participantsPerMatch);
  const teamsPerRoom = teamEvent && Number.isInteger(playersPerRoom) ? playersPerRoom / teamSize : playersPerRoom;
  const roomSizeValid = Number.isInteger(playersPerRoom) && playersPerRoom >= teamSize * 2 && playersPerRoom <= 100 && (!teamEvent || playersPerRoom % teamSize === 0);
  const advanceCount = Number(definition.advanceCount);
  const promotionValid = definition.finalRound || (Number.isInteger(advanceCount) && advanceCount >= 1 && advanceCount < teamsPerRoom);

  useEffect(() => {
    if (!runId && eligibleRuns.length) setRunId(runIdOf(eligibleRuns[0]));
  }, [eligibleRuns, runId]);

  useEffect(() => {
    if (!runId) return undefined;
    const request = dispatch(fetchManagedEventStages({ runId }));
    return () => request.abort();
  }, [dispatch, runId]);

  useEffect(() => {
    if (!runId || !latest?.completedBatchCount) return undefined;
    const request = dispatch(fetchManagedRoundResults({ result: resultView, runId, stageNumber: latest.number }));
    return () => request.abort();
  }, [dispatch, latest?.completedBatchCount, latest?.number, resultView, runId]);

  const setField = (field, value) =>
    setDefinition((current) => ({ ...current, [field]: value }));

  const submit = async (event) => {
    event.preventDefault();
    try {
      await dispatch(configureManagedEventRound({
        definition: {
          advanceCount: Number(definition.advanceCount),
          batchSpacingMinutes: Number(definition.batchSpacingMinutes),
          checkInMinutesBefore: Number(definition.checkInMinutesBefore),
          finalRound: definition.finalRound,
          participantsPerMatch: Number(definition.participantsPerMatch),
          stageDelayMinutes: Number(definition.stageDelayMinutes),
        },
        runId,
      })).unwrap();
    } catch {
      // Server-owned scope, roster, and result evidence remain authoritative.
    }
  };

  if (!eligibleRuns.length) return null;

  return (
    <section className="rounded-3xl border border-cyan-300/20 bg-[#07111f] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Rounds</p>
          <h2 className="mt-1 text-xl font-black text-white">Match rooms and promotion</h2>
        </div>
        <select
          className="min-w-56 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          onChange={(event) => setRunId(event.target.value)}
          value={runId}
        >
          {eligibleRuns.map((item) => <option key={runIdOf(item)} value={runIdOf(item)}>{item.title}</option>)}
        </select>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Fact label="Current list" value={teamEvent ? `${currentTeams.toLocaleString("en-IN")} teams / ${currentPlayers.toLocaleString("en-IN")} players` : `${currentPlayers.toLocaleString("en-IN")} players`} />
        <Fact label="Rounds created" value={String(stages.length)} />
        <Fact label="Promoted" value={teamEvent ? `${latest?.promotedTeamCount || (latest?.promotedCount || 0) / teamSize} teams / ${latest?.promotedCount || 0} players` : String(latest?.promotedCount || 0)} />
        <Fact label="Eliminated" value={teamEvent ? `${latest?.eliminatedTeamCount || (latest?.eliminatedCount || 0) / teamSize} teams / ${latest?.eliminatedCount || 0} players` : String(latest?.eliminatedCount || 0)} />
      </div>

      {stages.length ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {stages.map((stage) => (
            <article className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4" key={stage.id}>
              <div className="flex items-center justify-between gap-3">
                <strong className="text-white">Round {stage.number}</strong>
                <span className="rounded-full border border-slate-700 px-2 py-1 text-[10px] font-black uppercase text-cyan-200">{stage.status.replaceAll("_", " ")}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-400 sm:grid-cols-4">
                <span>{teamEvent ? `${stage.rosterTeamCount || stage.rosterCount / teamSize} teams / ` : ""}{stage.rosterCount} players</span>
                <span>{stage.batchCount} rooms</span>
                <span>{teamEvent ? `${stage.promotedTeamCount || stage.promotedCount / teamSize} teams` : stage.promotedCount} promoted</span>
                <span>{teamEvent ? `${stage.eliminatedTeamCount || stage.eliminatedCount / teamSize} teams` : stage.eliminatedCount} eliminated</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {latest?.completedBatchCount ? (
        <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
          <div className="flex gap-2">
            {['promoted', 'eliminated'].map((value) => (
              <button className={resultView === value ? "rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black capitalize text-slate-950" : "rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold capitalize text-slate-300"} key={value} onClick={() => setResultView(value)} type="button">{value}</button>
            ))}
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
            {resultPage.items.map((item) => (
              <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-3 border-t border-slate-800 px-3 py-2 text-sm first:border-t-0" key={`${item.room}:${item.rank}:${item.team?.key || item.player?.profileTag}`}>
                <span className="min-w-0"><strong className="block truncate text-white">{teamEvent ? item.team?.name || "Team" : item.player?.displayName || "Player"}</strong><small className="text-slate-500">{teamEvent ? `${item.team?.memberCount || teamSize} players` : item.player?.profileTag}</small></span>
                <span className="text-slate-400">Room {item.room}</span>
                <span className="font-black text-cyan-200">#{item.rank}</span>
              </div>
            ))}
            {resultPage.status !== "loading" && !resultPage.items.length ? <p className="p-3 text-sm text-slate-500">No {resultView} {teamEvent ? "teams" : "players"} recorded yet.</p> : null}
          </div>
          {resultPage.nextCursor ? <button className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200" onClick={() => dispatch(fetchManagedRoundResults({ cursor: resultPage.nextCursor, result: resultView, runId, stageNumber: latest.number }))} type="button">Load more</button> : null}
        </div>
      ) : null}

      {canConfigure && currentPlayers >= 2 ? (
        <form className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/50 p-4" onSubmit={submit}>
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-black text-white">Configure Round {nextRoundNumber}</h3>
            <label className="flex items-center gap-2 text-sm font-bold text-amber-100">
              <input
                checked={definition.finalRound}
                disabled={currentPlayers > 100}
                onChange={(event) => setField("finalRound", event.target.checked)}
                type="checkbox"
              />
              Final round
            </label>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <NumberField label="Players per room" max={100} min={teamSize * 2} onChange={(value) => setField("participantsPerMatch", value)} step={teamSize} value={definition.participantsPerMatch} />
            {!definition.finalRound ? <NumberField label={teamEvent ? "Teams promoted per room" : "Players promoted per room"} max={Math.max(1, Math.floor(teamsPerRoom) - 1)} min={1} onChange={(value) => setField("advanceCount", value)} value={definition.advanceCount} /> : <Fact label="Result" value={teamEvent ? "Final team ranking" : "Final ranking"} />}
            <NumberField label="Room spacing (min)" max={1440} min={0} onChange={(value) => setField("batchSpacingMinutes", value)} value={definition.batchSpacingMinutes} />
            <NumberField label="Round delay (min)" max={10080} min={0} onChange={(value) => setField("stageDelayMinutes", value)} value={definition.stageDelayMinutes} />
          </div>
          {teamEvent ? <p className={`mt-3 text-xs font-bold ${roomSizeValid && promotionValid ? "text-cyan-200" : "text-rose-200"}`}>{roomSizeValid ? `${teamsPerRoom} complete teams / ${playersPerRoom} players per room${definition.finalRound ? "" : ` · top ${advanceCount} teams / ${advanceCount * teamSize} players advance`}` : `Room size must be a multiple of ${teamSize} players and hold at least two complete teams.`}</p> : null}
          <button className="mt-4 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={actionBusy || !roomSizeValid || !promotionValid} type="submit">
            {actionBusy ? "Processing..." : `Create Round ${nextRoundNumber}`}
          </button>
        </form>
      ) : latest?.qualificationRule === "final_ranking" ? (
        <p className="mt-4 text-sm font-bold text-emerald-200">Final round configured.</p>
      ) : (
        <p className="mt-4 text-sm text-slate-400">Next-round setup unlocks after every room has a verified result.</p>
      )}

      {(overview?.generation?.status === "pending" || overview?.advancement?.some((job) => job.status === "pending")) ? (
        <button className="mt-4 rounded-xl border border-cyan-300/30 px-4 py-2 text-sm font-black text-cyan-100 disabled:opacity-50" disabled={actionBusy} onClick={() => dispatch(processManagedEventRound(runId))} type="button">Process next page</button>
      ) : null}
    </section>
  );
};

const Fact = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
    <p className="mt-1 font-black text-white">{value}</p>
  </div>
);

const NumberField = ({ label, max, min, onChange, step = 1, value }) => (
  <label className="text-xs font-bold text-slate-400">{label}
    <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white" max={max} min={min} onChange={(event) => onChange(event.target.value)} required step={step} type="number" value={value} />
  </label>
);

Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired };
NumberField.propTypes = { label: PropTypes.string.isRequired, max: PropTypes.number.isRequired, min: PropTypes.number.isRequired, onChange: PropTypes.func.isRequired, step: PropTypes.number, value: PropTypes.string.isRequired };
SequentialRoundControl.propTypes = { runs: PropTypes.arrayOf(PropTypes.object).isRequired };

export default SequentialRoundControl;
