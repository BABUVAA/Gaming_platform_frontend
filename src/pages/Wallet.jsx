import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWalletBalance,
  initiatePhonePeOrder,
} from "../store/paymentSlice";
import { Button } from "../components";
import api from "../api/axios-api";

const statusColor = {
  COMPLETED: "text-green-600 bg-green-100",
  PENDING: "text-yellow-600 bg-yellow-100",
  FAILED: "text-red-600 bg-red-100",
};

const Wallet = () => {
  const dispatch = useDispatch();
  const { wallet, isLoading } = useSelector((state) => state.payment);

  const [activeTab, setActiveTab] = useState("real");
  const [txnTypeFilter, setTxnTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const [txnInProgress, setTxnInProgress] = useState(false);

  useEffect(() => {
    dispatch(fetchWalletBalance());
  }, [dispatch]);

  const handleAddMoney = async () => {
    // if (txnInProgress) return;
    // setTxnInProgress(true);
    const value = parseFloat(amount);
    if (!value || value <= 0) return alert("Enter a valid amount");

    try {
      const response = await dispatch(
        initiatePhonePeOrder({
          amount: value,
          name: "Bhupesh Patel",
          mobile: "9602689822",
        })
      );

      if (response.payload.redirectUrl && response.payload.callbackUrl) {
        api.post(response.payload.callbackUrl);
        window.location.href = response.payload.redirectUrl;
      } else {
        alert("No redirect URL received.");
      }
    } catch (err) {
      console.error("PhonePe initiation failed:", err);
      alert("Something went wrong");
    } finally {
      setIsAddModalOpen(false);
      setAmount("");
    }
  };

  const handleWithdrawMoney = () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return alert("Enter a valid amount");
    alert(`Withdraw ₹${value} initiated`);
    setIsWithdrawModalOpen(false);
    setAmount("");
  };

  const renderModal = (title, onConfirm, onClose) => (
    <div
      className={`fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center ${
        txnInProgress ? "disabled" : ""
      }`}
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">{title}</h2>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow${
              txnInProgress ? "disabled" : ""
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  const activeTransactions =
    activeTab === "platform"
      ? wallet?.platformTransactions || []
      : wallet?.realTransactions || [];

  const filteredTransactions = activeTransactions.filter((txn) => {
    const matchesType = txnTypeFilter === "all" || txn.type === txnTypeFilter;
    const txnStatus = txn?.transactionId?.status || "pending";
    const matchesStatus = statusFilter === "all" || txnStatus === statusFilter;
    return matchesType && matchesStatus;
  });

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-10 mb-8">
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl shadow-2xl text-center text-white mb-8">
        <h2 className="text-4xl font-extrabold mb-2">💰 Wallet</h2>
        <p className="text-md opacity-90">
          Manage your balance and transactions
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-md text-center">
          <h4 className="text-sm text-gray-500">Wallet Balance</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ₹{wallet?.realMoney.toLocaleString("en-IN") || "0"}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md text-center">
          <h4 className="text-sm text-gray-500">Game Coins</h4>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {wallet?.platformMoney || 0}
          </p>
        </div>
        <div className="flex flex-col justify-center items-center gap-4">
          <Button
            onClick={() => {
              setAmount("");
              setIsAddModalOpen(true);
            }}
            className="w-full py-3 text-lg bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-xl hover:from-indigo-600 hover:to-blue-700 shadow-lg transition"
          >
            ➕ Add Money
          </Button>
          <Button
            onClick={() => {
              setAmount("");
              setIsWithdrawModalOpen(true);
            }}
            className="w-full py-3 text-lg bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl hover:from-rose-600 hover:to-red-700 shadow-lg transition"
          >
            ➖ Withdraw
          </Button>
        </div>
      </div>

      <div className="flex justify-center gap-4 mb-4">
        <button
          onClick={() => setActiveTab("real")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            activeTab === "real"
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          💸 Wallet Transactions
        </button>
        <button
          onClick={() => setActiveTab("platform")}
          className={`px-4 py-2 rounded-full text-sm font-semibold ${
            activeTab === "platform"
              ? "bg-green-600 text-white"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          🎮 Platform Transactions
        </button>
      </div>

      <div className="flex justify-between mb-4">
        <select
          className="border px-2 py-1 rounded text-sm"
          value={txnTypeFilter}
          onChange={(e) => setTxnTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="credit">Credit</option>
          <option value="debit">Debit</option>
        </select>

        <select
          className="border px-2 py-1 rounded text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl shadow p-4 max-h-[400px] overflow-auto">
        {filteredTransactions.length === 0 ? (
          <p className="text-gray-400 text-center py-4">
            No transactions found.
          </p>
        ) : (
          <ul className="divide-y">
            {[...filteredTransactions].reverse().map((txn, idx) => {
              const status =
                txn?.transactionId?.status?.toUpperCase() || "PENDING";
              const isFailed = status === "FAILED";
              const isCredit = txn.type === "credit";
              const amountColor = isFailed
                ? "text-red-500"
                : isCredit
                ? "text-green-600"
                : "text-red-600";

              const badgeColor =
                statusColor[status] || "text-gray-600 bg-gray-100";

              return (
                <li
                  key={idx}
                  className="flex justify-between items-start py-3 hover:bg-gray-50 px-2 rounded-lg transition"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-gray-800">
                      {txn.reason || "Transaction"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(txn.timestamp).toLocaleString("en-IN")}
                    </p>
                    {txn?.transactionId?.meta?.merchantTransactionId && (
                      <p className="text-xs text-gray-400">
                        Txn ID:{" "}
                        {txn.transactionId.meta.merchantTransactionId.slice(
                          -12
                        )}
                      </p>
                    )}
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${badgeColor}`}
                    >
                      {status}
                    </span>
                  </div>

                  <span
                    className={`text-base font-bold ${amountColor} whitespace-nowrap`}
                  >
                    {isCredit ? "+" : "-"} ₹{txn.amount}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {isAddModalOpen &&
        renderModal("Add Money", handleAddMoney, () =>
          setIsAddModalOpen(false)
        )}
      {isWithdrawModalOpen &&
        renderModal("Withdraw Money", handleWithdrawMoney, () =>
          setIsWithdrawModalOpen(false)
        )}
    </div>
  );
};

export default Wallet;
