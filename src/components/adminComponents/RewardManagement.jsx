import { useState } from "react";

const RewardDistribution = () => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Distribute Rewards</h3>
      <p className="text-sm text-gray-600">
        Manually distribute or review automatic rewards.
      </p>
    </div>
  );
};

const RewardHistory = () => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Reward History</h3>
      <p className="text-sm text-gray-600">
        Review past reward distributions and logs.
      </p>
    </div>
  );
};

const RewardManagement = () => {
  const [activeTab, setActiveTab] = useState("distribution");

  const tabs = [
    { key: "distribution", label: "Distribute" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Reward Management</h2>

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
        {activeTab === "distribution" && <RewardDistribution />}
        {activeTab === "history" && <RewardHistory />}
      </div>
    </div>
  );
};

export default RewardManagement;
