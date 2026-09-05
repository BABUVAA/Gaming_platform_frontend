import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { checkTransactionStatus, fetchUserTransactions, fetchWalletBalance, fetchWalletLedger } from "../store/slices/paymentSlice";

const labels = { pending: "Pending payment confirmation", processing: "Awaiting wallet confirmation", completed: "Completed · credited", failed: "Failed · not credited" };
const amountLabel = (item) => new Intl.NumberFormat("en-IN", { style: "currency", currency: item.currency }).format(item.amountMinor / 100);

export default function PaymentHistory() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.payment.transactions);
  const history = useSelector((state) => state.payment.transactionHistory);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const request = dispatch(fetchUserTransactions());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => { request.abort(); clearInterval(timer); };
  }, [dispatch]);

  const check = async (id) => {
    try {
      await dispatch(checkTransactionStatus(id)).unwrap();
      dispatch(fetchWalletBalance());
      dispatch(fetchWalletLedger());
    } catch { /* The row keeps the normalized error next to its retry button. */ }
  };
  const loading = ["loading", "loadingMore"].includes(history.status);
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-black text-white">Payment history</h2>
        <button type="button" disabled={loading} onClick={() => dispatch(fetchUserTransactions())} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 disabled:opacity-50">Refresh list</button>
      </div>
      <p className="mt-2 text-xs text-slate-400">Orders appear immediately. Pending payments do not increase your balance. Closed checkout windows remain pending until confirmed.</p>
      <div className="mt-3 space-y-2" aria-live="polite">
        {history.error ? <p className="text-sm text-rose-200">{history.error.message}</p> : null}
        {loading && !items.length ? <p className="text-sm text-slate-400">Loading payments...</p> : null}
        {!loading && !history.error && !items.length ? <p className="text-sm text-slate-400">No payment orders yet.</p> : null}
        {items.map((item) => {
          const request = history.checks[item.id];
          const seconds = Math.max(0, Math.ceil((new Date(request?.nextCheckAt || 0).getTime() - now) / 1000));
          const pending = ["pending", "processing"].includes(item.status);
          return <article key={item.id} className="rounded-xl border border-slate-800 p-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-bold text-white">{amountLabel(item)} <span className="text-xs font-normal text-slate-400">{item.provider === "razorpay" ? "Razorpay" : "PhonePe"}</span></p>
                <p className="mt-1 text-xs text-slate-400">{new Date(item.createdAt).toLocaleString("en-IN")}</p>
                <p className="mt-1 break-all text-xs text-slate-500">Reference: {item.id}</p>
              </div>
              <span className={`text-xs font-semibold ${item.status === "completed" ? "text-emerald-300" : item.status === "failed" ? "text-rose-300" : "text-amber-200"}`}>{labels[item.status] || "Pending confirmation"}</span>
            </div>
            {pending ? <button type="button" onClick={() => check(item.id)} disabled={request?.status === "loading" || seconds > 0} className="mt-3 rounded-lg border border-cyan-400/40 px-3 py-2 text-xs font-bold text-cyan-200 disabled:opacity-50">{request?.status === "loading" ? "Checking with provider..." : seconds > 0 ? `Check again in ${seconds}s` : "Check payment status"}</button> : null}
            {request?.error ? <p className="mt-2 text-xs text-rose-200">{request.error.message}</p> : null}
            {pending && request?.status === "succeeded" ? <p className="mt-2 text-xs text-slate-400">Not confirmed yet. If money was deducted, do not pay again; check later or contact support.</p> : null}
          </article>;
        })}
        {history.page.hasMore ? <button type="button" disabled={loading} onClick={() => dispatch(fetchUserTransactions({ cursor: history.page.nextCursor }))} className="rounded-xl border border-slate-700 px-3 py-2 text-sm text-cyan-200 disabled:opacity-50">Load older payments</button> : null}
      </div>
    </section>
  );
}
