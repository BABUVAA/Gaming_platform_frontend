import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  FiArrowDownLeft,
  FiArrowUpRight,
  FiClock,
  FiRefreshCw,
} from "react-icons/fi";
import { Button } from "../components";
import {
  fetchWalletLedger,
  fetchWalletBalance,
  initiatePhonePeOrder,
} from "../store/slices/paymentSlice";
import {
  selectPaymentLoading,
  selectWallet,
  selectWalletLedgerEntries,
  selectWalletLedgerError,
  selectWalletLedgerLoading,
  selectWalletLedgerLoadingMore,
  selectWalletLedgerPage,
} from "../store/selectors/walletSelectors";
import { showToast, types } from "../store/slices/toastSlice";
import { selectIsStaffUtilityMode } from "../store/selectors/playerSelectors";
import { STAFF_UTILITY_MESSAGE } from "../utils/staffUtilityMode";

const ledgerTypeLabels = {
  adjustment: "Wallet adjustment",
  deposit: "Funds deposited",
  entry_capture: "Entry fee settled",
  entry_hold: "Entry fee held",
  entry_release: "Entry hold released",
  opening_balance: "Opening balance",
  prize_pending: "Prize under review",
  prize_release: "Prize released",
  withdrawal_complete: "Withdrawal completed",
  withdrawal_hold: "Withdrawal requested",
  withdrawal_release: "Withdrawal released",
};

const quickAmounts = [100, 250, 500, 1000];
const formatMinor = (amountMinor = 0, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    currency,
    style: "currency",
  }).format(Number(amountMinor || 0) / 100);
const formatLedgerLabel = (value = "") =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

