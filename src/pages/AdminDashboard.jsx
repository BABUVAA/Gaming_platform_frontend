// Full layout refactor for Admin Dashboard with sidebar navigation
import { useState, useEffect } from "react";
import { useSocket } from "../context/socketContext";
import {
  RewardManagement,
  TournamentManagement,
  UserManagement,
  WalletManagement,
} from "../components";

const AdminDashboard = () => {
  const { socket } = useSocket();
  const [activeSection, setActiveSection] = useState("dashboard");

  const menu = [
    { label: "Dashboard", key: "dashboard" },
    { label: "Users", key: "users" },
    { label: "Wallets & Transactions", key: "wallets" },
    { label: "Tournaments", key: "tournaments" },
    { label: "Rewards", key: "rewards" },
  ];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col py-6 px-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Admin Panel</h2>
        <nav className="space-y-2">
          {menu.map((item) => (
            <button
              key={item.key}
              className={`w-full text-left px-4 py-2 rounded transition-all hover:bg-gray-700 ${
                activeSection === item.key ? "bg-blue-600" : ""
              }`}
              onClick={() => setActiveSection(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-auto">
        {/* {activeSection === "dashboard" && <DashboardOverview />}
         */}
        {activeSection === "users" && <UserManagement />}
        {activeSection === "wallets" && <WalletManagement />}
        {activeSection === "tournaments" && (
          <TournamentManagement socket={socket} />
        )}
        {activeSection === "rewards" && <RewardManagement />}
      </main>
    </div>
  );
};

export default AdminDashboard;
