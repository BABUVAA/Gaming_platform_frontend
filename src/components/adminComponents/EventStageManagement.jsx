import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FiRefreshCw } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchAdminEventStandings,
  fetchEventExecutionRuns,
  fetchEventStages,
  fetchEventPrizeRelease,
  releaseEventPrizes,
} from "../../store/slices/eventStageSlice.js";

const getId = (record) => record?.id || record?._id;
const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not set" : date.toLocaleString();
};

const EventStageManagement = () => {
  const dispatch = useDispatch();
  const [selectedRunId, setSelectedRunId] = useState("");
  const [standingResult, setStandingResult] = useState("");
  const [standingStage, setStandingStage] = useState("");
  const stageState = useSelector((state) => state.eventStages);
  const executionRuns = stageState.executionRuns;
  const selectedRun = executionRuns.find(
    (run) => getId(run) === selectedRunId,
  );
  const { errorByRunId, overviewByRunId, statusByRunId } =
    stageState;
  const overview = overviewByRunId[selectedRunId];
  const standings = stageState.standingsByRunId[selectedRunId];
  const prizeRelease = stageState.prizeByRunId[selectedRunId];
  const status = statusByRunId[selectedRunId] || "idle";

  useEffect(() => {
    const request = dispatch(fetchEventExecutionRuns());
    return () => request.abort();
  }, [dispatch]);

  useEffect(() => {
    if (!selectedRunId && executionRuns.length > 0) {
      setSelectedRunId(getId(executionRuns[0]));
    } else if (
      selectedRunId &&
      !executionRuns.some((run) => getId(run) === selectedRunId)
    ) {
    setSelectedRunId(executionRuns[0] ? getId(executionRuns[0]) : "");
    }
  }, [executionRuns, selectedRunId]);

  useEffect(() => {
    setStandingResult("");
    setStandingStage("");
  }, [selectedRunId]);

  useEffect(() => {
    if (!selectedRunId) return undefined;
    const request = dispatch(fetchEventStages({ runId: selectedRunId }));
    return () => request.abort();
  }, [dispatch, selectedRunId]);

  useEffect(() => {
    if (!selectedRunId || !overview?.completion) return undefined;
    const request = dispatch(fetchAdminEventStandings({
      eliminatedInStage: standingStage,
      result: standingResult,
      runId: selectedRunId,
    }));
    return () => request.abort();
  }, [dispatch, overview?.completion, selectedRunId, standingResult, standingStage]);

  useEffect(() => {
    if (!selectedRunId || overview?.completion?.financialSettlement !== "pending_release") return undefined;
    const request = dispatch(fetchEventPrizeRelease(selectedRunId));
    return () => request.abort();
  }, [dispatch, overview?.completion?.financialSettlement, selectedRunId]);

  const releasePrizes = async () => {
    if (!prizeRelease?.canRelease) return;
    if (!window.confirm("Release these fixed Event prizes to players' withdrawable balances?")) return;
    try {
      await dispatch(releaseEventPrizes(selectedRunId)).unwrap();
      dispatch(fetchEventStages({ runId: selectedRunId }));
    } catch {
      // Independent-review and idempotency decisions remain server-owned.
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
            Event execution
          </p>
          <h3 className="mt-1 text-lg font-black text-white">
            Results and rewards
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Inspect final evidence and independently release fixed Event rewards.
          </p>
        </div>
        {executionRuns.length > 0 ? (
          <label className="text-xs font-bold text-slate-400">
            Event Run
            <select
              className="mt-2 block min-w-64 rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              onChange={(event) => setSelectedRunId(event.target.value)}
              value={selectedRunId}
            >
              {executionRuns.map((run) => (
                <option key={getId(run)} value={getId(run)}>
                  {run.title}
                </option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      {stageState.runStatus === "loading" && executionRuns.length === 0 ? (
        <p className="mt-5 text-sm text-slate-500">
          Loading Event execution runs...
        </p>
      ) : null}
      {stageState.runStatus === "failed" ? (
        <button
          className="mt-5 rounded-xl border border-rose-400/30 px-4 py-2 text-sm text-rose-100"
          onClick={() => dispatch(fetchEventExecutionRuns())}
          type="button"
        >
          Retry: {stageState.runError}
        </button>
      ) : null}
      {stageState.runStatus === "succeeded" && executionRuns.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">
          No approved Event Run is ready for stage operations.
        </p>
      ) : null}

      {selectedRun ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
            <div>
              <p className="font-black text-white">{selectedRun.title}</p>
              <p className="mt-1 text-xs text-slate-500">
                Registration closes {formatDate(selectedRun.registrationClosesAt)} / {selectedRun.status.replaceAll("_", " ")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-xl border border-slate-700 p-3 text-slate-300 disabled:opacity-50"
                disabled={status === "loading"}
                onClick={() =>
                  dispatch(fetchEventStages({ runId: selectedRunId }))
                }
                title="Refresh stages"
                type="button"
              >
                <FiRefreshCw />
              </button>
            </div>
          </div>
          {status === "failed" ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">
              {errorByRunId[selectedRunId]}
            </p>
          ) : null}
          {overview?.generation?.errorCode ? (
            <p className="text-xs font-bold text-rose-200">
              Generation issue: {overview.generation.errorCode}
            </p>
          ) : null}
          {status === "loading" && !overview ? (
            <p className="text-sm text-slate-500">Loading stage status...</p>
          ) : null}
          {overview?.run ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label="Event status" value={overview.run.status?.replaceAll("_", " ")} />
              <Stat label="Frozen roster" value={String(overview.run.rosterCount || 0)} />
              <Stat label="Frozen at" value={formatDate(overview.run.rosterFrozenAt)} />
            </div>
          ) : null}
          {(overview?.advancement || []).map((job) => (
            <div
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
              key={job.stageNumber}
            >
              <div>
                <p className="font-black text-white">
                  Stage {job.stageNumber} advancement
                </p>
                <p className="mt-1 text-xs capitalize text-slate-400">
                  {job.status.replaceAll("_", " ")}
                  {job.errorCode ? ` / ${job.errorCode}` : ""}
                </p>
              </div>
            </div>
          ))}
          <div className="grid gap-3">
            {(overview?.stages || []).map((stage) => (
              <article
                className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                key={stage.id}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-black text-white">Stage {stage.number}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {stage.rosterCount} players / {stage.batchCount} batches / {stage.matchCount} Matches
                    </p>
                  </div>
                  <span className="rounded-full border border-cyan-300/20 px-3 py-1 text-xs font-bold text-cyan-200">
                    {stage.status.replaceAll("_", " ")}
                  </span>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {stage.batches.map((batch) => (
                    <div
                      className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-400"
                      key={batch.id}
                    >
                      Batch {batch.ordinal} / {batch.participantCount} players / {formatDate(batch.scheduledFor)} / {batch.status.replaceAll("_", " ")}
                    </div>
                  ))}
                </div>
                {stage.batchPage?.hasMore && stage.batchPage.nextCursor ? (
                  <button
                    className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
                    disabled={status === "loading"}
                    onClick={() =>
                      dispatch(
                        fetchEventStages({
                          batchCursor: stage.batchPage.nextCursor,
                          runId: selectedRunId,
                        }),
                      )
                    }
                    type="button"
                  >
                    Load more batches
                  </button>
                ) : null}
              </article>
            ))}
          </div>
          {standings ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="font-black text-white">Final standings and eliminated players</p>
                  <p className="mt-1 text-xs text-slate-500">Filter immutable results by status or eliminated round.</p>
                </div>
                <span className="text-xs capitalize text-slate-400">
                  {overview?.completion?.status?.replaceAll("_", " ")}
                </span>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-bold text-slate-400">
                  Result
                  <select className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" onChange={(event) => setStandingResult(event.target.value)} value={standingResult}>
                    <option value="">All players</option>
                    <option value="champion">Champion</option>
                    <option value="eliminated">Eliminated</option>
                  </select>
                </label>
                <label className="text-xs font-bold text-slate-400">
                  Eliminated round
                  <select className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white" onChange={(event) => setStandingStage(event.target.value)} value={standingStage}>
                    <option value="">All rounds</option>
                    {(overview?.stages || []).map((stage) => <option key={stage.id} value={stage.number}>Round {stage.number}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-3 space-y-2">
                {standings.standings.map((row) => (
                  <div
                    className="grid gap-1 rounded-xl border border-slate-800 px-3 py-2 text-sm sm:grid-cols-[2.5rem_1fr_auto] sm:gap-2"
                    key={`${row.placement}-${row.player.profileTag || row.player.displayName}`}
                  >
                    <span className="font-black text-cyan-200">#{row.placement}</span>
                    <span className="truncate font-bold text-white">
                      {row.player.displayName}
                    </span>
                    <span className="text-slate-400">
                      <span className="capitalize">{row.result}</span>
                      {row.eliminatedInStage ? ` / Round ${row.eliminatedInStage}` : ""}
                    </span>
                  </div>
                ))}
                {standings.standings.length === 0 ? <p className="rounded-xl border border-dashed border-slate-700 p-4 text-sm text-slate-500">No players match this filter.</p> : null}
              </div>
              {standings.nextCursor ? (
                <button
                  className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
                  disabled={
                    stageState.standingsStatusByRunId[selectedRunId] ===
                    "loading"
                  }
                  onClick={() =>
                    dispatch(
                      fetchAdminEventStandings({
                        cursor: standings.nextCursor,
                        eliminatedInStage: standingStage,
                        result: standingResult,
                        runId: selectedRunId,
                      }),
                    )
                  }
                  type="button"
                >
                  Load more standings
                </button>
              ) : null}
            </div>
          ) : null}
          {prizeRelease ? (
            <section className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-200">Event placement rewards</p>
                  <p className="mt-1 text-sm text-emerald-50">INR {(prizeRelease.totalMinor / 100).toFixed(2)} / {prizeRelease.status === "released" ? "released" : "pending independent release"}</p>
                </div>
                <button className="rounded-xl bg-emerald-300 px-4 py-2 text-sm font-black text-slate-950 disabled:opacity-50" disabled={!prizeRelease.canRelease || stageState.prizeActionByRunId[selectedRunId] === "loading"} onClick={releasePrizes} type="button">
                  {prizeRelease.status === "released" ? "Released" : prizeRelease.canRelease ? "Release prizes" : "Independent review required"}
                </button>
              </div>
              <p className="mt-3 text-xs leading-5 text-emerald-100/75">Rewards are fixed from final standings. A recipient or the Event approver cannot release them.</p>
            </section>
          ) : null}
          {stageState.nextRunCursor ? (
            <button
              className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
              disabled={stageState.runStatus === "loading"}
              onClick={() =>
                dispatch(
                  fetchEventExecutionRuns({ cursor: stageState.nextRunCursor }),
                )
              }
              type="button"
            >
              Load more Events
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
};

const Stat = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
    <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-2 font-black capitalize text-white">{value || "Not set"}</p>
  </div>
);

Stat.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

export default EventStageManagement;
