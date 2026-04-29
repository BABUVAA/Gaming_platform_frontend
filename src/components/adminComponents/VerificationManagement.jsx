import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  findVerificationRequests,
  reviewVerificationRequest,
} from "../../store/adminSlice";

const STATUS_STYLES = {
  pending: "bg-amber-500/15 text-amber-200",
  approved: "bg-emerald-500/15 text-emerald-300",
  rejected: "bg-rose-500/15 text-rose-200",
};

const VerificationManagement = () => {
  const dispatch = useDispatch();
  const { verificationRequests = [], isLoading, error } = useSelector(
    (store) => store.admin
  );
  const [statusFilter, setStatusFilter] = useState("pending");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [reviewNote, setReviewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(findVerificationRequests(statusFilter));
  }, [dispatch, statusFilter]);

  const groupedCounts = useMemo(
    () =>
      verificationRequests.reduce(
        (acc, request) => {
          acc[request.status] = (acc[request.status] || 0) + 1;
          return acc;
        },
        { pending: 0, approved: 0, rejected: 0 }
      ),
    [verificationRequests]
  );

  const handleReview = async (status) => {
    if (!selectedRequest) return;

    setIsSubmitting(true);
    const result = await dispatch(
      reviewVerificationRequest({
        requestId: selectedRequest._id,
        status,
        reviewNote,
      })
    );
    setIsSubmitting(false);

    if (result.type?.endsWith("/rejected")) return;

    setSelectedRequest(null);
    setReviewNote("");
    dispatch(findVerificationRequests(statusFilter));
  };

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
            Verification
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Verification Queue
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Review player game-account submissions and control who is eligible
            for live competition.
          </p>
        </div>

        <div className="flex gap-2">
          {["pending", "approved", "rejected"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                statusFilter === status
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {status} ({groupedCounts[status] || 0})
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-[24px] border border-slate-800">
        {error ? (
          <div className="border-b border-rose-800 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {typeof error === "string"
              ? error
              : error?.message || "Verification queue failed to load."}
          </div>
        ) : null}
        <table className="min-w-full text-sm">
          <thead className="bg-[#020617] text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="px-4 py-3">Player</th>
              <th className="px-4 py-3">Game</th>
              <th className="px-4 py-3">Identity</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  Loading verification requests...
                </td>
              </tr>
            ) : null}
            {verificationRequests.length === 0 && !isLoading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-500">
                  No verification requests found for this state.
                </td>
              </tr>
            ) : (
              verificationRequests.map((request) => (
                <tr key={request._id} className="bg-[#020617]">
                  <td className="px-4 py-4">
                    <div className="font-semibold text-white">
                      {request.user?.profile?.username || "Unknown"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {request.user?.profileTag || request.user?.email}
                    </div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-300">
                    {request.game?.name || request.gameKey}
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-white">
                      {request.accountUsername}
                    </div>
                    <div className="text-xs text-slate-500">
                      {request.accountId}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        STATUS_STYLES[request.status] || "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-400">
                    {new Date(request.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-4">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRequest(request);
                        setReviewNote(request.reviewNote || "");
                      }}
                      className="rounded-xl bg-cyan-300 px-3 py-2 text-xs font-semibold text-slate-950 transition hover:bg-cyan-200"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedRequest ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-2xl rounded-[28px] border border-slate-800 bg-slate-950 p-6 shadow-[0_24px_60px_rgba(2,8,23,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-black text-white">
                  Review Verification
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {selectedRequest.user?.profile?.username} submitted{" "}
                  {selectedRequest.game?.name || selectedRequest.gameKey}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="rounded-xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-300"
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <InfoBlock label="Player UID" value={selectedRequest.accountId} />
              <InfoBlock
                label="In-Game Name"
                value={selectedRequest.accountUsername}
              />
              <InfoBlock
                label="Game"
                value={selectedRequest.game?.name || selectedRequest.gameKey}
              />
              <InfoBlock
                label="Submitted"
                value={new Date(selectedRequest.createdAt).toLocaleString()}
              />
              <InfoBlock
                label="Reviewed By"
                value={
                  selectedRequest.reviewedBy?.profile?.username ||
                  selectedRequest.reviewedBy?.email ||
                  "-"
                }
              />
              <InfoBlock
                label="Reviewed At"
                value={
                  selectedRequest.reviewedAt
                    ? new Date(selectedRequest.reviewedAt).toLocaleString()
                    : "-"
                }
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#020617] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Proof Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {selectedRequest.evidenceNote || "No notes were provided."}
              </p>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-200">
                Review Note
              </label>
              <textarea
                rows={4}
                value={reviewNote}
                onChange={(event) => setReviewNote(event.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-[#020617] px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400"
                placeholder="Add operator notes for the player and audit trail."
              />
            </div>

            <div className="mt-5 rounded-xl border border-slate-800 bg-[#020617] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                Existing Review Note
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                {selectedRequest.reviewNote || "No previous review note."}
              </p>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReview("rejected")}
                className="rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Reject
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleReview("approved")}
                className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Approve"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const InfoBlock = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-[#020617] p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className="mt-2 text-sm font-medium text-white">{value}</p>
  </div>
);

export default VerificationManagement;
