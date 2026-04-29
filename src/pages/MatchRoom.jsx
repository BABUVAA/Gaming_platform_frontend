import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaFlag, FaHeadset } from "react-icons/fa";
import { FiClock, FiUploadCloud, FiUsers } from "react-icons/fi";
import { useDispatch } from "react-redux";
import api from "../api/axios-api";
import { showToast, types } from "../store/toastSlice";

const FLOW = [
  "scheduled",
  "check_in",
  "lobby_ready",
  "live",
  "result_pending",
  "verified",
  "settled",
  "disputed",
];

const STATUS_STYLE = {
  scheduled: "bg-slate-800 text-slate-200",
  check_in: "bg-amber-100 text-amber-900",
  lobby_ready: "bg-sky-100 text-sky-900",
  live: "bg-emerald-100 text-emerald-900",
  result_pending: "bg-orange-100 text-orange-900",
  verified: "bg-cyan-100 text-cyan-900",
  settled: "bg-violet-100 text-violet-900",
  disputed: "bg-rose-100 text-rose-900",
};

const ACTION_RULES = {
  checkIn: ["scheduled", "check_in"],
  dispute: ["lobby_ready", "live", "result_pending", "verified", "settled"],
  submitResult: ["live", "result_pending"],
};

const MatchRoom = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const [match, setMatch] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [scoreInput, setScoreInput] = useState("");
  const [proofNote, setProofNote] = useState("");

  const hydrateMatchState = (item) => {
    setMatch(item);
    setScoreInput(item?.result?.score ?? "");
    setProofNote(item?.result?.proofNote ?? "");
  };

  const loadMatch = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await api.get(`/api/matches/${id}`);
      const item = response.data?.data || null;
      hydrateMatchState(item);
    } catch (error) {
      try {
        const fallbackResponse = await api.get("/api/matches");
        const matches = fallbackResponse.data?.data || [];
        const fallbackMatch = matches.find((item) => item?._id === id) || null;

        if (fallbackMatch) {
          hydrateMatchState(fallbackMatch);
          dispatch(
            showToast({
              message: "Match room loaded from fallback feed.",
              type: types.WARNING,
              position: "bottom-right",
            })
          );
        } else {
          throw new Error("Match not found in fallback feed");
        }
      } catch {
        dispatch(
          showToast({
            message:
              error.response?.data?.message || "Unable to load match room.",
            type: types.DANGER,
            position: "bottom-right",
          })
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, id]);

  useEffect(() => {
    loadMatch();
  }, [loadMatch]);

  const stageIndex = useMemo(() => {
    if (!match?.status) return 0;
    const index = FLOW.indexOf(match.status);
    return index === -1 ? 0 : index;
  }, [match?.status]);

  const isActionEnabled = useCallback(
    (actionName) => {
      const allowedStatuses = ACTION_RULES[actionName] || [];
      return allowedStatuses.includes(match?.status);
    },
    [match?.status]
  );

  const requestActionWithFallback = async (candidates, payload = {}) => {
    let latestError = null;
    for (const candidate of candidates) {
      try {
        if (candidate.method === "post") {
          await api.post(candidate.path, payload);
        } else {
          await api.patch(candidate.path, payload);
        }
        return true;
      } catch (error) {
        latestError = error;
      }
    }
    throw latestError || new Error("All action routes failed");
  };

  const submitAction = async ({
    actionName,
    candidates,
    successMessage,
    payload = {},
  }) => {
    if (!isActionEnabled(actionName)) {
      dispatch(
        showToast({
          message: "This action is not available at the current match stage.",
          type: types.WARNING,
          position: "bottom-right",
        })
      );
      return;
    }

    setIsActing(true);
    try {
      if (actionName === "submitResult" && !String(payload.score || "").trim()) {
        throw new Error("Score is required before submitting a result.");
      }
      await requestActionWithFallback(candidates, payload);
      dispatch(
        showToast({
          message: successMessage,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );
      await loadMatch();
    } catch (error) {
      dispatch(
        showToast({
          message:
            error.response?.data?.message ||
            error.message ||
            "Match action failed.",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    } finally {
      setIsActing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 text-slate-300">
        Loading match room...
      </div>
    );
  }

  if (!match) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 text-slate-300">
        Match not found.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-sky-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.14),_transparent_30%),linear-gradient(135deg,_#0f172a,_#020617)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.5)]">
        <Link
          to="/dashboard/matches"
          className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200"
        >
          <FaArrowLeft />
          Back to matches
        </Link>
        <button
          type="button"
          onClick={loadMatch}
          className="ml-3 inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-slate-500"
        >
          Refresh
        </button>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-sky-300/80">
              Match Room
            </p>
            <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
              {match.title || "Untitled Match"}
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              {match.game} - {match.mode}
            </p>
          </div>
          <span
            className={`rounded-full px-4 py-2 text-xs font-black uppercase tracking-[0.16em] ${
              STATUS_STYLE[match.status] || "bg-slate-800 text-slate-200"
            }`}
          >
            {match.status}
          </span>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Lifecycle
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Progress Rail</h2>
          <div className="mt-5 grid gap-3">
            {FLOW.map((step, index) => {
              const isDone = index <= stageIndex;
              return (
                <div
                  key={step}
                  className={`rounded-2xl border px-4 py-3 text-sm capitalize ${
                    isDone
                      ? "border-cyan-400/35 bg-cyan-400/12 text-cyan-100"
                      : "border-slate-800 bg-slate-900/60 text-slate-400"
                  }`}
                >
                  {step.replace("_", " ")}
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
            <div className="flex items-center gap-2 text-slate-300">
              <FiClock />
              <p className="text-sm font-semibold">Scheduled</p>
            </div>
            <p className="mt-3 text-sm text-white">
              {match.scheduledFor
                ? new Date(match.scheduledFor).toLocaleString()
                : "Not scheduled yet"}
            </p>
            <div className="mt-4 flex items-center gap-2 text-slate-300">
              <FaHeadset />
              <p className="text-sm">
                {match.assignedOperator?.profile?.username ||
                  "Operator not assigned"}
              </p>
            </div>
            <div className="mt-4 flex items-center gap-2 text-slate-300">
              <FiUsers />
              <p className="text-sm">{match.participants?.length || 0} participants</p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Action Center
            </p>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                disabled={isActing || !isActionEnabled("checkIn")}
                onClick={() =>
                  submitAction({
                    actionName: "checkIn",
                    successMessage: "Check-in submitted successfully.",
                    candidates: [
                      { method: "patch", path: `/api/matches/${id}/check-in` },
                      { method: "post", path: `/api/matches/${id}/check-in` },
                      { method: "patch", path: `/api/matches/${id}/checkin` },
                      { method: "post", path: `/api/matches/${id}/checkin` },
                    ],
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
              >
                <FaCheckCircle />
                Mark Check-in
              </button>
              <button
                type="button"
                disabled={isActing || !isActionEnabled("dispute")}
                onClick={() =>
                  submitAction({
                    actionName: "dispute",
                    successMessage: "Dispute raised. Admin will review.",
                    payload: {
                      reason: "Player dispute raised from match room",
                    },
                    candidates: [
                      { method: "patch", path: `/api/matches/${id}/dispute` },
                      { method: "post", path: `/api/matches/${id}/dispute` },
                      { method: "post", path: `/api/matches/${id}/raise-dispute` },
                    ],
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
              >
                <FaFlag />
                Raise Dispute
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Lobby Credentials
          </p>
          <h3 className="mt-2 text-xl font-black text-white">Room Access</h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              Room ID: <span className="font-semibold text-white">{match.roomId || "-"}</span>
            </p>
            <p>
              Room Password:{" "}
              <span className="font-semibold text-white">{match.roomPassword || "-"}</span>
            </p>
            <p>
              Notes: <span className="text-slate-400">{match.roomNote || "No notes yet."}</span>
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Result Submission
          </p>
          <h3 className="mt-2 text-xl font-black text-white">Upload Outcome</h3>
          <div className="mt-4 space-y-3">
            <input
              value={scoreInput}
              onChange={(event) => setScoreInput(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              placeholder="Enter score (example: 25-17)"
            />
            <textarea
              rows={4}
              value={proofNote}
              onChange={(event) => setProofNote(event.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-cyan-400"
              placeholder="Proof note or result context."
            />
            <button
              type="button"
              disabled={isActing || !isActionEnabled("submitResult")}
              onClick={() =>
                submitAction({
                  actionName: "submitResult",
                  successMessage: "Result submitted for verification.",
                  payload: {
                    score: scoreInput,
                    proofNote,
                  },
                  candidates: [
                    { method: "patch", path: `/api/matches/${id}/result` },
                    { method: "post", path: `/api/matches/${id}/result` },
                    { method: "post", path: `/api/matches/${id}/submit-result` },
                  ],
                })
              }
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 disabled:opacity-60"
            >
              <FiUploadCloud />
              Submit Result
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MatchRoom;
