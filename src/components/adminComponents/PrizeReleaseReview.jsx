import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiDollarSign,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import {
  selectPrizeReleaseItems,
  selectPrizeReleasePage,
  selectPrizeReleaseQueueError,
  selectPrizeReleaseQueueStatus,
  selectPrizeReleaseRequests,
} from "../../store/selectors/prizeReleaseReviewSelectors.js";
import {
  fetchPrizeReleaseQueue,
  releaseMatchPrize,
} from "../../store/slices/prizeReleaseReviewSlice.js";

const formatMinor = (amountMinor, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    currency,
    style: "currency",
  }).format(Number(amountMinor || 0) / 100);

const formatDate = (value) => {
  const date = value ? new Date(value) : null;
  if (!date || Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const staffName = (staff) =>
  staff
    ? `${staff.displayName}${staff.profileTag ? ` · ${staff.profileTag}` : ""}`
    : "Reviewer identity unavailable";

const blockMessages = {
  dispute_unresolved:
    "This prize cannot be released while the Match dispute remains unresolved.",
  independent_review_required:
    "Independent Platform/Super Admin review required. The administrator who settled this Match cannot release its prize.",
  manual_resolution_required:
    "This record requires manual financial resolution before its prize can be released.",
  participant_conflict:
    "You participated in this Match, so another governance administrator must review the prize.",
};

const getBlockMessage = (item) =>
  blockMessages[item.review?.blockedReason] ||
  (!item.review?.canRelease
    ? "This prize is not eligible for release. Refresh the queue or ask another governance administrator to review it."
    : null);

const getDisputeStatus = (result) => {
  if (!result.disputedAt) return "No dispute filed";
  if (result.disputeResolvedAt) {
    return `Resolved ${formatDate(result.disputeResolvedAt)}`;
  }
  return "Dispute unresolved";
};

const PrizeReleaseReview = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectPrizeReleaseItems);
  const page = useSelector(selectPrizeReleasePage);
  const queueError = useSelector(selectPrizeReleaseQueueError);
  const queueStatus = useSelector(selectPrizeReleaseQueueStatus);
  const releaseRequests = useSelector(selectPrizeReleaseRequests);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [confirmed, setConfirmed] = useState(false);

  const selected = items.find((item) => item.matchId === selectedMatchId) || null;
  const selectedRequest = selected
    ? releaseRequests[selected.matchId] || null
    : null;

  useEffect(() => {
    const request = dispatch(fetchPrizeReleaseQueue());
    return () => request.abort();
  }, [dispatch]);

  const chooseItem = (item) => {
    setConfirmed(false);
    setSelectedMatchId(item.matchId);
  };

  const refreshQueue = () => {
    setConfirmed(false);
    dispatch(fetchPrizeReleaseQueue());
  };

  const loadMore = () => {
    if (!page.nextCursor || queueStatus === "loadingMore") return;
    dispatch(fetchPrizeReleaseQueue({ cursor: page.nextCursor }));
  };

  const releasePrize = async () => {
    if (
      !selected?.review?.canRelease ||
      !confirmed ||
      selectedRequest?.status === "loading"
    ) return;
    try {
      await dispatch(releaseMatchPrize({ matchId: selected.matchId })).unwrap();
      setConfirmed(false);
      setSelectedMatchId(null);
    } catch {
      // The thunk and per-Match Redux request state retain the safe API error.
    }
  };

  const isInitialLoading = queueStatus === "loading" && items.length === 0;

  return (
    <section className="space-y-5">
      <header className="rounded-2xl border border-slate-800 bg-slate-950/55 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-300"><FiShield className="text-emerald-300" />{items.length} settled Match{items.length === 1 ? "" : "es"}</p>
          <button
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
            disabled={queueStatus === "loading" || queueStatus === "loadingMore"}
            onClick={refreshQueue}
            type="button"
          >
            <FiRefreshCw className={queueStatus === "loading" ? "animate-spin" : ""} />
            Refresh queue
          </button>
        </div>
      </header>

      {queueError ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">
          <span>{queueError}</span>
          <button className="font-bold underline underline-offset-4" onClick={refreshQueue} type="button">
            Try again
          </button>
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="space-y-3" aria-live="polite">
          {isInitialLoading ? (
            <p className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
              Loading settled prizes...
            </p>
          ) : null}

          {!isInitialLoading && items.length === 0 && !queueError ? (
            <p className="rounded-2xl border border-dashed border-slate-700 bg-slate-950/50 p-6 text-center text-sm leading-6 text-slate-400">
              No settled winner prizes are waiting for release review.
            </p>
          ) : null}

          {items.map((item) => (
            <PrizeReviewCard
              item={item}
              key={item.matchId}
              onChoose={chooseItem}
              pending={releaseRequests[item.matchId]?.status === "loading"}
              selected={selectedMatchId === item.matchId}
            />
          ))}

          {page.hasMore ? (
            <div className="pt-2 text-center">
              <button
                className="rounded-xl border border-cyan-300/30 bg-cyan-300/10 px-5 py-3 text-sm font-black text-cyan-100 disabled:opacity-50"
                disabled={queueStatus === "loading" || queueStatus === "loadingMore"}
                onClick={loadMore}
                type="button"
              >
                {queueStatus === "loadingMore" ? "Loading more..." : "Load more"}
              </button>
            </div>
          ) : null}
        </div>

        <PrizeReviewPanel
          confirmed={confirmed}
          item={selected}
          onConfirmChange={setConfirmed}
          onRelease={releasePrize}
          request={selectedRequest}
        />
      </div>
    </section>
  );
};

const PrizeReviewCard = ({ item, onChoose, pending, selected }) => {
  const blockedMessage = getBlockMessage(item);
  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
            {item.gameKey.toUpperCase()} · {item.offering.title}
          </p>
          <h3 className="mt-2 text-lg font-black text-white">{item.title}</h3>
          <p className="mt-2 text-sm text-slate-400">
            Settled by {staffName(item.settledBy)} · {formatDate(item.settledAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-black text-emerald-300">
            {formatMinor(item.totalMinor, item.currency)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {item.winners.length} winner{item.winners.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {blockedMessage ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-100">
          <FiAlertTriangle className="mt-0.5 shrink-0" /> {blockedMessage}
        </p>
      ) : null}

      <div className="mt-4 flex justify-end border-t border-slate-800 pt-3">
        <button
          className={selected ? "rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950" : "rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200"}
          disabled={pending}
          onClick={() => onChoose(item)}
          type="button"
        >
          {pending ? "Releasing..." : selected ? "Reviewing" : "Review evidence"}
        </button>
      </div>
    </article>
  );
};

const PrizeReviewPanel = ({ confirmed, item, onConfirmChange, onRelease, request }) => {
  if (!item) {
    return (
      <aside className="h-fit rounded-3xl border border-dashed border-slate-700 bg-slate-950/50 p-5 text-sm leading-6 text-slate-400">
        Choose a settled Match to inspect its verified winners, allocations,
        dispute evidence, and independent-review eligibility.
      </aside>
    );
  }

  const blockedMessage = getBlockMessage(item);
  const isReleasing = request?.status === "loading";
  const releaseError = request?.error?.message || request?.error || null;

  return (
    <aside className="h-fit rounded-3xl border border-emerald-300/20 bg-[#07111f] p-5">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-300">
        Release confirmation
      </p>
      <h3 className="mt-2 text-xl font-black text-white">{item.title}</h3>

      <dl className="mt-5 space-y-3 text-sm">
        <ReviewValue label="Match" value={item.title} />
        <ReviewValue label="Offering" value={item.offering.title} />
        <ReviewValue label="Settled by" value={staffName(item.settledBy)} />
        <ReviewValue label="Settled" value={formatDate(item.settledAt)} />
        <ReviewValue label="Verified" value={formatDate(item.result.verifiedAt)} />
        <ReviewValue label="Final score" value={item.result.finalScore || "Not provided"} />
        <ReviewValue label="Dispute" value={getDisputeStatus(item.result)} />
      </dl>

      <section className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/70 p-4">
        <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
          Recorded winner allocation
        </p>
        <div className="mt-3 space-y-3">
          {item.winners.map((winner) => (
            <div className="flex items-center justify-between gap-3 text-sm" key={winner.userId}>
              <span className="text-slate-200">
                #{winner.place || 1} {winner.displayName}
                {winner.profileTag ? ` · ${winner.profileTag}` : ""}
              </span>
              <span className="font-black text-emerald-300">
                {formatMinor(winner.amountMinor, item.currency)}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-4">
          <span className="text-sm font-bold text-white">Exact total</span>
          <span className="text-lg font-black text-emerald-300">
            {formatMinor(item.totalMinor, item.currency)}
          </span>
        </div>
      </section>

      <section className="mt-4 space-y-3 rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
        <EvidenceValue label="Result evidence" value={item.result.proofNote} />
        <EvidenceValue label="Dispute resolution" value={item.result.disputeResolutionNote} />
        <EvidenceValue label="Dispute deadline" value={formatDate(item.result.disputeDeadline)} />
      </section>

      <div className="mt-5 flex items-center justify-center gap-3 rounded-2xl border border-emerald-300/25 bg-emerald-300/10 p-4 text-sm font-black text-emerald-100">
        <FiDollarSign /> Prize pending <span aria-hidden="true">→</span> Withdrawable
      </div>

      {blockedMessage ? (
        <p className="mt-4 flex items-start gap-2 rounded-xl border border-amber-300/20 bg-amber-300/10 p-3 text-sm leading-6 text-amber-100">
          <FiAlertTriangle className="mt-1 shrink-0" /> {blockedMessage}
        </p>
      ) : (
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-slate-700 p-3 text-sm leading-6 text-slate-300">
          <input
            checked={confirmed}
            className="mt-1"
            onChange={(event) => onConfirmChange(event.target.checked)}
            type="checkbox"
          />
          I independently reviewed the recorded result, dispute state, winners,
          and exact allocation. I understand this ledger movement is irreversible.
        </label>
      )}

      {releaseError ? (
        <p className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">
          {releaseError}
        </p>
      ) : null}

      <button
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-300 px-4 py-3 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        disabled={Boolean(blockedMessage) || !confirmed || isReleasing}
        onClick={onRelease}
        type="button"
      >
        {isReleasing ? <FiClock /> : <FiCheckCircle />}
        {isReleasing ? "Releasing recorded prize..." : "Release exact recorded prize"}
      </button>
    </aside>
  );
};

const ReviewValue = ({ label, value }) => (
  <div className="flex justify-between gap-3 border-b border-slate-800 pb-3">
    <dt className="text-slate-500">{label}</dt>
    <dd className="text-right text-slate-200">{value}</dd>
  </div>
);

const EvidenceValue = ({ label, value }) => (
  <div>
    <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">{label}</p>
    <p className="mt-1 leading-6 text-slate-300">{value || "No additional note recorded."}</p>
  </div>
);

const winnerShape = PropTypes.shape({
  amountMinor: PropTypes.number.isRequired,
  place: PropTypes.number,
  displayName: PropTypes.string.isRequired,
  profileTag: PropTypes.string,
  userId: PropTypes.string.isRequired,
});

const prizeReviewShape = PropTypes.shape({
  currency: PropTypes.string.isRequired,
  gameKey: PropTypes.string.isRequired,
  matchId: PropTypes.string.isRequired,
  offering: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
  }).isRequired,
  result: PropTypes.shape({
    disputeDeadline: PropTypes.string,
    disputeResolutionNote: PropTypes.string,
    disputeResolvedAt: PropTypes.string,
    disputedAt: PropTypes.string,
    finalScore: PropTypes.string,
    proofNote: PropTypes.string,
    verifiedAt: PropTypes.string,
  }).isRequired,
  review: PropTypes.shape({
    blockedReason: PropTypes.oneOf([
      "independent_review_required",
      "manual_resolution_required",
      "dispute_unresolved",
      "participant_conflict",
    ]),
    canRelease: PropTypes.bool.isRequired,
  }).isRequired,
  settledAt: PropTypes.string.isRequired,
  settledBy: PropTypes.shape({
    displayName: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    profileTag: PropTypes.string,
  }),
  title: PropTypes.string.isRequired,
  totalMinor: PropTypes.number.isRequired,
  winners: PropTypes.arrayOf(winnerShape).isRequired,
});

PrizeReviewCard.propTypes = {
  item: prizeReviewShape.isRequired,
  onChoose: PropTypes.func.isRequired,
  pending: PropTypes.bool.isRequired,
  selected: PropTypes.bool.isRequired,
};

PrizeReviewPanel.propTypes = {
  confirmed: PropTypes.bool.isRequired,
  item: prizeReviewShape,
  onConfirmChange: PropTypes.func.isRequired,
  onRelease: PropTypes.func.isRequired,
  request: PropTypes.shape({
    error: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
    status: PropTypes.string,
  }),
};

ReviewValue.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

EvidenceValue.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
};

export default PrizeReleaseReview;
