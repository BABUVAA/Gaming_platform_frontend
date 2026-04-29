import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Fuse from "fuse.js";
import { findTransactions } from "../../../store/adminSlice";

const STATUS_COLORS = {
  completed: "bg-emerald-500/15 text-emerald-300",
  pending: "bg-amber-500/15 text-amber-200",
  failed: "bg-rose-500/15 text-rose-200",
};

const getToday = () => new Date().toISOString().split("T")[0];

const TransactionList = ({ transactions }) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fuse = useMemo(
    () =>
      new Fuse(transactions, {
        keys: [
          "_id",
          "meta.merchantTransactionId",
          "userId.email",
          "userId.profile.username",
          "reason",
        ],
        threshold: 0.4,
      }),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    if (!search.trim()) return transactions;
    return fuse.search(search).map((result) => result.item);
  }, [fuse, search, transactions]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredTransactions.length / itemsPerPage)
  );
  const paginated = filteredTransactions
    .slice()
    .reverse()
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h3 className="text-xl font-black text-white">Transaction History</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Review wallet movement by merchant ID, user, or reason.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by Txn ID, email, reason..."
          className="w-full rounded-2xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400 lg:max-w-sm"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="mt-5 overflow-x-auto rounded-[20px] border border-slate-800">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-950 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
            <tr>
              <th className="p-3">Txn ID</th>
              <th className="p-3">PhonePe Txn ID</th>
              <th className="p-3">Email</th>
              <th className="p-3">Username</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Direction</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {paginated.map((txn) => (
              <tr key={txn._id} className="bg-[#020617]">
                <td className="p-3 text-slate-200">
                  {txn.meta?.merchantTransactionId || "-"}
                </td>
                <td className="p-3 text-xs text-slate-400">
                  {txn.meta?.phonePeOrderId || "-"}
                </td>
                <td className="p-3 text-slate-300">{txn.userId?.email || "N/A"}</td>
                <td className="p-3 text-slate-100">
                  {txn.userId?.profile?.username || "Unknown"}
                </td>
                <td className="p-3 font-semibold text-emerald-300">
                  Rs {txn.amount}
                </td>
                <td className="p-3 capitalize text-slate-300">
                  {txn.direction}
                </td>
                <td className="p-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                      STATUS_COLORS[txn.status] || "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {txn.status}
                  </span>
                </td>
                <td className="p-3 text-slate-400">
                  {new Date(txn.transactionDate).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Showing {paginated.length} of {filteredTransactions.length} entries
        </p>
        <div className="flex items-center gap-2">
          <button
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => page - 1)}
          >
            Prev
          </button>
          <span className="px-2 text-sm text-slate-300">
            {currentPage} / {totalPages}
          </span>
          <button
            className="rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300 disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

const FundOperations = () => {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5">
      <h3 className="text-xl font-black text-white">Fund Operations</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Manual ledger adjustments and operator-assisted wallet actions can land
        here once the admin mutation endpoints are ready.
      </p>
      <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        This section is staged for backend fund-control integration.
      </div>
    </div>
  );
};

const WalletManagement = () => {
  const [activeTab, setActiveTab] = useState("transactions");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());

  const dispatch = useDispatch();
  const { transactions = [], isLoading } = useSelector((store) => store.admin);

  useEffect(() => {
    const isValidRange = startDate <= endDate && endDate <= getToday();
    if (startDate && endDate && isValidRange) {
      dispatch(findTransactions({ startDate, endDate }));
    }
  }, [dispatch, endDate, startDate]);

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
            Finance
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Wallets & Transactions
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Review deposit and withdrawal traffic through a darker operator ledger.
          </p>
        </div>

        <div className="flex gap-2">
          {["transactions", "funds"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab === "transactions" ? "Transactions" : "Fund Operations"}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "transactions" ? (
        <>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <div className="text-sm font-medium text-slate-300">Filter by date:</div>
            <input
              type="date"
              value={startDate}
              max={getToday()}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-[#020617] p-3 text-sm text-slate-100"
            />
            <span className="text-slate-500">to</span>
            <input
              type="date"
              value={endDate}
              max={getToday()}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-[#020617] p-3 text-sm text-slate-100"
            />
          </div>

          <div className="mt-6">
            {isLoading && transactions.length === 0 ? (
              <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5 text-sm text-slate-400">
                Loading transactions...
              </div>
            ) : (
              <TransactionList transactions={transactions} />
            )}
          </div>
        </>
      ) : null}

      {activeTab === "funds" ? <div className="mt-6"><FundOperations /></div> : null}
    </div>
  );
};

export default WalletManagement;