const Wallet = () => {
  const dispatch = useDispatch();
  const wallet = useSelector(selectWallet);
  const isLoading = useSelector(selectPaymentLoading);
  const ledgerEntries = useSelector(selectWalletLedgerEntries);
  const ledgerError = useSelector(selectWalletLedgerError);
  const ledgerIsLoading = useSelector(selectWalletLedgerLoading);
  const ledgerIsLoadingMore = useSelector(selectWalletLedgerLoadingMore);
  const ledgerPage = useSelector(selectWalletLedgerPage);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    const walletRequest = dispatch(fetchWalletBalance());
    const ledgerRequest = dispatch(fetchWalletLedger());
    return () => {
      walletRequest.abort();
      ledgerRequest.abort();
    };
  }, [dispatch]);

  const closeModals = () => {
    setIsAddModalOpen(false);
    setAmount("");
  };

  const validateAmount = (value, { maxAmount } = {}) => {
    const parsedValue = Number(value);
    if (!parsedValue || parsedValue <= 0) {
      dispatch(
        showToast({
          message: "Enter a valid wallet amount.",
          type: types.WARNING,
          position: "bottom-right",
        })
      );
      return null;
    }

    // Withdrawals should be blocked in the UI before we ask the backend to
    // process an impossible amount.
    if (typeof maxAmount === "number" && parsedValue > maxAmount) {
      dispatch(
        showToast({
          message: "Entered amount is higher than your available balance.",
          type: types.WARNING,
          position: "bottom-right",
        })
      );
      return null;
    }

    return parsedValue;
  };

  const handleAddMoney = async () => {
    if (isStaffUtilityMode) return;
    const value = validateAmount(amount);
    if (!value) return;

    try {
      const response = await dispatch(
        initiatePhonePeOrder({
          amount: value,
          name: "Player",
          mobile: "9999999999",
        })
      ).unwrap();

      if (response?.redirectUrl) {
        // Only the payment provider may call the signed callback endpoint.
        window.location.href = response.redirectUrl;
        closeModals();
        return;
      }

      dispatch(
        showToast({
          message: "No payment redirect URL was returned.",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    } catch {
      // The thunk owns the normalized failure toast and Redux error state.
    }
  };

  const handleLedgerRefresh = () => {
    dispatch(fetchWalletLedger());
  };

  const handleLoadMoreLedger = () => {
    if (!ledgerPage.nextCursor || ledgerIsLoadingMore) return;
    dispatch(fetchWalletLedger({ cursor: ledgerPage.nextCursor }));
  };

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-500/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),_transparent_30%),linear-gradient(135deg,_#0f172a,_#020617)] p-6 shadow-[0_24px_60px_rgba(2,8,23,0.5)]">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/80">
          Wallet Command
        </p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-black text-white md:text-5xl">
              Manage deposits, platform balance, and settlement history.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              This is your cash and competition ledger. Keep real funds topped
              up, review platform credits, and watch the status of every wallet move.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Available"
              value={formatMinor(wallet?.availableMinor, wallet?.currency)}
              accent="text-cyan-300"
              icon={<FiArrowDownLeft />}
            />
            <MetricCard
              label="Entry held"
              value={formatMinor(wallet?.entryHeldMinor, wallet?.currency)}
              accent="text-amber-200"
              icon={<FiClock />}
            />
            <MetricCard
              label="Prize pending"
              value={formatMinor(wallet?.prizePendingMinor, wallet?.currency)}
              accent="text-violet-200"
              icon={<FiArrowUpRight />}
            />
            <MetricCard
              label="Withdrawable"
              value={formatMinor(wallet?.withdrawableMinor, wallet?.currency)}
              accent="text-emerald-300"
              icon={<FiArrowUpRight />}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
        {isStaffUtilityMode ? (
          <div className="rounded-3xl border border-amber-400/30 bg-amber-400/10 p-5 text-amber-50 xl:col-span-2">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
              View-only wallet history
            </p>
            <p className="mt-3 text-sm leading-6">{STAFF_UTILITY_MESSAGE}</p>
            <p className="mt-2 text-sm leading-6">
              Deposits and withdrawals are player-only actions.
            </p>
          </div>
        ) : (
          <>
            <ActionPanel
              title="Add funds"
              copy="Top up your real wallet before joining paid brackets and tournaments."
              actionLabel="Add Money"
              onClick={() => {
                setAmount("");
                setIsAddModalOpen(true);
              }}
              tone="primary"
            />
            <ActionPanel
              title="Withdraw funds"
              copy="Move eligible winnings out with a withdrawal request from the same command deck."
              actionLabel="Withdrawal review pending"
              disabled
              onClick={() => undefined}
              tone="danger"
            />
          </>
        )}
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Quick Rules
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>Deposits redirect you to the payment provider securely.</li>
            <li>Paid entries move funds into Entry held until final settlement.</li>
            <li>Prizes remain pending through result and dispute review.</li>
            <li>Withdrawal stays disabled until the reviewed payout lifecycle ships.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              Immutable history
            </p>
            <h2 className="mt-2 text-2xl font-black text-white">
              Wallet ledger
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Posted movements are permanent. Each row shows only the wallet
              buckets involved in your account.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLedgerRefresh}
            disabled={ledgerIsLoading || ledgerIsLoadingMore}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw className={ledgerIsLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <div className="mt-5 space-y-3" aria-live="polite">
          {ledgerIsLoading && ledgerEntries.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-300">
              Loading your ledger history...
            </div>
          ) : null}

          {!ledgerIsLoading && ledgerError && ledgerEntries.length === 0 ? (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center">
              <p className="text-sm text-rose-100">{ledgerError}</p>
              <button
                type="button"
                onClick={handleLedgerRefresh}
                className="mt-4 rounded-xl bg-rose-300 px-4 py-2 text-sm font-bold text-slate-950"
              >
                Try again
              </button>
            </div>
          ) : null}

          {!ledgerIsLoading && !ledgerError && ledgerEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
              No ledger entries yet. Your first posted wallet movement will
              appear here.
            </div>
          ) : null}

          {ledgerEntries.map((entry) => (
            <LedgerEntry key={entry.id} entry={entry} />
          ))}

          {ledgerError && ledgerEntries.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
              <span>{ledgerError} Your loaded history is still available.</span>
              <button
                type="button"
                onClick={handleLedgerRefresh}
                className="font-bold text-amber-200 underline underline-offset-4"
              >
                Refresh history
              </button>
            </div>
          ) : null}

          {ledgerPage.hasMore ? (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleLoadMoreLedger}
                disabled={ledgerIsLoading || ledgerIsLoadingMore}
                className="rounded-2xl border border-cyan-400/40 bg-cyan-400/10 px-5 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {ledgerIsLoadingMore ? "Loading more..." : "Load more"}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      {isAddModalOpen && !isStaffUtilityMode ? (
        <AmountModal
          title="Add Money"
          amount={amount}
          setAmount={setAmount}
          onClose={closeModals}
          onConfirm={handleAddMoney}
          isLoading={isLoading}
          disableWhileLoading={false}
        />
      ) : null}

    </div>
  );
};

