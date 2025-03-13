import { useState } from "react";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("dashboard");

  const services = [
    { name: "Dashboard", key: "dashboard" },
    { name: "Tournaments", key: "tournaments" },
    { name: "Users", key: "users" },
    { name: "Games", key: "games" },
    { name: "Rewards", key: "rewards" },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      {/* Service Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6 w-full max-w-lg">
        {services.map((service) => (
          <div
            key={service.key}
            className={`rounded-lg p-4 text-center shadow-md cursor-pointer transition-transform transform ${
              activeSection === service.key
                ? "bg-blue-500 text-white scale-105"
                : "bg-white text-gray-900 hover:bg-blue-100"
            }`}
            onClick={() => setActiveSection(service.key)}
          >
            <h2 className="text-lg font-semibold">{service.name}</h2>
          </div>
        ))}
      </div>

      {/* Render Active Section */}
      <div className="w-full max-w-4xl p-4 sm:p-6 bg-white rounded-lg shadow-md">
        {activeSection === "dashboard" && <Dashboard />}
        {activeSection === "tournaments" && <TournamentManagement />}
        {activeSection === "users" && <UserManagement />}
        {activeSection === "games" && <GameManagement />}
        {activeSection === "rewards" && <RewardManagement />}
      </div>
    </div>
  );
};

/* Components for each service */
const Dashboard = () => (
  <p className="text-center">Welcome to the Admin Dashboard!</p>
);

const TournamentManagement = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">Tournament Management</h2>
    <button className="bg-blue-500 text-white px-4 py-2 rounded">
      Create Tournament
    </button>
  </div>
);

const UserManagement = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">User Management</h2>
    <p>Manage users here...</p>
  </div>
);

const GameManagement = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">Game Management</h2>
    <p>Manage games here...</p>
  </div>
);

const RewardManagement = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">Reward Distribution</h2>
    <p>Distribute and track rewards...</p>
  </div>
);

export default AdminDashboard;
