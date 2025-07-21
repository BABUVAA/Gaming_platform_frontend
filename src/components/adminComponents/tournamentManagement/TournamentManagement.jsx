import { useEffect, useMemo, useState } from "react";
import CreateTemplate from "../../myComponents/CreateTemplate";
import { useDispatch, useSelector } from "react-redux";
import { findTournaments } from "../../../store/adminSlice";
import Fuse from "fuse.js";

const ActiveTournaments = () => {
  const getToday = () => new Date().toISOString().split("T")[0];
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [activeTab, setActiveTab] = useState("active"); // "ongoing" | "upcoming" | "completed"
  const dispatch = useDispatch();
  const { tournaments, loading } = useSelector((store) => store.admin);

  useEffect(() => {
    const isValidRange = startDate <= endDate && endDate <= getToday();
    if (startDate && endDate && isValidRange) {
      dispatch(findTournaments({ startDate, endDate, status: activeTab }));
    }
  }, [dispatch, startDate, endDate, activeTab]);

  const filteredTournaments = useMemo(() => {
    if (!searchTerm) return tournaments;

    const fuse = new Fuse(tournaments, {
      keys: [
        "tournamentName",
        "game",
        "mode",
        "map",
        "status",
        "registeredPlayers.profile.username",
        "registeredTeams.createdBy.profile.username",
      ],
      threshold: 0.3,
      includeScore: true,
    });

    return fuse.search(searchTerm).map((result) => result.item);
  }, [searchTerm, tournaments]);

  return (
    <div>
      <h3 className="text-xl font-bold mb-4">Tournament Manager</h3>

      <div className="flex flex-col md:flex-row md:items-end md:gap-4 mb-6">
        {/* Start Date */}
        <div className="flex flex-col w-full md:w-1/4">
          <label className="text-sm font-medium mb-1">Start Date</label>
          <input
            type="date"
            value={startDate}
            max={getToday()}
            onChange={(e) => setStartDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* End Date */}
        <div className="flex flex-col w-full md:w-1/4">
          <label className="text-sm font-medium mb-1">End Date</label>
          <input
            type="date"
            value={endDate}
            max={getToday()}
            min={startDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="border p-2 rounded w-full"
          />
        </div>

        {/* Search Input */}
        <div className="flex flex-col w-full md:flex-1">
          <label className="text-sm font-medium mb-1">Search</label>
          <input
            type="text"
            placeholder="Search tournaments..."
            className="border p-2 rounded w-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-4 border-b">
        {[
          "upcoming",
          "registration_open",
          "active",
          "ongoing",
          "completed",
          "cancelled",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 px-4 font-medium border-b-2 ${
              activeTab === tab
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-blue-500"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tournament List */}
      {loading ? (
        <p className="text-sm text-gray-500">Loading tournaments...</p>
      ) : tournaments.length === 0 ? (
        <p className="text-sm text-gray-500">No tournaments found.</p>
      ) : (
        <div className="space-y-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Game
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Mode
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Map
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Start
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    End
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Prize Pool
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Entry Fee
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Players
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-semibold text-gray-700">
                    Teams
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200 text-sm">
                {filteredTournaments.map((tournament) => (
                  <tr key={tournament._id}>
                    <td className="px-4 py-2">{tournament.tournamentName}</td>
                    <td className="px-4 py-2">{tournament.game}</td>
                    <td className="px-4 py-2">{tournament.mode}</td>
                    <td className="px-4 py-2">{tournament.map || "-"}</td>
                    <td className="px-4 py-2 capitalize">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          tournament.status === "completed"
                            ? "bg-red-100 text-red-600"
                            : tournament.status === "upcoming"
                            ? "bg-yellow-100 text-yellow-600"
                            : "bg-green-100 text-green-600"
                        }`}
                      >
                        {tournament.status}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {new Date(tournament.startDate).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      {tournament.endDate
                        ? new Date(tournament.endDate).toLocaleString()
                        : "-"}
                    </td>
                    <td className="px-4 py-2">₹{tournament.prizePool}</td>
                    <td className="px-4 py-2">₹{tournament.entryFee}</td>
                    <td className="px-4 py-2">
                      {tournament.registeredPlayers?.length || 0}
                    </td>
                    <td className="px-4 py-2">
                      {tournament.registeredTeams?.length || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
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
