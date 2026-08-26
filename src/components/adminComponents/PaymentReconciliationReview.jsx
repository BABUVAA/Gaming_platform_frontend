import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPaymentReconciliationQueue,
  verifySandboxPayment,
} from "../../store/slices/paymentReconciliationReviewSlice.js";
import {
  selectPaymentReconciliationError,
  selectPaymentReconciliationItems,
  selectPaymentReconciliationPage,
  selectPaymentReconciliationRequests,
  selectPaymentReconciliationStatus,
} from "../../store/selectors/paymentReconciliationReviewSelectors.js";

const filters = ["", "queued", "processing", "completed", "failed"];
const formatMinor = (amount = 0) =>
  new Intl.NumberFormat("en-IN", { currency: "INR", style: "currency" }).format(
    Number(amount || 0) / 100,
  );

const PaymentReconciliationReview = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectPaymentReconciliationItems);
  const page = useSelector(selectPaymentReconciliationPage);
  const requests = useSelector(selectPaymentReconciliationRequests);
  const status = useSelector(selectPaymentReconciliationStatus);
  const error = useSelector(selectPaymentReconciliationError);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const request = dispatch(fetchPaymentReconciliationQueue({ status: filter }));
    return () => request.abort();
  }, [dispatch, filter]);

  const refresh = () => dispatch(fetchPaymentReconciliationQueue({ status: filter }));
  const loadMore = () => {
    if (!page.nextCursor || status === "loadingMore") return;
    dispatch(fetchPaymentReconciliationQueue({ cursor: page.nextCursor, status: filter }));
  };

  return (
    <section className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/25 bg-amber-300/10 px-4 py-3">
        <p className="text-sm font-bold text-amber-100">PhonePe sandbox · withdrawals disabled</p>
        <span className="rounded-lg border border-amber-300/20 px-2.5 py-1 text-xs font-black text-amber-200">Test money</span>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((value) => (
            <button
              className={filter === value
                ? "rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950"
                : "rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300"}
              key={value || "all"}
              onClick={() => setFilter(value)}
              type="button"
            >
              {value ? value.replace("_", " ") : "all"}
            </button>
          ))}
        </div>
        <button className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50" disabled={status === "loading"} onClick={refresh} type="button">
          Refresh
        </button>
      </div>

      {error ? <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">{error}</p> : null}
      {status === "loading" && items.length === 0 ? <p className="p-6 text-sm text-slate-400">Loading sandbox payments...</p> : null}
      {status !== "loading" && items.length === 0 && !error ? <p className="rounded-2xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">No sandbox payment jobs in this view.</p> : null}

      <div className="grid gap-3">
        {items.map((item) => (
          <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4" key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-black text-white">{item.player?.username || "Player"}</p>
                <p className="mt-1 text-xs text-slate-500">{item.player?.profileTag || "No profile tag"} / order ...{item.referenceSuffix || "pending"}</p>
              </div>
              <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-black uppercase text-slate-300">{item.status}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-2xl font-black text-amber-200">{formatMinor(item.amountMinor)}</p>
                <p className="mt-1 text-xs text-slate-500">Test money / {item.attempts || 0} provider checks</p>
              </div>
              <button
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                disabled={!item.actions?.canVerify || Boolean(requests[item.id])}
                onClick={() => dispatch(verifySandboxPayment({ jobId: item.id }))}
                type="button"
              >
                {requests[item.id] ? "Checking..." : "Verify with PhonePe"}
              </button>
            </div>
            {item.attention ? <p className="mt-3 text-xs text-rose-200">The last provider check failed safely. Retry after confirming PhonePe availability.</p> : null}
          </article>
        ))}
      </div>

      {page.hasMore ? <button className="rounded-xl border border-cyan-300/40 px-5 py-3 text-sm font-bold text-cyan-200 disabled:opacity-50" disabled={status === "loadingMore"} onClick={loadMore} type="button">{status === "loadingMore" ? "Loading..." : "Load more"}</button> : null}
    </section>
  );
};

export default PaymentReconciliationReview;
