import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FaBolt, FaClock, FaLink, FaShieldAlt } from "react-icons/fa";
import api from "../api/axios-api";
import { user_profile } from "../store/authSlice";
import { showToast, types } from "../store/toastSlice";

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
};

const Account = () => {
  const dispatch = useDispatch();
  const games = useSelector((store) => store.games?.data);
  const profile = useSelector((store) => store.auth?.profile);

  const [linkedAccounts, setLinkedAccounts] = useState([]);
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const availableGames = games || [];

  const loadAccountCenter = async () => {
    setIsLoading(true);
    try {
      const [accountsResponse, requestsResponse] = await Promise.all([
        api.get("/api/users/game-accounts"),
        api.get("/api/users/verification-requests"),
      ]);

      setLinkedAccounts(accountsResponse.data?.data || []);
      setVerificationRequests(requestsResponse.data?.data || []);
    } catch (error) {
      dispatch(
        showToast({
          message:
            error.response?.data?.message ||
            "Unable to load your connected accounts.",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccountCenter();
  }, []);

  const accountByGameKey = useMemo(() => {
    return linkedAccounts.reduce((acc, item) => {
      if (item?.game?.link) {
        acc[item.game.link] = item;
      }
      return acc;
    }, {});
  }, [linkedAccounts]);

  const openConnectModal = (game) => {
    setSelectedGame(game);
    setForm(emptyForm);
  };

  const closeModal = () => {
    setSelectedGame(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!selectedGame) return;

    setIsSubmitting(true);

    try {
      if (selectedGame.verificationMethod === "api_token") {
        await api.post("/api/users/game-accounts/connect", {
          gameKey: selectedGame.link,
          playerTag: form.playerTag,
          token: form.token,
        });
      } else {
        await api.post("/api/users/verification-requests", {
          gameKey: selectedGame.link,
          accountId: form.accountId,
          accountUsername: form.accountUsername,
          evidenceNote: form.evidenceNote,
        });
      }

      dispatch(
        showToast({
          message:
            selectedGame.verificationMethod === "api_token"
              ? `${selectedGame.name} connected successfully.`
              : `${selectedGame.name} verification request submitted.`,
          type: types.SUCCESS,
          position: "bottom-right",
        })
      );

      await Promise.all([loadAccountCenter(), dispatch(user_profile())]);
      closeModal();
    } catch (error) {
      dispatch(
        showToast({
          message:
            error.response?.data?.message ||
            "We could not complete that account action.",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    {
      label: "Linked Accounts",
      value: linkedAccounts.length,
      icon: <FaLink />,
    },
    {
      label: "Verified",
      value: linkedAccounts.filter(
        (account) => account.verificationStatus === "verified"
      ).length,
      icon: <FaShieldAlt />,
    },
    {
      label: "Pending Reviews",
      value: verificationRequests.filter(
        (request) => request.status === "pending"
      ).length,
      icon: <FaClock />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#07111f] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 md:py-8">
        <section className="overflow-hidden rounded-2xl border border-cyan-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.22),_transparent_35%),linear-gradient(135deg,_#0b1628,_#09111d_50%,_#0f172a)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.55)]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300/80">
                Account Command
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-5xl">
                Connect your game identities before match time.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-6 text-slate-300 md:text-base">
                This is the foundation for tournament eligibility, manual
                operator review, and live match readiness across Clash of Clans
                and BGMI.
              </p>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-3 lg:w-auto">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-white/10 bg-black/20 px-4 py-4 backdrop-blur"
                >
                  <div className="flex items-center gap-2 text-cyan-300">
                    {stat.icon}
                    <span className="text-xs uppercase tracking-[0.25em]">
                      {stat.label}
                    </span>
                  </div>
                  <p className="mt-3 text-3xl font-black text-white">
                    {stat.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white">
                  Supported Games
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  Each game uses its own verification flow so operators know
                  exactly what to trust.
                </p>
              </div>
              <div className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
                {availableGames.length} Live
              </div>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              {availableGames.map((game) => {
                const account = accountByGameKey[game.link];
                const status = account?.verificationStatus || "unlinked";

                return (
                  <article
                    key={game._id}
                    className="overflow-hidden rounded-2xl border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.86),_rgba(2,6,23,0.96))]"
                  >
                    <div className="border-b border-slate-800 px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                            {game.link}
                          </p>
                          <h3 className="mt-1 text-2xl font-black text-white">
                            {game.name || game.title}
                          </h3>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                            statusClasses[status] ||
                            "border border-slate-700 bg-slate-800 text-slate-300"
                          }`}
                        >
                          {status === "unlinked" ? "Not Linked" : status}
                        </span>
                      </div>
                    </div>

                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm text-cyan-200">
                        <FaBolt />
                        <span>{methodLabels[game.verificationMethod]}</span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {game.verificationInstructions}
                      </p>

                      {account && (
                        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                            Active Account
                          </p>
                          <p className="mt-2 text-lg font-semibold text-white">
                            {account.accountUsername}
                          </p>
                          <p className="text-sm text-slate-400">
                            {account.accountId}
                          </p>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => openConnectModal(game)}
                        className="mt-5 inline-flex items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
                      >
                        {game.verificationMethod === "api_token"
                          ? account
                            ? "Reconnect Account"
                            : "Verify Account"
                          : account
                            ? "Resubmit for Review"
                            : "Request Review"}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.45)]">
              <h2 className="text-xl font-bold text-white">Player Readiness</h2>
              <div className="mt-4 space-y-3 text-sm text-slate-300">
                <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  <span className="block text-xs uppercase tracking-[0.2em] text-slate-500">
                    Profile
                  </span>
                  <span className="mt-2 block text-lg font-semibold text-white">
                    {profile?.profile?.username || "Player"}
                  </span>
                  <span className="text-slate-400">
                    {profile?.profileTag || "No player tag"}
                  </span>
                </p>

                <p className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
                  Link verified accounts now so tournament joins, quick 5v5
                  matchmaking, and operator review all use the same trusted
                  identity.
                </p>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,6,23,0.45)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-bold text-white">
                  Verification Queue
                </h2>
                <span className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  Player View
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {verificationRequests.length === 0 && !isLoading ? (
                  <div className="rounded-xl border border-dashed border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
                    No manual review requests yet.
                  </div>
                ) : (
                  verificationRequests.map((request) => (
                    <article
                      key={request._id}
                      className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"
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

                      {request.evidenceNote && (
                        <p className="mt-3 text-sm leading-6 text-slate-300">
                          {request.evidenceNote}
                        </p>
                      )}

                      {request.reviewNote && (
                        <p className="mt-3 rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-sm text-slate-300">
                          {request.reviewNote}
                        </p>
                      )}
                    </article>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>

        {isLoading && (
          <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/90 p-5 text-sm text-slate-400">
            Loading your account command center...
          </div>
        )}
      </div>

      {selectedGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-[0_24px_70px_rgba(2,8,23,0.65)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-cyan-300/80">
                  {selectedGame.link}
                </p>
                <h3 className="mt-2 text-2xl font-black text-white">
                  {selectedGame.verificationMethod === "api_token"
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
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-300"
              >
                {isSubmitting
                  ? "Submitting..."
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

export default Account;
