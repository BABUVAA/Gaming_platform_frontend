import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCheck, FiClock, FiRefreshCw, FiX } from "react-icons/fi";
import {
  decideWithdrawal,
  fetchWithdrawalReviewQueue,
  startWithdrawalReview,
} from "../../store/slices/withdrawalReviewSlice.js";
import {
  selectWithdrawalReviewError,
  selectWithdrawalReviewItems,
  selectWithdrawalReviewPage,
  selectWithdrawalReviewRequests,
  selectWithdrawalReviewStatus,
} from "../../store/selectors/withdrawalReviewSelectors.js";

const formatMinor = (minor = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", { currency, style: "currency" }).format(minor / 100);
const formatStatus = (status = "") => status.split("_").map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`).join(" ");
const formatWithdrawalStatus = (item) =>
  item.status === "reconciled"
    ? `Reconciled - ${item.outcome === "paid" ? "paid" : "funds returned"}`
    : formatStatus(item.status);

const WithdrawalReview = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectWithdrawalReviewItems);
  const page = useSelector(selectWithdrawalReviewPage);
  const requests = useSelector(selectWithdrawalReviewRequests);
  const status = useSelector(selectWithdrawalReviewStatus);
  const error = useSelector(selectWithdrawalReviewError);
  const [selectedId, setSelectedId] = useState(null);
  const [decision, setDecision] = useState(null);
  const [note, setNote] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const selected = items.find((item) => item.id === selectedId) || null;

  useEffect(() => {
    const request = dispatch(fetchWithdrawalReviewQueue());
    return () => request.abort();
  }, [dispatch]);

  const refresh = () => dispatch(fetchWithdrawalReviewQueue());
  const loadMore = () => {
    if (page.nextCursor && status !== "loadingMore") {
      dispatch(fetchWithdrawalReviewQueue({ cursor: page.nextCursor }));
    }
  };
  const resetDecision = () => {
    setDecision(null);
    setNote("");
    setConfirmed(false);
  };
  const startReview = async () => {
    if (!selected?.actions?.canStartReview) return;
    try {
      await dispatch(startWithdrawalReview({ withdrawalId: selected.id })).unwrap();
    } catch {
      // Per-record Redux state renders the normalized error.
    }
  };
  const submitDecision = async () => {
    if (!selected?.actions?.canDecide || !confirmed || !decision) return;
    if (decision === "reject" && !note.trim()) return;
    try {
      await dispatch(decideWithdrawal({ decision, note: note.trim(), withdrawalId: selected.id })).unwrap();
      resetDecision();
    } catch {
      // Per-record Redux state renders the normalized error.
    }
  };

  return (
    <section className="space-y-5">
      <header className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(16,185,129,0.12),_transparent_38%),#07111f] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div><p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-300">Financial governance</p><h2 className="mt-1 text-2xl font-black text-white">Withdrawal Review</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Claim a request before deciding it. Approval only queues provider processing; it never marks a payout as paid.</p></div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 disabled:opacity-50" disabled={status === "loading" || status === "loadingMore"} onClick={refresh} type="button"><FiRefreshCw /> Refresh</button>
        </div>
      </header>

      {error ? <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{error}</p> : null}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
        <div className="space-y-3">
          {status === "loading" && items.length === 0 ? <p className="rounded-3xl border border-slate-800 p-6 text-sm text-slate-400">Loading withdrawal reviews...</p> : null}
          {status === "succeeded" && items.length === 0 ? <p className="rounded-3xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">No withdrawals require governance attention.</p> : null}
          {items.map((item) => <ReviewCard item={item} key={item.id} onSelect={() => { setSelectedId(item.id); resetDecision(); }} selected={item.id === selectedId} />)}
          {page.hasMore ? <button className="rounded-2xl border border-cyan-400/40 px-5 py-3 text-sm font-bold text-cyan-200 disabled:opacity-50" disabled={status === "loadingMore"} onClick={loadMore} type="button">{status === "loadingMore" ? "Loading more..." : "Load more"}</button> : null}
        </div>
        <ReviewPanel confirmed={confirmed} decision={decision} item={selected} note={note} onConfirm={setConfirmed} onDecision={setDecision} onNote={setNote} onStart={startReview} onSubmit={submitDecision} request={selected ? requests[selected.id] : null} />
      </div>
    </section>
  );
};

const ReviewCard = ({ item, onSelect, selected }) => (
  <button className={`w-full rounded-3xl border p-5 text-left transition ${selected ? "border-cyan-300/50 bg-cyan-300/10" : "border-slate-800 bg-slate-950/70 hover:border-slate-700"}`} onClick={onSelect} type="button">
    <div className="flex items-start justify-between gap-3"><div><p className="font-black text-white">{item.player?.displayName || item.player?.email || "Player"}</p><p className="mt-1 text-sm text-slate-400">{item.destination?.maskedLabel}</p></div><span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold text-slate-300">{formatWithdrawalStatus(item)}</span></div>
    <div className="mt-4 flex items-end justify-between gap-3"><p className="text-2xl font-black text-emerald-300">{formatMinor(item.amountMinor, item.currency)}</p><p className="text-xs text-slate-500">{new Date(item.requestedAt).toLocaleString("en-IN")}</p></div>
  </button>
);

const ReviewPanel = ({ confirmed, decision, item, note, onConfirm, onDecision, onNote, onStart, onSubmit, request }) => {
  if (!item) return <aside className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-sm text-slate-400">Select a withdrawal to inspect its server-recorded request and allowed actions.</aside>;
  const loading = request?.status === "loading";
  const actionError = typeof request?.error === "string" ? request.error : request?.error?.message;
  return <aside className="rounded-3xl border border-slate-800 bg-slate-950/80 p-5">
    <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Review evidence</p>
    <dl className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Value label="Player" value={item.player?.email || item.player?.displayName || "Player"} /><Value label="Exact amount" value={formatMinor(item.amountMinor, item.currency)} /><Value label="Destination" value={item.destination?.maskedLabel || "Saved destination"} /><Value label="Status" value={formatWithdrawalStatus(item)} /></dl>
    {item.actions?.blockedReason ? <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-100">{formatStatus(item.actions.blockedReason)}</p> : null}
    {actionError ? <p className="mt-4 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">{actionError}</p> : null}
    {item.actions?.canStartReview ? <button className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={loading} onClick={onStart} type="button"><FiClock /> {loading ? "Claiming..." : "Start review"}</button> : null}
    {item.actions?.canDecide ? <div className="mt-5 border-t border-slate-800 pt-5"><div className="grid grid-cols-2 gap-3"><button className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${decision === "approve" ? "border-emerald-300 bg-emerald-300 text-slate-950" : "border-slate-700 text-slate-200"}`} onClick={() => { onDecision("approve"); onConfirm(false); }} type="button"><FiCheck /> Approve</button><button className={`inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-bold ${decision === "reject" ? "border-rose-300 bg-rose-300 text-slate-950" : "border-slate-700 text-slate-200"}`} onClick={() => { onDecision("reject"); onConfirm(false); }} type="button"><FiX /> Reject</button></div>{decision ? <><label className="mt-4 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{decision === "reject" ? "Rejection reason (required)" : "Reviewer note (optional)"}</label><textarea className="mt-2 min-h-24 w-full rounded-2xl border border-slate-800 bg-slate-900 p-3 text-sm text-white" maxLength={500} onChange={(event) => { onConfirm(false); onNote(event.target.value); }} value={note} /><label className="mt-3 flex items-start gap-3 text-sm text-slate-300"><input checked={confirmed} className="mt-1" onChange={(event) => onConfirm(event.target.checked)} type="checkbox" /><span>I confirm this decision for the exact server-recorded request.</span></label><button className="mt-4 w-full rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={loading || !confirmed || (decision === "reject" && !note.trim())} onClick={onSubmit} type="button">{loading ? "Saving decision..." : `Confirm ${decision}`}</button></> : null}</div> : null}
  </aside>;
};

