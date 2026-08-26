import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiInbox,
  FiRefreshCw,
  FiRotateCcw,
  FiXCircle,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { selectAuthUser } from "../../store/selectors/authSelectors.js";
import { canReviewEventProposal } from "../../utils/eventReviewPolicy.js";
import {
  fetchEventReviewQueue,
  reviewEventRun,
  reviewEventTemplate,
} from "../../store/slices/eventReviewSlice";

const staffSummaryShape = PropTypes.shape({
  profile: PropTypes.shape({ username: PropTypes.string }),
});

const eventRecordShape = PropTypes.shape({
  _id: PropTypes.string.isRequired,
  createdBy: staffSummaryShape,
  game: PropTypes.shape({ name: PropTypes.string }),
  mode: PropTypes.string,
  admissionPolicy: PropTypes.string,
  registrationCapacity: PropTypes.number,
  registrationClosesAt: PropTypes.string,
  registrationOpensAt: PropTypes.string,
  revision: PropTypes.number,
  startsAt: PropTypes.string,
  submittedAt: PropTypes.string,
  submittedBy: staffSummaryShape,
  teamSize: PropTypes.number,
  template: PropTypes.shape({ title: PropTypes.string }),
  title: PropTypes.string,
  waitlistEnabled: PropTypes.bool,
  executionPlan: PropTypes.shape({
    advanceCount: PropTypes.number,
    batchSpacingMinutes: PropTypes.number,
    checkInMinutesBefore: PropTypes.number,
    format: PropTypes.string,
    participantsPerMatch: PropTypes.number,
    seedingPolicy: PropTypes.string,
    stages: PropTypes.arrayOf(PropTypes.shape({
      advanceCount: PropTypes.number,
      batchSpacingMinutes: PropTypes.number,
      checkInMinutesBefore: PropTypes.number,
      number: PropTypes.number,
      participantsPerMatch: PropTypes.number,
      qualificationRule: PropTypes.string,
      stageDelayMinutes: PropTypes.number,
    })),
    projection: PropTypes.arrayOf(PropTypes.shape({
      batchCount: PropTypes.number,
      number: PropTypes.number,
      participantCount: PropTypes.number,
      qualifiedCount: PropTypes.number,
    })),
  }),
  entryTerms: PropTypes.shape({
    currency: PropTypes.string,
    entryFeeMinor: PropTypes.number,
    policy: PropTypes.string,
  }),
  formatSnapshot: PropTypes.shape({
    gameKey: PropTypes.string,
    map: PropTypes.string,
    mode: PropTypes.string,
    teamSize: PropTypes.number,
    templateRevision: PropTypes.number,
  }),
  rewardTerms: PropTypes.shape({
    currency: PropTypes.string,
    placements: PropTypes.arrayOf(PropTypes.shape({
      amountMinor: PropTypes.number,
      place: PropTypes.number,
    })),
  }),
  roundPlanStatus: PropTypes.string,
});

