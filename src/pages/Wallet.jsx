import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiArrowDownLeft, FiArrowUpRight, FiClock } from "react-icons/fi";
import { Button } from "../components";
import api from "../api/axios-api";
import {
  initiatePhonePeOrder,
  withdrawRequest,
} from "../store/paymentSlice";
import { showToast, types } from "../store/toastSlice";

const statusColor = {
  COMPLETED: "bg-emerald-500/15 text-emerald-300",
  PENDING: "bg-amber-500/15 text-amber-200",
  FAILED: "bg-rose-500/15 text-rose-200",
};

const quickAmounts = [100, 250, 500, 1000];

const Wallet = () => {
  const dispatch = useDispatch();
  const { wallet, isLoading } = useSelector((state) => state.payment);

  const [activeTab, setActiveTab] = useState("real");
  const [txnTypeFilter, setTxnTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const activeTransactions =
    activeTab === "platform"
      ? wallet?.platformTransactions || []
      : wallet?.realTransactions || [];

  const filteredTransactions = useMemo(
    () =>
      activeTransactions.filter((txn) => {
        const matchesType = txnTypeFilter === "all" || txn.type === txnTypeFilter;
        const txnStatus = (txn?.transactionId?.status || "pending").toLowerCase();
        const matchesStatus =
          statusFilter === "all" || txnStatus === statusFilter.toLowerCase();
        return matchesType && matchesStatus;
      }),
    [activeTransactions, statusFilter, txnTypeFilter]
  );

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsWithdrawModalOpen(false);
    setAmount("");
  };

  const validateAmount = (value) => {
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

    return parsedValue;
  };

  const handleAddMoney = async () => {
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
        if (response.callbackUrl) {
          await api.post(response.callbackUrl);
        }

        window.location.href = response.redirectUrl;
        return;
      }

      dispatch(
        showToast({
          message: "No payment redirect URL was returned.",
          type: types.DANGER,
          position: "bottom-right",
        })
      );
    } catch (error) {
      console.error("PhonePe initiation failed:", error);
    } finally {
      closeModals();
    }
  };

  const handleWithdrawMoney = async () => {
    const value = validateAmount(amount);
    if (!value) return;

    try {
      await dispatch(withdrawRequest({ amount: value })).unwrap();
      closeModals();
    } catch (error) {
      console.error("Withdraw request failed:", error);
    }
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

          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Real Wallet"
              value={`Rs ${wallet?.realMoney || 0}`}
              accent="text-cyan-300"
              icon={<FiArrowDownLeft />}
            />
            <MetricCard
              label="Platform Coins"
              value={wallet?.platformMoney || 0}
              accent="text-emerald-300"
              icon={<FiArrowUpRight />}
            />
            <MetricCard
              label="Recent Activity"
              value={activeTransactions.length}
              accent="text-amber-200"
              icon={<FiClock />}
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_1fr_0.8fr]">
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
          actionLabel="Withdraw"
          onClick={() => {
            setAmount("");
            setIsWithdrawModalOpen(true);
          }}
          tone="danger"
        />
        <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Quick Rules
          </p>
          <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <li>Deposits redirect you to the payment provider securely.</li>
            <li>Platform ledger entries track in-app rewards and usage.</li>
            <li>Pending statuses usually settle after backend confirmation.</li>
          </ul>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {[
              { key: "real", label: "Real Wallet" },
              { key: "platform", label: "Platform Ledger" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-semibold uppercase tracking-[0.16em] transition ${
                  activeTab === tab.key
                    ? "bg-cyan-400/14 text-cyan-200"
                    : "text-slate-500 hover:text-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <select
              className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
              value={txnTypeFilter}
              onChange={(event) => setTxnTypeFilter(event.target.value)}
            >
              <option value="all">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>

            <select
              className="rounded-2xl border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-slate-200"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {filteredTransactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
              No transactions found for this view.
            </div>
          ) : (
            [...filteredTransactions].reverse().map((txn, index) => {
              const status =
                txn?.transactionId?.status?.toUpperCase() || "PENDING";
              const isCredit = txn.type === "credit";

              return (
                <article
                  key={txn._id || index}
                  className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4"
                >
                  <div>
                    <p className="font-semibold text-white">
                      {txn.reason || "Transaction"}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {new Date(txn.timestamp || txn.createdAt).toLocaleString("en-IN")}
                    </p>
                    {txn?.transactionId?.meta?.merchantTransactionId ? (
                      <p className="mt-1 text-xs text-slate-500">
                        Txn ID:{" "}
                        {txn.transactionId.meta.merchantTransactionId.slice(-12)}
                      </p>
                    ) : null}
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        statusColor[status] || "bg-slate-800 text-slate-200"
                      }`}
                    >
                      {status}
                    </span>
                    <p
                      className={`mt-3 text-lg font-black ${
                        isCredit ? "text-emerald-300" : "text-rose-300"
                      }`}
                    >
                      {isCredit ? "+" : "-"} Rs {txn.amount}
                    </p>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>

      {isAddModalOpen ? (
        <AmountModal
          title="Add Money"
          amount={amount}
          setAmount={setAmount}
          onClose={closeModals}
          onConfirm={handleAddMoney}
          isLoading={isLoading}
        />
      ) : null}

      {isWithdrawModalOpen ? (
        <AmountModal
          title="Withdraw Money"
          amount={amount}
          setAmount={setAmount}
          onClose={closeModals}
          onConfirm={handleWithdrawMoney}
          isLoading={isLoading}
        />
      ) : null}
    </div>
  );
};

const AmountModal = ({ title, amount, setAmount, onConfirm, onClose, isLoading }) => (
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
          disabled={isLoading}
          className="rounded-2xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500"
        >
          {isLoading ? "Processing..." : "Confirm"}
        </button>
      </div>
    </div>
  </div>
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

const ActionPanel = ({ title, copy, actionLabel, onClick, tone }) => (
  <div className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5 shadow-[0_18px_50px_rgba(2,8,23,0.45)]">
    <h2 className="text-xl font-black text-white">{title}</h2>
    <p className="mt-3 text-sm leading-7 text-slate-400">{copy}</p>
    <Button
      onClick={onClick}
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

export default Wallet;
