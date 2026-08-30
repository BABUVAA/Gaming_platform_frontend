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
  fetchPaymentCapabilities,
  initiatePhonePeOrder,
} from "../store/slices/paymentSlice";
import {
  fetchPayoutDestinations,
  fetchWithdrawalHistory,
  requestWithdrawal,
} from "../store/slices/withdrawalSlice.js";
import {
  selectPaymentLoading,
  selectPaymentCapabilities,
  selectWallet,
  selectWalletLedgerEntries,
  selectWalletLedgerError,
  selectWalletLedgerLoading,
  selectWalletLedgerLoadingMore,
  selectWalletLedgerPage,
} from "../store/selectors/walletSelectors";
import { showToast, types } from "../store/slices/toastSlice";
import {
  selectIsStaffUtilityMode,
  selectPlayerSummary,
} from "../store/selectors/playerSelectors";
import { STAFF_UTILITY_MESSAGE } from "../utils/staffUtilityMode";
import {
  selectPayoutDestinations,
  selectPayoutDestinationStatus,
  selectWithdrawalAvailability,
  selectWithdrawalHistory,
  selectWithdrawalHistoryError,
  selectWithdrawalHistoryPage,
  selectWithdrawalHistoryStatus,
  selectWithdrawalRequest,
  selectWithdrawalRequestError,
} from "../store/selectors/withdrawalSelectors.js";

