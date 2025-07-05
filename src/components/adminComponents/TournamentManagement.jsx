import { useState } from "react";
import CreateTemplate from "../myComponents/CreateTemplate";

const ActiveTournaments = ({ socket }) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Active Tournaments</h3>
      <p className="text-sm text-gray-600">
        List and control active tournaments here...
      </p>
    </div>
  );
};

const MonitorTools = ({ socket }) => {
  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Monitoring Tools</h3>
      <p className="text-sm text-gray-600">
        Real-time monitoring and management tools here...
      </p>
    </div>
  );
};

const TournamentManagement = ({ socket }) => {
  const [activeTab, setActiveTab] = useState("create");

  const tabs = [
    { key: "create", label: "Create Template" },
    { key: "active", label: "Active Tournaments" },
    { key: "monitor", label: "Monitoring Tools" },
  ];

  return (
    <div className="bg-white p-6 rounded shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Tournament Management</h2>

      {/* Tab Navigation */}
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

      {/* Tab Content */}
      <div>
        {activeTab === "create" && <CreateTemplate socket={socket} />}
        {activeTab === "active" && <ActiveTournaments socket={socket} />}
        {activeTab === "monitor" && <MonitorTools socket={socket} />}
      </div>
    </div>
  );
};

export default TournamentManagement;
