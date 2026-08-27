import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiAlertTriangle, FiCheck, FiExternalLink, FiRefreshCw, FiShield, FiX } from "react-icons/fi";
import { fetchManagedVerificationEvidence, fetchManagedVerificationRequests, reviewManagedVerificationRequest } from "../../store/slices/gameManagementSlice.js";

const formatDate = (value) => value ? new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "-";

const GameAccountVerificationQueue = () => {
  const dispatch = useDispatch();
  const verification = useSelector((state) => state.gameManagement.verification);
  const [filter, setFilter] = useState("pending");
  const [selected, setSelected] = useState(null);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    dispatch(fetchManagedVerificationRequests({ status: filter }));
  }, [dispatch, filter]);

  const decide = async (status) => {
    const result = await dispatch(reviewManagedVerificationRequest({ requestId: selected.id, reviewNote, status }));
    if (!result.type.endsWith("/rejected")) {
      setSelected(null);
      setReviewNote("");
    }
  };

  const viewEvidence = async (requestId) => {
    const preview = window.open("", "_blank");
    try {
      const objectUrl = await dispatch(fetchManagedVerificationEvidence({ requestId })).unwrap();
      if (preview) preview.location.href = objectUrl;
      else window.open(objectUrl, "_blank", "noopener,noreferrer");
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      preview?.close();
    }
  };

  return (
    <section className="rounded-3xl border border-slate-800 bg-[#07111f] p-5 md:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="inline-flex items-center gap-2 text-xl font-black text-white"><FiShield className="text-cyan-300" /> Account verification</h2><p className="mt-1 text-sm text-slate-500">Review player IDs for your assigned games.</p></div>
        <div className="flex flex-wrap gap-2">
          {["pending", "approved", "rejected"].map((status) => <button className={filter === status ? "rounded-xl bg-cyan-300 px-3 py-2 text-xs font-black capitalize text-slate-950" : "rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold capitalize text-slate-300"} key={status} onClick={() => setFilter(status)} type="button">{status}</button>)}
          <button aria-label="Refresh verification requests" className="rounded-xl border border-slate-700 p-2 text-slate-300" onClick={() => dispatch(fetchManagedVerificationRequests({ status: filter }))} type="button"><FiRefreshCw /></button>
        </div>
      </div>

      {verification.error ? <p className="mt-4 rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-100">{String(verification.error)}</p> : null}
      <div className="mt-5 grid gap-3 xl:grid-cols-2">
        {verification.items.map((request) => <article className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4" key={request.id}>
          <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-black text-white">{request.player?.username || "Player"}</p><p className="truncate text-xs text-slate-500">{request.player?.profileTag || "No profile tag"}</p></div><div className="flex flex-wrap justify-end gap-2"><span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-xs font-bold text-cyan-200">{request.game?.name || "Game"}</span>{request.requestType === "replacement" ? <span className="rounded-full bg-amber-300/10 px-2.5 py-1 text-xs font-bold text-amber-200">Account change</span> : null}</div></div>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">In-game name</dt><dd className="mt-1 break-words font-bold text-slate-200">{request.accountUsername}</dd></div><div><dt className="text-xs text-slate-500">Player UID</dt><dd className="mt-1 break-all font-bold text-slate-200">{request.accountId}</dd></div></dl>
          <p className="mt-3 text-xs text-slate-500">Submitted {formatDate(request.submittedAt)}</p>
          {request.evidence?.available ? <div className="mt-3 flex flex-wrap items-center gap-2"><button className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-cyan-200" onClick={() => viewEvidence(request.id)} type="button">View evidence <FiExternalLink /></button><span className={request.evidence.assessment === "suspicious" ? "text-xs font-bold text-rose-300" : "text-xs text-slate-500"}>{request.evidence.assessment === "suspicious" ? "Suspicious signals" : `${request.evidence.width} × ${request.evidence.height}`}</span></div> : null}
          {request.reviewNote ? <p className="mt-3 rounded-xl bg-slate-900 p-3 text-sm text-slate-300">{request.reviewNote}</p> : null}
          {request.status === "pending" ? <button className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950" onClick={() => { setSelected(request); setReviewNote(""); }} type="button">Review account</button> : null}
        </article>)}
      </div>
      {verification.status === "loading" && verification.items.length === 0 ? <p className="mt-5 text-sm text-slate-500">Loading requests...</p> : null}
      {verification.status !== "loading" && verification.items.length === 0 ? <p className="mt-5 text-sm text-slate-500">No {filter} requests in your assigned games.</p> : null}
      {verification.page?.hasMore ? <button className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200" disabled={verification.status === "loading"} onClick={() => dispatch(fetchManagedVerificationRequests({ cursor: verification.page.nextCursor, limit: verification.page.limit, status: filter }))} type="button">Load more</button> : null}

      {selected ? <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"><div className="w-full max-w-xl rounded-t-3xl border border-slate-800 bg-[#07111f] p-5 sm:rounded-3xl sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h3 className="text-xl font-black text-white">Verify {selected.game?.name}</h3><p className="mt-1 text-sm text-slate-400">{selected.accountUsername} / {selected.accountId}</p></div><button className="rounded-xl border border-slate-700 p-2 text-slate-300" onClick={() => setSelected(null)} type="button"><FiX /></button></div>
        {selected.previousIdentity ? <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs"><div><p className="text-slate-500">Current</p><p className="mt-1 font-bold text-white">{selected.previousIdentity.accountUsername}</p><p className="break-all text-slate-400">{selected.previousIdentity.accountId}</p></div><div><p className="text-slate-500">Requested</p><p className="mt-1 font-bold text-white">{selected.accountUsername}</p><p className="break-all text-slate-400">{selected.accountId}</p></div></div> : null}
        {selected.evidenceNote ? <div className="mt-4 rounded-xl bg-slate-950 p-3 text-sm text-slate-300">{selected.evidenceNote}</div> : null}
        {selected.evidence?.riskFlags?.length ? <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-xs text-amber-100">Signals: {selected.evidence.riskFlags.join(", ")}. Treat these as review signals, not automatic proof.</p> : null}
        <label className="mt-5 block text-sm font-bold text-slate-200" htmlFor="game-verification-note">Review note</label><textarea className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 text-sm text-white outline-none focus:border-cyan-300" id="game-verification-note" maxLength={1000} onChange={(event) => setReviewNote(event.target.value)} rows={4} value={reviewNote} />
        {verification.actionError ? <p className="mt-3 text-sm text-rose-200">{String(verification.actionError)}</p> : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-3"><button className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-600 px-4 py-3 text-sm font-black text-slate-200 disabled:opacity-50" disabled={verification.actionStatus === "loading"} onClick={() => decide("rejected")} type="button"><FiX /> Reject</button>{selected.evidence?.available ? <button className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/50 bg-rose-400/10 px-4 py-3 text-sm font-black text-rose-200 disabled:opacity-50" disabled={verification.actionStatus === "loading"} onClick={() => decide("fraud_suspected")} type="button"><FiAlertTriangle /> Flag fraud</button> : null}<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={verification.actionStatus === "loading"} onClick={() => decide("approved")} type="button"><FiCheck /> Approve</button></div>
      </div></div> : null}
    </section>
  );
};

export default GameAccountVerificationQueue;
