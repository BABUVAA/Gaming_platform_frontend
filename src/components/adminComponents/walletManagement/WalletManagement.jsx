import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { findTransactions } from "../../../store/adminSlice";
import Fuse from "fuse.js";

const STATUS_COLORS = {
  completed: "text-green-600 bg-green-100",
  pending: "text-yellow-600 bg-yellow-100",
  failed: "text-red-600 bg-red-100",
};

const TransactionList = ({ transactions }) => {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fuse = useMemo(() => {
    return new Fuse(transactions, {
      keys: [
        "_id",
        "meta.merchantTransactionId",
        "userId.email",
        "userId.profile.username",
        "reason",
      ],
      threshold: 0.4,
    });
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (!search) return transactions;
    return fuse.search(search).map((res) => res.item);
  }, [search, fuse]);

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginated = filteredTransactions
    .slice()
    .reverse()
    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-xl font-bold">Transaction History</h3>
          <p className="text-sm text-gray-600">
            List of all wallet transactions by users.
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by Txn ID, Email, Reason..."
          className="border p-2 rounded w-80 text-sm"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Txn ID</th>
              <th className="p-2 text-left">PhonePe Txn ID</th>
              <th className="p-2 text-left">Email</th>
              <th className="p-2 text-left">Username</th>
              <th className="p-2 text-left">Amount</th>
              <th className="p-2 text-left">Direction</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Date</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((txn) => (
              <tr key={txn._id} className="border-t">
                <td className="p-2">{txn.meta?.merchantTransactionId}</td>
                <td className="p-2 text-xs">
                  {txn.meta?.phonePeOrderId || "-"}
                </td>
                <td className="p-2">{txn.userId?.email || "N/A"}</td>
                <td className="p-2">{txn.userId?.profile?.username}</td>
                <td className="p-2 text-green-600 font-semibold">
                  ₹{txn.amount}
                </td>
                <td className="p-2 capitalize">{txn.direction}</td>
                <td className="p-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      STATUS_COLORS[txn.status] || "bg-gray-200 text-gray-700"
                    }`}
                  >
                    {txn.status}
                  </span>
                </td>
                <td className="p-2">
                  {new Date(txn.transactionDate).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500">
          Showing {paginated.length} of {filteredTransactions.length} entries
        </p>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
          >
            Prev
          </button>
          <span className="px-2">{currentPage}</span>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
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
    <div>
      <h3 className="text-xl font-bold mb-4">Add/Deduct Funds</h3>
      <p className="text-sm text-gray-600">
        Perform wallet operations like adding or deducting funds.
      </p>
    </div>
  );
};

const WalletManagement = () => {
  const [activeTab, setActiveTab] = useState("transactions");

  const getToday = () => {
    const today = new Date();
    return today.toISOString().split("T")[0]; // yyyy-mm-dd
  };

  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());

  const dispatch = useDispatch();
  const { transactions } = useSelector((store) => store.admin);

  useEffect(() => {
    const isValidRange = startDate <= endDate && endDate <= getToday();
    if (startDate && endDate && isValidRange) {
      dispatch(findTransactions({ startDate, endDate }));
    }
  }, [dispatch, startDate, endDate]);

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Wallets & Transactions</h2>

      <div className="flex gap-4 border-b mb-4">
        {["transactions", "funds"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 border-b-2 text-sm font-medium transition ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
          >
            {tab === "transactions" ? "Transactions" : "Fund Operations"}
          </button>
        ))}
      </div>

      {activeTab === "transactions" && (
        <>
          <div className="flex flex-wrap gap-4 mb-4 items-center">
            <div className="text-sm font-medium text-gray-700">
              Filter by Date:
            </div>
            <input
              type="date"
              value={startDate}
              max={getToday()}
              onChange={(e) => setStartDate(e.target.value)}
              className="border p-2 rounded text-sm"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              max={getToday()}
              onChange={(e) => setEndDate(e.target.value)}
              className="border p-2 rounded text-sm"
            />
          </div>

          <TransactionList transactions={transactions} />
        </>
      )}

      {activeTab === "funds" && <FundOperations />}
    </div>
  );
};

export default WalletManagement;
