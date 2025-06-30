import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWalletBalance,
  fetchUserTransactions,
  initiatePhonePeOrder,
  checkTransactionStatus,
} from "../store/paymentSlice";
import { Button } from "../components";
import api from "../api/axios-api";

const Wallet = () => {
  const dispatch = useDispatch();
  const { wallet, platformTransactions, withdrawTransactions, isLoading } =
    useSelector((state) => state.payment);

  const [activeTab, setActiveTab] = useState("platform");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  const handleAddMoney = async () => {
    const value = parseFloat(amount);
    if (!value || value <= 0) return alert("Enter a valid amount");

    try {
      const response = await dispatch(
        initiatePhonePeOrder({
          amount: value,
          name: "Bhupesh Patel",
          mobile: "9602689822",
        })
      ).unwrap();
      if (response.redirectUrl && response.callbackUrl) {
        api.post(response.callbackUrl);
        window.location.href = response.redirectUrl;
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

    // TODO: Replace with actual withdraw logic
    alert(`Withdraw ₹${value} initiated`);
    setIsWithdrawModalOpen(false);
    setAmount("");
  };

  const renderModal = (title, onConfirm, onClose) => (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
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
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-10">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-6 rounded-2xl shadow-2xl text-center text-white mb-8">
        <h2 className="text-4xl font-extrabold mb-2">💰 Wallet</h2>
        <p className="text-md opacity-90">
          Manage your balance and transactions
        </p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-md border hover:shadow-lg transition-all text-center">
          <h4 className="text-sm text-gray-500">Wallet Balance</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ₹{wallet?.toLocaleString("en-IN") || "0"}
          </p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-md border hover:shadow-lg transition-all text-center">
          <h4 className="text-sm text-gray-500">Game Coins</h4>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
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

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        {["platform", "withdraw"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition ${
              activeTab === tab
                ? "bg-indigo-600 text-white shadow"
                : "bg-gray-200 text-gray-700 hover:bg-indigo-100"
            }`}
          >
            {tab === "platform"
              ? "💹 Platform Transactions"
              : "🏦 Withdraw History"}
          </button>
        ))}
      </div>

      {/* Transactions */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {activeTab === "platform"
            ? "Platform Transactions"
            : "Withdraw Transactions"}
        </h3>

        {isLoading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <ul className="space-y-4 max-h-[300px] overflow-auto">
            {(activeTab === "platform"
              ? platformTransactions
              : withdrawTransactions
            )?.map((txn, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center border-b pb-2 hover:bg-gray-50 px-2 py-2 rounded"
              >
                <div className="text-sm text-gray-800">
                  <p className="font-medium">
                    {txn.description || "Transaction"}
                  </p>
                  <span className="text-xs text-gray-400">
                    {new Date(txn.date).toLocaleString("en-IN")}
                  </span>
                </div>
                <span
                  className={`font-semibold ${
                    txn.amount >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {txn.amount >= 0 ? "+" : "-"}{" "}
                  {activeTab === "platform"
                    ? `${txn.amount} Coins`
                    : `₹${txn.amount}`}
                </span>
              </li>
            ))}

            {!(activeTab === "platform"
              ? platformTransactions?.length
              : withdrawTransactions?.length) && (
              <p className="text-center text-gray-400 text-sm">
                No {activeTab} transactions found.
              </p>
            )}
          </ul>
        )}
      </div>

      {/* Modals */}
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
