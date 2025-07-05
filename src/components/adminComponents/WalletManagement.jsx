import { useState } from "react";

const TransactionList = () => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Transaction History</h3>
      <p className="text-sm text-gray-600">
        List of all wallet transactions by users.
      </p>
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

  const tabs = [
    { key: "transactions", label: "Transactions" },
    { key: "funds", label: "Fund Operations" },
  ];

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Wallets & Transactions</h2>

      <div className="flex gap-4 border-b mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`pb-2 border-b-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-blue-600"
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "transactions" && <TransactionList />}
        {activeTab === "funds" && <FundOperations />}
      </div>
    </div>
  );
};

export default WalletManagement;
