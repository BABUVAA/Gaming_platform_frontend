import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  FiCheckCircle,
  FiClock,
  FiFileText,
  FiRefreshCw,
  FiRotateCcw,
  FiXCircle,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchEventReviewQueue,
  reviewEventRun,
  reviewEventTemplate,
} from "../../store/slices/eventReviewSlice";
import EventInvitationManagement from "./EventInvitationManagement.jsx";
import EventStageManagement from "./EventStageManagement.jsx";

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

const ReviewCard = ({ item, kind, onChoose, selected }) => {
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
          <p className="mt-1 text-sm text-slate-400">
            {gameName} {isRun ? `/ ${formatDate(item.startsAt)}` : `/ ${item.mode} / ${item.teamSize} player team`}
          </p>
          {isRun ? (
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Registration {formatDate(item.registrationOpensAt)} to {formatDate(item.registrationClosesAt)} / {item.admissionPolicy?.replaceAll("_", " ") || "admission not set"} / {item.registrationCapacity || 0} seats / waitlist {item.waitlistEnabled ? "on" : "off"}
            </p>
          ) : null}
          {isRun && item.executionPlan ? (
            <p className="mt-2 text-xs leading-5 text-cyan-100/70">
              {item.executionPlan.format?.replaceAll("_", " ")} / {item.executionPlan.participantsPerMatch} players per match / top {item.executionPlan.advanceCount} advance / {item.executionPlan.batchSpacingMinutes} minute spacing / check-in {item.executionPlan.checkInMinutesBefore} minutes before / {item.executionPlan.seedingPolicy?.replaceAll("_", " ")}
            </p>
          ) : null}
          {isRun && item.formatSnapshot ? (
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Locked format / {item.formatSnapshot.gameKey} / {item.formatSnapshot.mode} / {item.formatSnapshot.map || "no map"} / {item.formatSnapshot.teamSize}-player entry / template revision {item.formatSnapshot.templateRevision}
            </p>
          ) : null}
          {isRun && item.rewardTerms?.placements?.length ? (
            <p className="mt-2 text-xs leading-5 text-emerald-100/80">
              Placement rewards: {item.rewardTerms.placements.map((reward) => `#${reward.place} INR ${(reward.amountMinor / 100).toFixed(2)}`).join(" / ")}
            </p>
          ) : isRun ? (
            <p className="mt-2 text-xs text-slate-500">No placement rewards proposed.</p>
          ) : null}
        </div>
        <span className="rounded-full border border-amber-300/25 bg-amber-300/10 px-3 py-1 text-xs font-bold text-amber-200">
          Review ready
        </span>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-800 pt-3">
        <p className="text-xs text-slate-500">Revision {item.revision || 1} submitted {formatDate(item.submittedAt)}</p>
        <button
          className={selected ? "rounded-lg bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950" : "rounded-lg border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200"}
          onClick={() => onChoose(item, kind)}
          type="button"
        >
          {selected ? "Reviewing" : "Review"}
        </button>
      </div>
    </article>
  );
};

ReviewCard.propTypes = {
  item: eventRecordShape.isRequired,
  kind: PropTypes.oneOf(["template", "run"]).isRequired,
  onChoose: PropTypes.func.isRequired,
  selected: PropTypes.bool.isRequired,
};

