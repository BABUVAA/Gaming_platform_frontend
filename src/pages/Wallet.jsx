import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPlatformTransactions,
  fetchWithdrawTransactions,
} from "../store/transactionSlice"; // Redux actions for fetching data
import { Button } from "../components";

const Wallet = () => {
  const dispatch = useDispatch();
  const gameCoins = "40245"; // Example static value, should come from the state
  const { platformTransactions, withdrawTransactions } = useSelector(
    (state) => state.transactions
  );
  const userBalance = "50"; // Example static value, should come from the state

  const [activeTab, setActiveTab] = useState("platform");

  useEffect(() => {
    dispatch(fetchPlatformTransactions()); // Fetch platform transactions
    dispatch(fetchWithdrawTransactions()); // Fetch withdraw transactions
  }, [dispatch]);

  const handleDeposit = () => {
    console.log("Deposit money action triggered.");
    // Add logic for handling deposit here
  };

  const handleWithdraw = () => {
    console.log("Withdraw money action triggered.");
    // Add logic for handling withdrawal here
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 bg-gray-50 rounded-xl shadow-xl">
      <h1 className="text-3xl font-bold text-center text-gray-900 mb-12">
        Your Wallet
      </h1>

      {/* Wallet Balance Card */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-12">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Wallet Balance
            </h3>
            <p className="text-3xl font-bold">{userBalance}$</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Game Coins</h3>
            <p className="text-3xl font-bold">{gameCoins} Coins</p>
          </div>
        </div>

        {/* Deposit and Withdraw Buttons */}
        <div className="flex justify-between mt-6">
          <Button
            onClick={handleDeposit}
            size="medium"
            className=" bg-green-500 text-white rounded-md shadow-md hover:bg-green-600 transition"
          >
            Add Money
          </Button>
          <Button
            onClick={handleWithdraw}
            size="medium"
            className=" bg-red-500 text-white rounded-md shadow-md hover:bg-red-600 transition"
          >
            Withdraw
          </Button>
        </div>
      </div>

      {/* Tabbed Interface for Transaction History */}
      <div className="flex justify-center space-x-8 mb-6">
        <button
          onClick={() => handleTabChange("platform")}
          className={`p-4 ${
            activeTab === "platform"
              ? "bg-blue-500 text-white"
              : "bg-gray-100 text-gray-600"
          } rounded-md shadow-md hover:bg-blue-400 transition`}
        >
          Platform Transactions
        </button>
        <button
          onClick={() => handleTabChange("withdraw")}
          className={`p-4 ${
            activeTab === "withdraw"
              ? "bg-green-500 text-white"
              : "bg-gray-100 text-gray-600"
          } rounded-md shadow-md hover:bg-green-400 transition`}
        >
          Withdraw Transactions
        </button>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        {activeTab === "platform" ? (
          <>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Platform Transactions
            </h3>
            <ul>
              {/* Dummy Transactions */}
              <li className="flex justify-between mb-2 text-gray-700">
                <span>2024-12-28: Purchase Game Coins</span>
                <span>+20 Coins</span>
              </li>
              <li className="flex justify-between mb-2 text-gray-700">
                <span>2024-12-29: Platform Fee</span>
                <span>-5 Coins</span>
              </li>
              <li className="flex justify-between mb-2 text-gray-700">
                <span>2024-12-30: Gift Bonus</span>
                <span>+100 Coins</span>
              </li>
            </ul>
          </>
        ) : (
          <>
            <h3 className="text-2xl font-semibold text-gray-900 mb-4">
              Withdraw Transactions
            </h3>
            <ul>
              {/* Dummy Withdraw Transactions */}
              <li className="flex justify-between mb-2 text-gray-700">
                <span>2024-12-30: Withdraw to Bank</span>
                <span>-50$ (Pending)</span>
              </li>
              <li className="flex justify-between mb-2 text-gray-700">
                <span>2024-12-29: Withdraw to Wallet</span>
                <span>-20$ (Completed)</span>
              </li>
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default Wallet;