const formatDate = (value) => {
  if (!value) return "Not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const ReviewCard = ({ canReview, item, kind, onChoose, selected }) => {
  const isRun = kind === "run";
  const gameName = item.game?.name || "Game";
  const title = item.title || item.template?.title || "Untitled Event";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            {isRun ? "Event schedule" : "Event template"}
          </p>
          <h3 className="mt-2 font-black text-white">{title}</h3>
          <p className="mt-1 text-sm text-slate-400">{gameName}</p>
          <dl className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
            <ReviewFact label="Format" value={`${item.formatSnapshot?.mode || item.mode || "Mode"} · ${item.formatSnapshot?.teamSize || item.teamSize || 1} player`} />
            {isRun ? <ReviewFact label="Starts" value={formatDate(item.startsAt)} /> : null}
            {isRun ? <ReviewFact label="Entry" value={item.entryTerms?.policy === "paid" ? `INR ${(item.entryTerms.entryFeeMinor / 100).toFixed(2)}` : "Free"} /> : null}
            {isRun ? <ReviewFact label="Access" value={item.admissionPolicy?.replaceAll("_", " ") || "Not set"} /> : null}
          </dl>
          {isRun ? <p className="mt-3 text-xs text-slate-500">Registration: {formatDate(item.registrationOpensAt)} – {formatDate(item.registrationClosesAt)}</p> : null}
          {isRun && item.roundPlanStatus === "approved" && item.executionPlan ? (
            <details className="mt-3 rounded-xl border border-cyan-300/15 bg-cyan-300/5 p-3 text-xs leading-5 text-cyan-100/80">
              <summary className="cursor-pointer font-black">Legacy round plan</summary>
              <p className="font-black capitalize">{item.executionPlan.format?.replaceAll("_", " ")}</p>
              {item.executionPlan.format === "ranked_stages" ? (
                <div className="mt-2 space-y-1">
                  {item.executionPlan.stages?.map((stage) => (
                    <p key={stage.number}>
                      Round {stage.number}: {(item.executionPlan.projection?.find((entry) => entry.number === stage.number)?.participantCount || 0).toLocaleString("en-IN")} players / {(item.executionPlan.projection?.find((entry) => entry.number === stage.number)?.batchCount || 0).toLocaleString("en-IN")} rooms / {stage.participantsPerMatch} max per room / {stage.qualificationRule === "final_ranking" ? "final ranking" : `top ${stage.advanceCount} qualify`} / room spacing {stage.batchSpacingMinutes} min / next-round delay {stage.stageDelayMinutes} min
                    </p>
                  ))}
                </div>
              ) : (
                <p className="mt-1">2 players per match / 1 winner advances / {item.executionPlan.batchSpacingMinutes} minute spacing / registration order</p>
              )}
            </details>
          ) : null}
          {isRun && item.formatSnapshot ? (
            <p className="mt-2 text-xs text-slate-500">{item.formatSnapshot.map || "No map"} · template revision {item.formatSnapshot.templateRevision}</p>
          ) : null}
          {isRun && item.rewardTerms?.placements?.length ? (
            <p className="mt-2 text-xs font-bold text-emerald-200">
              Rewards: {item.rewardTerms.placements.map((reward) => `#${reward.place} ${(reward.amountMinor / 100).toFixed(2)}`).join(" · ")}
            </p>
          ) : isRun ? (
            <p className="mt-2 text-xs text-slate-500">No rewards</p>
          ) : null}
        </div>
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">
          {canReview ? "Review ready" : "Independent review required"}
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <p className="text-xs text-slate-500">Revision {item.revision || 1} submitted {formatDate(item.submittedAt)}</p>
        <button
          className={selected ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950" : "rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200"}
          disabled={!canReview}
          onClick={() => onChoose(item, kind)}
          type="button"
        >
          {canReview ? (selected ? "Reviewing" : "Review") : "Another admin reviews"}
        </button>
      </div>
    </article>
  );
};

