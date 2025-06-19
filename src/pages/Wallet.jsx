import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchWalletBalance,
  fetchUserTransactions,
  initiatePhonePeOrder,
} from "../store/paymentSlice";
import { Button } from "../components";

const Wallet = () => {
  const dispatch = useDispatch();
  const { wallet, platformTransactions, withdrawTransactions, isLoading } =
    useSelector((state) => state.payment);

  const [activeTab, setActiveTab] = useState("platform");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    dispatch(fetchWalletBalance());
    dispatch(fetchUserTransactions());
  }, [dispatch]);

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
      if (response.redirectUrl) {
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{title}</h2>
        <input
          type="number"
          placeholder="Enter amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
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
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-10">
      <div className="bg-gradient-to-br from-blue-100 to-purple-200 p-6 rounded-2xl shadow-lg text-center mb-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Wallet</h2>
        <p className="text-gray-600">Manage your balance and transactions</p>
      </div>

      {/* Balance Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h4 className="text-sm text-gray-500">Wallet Balance</h4>
          <p className="text-3xl font-bold text-blue-600 mt-2">
            ₹{wallet || 0}
          </p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow text-center">
          <h4 className="text-sm text-gray-500">Game Coins</h4>
          <p className="text-3xl font-bold text-green-600 mt-2">0</p>
        </div>

        <div className="flex flex-col justify-center items-center gap-4">
          <Button
            onClick={() => {
              setAmount("");
              setIsAddModalOpen(true);
            }}
            className="w-full bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Money
          </Button>
          <Button
            onClick={() => {
              setAmount("");
              setIsWithdrawModalOpen(true);
            }}
            className="w-full bg-rose-500 text-white hover:bg-rose-600"
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-4 mb-6">
        {["platform", "withdraw"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-2 rounded-full font-medium shadow transition ${
              activeTab === tab
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-indigo-100"
            }`}
          >
            {tab === "platform" ? "Platform Transactions" : "Withdraw History"}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">
          {activeTab === "platform"
            ? "Platform Transactions"
            : "Withdraw Transactions"}
        </h3>

        {isLoading ? (
          <p className="text-center text-gray-400">Loading...</p>
        ) : (
          <ul className="space-y-4 max-h-[300px] overflow-auto scrollbar-thin scrollbar-thumb-gray-300">
            {(activeTab === "platform"
              ? platformTransactions
              : withdrawTransactions
            )?.map((txn, idx) => (
              <li
                key={idx}
                className="flex justify-between items-center border-b pb-2"
              >
                <div className="text-sm text-gray-700">
                  <p>{txn.description || "Transaction"}</p>
                  <span className="text-xs text-gray-400">
                    {new Date(txn.date).toLocaleString() || "Date Unknown"}
                  </span>
                </div>
                <span
                  className={`font-medium ${
                    txn.amount >= 0 ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {txn.amount >= 0 ? "+" : ""}
                  {activeTab === "platform"
                    ? `${txn.amount} Coins`
                    : `₹${txn.amount}`}
                </span>
              </li>
            ))}

            {/* Empty state */}
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