const ledgerTypeLabels = {
  adjustment: "Wallet adjustment",
  referral_bonus: "Referral tournament credit",
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
const withdrawalStatusLabels = {
  approved: "Approved",
  failed: "Failed - funds returned",
  paid: "Paid",
  provider_processing: "Processing",
  reconciled: "Reconciled",
  rejected: "Rejected - funds returned",
  requested: "Requested",
  under_review: "Under review",
};
const getWithdrawalStatusLabel = (item) => {
  if (item.status === "reconciled") {
    return item.outcome === "paid"
      ? "Reconciled - paid"
      : "Reconciled - funds returned";
  }
  return withdrawalStatusLabels[item.status] || formatLedgerLabel(item.status);
};
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
  const paymentCapabilities = useSelector(selectPaymentCapabilities);
  const ledgerEntries = useSelector(selectWalletLedgerEntries);
  const ledgerError = useSelector(selectWalletLedgerError);
  const ledgerIsLoading = useSelector(selectWalletLedgerLoading);
  const ledgerIsLoadingMore = useSelector(selectWalletLedgerLoadingMore);
  const ledgerPage = useSelector(selectWalletLedgerPage);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const playerSummary = useSelector(selectPlayerSummary);
  const isPlayer = playerSummary?.role === "player";
  const payoutDestinations = useSelector(selectPayoutDestinations);
  const payoutDestinationStatus = useSelector(selectPayoutDestinationStatus);
  const withdrawalAvailability = useSelector(selectWithdrawalAvailability);
  const withdrawalHistory = useSelector(selectWithdrawalHistory);
  const withdrawalHistoryError = useSelector(selectWithdrawalHistoryError);
  const withdrawalHistoryPage = useSelector(selectWithdrawalHistoryPage);
  const withdrawalHistoryStatus = useSelector(selectWithdrawalHistoryStatus);
  const withdrawalRequestState = useSelector(selectWithdrawalRequest);
  const withdrawalRequestError = useSelector(selectWithdrawalRequestError);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [withdrawalAmount, setWithdrawalAmount] = useState("");
  const [payoutDestinationId, setPayoutDestinationId] = useState("");
  const [withdrawalAttemptKey, setWithdrawalAttemptKey] = useState(null);

  useEffect(() => {
    const walletRequest = dispatch(fetchWalletBalance());
    const ledgerRequest = dispatch(fetchWalletLedger());
    const capabilityRequest = dispatch(fetchPaymentCapabilities());
    return () => {
      walletRequest.abort();
      ledgerRequest.abort();
      capabilityRequest.abort();
    };
  }, [dispatch]);

  useEffect(() => {
    if (!isPlayer) return undefined;
    const destinationsRequest = dispatch(fetchPayoutDestinations());
    const historyRequest = dispatch(fetchWithdrawalHistory());
    return () => {
      destinationsRequest.abort();
      historyRequest.abort();
    };
  }, [dispatch, isPlayer]);

  const closeModals = () => {
    setIsAddModalOpen(false);
    setAmount("");
  };

  const validateAmount = (value, { maxAmount } = {}) => {
    const amountText = String(value ?? "").trim();
    const parsedValue = Number(value);
    if (!/^\d+(\.\d{1,2})?$/.test(amountText) || !parsedValue || parsedValue <= 0) {
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
          amountMinor: Math.round(value * 100),
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

  const resetWithdrawalIntent = () => setWithdrawalAttemptKey(null);

  const openWithdrawal = () => {
    setWithdrawalAmount("");
    setPayoutDestinationId(payoutDestinations[0]?.id || "");
    resetWithdrawalIntent();
    setIsWithdrawalModalOpen(true);
  };

  const closeWithdrawal = () => {
    setIsWithdrawalModalOpen(false);
    setWithdrawalAmount("");
    setPayoutDestinationId("");
    resetWithdrawalIntent();
  };

  const handleWithdrawal = async () => {
    if (isStaffUtilityMode || !withdrawalAvailability.canRequest) return;
    if (!/^\d+(?:\.\d{1,2})?$/.test(withdrawalAmount.trim())) {
      dispatch(showToast({
        message: "Enter a withdrawal amount with no more than two decimal places.",
        position: "bottom-right",
        type: types.WARNING,
      }));
      return;
    }
    const amountMajor = validateAmount(withdrawalAmount, {
      maxAmount: Number(wallet?.withdrawableMinor || 0) / 100,
    });
    const destination = payoutDestinations.find(
      (item) => item.id === payoutDestinationId,
    );
    if (!amountMajor || !destination) return;

    const attemptKey =
      withdrawalAttemptKey || `withdrawal-${crypto.randomUUID()}`;
    if (!withdrawalAttemptKey) setWithdrawalAttemptKey(attemptKey);
    try {
      await dispatch(
        requestWithdrawal({
          amountMinor: Math.round(amountMajor * 100),
          idempotencyKey: attemptKey,
          payoutDestinationId,
        }),
      ).unwrap();
      closeWithdrawal();
      dispatch(fetchWalletBalance());
      dispatch(fetchWithdrawalHistory());
    } catch {
      // The same attempt key is retained so a transport retry is idempotent.
    }
  };

  const handleLoadMoreWithdrawals = () => {
    if (!withdrawalHistoryPage.nextCursor || withdrawalHistoryStatus === "loadingMore") return;
    dispatch(fetchWithdrawalHistory({ cursor: withdrawalHistoryPage.nextCursor }));
  };

  return (
    <div className="space-y-4">
      {paymentCapabilities.testMoney ? (
        <section className="rounded-2xl border border-amber-300/40 bg-amber-300/10 px-4 py-3 text-amber-50">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-amber-200">
            PhonePe sandbox - test money only
          </p>
          <p className="mt-1 text-xs leading-5">
            Deposits, entry fees, prizes, and wallet balances on this deployment
            are test values. They cannot be withdrawn or exchanged for real money.
          </p>
        </section>
      ) : null}
      <section className="rounded-2xl border border-emerald-500/20 bg-slate-950/90 p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Wallet</h1>
          </div>

          <div className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-5">
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
              label="Withdrawal pending"
              value={formatMinor(wallet?.withdrawalPendingMinor, wallet?.currency)}
              accent="text-amber-200"
              icon={<FiClock />}
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

      <section className="grid gap-3 md:grid-cols-2">
        {isStaffUtilityMode ? (
          <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-50 xl:col-span-2">
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
              copy={paymentCapabilities.depositAvailable
                ? paymentCapabilities.testMoney
                  ? "PhonePe sandbox deposit."
                  : "Deposit through PhonePe."
                : "Deposits are unavailable."}
              actionLabel={paymentCapabilities.depositAvailable ? "Add Money" : "Unavailable"}
              disabled={paymentCapabilities.depositAvailable !== true}
              onClick={() => {
                setAmount("");
                setIsAddModalOpen(true);
              }}
              tone="primary"
            />
            <ActionPanel
              title="Withdraw funds"
              copy="Request a reviewed payout."
              actionLabel={withdrawalAvailability.canRequest ? "Request withdrawal" : "Unavailable"}
              disabled={!withdrawalAvailability.canRequest || payoutDestinations.length === 0}
              onClick={openWithdrawal}
              tone="danger"
            />
          </>
        )}
      </section>

      {!isStaffUtilityMode ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white">Withdrawal history</h2>
            </div>
            <button className="rounded-2xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 disabled:opacity-50" disabled={withdrawalHistoryStatus === "loading" || withdrawalHistoryStatus === "loadingMore"} onClick={() => dispatch(fetchWithdrawalHistory())} type="button">Refresh</button>
          </div>
          {!withdrawalAvailability.canRequest ? <p className="mt-4 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">Payout processing is not configured yet. Your wallet and existing withdrawal history remain available.</p> : null}
          {payoutDestinationStatus === "succeeded" && payoutDestinations.length === 0 ? <p className="mt-4 rounded-2xl border border-dashed border-slate-700 p-4 text-sm text-slate-400">No verified payout destination is available. Add and verify one when payout destination management becomes available.</p> : null}
          <div className="mt-4 space-y-3" aria-live="polite">
            {withdrawalHistoryStatus === "loading" && withdrawalHistory.length === 0 ? <p className="rounded-2xl border border-slate-800 p-5 text-sm text-slate-400">Loading withdrawal history...</p> : null}
            {withdrawalHistoryError ? <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 p-4 text-sm text-rose-100">{withdrawalHistoryError}</p> : null}
            {withdrawalHistoryStatus === "succeeded" && withdrawalHistory.length === 0 ? <p className="rounded-2xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">No withdrawal requests yet.</p> : null}
            {withdrawalHistory.map((item) => <WithdrawalRow item={item} key={item.id} />)}
            {withdrawalHistoryPage.hasMore ? <button className="rounded-2xl border border-cyan-400/40 px-5 py-3 text-sm font-bold text-cyan-200 disabled:opacity-50" disabled={withdrawalHistoryStatus === "loadingMore"} onClick={handleLoadMoreWithdrawals} type="button">{withdrawalHistoryStatus === "loadingMore" ? "Loading more..." : "Load more"}</button> : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-white">
              Wallet ledger
            </h2>
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

      {isWithdrawalModalOpen && !isStaffUtilityMode ? (
        <WithdrawalModal
          amount={withdrawalAmount}
          destinations={payoutDestinations}
          error={withdrawalRequestError}
          isLoading={withdrawalRequestState.status === "loading"}
          onAmountChange={(value) => { setWithdrawalAmount(value); resetWithdrawalIntent(); }}
          onClose={closeWithdrawal}
          onConfirm={handleWithdrawal}
          onDestinationChange={(value) => { setPayoutDestinationId(value); resetWithdrawalIntent(); }}
          selectedDestinationId={payoutDestinationId}
        />
      ) : null}

    </div>
  );
};

const WithdrawalRow = ({ item }) => (
  <article className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:flex-row sm:items-center sm:justify-between">
    <div>
      <p className="font-bold text-white">{formatMinor(item.amountMinor, item.currency)}</p>
      <p className="mt-1 text-sm text-slate-400">{item.destination?.maskedLabel || "Saved payout destination"}</p>
      <p className="mt-1 text-xs text-slate-500">{new Date(item.requestedAt).toLocaleString("en-IN")}</p>
    </div>
    <span className="self-start rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-xs font-bold text-slate-200">{getWithdrawalStatusLabel(item)}</span>
  </article>
);

const WithdrawalModal = ({ amount, destinations, error, isLoading, onAmountChange, onClose, onConfirm, onDestinationChange, selectedDestinationId }) => {
  const [confirmed, setConfirmed] = useState(false);
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="withdrawal-title">
    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950 p-6">
      <h2 className="text-2xl font-black text-white" id="withdrawal-title">Request withdrawal</h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">Funds move to Withdrawal pending. Review and provider processing happen after this request.</p>
      <label className="mt-5 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Amount (INR)</label>
      <input className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white outline-none focus:border-cyan-400" min="1" onChange={(event) => { setConfirmed(false); onAmountChange(event.target.value); }} type="number" value={amount} />
      <label className="mt-4 block text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Verified payout destination</label>
      <select className="mt-2 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-white" onChange={(event) => { setConfirmed(false); onDestinationChange(event.target.value); }} value={selectedDestinationId}>
        {destinations.map((destination) => <option key={destination.id} value={destination.id}>{formatLedgerLabel(destination.type)} - {destination.maskedLabel}</option>)}
      </select>
      {error ? <p className="mt-4 rounded-xl bg-rose-400/10 p-3 text-sm text-rose-100">{error}</p> : null}
      <label className="mt-4 flex items-start gap-3 text-sm leading-6 text-slate-300"><input checked={confirmed} className="mt-1" onChange={(event) => setConfirmed(event.target.checked)} type="checkbox" /> <span>I confirm the amount and saved destination. This request is not an instant payment.</span></label>
      <div className="mt-5 flex justify-end gap-3"><button className="rounded-2xl border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-300" disabled={isLoading} onClick={onClose} type="button">Cancel</button><button className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-50" disabled={isLoading || !selectedDestinationId || !amount || !confirmed} onClick={onConfirm} type="button">{isLoading ? "Submitting..." : "Submit for review"}</button></div>
    </div>
  </div>;
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
  <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-3">
    <div className="flex items-center justify-between gap-3">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <span className="rounded-lg bg-white/5 p-1.5 text-slate-300">{icon}</span>
    </div>
    <p className={`mt-2 text-xl font-black ${accent}`}>{value}</p>
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
  <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-4">
    <h2 className="text-lg font-black text-white">{title}</h2>
    <p className="mt-1 text-xs leading-5 text-slate-400">{copy}</p>
    <Button
      onClick={onClick}
      disabled={disabled}
      className={`mt-3 w-full rounded-xl py-2.5 ${
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

WithdrawalRow.propTypes = {
  item: PropTypes.shape({
    amountMinor: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    destination: PropTypes.shape({ maskedLabel: PropTypes.string }),
    id: PropTypes.string.isRequired,
    outcome: PropTypes.oneOf(["paid", "failed"]),
    requestedAt: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
};

WithdrawalModal.propTypes = {
  amount: PropTypes.string.isRequired,
  destinations: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    maskedLabel: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  })).isRequired,
  error: PropTypes.string,
  isLoading: PropTypes.bool.isRequired,
  onAmountChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onDestinationChange: PropTypes.func.isRequired,
  selectedDestinationId: PropTypes.string.isRequired,
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