ReviewCard.propTypes = {
  canReview: PropTypes.bool.isRequired,
  item: eventRecordShape.isRequired,
  kind: PropTypes.oneOf(["template", "run"]).isRequired,
  onChoose: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

const ReviewFact = ({ label, value }) => (
  <div className="rounded-lg bg-slate-900/80 px-2.5 py-2">
    <dt className="text-slate-500">{label}</dt>
    <dd className="mt-0.5 truncate font-bold capitalize text-slate-200">{value}</dd>
  </div>
);

ReviewFact.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

const EventReviewQueue = () => {
  const dispatch = useDispatch();
  const { error, runs, status, templates } = useSelector(
    (state) => state.eventReview,
  );
  const currentUser = useSelector(selectAuthUser);
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState("");

  useEffect(() => {
    dispatch(fetchEventReviewQueue());
  }, [dispatch]);

  const reviewTemplates = templates.filter((item) => item.status === "in_review");
  const reviewRuns = runs.filter((item) => item.status === "in_review");
  const reviewCount = reviewTemplates.length + reviewRuns.length;

  const canReview = (item) => {
    return canReviewEventProposal({ currentUser, item });
  };
  const chooseRecord = (item, kind) => {
    if (!canReview(item)) return;
    setDecision("");
    setNote("");
    setSelected({ id: item._id, item, kind });
  };

  const submitDecision = async (action) => {
    if (!selected || !canReview(selected.item)) return;

    setDecision(action);
    const operation =
      selected.kind === "template"
        ? reviewEventTemplate({ action, note, templateId: selected.id })
        : reviewEventRun({ action, note, runId: selected.id });

    try {
      await dispatch(operation).unwrap();
      setNote("");
      setSelected(null);
    } catch {
      // createApiThunk displays the policy error and leaves the review open.
    } finally {
      setDecision("");
    }
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#07111f] p-3">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300"><FiInbox /></span>
          <div>
            <h2 className="font-black text-white">Review queue</h2>
            <p className="text-xs text-slate-500">{reviewCount} pending</p>
          </div>
        </div>
        <button aria-label="Refresh review queue" className="grid size-9 place-items-center rounded-xl border border-slate-700 text-slate-300 disabled:opacity-60" disabled={status === "loading"} onClick={() => dispatch(fetchEventReviewQueue())} title="Refresh" type="button"><FiRefreshCw /></button>
      </header>

      {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}

      <div className={selected ? "grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]" : "grid gap-5"}>
        <div className="space-y-5">
          {reviewTemplates.length > 0 ? <QueueGroup canReview={canReview} icon={FiFileText} items={reviewTemplates} kind="template" onChoose={chooseRecord} selected={selected} title="Templates" /> : null}
          {reviewRuns.length > 0 ? <QueueGroup canReview={canReview} icon={FiClock} items={reviewRuns} kind="run" onChoose={chooseRecord} selected={selected} title="Events" /> : null}
          {status === "loading" && reviewCount === 0 ? <CompactQueueState label="Loading..." /> : null}
          {status !== "loading" && reviewCount === 0 ? <CompactQueueState label="All caught up" /> : null}
        </div>
        {selected ? <ReviewPanel canReview={canReview(selected.item)} decision={decision} note={note} onDecision={submitDecision} onNoteChange={setNote} selected={selected} /> : null}
      </div>
    </section>
  );
};

const QueueGroup = ({ canReview, icon: Icon, items, kind, onChoose, selected, title }) => (
  <section className="rounded-2xl border border-slate-800 bg-[#07111f] p-4">
    <div className="flex items-center gap-2"><Icon className="text-cyan-300" /><h3 className="font-black text-white">{title}</h3><span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-400">{items.length}</span></div>
    <div className="mt-4 grid gap-3">
      {items.map((item) => <ReviewCard canReview={canReview(item)} item={item} key={item._id} kind={kind} onChoose={onChoose} selected={selected?.id === item._id} />)}
    </div>
  </section>
);

const CompactQueueState = ({ label }) => (
  <div className="flex min-h-28 items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-sm font-bold text-slate-500">
    <FiCheckCircle className="text-emerald-300" />
    <span>{label}</span>
  </div>
);

CompactQueueState.propTypes = { label: PropTypes.string.isRequired };

QueueGroup.propTypes = {
  canReview: PropTypes.func.isRequired,
  icon: PropTypes.elementType.isRequired,
  items: PropTypes.arrayOf(eventRecordShape).isRequired,
  kind: PropTypes.oneOf(["template", "run"]).isRequired,
  onChoose: PropTypes.func.isRequired,
  selected: PropTypes.shape({ id: PropTypes.string }),
  title: PropTypes.string.isRequired,
};

const ReviewPanel = ({ canReview, decision, note, onDecision, onNoteChange, selected }) => {
  const { item, kind } = selected;
  return (
    <aside className="h-fit rounded-2xl border border-cyan-300/20 bg-[#07111f] p-4">
      <h3 className="text-lg font-black text-white">{item.title}</h3>
      <dl className="mt-4 space-y-3 text-sm"><ReviewValue label="Type" value={kind === "run" ? "Event" : "Template"} /><ReviewValue label="Revision" value={String(item.revision || 1)} /><ReviewValue label="Submitted by" value={item.submittedBy?.profile?.username || item.createdBy?.profile?.username || "Staff member"} /><ReviewValue label="Submitted" value={formatDate(item.submittedAt)} /></dl>
      {!canReview ? <p className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-sm text-amber-100">Independent review is required. Another Platform or Super Admin must record this decision.</p> : null}
      <label className="mt-5 block text-sm font-bold text-slate-200">Review note<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" disabled={!canReview} maxLength="1000" onChange={(event) => onNoteChange(event.target.value)} placeholder="Required for changes or rejection. Explain the decision clearly." value={note} /></label>
      <div className="mt-5 grid gap-2"><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60" disabled={!canReview || Boolean(decision)} onClick={() => onDecision("approved")} type="button"><FiCheckCircle /> {decision === "approved" ? "Recording..." : "Approve"}</button><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100 disabled:opacity-60" disabled={!canReview || Boolean(decision)} onClick={() => onDecision("changes_requested")} type="button"><FiRotateCcw /> {decision === "changes_requested" ? "Recording..." : "Request changes"}</button><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-100 disabled:opacity-60" disabled={!canReview || Boolean(decision)} onClick={() => onDecision("rejected")} type="button"><FiXCircle /> {decision === "rejected" ? "Recording..." : "Reject proposal"}</button></div>
    </aside>
  );
};

ReviewPanel.propTypes = {
  canReview: PropTypes.bool.isRequired,
  decision: PropTypes.string.isRequired,
  note: PropTypes.string.isRequired,
  onDecision: PropTypes.func.isRequired,
  onNoteChange: PropTypes.func.isRequired,
  selected: PropTypes.shape({
    item: eventRecordShape.isRequired,
    kind: PropTypes.oneOf(["template", "run"]).isRequired,
  }),
};

const ReviewValue = ({ label, value }) => <div className="flex justify-between gap-3 border-b border-slate-800 pb-3"><dt className="text-slate-500">{label}</dt><dd className="text-right text-slate-200">{value}</dd></div>;

ReviewValue.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default EventReviewQueue;