const Value = ({ label, value }) => <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3"><dt className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">{label}</dt><dd className="mt-1 break-words text-sm font-bold text-white">{value}</dd></div>;

const itemShape = PropTypes.shape({ actions: PropTypes.shape({ blockedReason: PropTypes.string, canDecide: PropTypes.bool, canStartReview: PropTypes.bool }), amountMinor: PropTypes.number.isRequired, currency: PropTypes.string.isRequired, destination: PropTypes.shape({ maskedLabel: PropTypes.string }), id: PropTypes.string.isRequired, outcome: PropTypes.oneOf(["paid", "failed"]), player: PropTypes.shape({ displayName: PropTypes.string, email: PropTypes.string }), requestedAt: PropTypes.string.isRequired, status: PropTypes.string.isRequired });
ReviewCard.propTypes = { item: itemShape.isRequired, onSelect: PropTypes.func.isRequired, selected: PropTypes.bool.isRequired };
ReviewPanel.propTypes = { confirmed: PropTypes.bool.isRequired, decision: PropTypes.string, item: itemShape, note: PropTypes.string.isRequired, onConfirm: PropTypes.func.isRequired, onDecision: PropTypes.func.isRequired, onNote: PropTypes.func.isRequired, onStart: PropTypes.func.isRequired, onSubmit: PropTypes.func.isRequired, request: PropTypes.shape({ error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]), status: PropTypes.string }) };
Value.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired };

export default WithdrawalReview;