const AmountModal = ({
  title,
  amount,
  setAmount,
  onConfirm,
  onClose,
  isLoading,
  disableWhileLoading = true,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
    <div className="w-full max-w-sm rounded-3xl border border-slate-800 bg-slate-950 p-6 shadow-[0_24px_60px_rgba(2,8,23,0.55)]">
      <h2 className="text-2xl font-black text-white">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Choose a clean amount to continue the wallet flow.
      </p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {quickAmounts.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setAmount(String(value))}
            className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-3 text-sm font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
          >
            Rs {value}
          </button>
        ))}
      </div>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(event) => setAmount(event.target.value)}
        className="mt-4 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400"
      />
      <div className="mt-5 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={disableWhileLoading && isLoading}
          className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {disableWhileLoading && isLoading ? "Processing..." : "Confirm"}
        </button>
      </div>
    </div>
  </div>
);

const LedgerEntry = ({ entry }) => (
  <article className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <p className="font-semibold text-white">
          {ledgerTypeLabels[entry.type] || formatLedgerLabel(entry.type) ||
            "Wallet movement"}
        </p>
        <p className="mt-1 text-sm text-slate-400">
          {new Date(entry.createdAt).toLocaleString("en-IN")}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {formatLedgerLabel(entry.referenceType)}
        </p>
      </div>
      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
        Posted
      </span>
    </div>

    <div className="mt-4 flex flex-wrap gap-2">
      {(entry.legs || []).map((leg, index) => {
        const isCredit = leg.direction === "credit";
        return (
          <span
            key={`${leg.account}-${leg.direction}-${index}`}
            className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
              isCredit
                ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/25 bg-rose-500/10 text-rose-200"
            }`}
          >
            {formatLedgerLabel(leg.account)} · {isCredit ? "+" : "−"}
            {formatMinor(leg.amountMinor, entry.currency)}
          </span>
        );
      })}
    </div>
  </article>
);

const MetricCard = ({ label, value, accent, icon }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <span className="rounded-xl bg-white/5 p-2 text-slate-300">{icon}</span>
    </div>
    <p className={`mt-3 text-3xl font-black ${accent}`}>{value}</p>
  </div>
);

const ActionPanel = ({
  title,
  copy,
  actionLabel,
  disabled = false,
  onClick,
  tone,
}) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
    <h2 className="text-xl font-black text-white">{title}</h2>
    <p className="mt-3 text-sm leading-7 text-slate-400">{copy}</p>
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`mt-5 w-full rounded-2xl py-3 ${
        tone === "danger"
          ? "bg-rose-500 text-white hover:bg-rose-400"
          : "bg-cyan-300 text-slate-950"
      }`}
    >
      {actionLabel}
    </Button>
  </div>
);

AmountModal.propTypes = {
  title: PropTypes.string.isRequired,
  amount: PropTypes.string.isRequired,
  setAmount: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
  disableWhileLoading: PropTypes.bool,
};

MetricCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  accent: PropTypes.string.isRequired,
  icon: PropTypes.node.isRequired,
};

ActionPanel.propTypes = {
  title: PropTypes.string.isRequired,
  copy: PropTypes.string.isRequired,
  actionLabel: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
  tone: PropTypes.string.isRequired,
};

LedgerEntry.propTypes = {
  entry: PropTypes.shape({
    createdAt: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    legs: PropTypes.arrayOf(
      PropTypes.shape({
        account: PropTypes.string.isRequired,
        amountMinor: PropTypes.number.isRequired,
        direction: PropTypes.oneOf(["credit", "debit"]).isRequired,
      }),
    ).isRequired,
    referenceType: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
};

export default Wallet;
