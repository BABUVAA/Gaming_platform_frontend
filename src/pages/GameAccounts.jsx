import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import PropTypes from "prop-types";
import { FaBolt, FaExclamationTriangle, FaLock } from "react-icons/fa";
import api from "../api/axios-api";
import { getApiErrorMessage } from "../api/apiError";
import { fetchMyVerificationRequests, submitGameAccountReplacement, submitGameAccountVerification } from "../store/slices/verificationRequestSlice";
import { showToast, types } from "../store/slices/toastSlice";
import { selectIsStaffUtilityMode } from "../store/selectors/playerSelectors";

const statusClasses = {
  verified: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
  rejected: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
};

const methodLabels = {
  api_token: "Instant Verification",
  manual_review: "Manual Review",
};

const emptyForm = {
  playerTag: "",
  token: "",
  accountId: "",
  accountUsername: "",
  evidenceNote: "",
  evidence: null,
  fraudAcknowledged: false,
};

const GameAccounts = () => {
  const dispatch = useDispatch();
  const games = useSelector((store) => store.games?.data);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);

  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const verificationRequests = useSelector((store) => store.verificationRequests?.items || []);
  const verificationPage = useSelector((store) => store.verificationRequests?.page);
  const verificationStatus = useSelector((store) => store.verificationRequests?.status);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [selectedAction, setSelectedAction] = useState("connect");
  const [form, setForm] = useState(emptyForm);
  const availableGames = games || [];

  const loadGameAccounts = useCallback(async () => {
    // Keep this loader stable so the bootstrap effect runs only when its Redux
    // dispatch dependency changes, not after every component render.
    setIsLoading(true);
    try {
      const [accountsResponse] = await Promise.all([
        api.get("/api/users/game-accounts"),
        dispatch(fetchMyVerificationRequests()).unwrap(),
      ]);

      setLinkedAccounts(accountsResponse.data?.data || []);
    } catch (error) {
      dispatch(
        showToast({
          message: getApiErrorMessage(
            error,
            "Unable to load your connected accounts.",
          ),
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    } finally {
      setIsLoading(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadGameAccounts();
  }, [loadGameAccounts]);

  const accountByGameKey = useMemo(() => {
    return linkedAccounts.reduce((acc, item) => {
      if (item?.game?.link) {
        acc[item.game.link] = item;
      }
      return acc;
    }, {});
  }, [linkedAccounts]);

  const openConnectModal = (game, action = "connect") => {
    if (isStaffUtilityMode) return;
    setSelectedGame(game);
    setSelectedAction(action);
    setForm(emptyForm);
  };

  const closeModal = () => {
    setSelectedGame(null);
    setSelectedAction("connect");
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedGame || isStaffUtilityMode) return;

    setIsSubmitting(true);

    try {
      let recoveredExistingRequest = false;
      if (selectedAction === "replacement" && selectedGame.verificationMethod === "manual_review") {
        await dispatch(submitGameAccountReplacement({
          gameKey: selectedGame.link,
          accountId: form.accountId,
          accountUsername: form.accountUsername,
          evidenceNote: form.evidenceNote,
          evidence: form.evidence,
          fraudAcknowledged: form.fraudAcknowledged,
        })).unwrap();
      } else if (selectedGame.verificationMethod === "api_token") {
        await api.post("/api/users/game-accounts/connect", {
          gameKey: selectedGame.link,
          playerTag: form.playerTag,
          token: form.token,
          replacement: selectedAction === "replacement",
        });
      } else if (selectedGame.link === "bgmi") {
        const result = await dispatch(submitGameAccountVerification({
          gameKey: selectedGame.link,
          accountId: form.accountId,
          accountUsername: form.accountUsername,
          evidenceNote: form.evidenceNote,
          evidence: form.evidence,
          fraudAcknowledged: form.fraudAcknowledged,
        })).unwrap();
        if (result?.recovered) {
          recoveredExistingRequest = true;
          dispatch(
            showToast({
              message: "Your existing BGMI verification request was restored.",
              type: types.SUCCESS,
              position: "bottom-right",
            }),
          );
        }
      } else {
        await api.post("/api/users/verification-requests", {
          gameKey: selectedGame.link,
          accountId: form.accountId,
          accountUsername: form.accountUsername,
          evidenceNote: form.evidenceNote,
        });
      }

      if (!recoveredExistingRequest) {
        dispatch(showToast({
          message:
            selectedAction === "replacement"
              ? `${selectedGame.name} account change submitted.`
              : selectedGame.verificationMethod === "api_token"
              ? `${selectedGame.name} connected successfully.`
              : `${selectedGame.name} verification request submitted.`,
          type: types.SUCCESS,
          position: "bottom-right",
        }));
      }

      await loadGameAccounts();
      closeModal();
    } catch (error) {
      dispatch(
        showToast({
          message: getApiErrorMessage(
            error,
            "We could not complete that account action.",
          ),
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl text-slate-100">
      <div className="space-y-4">
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(18rem,0.8fr)]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
            <h2 className="text-base font-bold text-white">Your games</h2>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              {availableGames.map((game) => {
                const account = accountByGameKey[game.link];
                const status = account?.verificationStatus || "unlinked";

                return (
                  <article
                    key={game._id}
                    className="rounded-2xl border border-slate-800 bg-slate-900/65 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-base font-black text-white">
                          {game.name || game.title}
                        </h3>
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-400">
                          <FaBolt className="text-cyan-300" />
                          <span>{methodLabels[game.verificationMethod]}</span>
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${
                          statusClasses[status] ||
                          "border border-slate-700 bg-slate-800 text-slate-300"
                        }`}
                      >
                        {status === "unlinked" ? "Not linked" : status}
                      </span>
                    </div>

                    {account ? (
                      <div className="mt-3 border-t border-slate-800 pt-3">
                        <p className="truncate text-sm font-semibold text-white">
                          {account.accountUsername}
                        </p>
                        <p className="truncate text-xs text-slate-500">
                          {account.accountId}
                        </p>
                      </div>
                    ) : null}

                    {!isStaffUtilityMode ? (
                      <div className="mt-3">
                        {status === "verified" ? (
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300"><FaLock /> Verified</span>
                            {account.replacement?.allowed ? (
                              <button className="rounded-lg border border-cyan-400/40 px-3 py-1.5 text-xs font-bold text-cyan-200" onClick={() => openConnectModal(game, "replacement")} type="button">Change account</button>
                            ) : account.replacement?.used ? (
                              <span className="text-xs text-slate-500">Account change used</span>
                            ) : account.replacement?.eligibleAt ? (
                              <span className="text-xs text-slate-500">Change available {new Date(account.replacement.eligibleAt).toLocaleDateString("en-IN")}</span>
                            ) : null}
                          </div>
                        ) : status === "pending" ? (
                          <span className="text-xs font-bold text-amber-200">
                            Under review
                          </span>
                        ) : (
                        <button
                          type="button"
                          onClick={() => openConnectModal(game)}
                          className="inline-flex items-center justify-center rounded-xl bg-cyan-300 px-3.5 py-2 text-xs font-black text-slate-950 transition hover:bg-cyan-200"
                        >
                          {status === "rejected"
                            ? "Try again"
                            : game.verificationMethod === "api_token"
                              ? "Verify account"
                              : "Request review"}
                        </button>
                        )}
                      </div>
                    ) : null}
                  </article>
                );
              })}
            </div>
          </div>

          <div>
            <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
              <h2 className="text-base font-bold text-white">Requests</h2>

              <div className="mt-3 space-y-2">
                {verificationRequests.length === 0 && !isLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                    No manual review requests yet.
                  </div>
                ) : (
                  verificationRequests.map((request) => (
                    <article
                      key={request._id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-3"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">
                            {request.game?.name || request.gameKey}
                          </p>
                          <p className="text-xs text-slate-500">
                            {request.accountUsername} - {request.accountId}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${
                            statusClasses[request.status]
                          }`}
                        >
                          {request.status}
                        </span>
                      </div>

                      {request.reviewNote && (
                        <p className="mt-2 rounded-lg bg-slate-950/70 px-3 py-2 text-xs leading-5 text-slate-300">
                          {request.reviewNote}
                        </p>
                      )}
                    </article>
                  ))
                )}
                {verificationPage?.hasMore ? (
                  <button
                    type="button"
                    disabled={verificationStatus === "loading_more"}
                    onClick={() => dispatch(fetchMyVerificationRequests({ cursor: verificationPage.nextCursor, limit: verificationPage.limit }))}
                    className="w-full rounded-xl border border-cyan-400/30 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {verificationStatus === "loading_more" ? "Loading..." : "Load more history"}
                  </button>
                ) : null}
              </div>
            </section>
          </div>
        </section>

        {isLoading && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 text-sm text-slate-400">
            Loading your game accounts...
          </div>
        )}
      </div>

      {selectedGame && !isStaffUtilityMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-[0_24px_70px_rgba(2,8,23,0.65)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                  {selectedGame.link}
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {selectedAction === "replacement"
                    ? "Change Verified Account"
                    : selectedGame.verificationMethod === "api_token"
                    ? "Verify Live Account"
                    : "Request Manual Verification"}
                </h3>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-500 hover:text-white"
              >
                Close
              </button>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-400">
              {selectedGame.verificationInstructions}
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              {selectedGame.verificationMethod === "api_token" ? (
                <>
                  <Field
                    label="Player Tag"
                    placeholder="#ABC123"
                    value={form.playerTag}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, playerTag: value }))
                    }
                  />
                  <Field
                    label="Owner Token"
                    placeholder="Paste your Supercell owner token"
                    value={form.token}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, token: value }))
                    }
                  />
                </>
              ) : (
                <>
                  <Field
                    label="Player UID"
                    placeholder="Enter your BGMI UID"
                    value={form.accountId}
                    onChange={(value) =>
                      setForm((current) => ({ ...current, accountId: value }))
                    }
                  />
                  <Field
                    label="In-Game Name"
                    placeholder="Enter your BGMI name"
                    value={form.accountUsername}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        accountUsername: value,
                      }))
                    }
                  />
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-200">
                      Proof Notes
                    </label>
                    <textarea
                      value={form.evidenceNote}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          evidenceNote: event.target.value,
                        }))
                      }
                      rows={4}
                      placeholder="Add anything the operator should use to verify this account."
                      className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
                    />
                  </div>
                  {selectedGame.link === "bgmi" ? (
                    <>
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-200" htmlFor="game-account-evidence">Original BGMI screenshot</label>
                        <input accept="image/png,image/jpeg" className="block w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-300 file:px-3 file:py-2 file:font-bold file:text-slate-950" id="game-account-evidence" onChange={(event) => setForm((current) => ({ ...current, evidence: event.target.files?.[0] || null }))} required type="file" />
                        <p className="mt-2 text-xs text-slate-500">PNG or JPEG, maximum 5 MB. Browser uploads cannot prove the physical capture device.</p>
                      </div>
                      <div className="rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-100">
                        <p className="flex items-start gap-2 font-bold"><FaExclamationTriangle className="mt-0.5 shrink-0" /> Permanent-ban warning</p>
                        <p className="mt-2 text-xs leading-5 text-rose-100/80">Forged, edited, AI-generated, borrowed, or misleading evidence can freeze withdrawals and rewards during investigation. Confirmed fraud permanently bans the account and cancels fraudulent winnings under platform rules.</p>
                        <label className="mt-3 flex items-start gap-2 text-xs font-semibold"><input checked={form.fraudAcknowledged} className="mt-0.5" onChange={(event) => setForm((current) => ({ ...current, fraudAcknowledged: event.target.checked }))} required type="checkbox" /> I confirm this is my account and understand the permanent-ban policy.</label>
                      </div>
                    </>
                  ) : null}
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isSubmitting
                  ? "Submitting..."
                  : selectedAction === "replacement"
                    ? "Submit Account Change"
                    : selectedGame.verificationMethod === "api_token"
                    ? "Verify and Connect"
                    : "Submit for Review"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const Field = ({ label, placeholder, value, onChange }) => {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-200">
        {label}
      </label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
      />
    </div>
  );
};

Field.propTypes = {
  label: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};

Field.defaultProps = {
  placeholder: "",
};

export default GameAccounts;
