import { useState } from "react";
import { useSocket } from "../context/socketContext";

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

const TournamentManagement = () => {
  const { socket } = useSocket();

  const [tournamentData, setTournamentData] = useState({
    tournamentName: "",
    game: "",
    startDate: "",
    endDate: "",
    entryFee: "",
    prizePool: "",
    mode: "",
    maxParticipants: "",
    status: "upcoming",
    category: "none",
    imageUrl: "",
    isFeatured: false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setTournamentData((prevData) => ({
      ...prevData,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      !tournamentData.tournamentName ||
      !tournamentData.game ||
      !tournamentData.startDate ||
      !tournamentData.endDate
    ) {
      alert("Please fill all required fields!");
      return;
    }

    // Emit to WebSocket
    socket.emit("newTournament", tournamentData);
    console.log("New Tournament Sent:", tournamentData);

    // Reset Form
    setTournamentData({
      tournamentName: "",
      game: "",
      startDate: "",
      endDate: "",
      entryFee: "",
      prizePool: "",
      mode: "",
      maxParticipants: "",
      status: "upcoming",
      category: "none",
      imageUrl: "",
      isFeatured: false,
    });
  };

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg max-w-lg mx-auto mt-10">
      <h2 className="text-2xl font-semibold mb-4 text-center">
        Create New Tournament
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tournament Name */}
        <div>
          <label className="block text-sm font-medium">Tournament Name</label>
          <input
            type="text"
            name="tournamentName"
            value={tournamentData.tournamentName}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>

        {/* Game Selection */}
        <div>
          <label className="block text-sm font-medium">Game</label>
          <select
            name="game"
            value={tournamentData.game}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          >
            <option value="">Select Game</option>
            <option value="bgmi">BGMI</option>
            <option value="coc">COC</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label className="block text-sm font-medium">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={tournamentData.startDate}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="block text-sm font-medium">End Date</label>
          <input
            type="date"
            name="endDate"
            value={tournamentData.endDate}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>

        {/* Entry Fee */}
        <div>
          <label className="block text-sm font-medium">Entry Fee</label>
          <input
            type="number"
            name="entryFee"
            value={tournamentData.entryFee}
            onChange={handleChange}
            placeholder="Optional"
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>

        {/* Prize Pool */}
        <div>
          <label className="block text-sm font-medium">Prize Pool</label>
          <input
            type="number"
            name="prizePool"
            value={tournamentData.prizePool}
            onChange={handleChange}
            placeholder="Optional"
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>

        {/* Mode Selection */}
        <div>
          <label className="block text-sm font-medium">Mode</label>
          <select
            name="mode"
            value={tournamentData.mode}
            onChange={handleChange}
            required
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          >
            <option value="">Select Mode</option>
            <option value="solo">Solo</option>
            <option value="duo">Duo</option>
            <option value="squad">Squad</option>
            <option value="5v5">5v5</option>
            <option value="10v10">10v10</option>
            <option value="15v15">15v15</option>
            <option value="20v20">20v20</option>
          </select>
        </div>

        {/** Participant */}
        <div>
          <label className="block text-sm font-medium">Participants</label>
          <input
            type="number"
            name="maxParticipants"
            value={tournamentData.maxParticipants}
            onChange={handleChange}
            placeholder="Optional"
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>
        {/* Tournament Status */}
        <div>
          <label className="block text-sm font-medium">Status</label>
          <select
            name="status"
            value={tournamentData.status}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          >
            <option value="upcoming">Upcoming</option>
            <option value="registration_open">Registration Open</option>
            <option value="active">Active</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Category Selection */}
        <div>
          <label className="block text-sm font-medium">Category</label>
          <select
            name="category"
            value={tournamentData.category}
            onChange={handleChange}
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          >
            <option value="none">None</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Tournament Image */}
        <div>
          <label className="block text-sm font-medium">
            Tournament Image URL
          </label>
          <input
            type="text"
            name="imageUrl"
            value={tournamentData.imageUrl}
            onChange={handleChange}
            placeholder="Enter image URL"
            className="w-full p-2 bg-gray-800 border border-gray-600 rounded"
          />
        </div>

        {/* Featured Tournament */}
        <div className="flex items-center">
          <input
            type="checkbox"
            name="isFeatured"
            checked={tournamentData.isFeatured}
            onChange={handleChange}
            className="mr-2"
          />
          <label className="text-sm font-medium">Mark as Featured</label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 transition-all py-2 rounded text-lg font-semibold"
        >
          Create Tournament
        </button>
      </form>
    </div>
  );
};

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