const EventReviewQueue = () => {
  const dispatch = useDispatch();
  const { error, runs, status, templates } = useSelector(
    (state) => state.eventReview,
  );
  const [selected, setSelected] = useState(null);
  const [note, setNote] = useState("");
  const [decision, setDecision] = useState("");

  useEffect(() => {
    dispatch(fetchEventReviewQueue());
  }, [dispatch]);

  const reviewTemplates = templates.filter((item) => item.status === "in_review");
  const reviewRuns = runs.filter((item) => item.status === "in_review");
  const reviewCount = reviewTemplates.length + reviewRuns.length;

  const chooseRecord = (item, kind) => {
    setDecision("");
    setNote("");
    setSelected({ id: item._id, item, kind });
  };

  const submitDecision = async (action) => {
    if (!selected) return;

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
      <header className="rounded-2xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.13),_transparent_35%),#07111f] p-4 md:p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">Platform review</p>
            <h2 className="mt-1 text-lg font-black tracking-tight text-white">Event approval queue</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Review submitted Event work. You cannot review a proposal you created or last submitted, even if you hold more than one staff role.</p>
          </div>
          <button className="inline-flex w-fit items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 disabled:opacity-60" disabled={status === "loading"} onClick={() => dispatch(fetchEventReviewQueue())} type="button"><FiRefreshCw /> Refresh queue</button>
        </div>
        <div className="mt-5 inline-flex items-center gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 px-4 py-3 text-sm text-amber-100"><FiClock /> {reviewCount} item{reviewCount === 1 ? "" : "s"} waiting for an independent decision</div>
      </header>

      {error && <div className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div className="space-y-5">
          <QueueGroup icon={FiFileText} items={reviewTemplates} kind="template" onChoose={chooseRecord} selected={selected} title="Template proposals" />
          <QueueGroup icon={FiClock} items={reviewRuns} kind="run" onChoose={chooseRecord} selected={selected} title="Event schedules" />
          {status === "loading" && reviewCount === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">Loading review queue...</p>}
          {status !== "loading" && reviewCount === 0 && <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">Nothing is waiting for review. Approved and returned work stays out of this queue.</p>}
        </div>
        <ReviewPanel decision={decision} note={note} onDecision={submitDecision} onNoteChange={setNote} selected={selected} />
      </div>
      <EventInvitationManagement />
      <EventStageManagement />
    </section>
  );
};

const QueueGroup = ({ icon: Icon, items, kind, onChoose, selected, title }) => (
  <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-5">
    <div className="flex items-center gap-2"><Icon className="text-cyan-300" /><h3 className="font-black text-white">{title}</h3><span className="rounded-full bg-slate-900 px-2 py-1 text-xs text-slate-400">{items.length}</span></div>
    <div className="mt-4 grid gap-3">
      {items.map((item) => <ReviewCard item={item} key={item._id} kind={kind} onChoose={onChoose} selected={selected?.id === item._id} />)}
      {items.length === 0 && <p className="text-sm text-slate-500">No submitted {kind === "run" ? "schedules" : "templates"} right now.</p>}
    </div>
  </section>
);

QueueGroup.propTypes = {
  icon: PropTypes.elementType.isRequired,
  items: PropTypes.arrayOf(eventRecordShape).isRequired,
  kind: PropTypes.oneOf(["template", "run"]).isRequired,
  onChoose: PropTypes.func.isRequired,
  selected: PropTypes.shape({ id: PropTypes.string }),
  title: PropTypes.string.isRequired,
};

const ReviewPanel = ({ decision, note, onDecision, onNoteChange, selected }) => {
  if (!selected) return <aside className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm leading-6 text-slate-400">Choose an item from the queue to compare its setup and record an approval decision.</aside>;

  const { item, kind } = selected;
  return (
    <aside className="h-fit rounded-3xl border border-cyan-300/20 bg-[#07111f] p-5">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Decision record</p>
      <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>
      <dl className="mt-5 space-y-3 text-sm"><ReviewValue label="Proposal type" value={kind === "run" ? "Dated Event schedule" : "Repeatable Event template"} /><ReviewValue label="Revision" value={String(item.revision || 1)} /><ReviewValue label="Submitted by" value={item.submittedBy?.profile?.username || item.createdBy?.profile?.username || "Staff member"} /><ReviewValue label="Submitted" value={formatDate(item.submittedAt)} /></dl>
      <label className="mt-5 block text-sm font-bold text-slate-200">Review note<textarea className="mt-2 min-h-28 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white" maxLength="1000" onChange={(event) => onNoteChange(event.target.value)} placeholder="Required for changes or rejection. Explain the decision clearly." value={note} /></label>
      <p className="mt-2 text-xs leading-5 text-slate-500">Approval may be recorded without a note. Changes requested and rejection require at least 10 characters.</p>
      <div className="mt-5 grid gap-2"><button className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60" disabled={Boolean(decision)} onClick={() => onDecision("approved")} type="button"><FiCheckCircle /> {decision === "approved" ? "Recording..." : "Approve"}</button><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300/30 bg-amber-300/10 px-4 py-3 text-sm font-black text-amber-100 disabled:opacity-60" disabled={Boolean(decision)} onClick={() => onDecision("changes_requested")} type="button"><FiRotateCcw /> {decision === "changes_requested" ? "Recording..." : "Request changes"}</button><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-100 disabled:opacity-60" disabled={Boolean(decision)} onClick={() => onDecision("rejected")} type="button"><FiXCircle /> {decision === "rejected" ? "Recording..." : "Reject proposal"}</button></div>
    </aside>
  );
};

ReviewPanel.propTypes = {
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
