import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchStageAdjustmentReviewQueue,
  reviewStageAdjustment,
} from "../../store/slices/eventStageAdjustmentSlice.js";

const StageAdjustmentReviewQueue = () => {
  const dispatch = useDispatch();
  const { queue, queueError, queueNextCursor, queueStatus, reviewById } = useSelector(
    (state) => state.eventStageAdjustments,
  );
  const [notes, setNotes] = useState({});

  useEffect(() => {
    const request = dispatch(fetchStageAdjustmentReviewQueue());
    return () => request.abort();
  }, [dispatch]);

  const decide = async (adjustmentId, action) => {
    try {
      await dispatch(reviewStageAdjustment({
        action,
        adjustmentId,
        note: notes[adjustmentId] || "",
      })).unwrap();
    } catch {
      // Server policy owns independent review and stage immutability.
    }
  };

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-3 md:p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 font-black text-cyan-300">R</span>
          <div>
            <h3 className="font-black text-white">Round changes</h3>
            <p className="text-xs text-slate-500">{queue.length} pending</p>
          </div>
        </div>
        <button
          aria-label="Refresh round changes"
          className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 disabled:opacity-50"
          disabled={queueStatus === "loading"}
          onClick={() => dispatch(fetchStageAdjustmentReviewQueue())}
          type="button"
        >
          Refresh
        </button>
      </div>

      {queueError ? <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{queueError}</p> : null}
      <div className="mt-4 grid gap-3 xl:grid-cols-2">
        {queue.map((item) => {
          const busy = reviewById[item.id] === "loading";
          const definition = item.definition || {};
          return (
            <article className="rounded-2xl border border-slate-800 bg-slate-950/65 p-4" key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">{item.eventRun?.title || "Event"} / Round {item.stageNumber}</p>
                  <p className="mt-1 text-xs text-slate-500">Revision {item.revision} / proposed by {item.proposedBy?.username || "Event Manager"}</p>
                </div>
                <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-100">Independent review</span>
              </div>

              <dl className="mt-4 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                <Fact label="Expected players" value={item.expectedParticipantCount} />
                <Fact label="Players / room" value={definition.participantsPerMatch} />
                <Fact label="Advance / room" value={definition.qualificationRule === "final_ranking" ? "Final ranking" : definition.advanceCount} />
                <Fact label="Room spacing" value={`${definition.batchSpacingMinutes || 0} min`} />
                <Fact label="Check-in" value={`${definition.checkInMinutesBefore || 0} min`} />
                <Fact label="Next-round delay" value={`${definition.stageDelayMinutes || 0} min`} />
              </dl>

              <div className="mt-3 rounded-xl border border-slate-800 p-3 text-xs text-slate-400">
                {(item.projection || []).map((row, index) => (
                  <p key={`${item.id}:${index}`}>
                    Round {item.stageNumber + index}: {row.participantCount} players / {row.batchCount} rooms / {row.qualifiedCount} qualify
                  </p>
                ))}
              </div>

              <label className="mt-3 block text-xs font-bold text-slate-400">
                Review note
                <textarea
                  className="mt-1 min-h-20 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white"
                  maxLength={1000}
                  onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                  placeholder="Required when requesting changes or rejecting."
                  value={notes[item.id] || ""}
                />
              </label>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                <DecisionButton action="approved" busy={busy} label="Approve" onClick={decide} recordId={item.id} />
                <DecisionButton action="changes_requested" busy={busy} label="Request changes" onClick={decide} recordId={item.id} />
                <DecisionButton action="rejected" busy={busy} label="Reject" onClick={decide} recordId={item.id} />
              </div>
            </article>
          );
        })}
        {queueStatus !== "loading" && queue.length === 0 ? <div className="col-span-full flex min-h-16 items-center justify-center rounded-xl border border-dashed border-slate-800 text-xs font-bold text-slate-500">All caught up</div> : null}
      </div>
      {queueNextCursor ? (
        <button
          className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
          disabled={queueStatus === "loading"}
          onClick={() => dispatch(fetchStageAdjustmentReviewQueue({ cursor: queueNextCursor }))}
          type="button"
        >
          {queueStatus === "loading" ? "Loading..." : "Load more proposals"}
        </button>
      ) : null}
    </section>
  );
};

const Fact = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 p-2">
    <dt className="text-xs text-slate-500">{label}</dt>
    <dd className="mt-1 font-bold text-slate-100">{value}</dd>
  </div>
);

const DecisionButton = ({ action, busy, label, onClick, recordId }) => (
  <button
    className="rounded-xl border border-cyan-300/25 px-3 py-2 text-xs font-black text-cyan-100 disabled:opacity-50"
    disabled={busy}
    onClick={() => onClick(recordId, action)}
    type="button"
  >
    {busy ? "Recording..." : label}
  </button>
);

Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired };
DecisionButton.propTypes = { action: PropTypes.string.isRequired, busy: PropTypes.bool.isRequired, label: PropTypes.string.isRequired, onClick: PropTypes.func.isRequired, recordId: PropTypes.string.isRequired };

export default StageAdjustmentReviewQueue;
