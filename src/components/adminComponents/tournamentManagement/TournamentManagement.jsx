import { useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { useDispatch, useSelector } from "react-redux";
import CreateTemplate from "../../myComponents/CreateTemplate";
import { findTournaments } from "../../../store/adminSlice";

const getToday = () => new Date().toISOString().split("T")[0];

const statusPill = {
  completed: "bg-rose-500/15 text-rose-200",
  upcoming: "bg-amber-500/15 text-amber-200",
  active: "bg-emerald-500/15 text-emerald-300",
  registration_open: "bg-cyan-500/15 text-cyan-200",
  ongoing: "bg-violet-500/15 text-violet-200",
  cancelled: "bg-slate-700 text-slate-200",
};

const ActiveTournaments = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(getToday());
  const [endDate, setEndDate] = useState(getToday());
  const [activeTab, setActiveTab] = useState("active");
  const dispatch = useDispatch();
  const { tournaments = [], isLoading } = useSelector((store) => store.admin);

  useEffect(() => {
    const isValidRange = startDate <= endDate && endDate <= getToday();
    if (startDate && endDate && isValidRange) {
      dispatch(findTournaments({ startDate, endDate, status: activeTab }));
    }
  }, [activeTab, dispatch, endDate, startDate]);

  const filteredTournaments = useMemo(() => {
    if (!searchTerm.trim()) return tournaments;

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
    });

    return fuse.search(searchTerm).map((result) => result.item);
  }, [searchTerm, tournaments]);

  return (
    <div className="space-y-6">
      <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5">
        <h3 className="text-xl font-black text-white">Tournament Manager</h3>
        <div className="mt-5 flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="flex flex-col xl:w-1/4">
            <label className="mb-1 text-sm font-medium text-slate-300">Start Date</label>
            <input
              type="date"
              value={startDate}
              max={getToday()}
              onChange={(event) => setStartDate(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100"
            />
          </div>

          <div className="flex flex-col xl:w-1/4">
            <label className="mb-1 text-sm font-medium text-slate-300">End Date</label>
            <input
              type="date"
              value={endDate}
              max={getToday()}
              min={startDate}
              onChange={(event) => setEndDate(event.target.value)}
              className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100"
            />
          </div>

          <div className="flex flex-col xl:flex-1">
            <label className="mb-1 text-sm font-medium text-slate-300">Search</label>
            <input
              type="text"
              placeholder="Search tournaments..."
              className="rounded-2xl border border-slate-800 bg-slate-950 p-3 text-sm text-slate-100"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
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
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              {tab.replaceAll("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5 text-sm text-slate-400">
          Loading tournaments...
        </div>
      ) : filteredTournaments.length === 0 ? (
        <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5 text-sm text-slate-400">
          No tournaments found for this range and status.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[24px] border border-slate-800">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-950 text-left text-xs uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Game</th>
                <th className="px-4 py-3">Mode</th>
                <th className="px-4 py-3">Map</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Start</th>
                <th className="px-4 py-3">End</th>
                <th className="px-4 py-3">Prize Pool</th>
                <th className="px-4 py-3">Entry Fee</th>
                <th className="px-4 py-3">Players</th>
                <th className="px-4 py-3">Teams</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredTournaments.map((tournament) => (
                <tr key={tournament._id} className="bg-[#020617]">
                  <td className="px-4 py-3 font-semibold text-white">
                    {tournament.tournamentName}
                  </td>
                  <td className="px-4 py-3 text-slate-300">{tournament.game}</td>
                  <td className="px-4 py-3 text-slate-300">{tournament.mode}</td>
                  <td className="px-4 py-3 text-slate-400">{tournament.map || "-"}</td>
                  <td className="px-4 py-3 capitalize">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] ${
                        statusPill[tournament.status] || "bg-slate-800 text-slate-300"
                      }`}
                    >
                      {tournament.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(tournament.startDate).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {tournament.endDate
                      ? new Date(tournament.endDate).toLocaleString()
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-emerald-300">
                    Rs {tournament.prizePool}
                  </td>
                  <td className="px-4 py-3 text-amber-200">
                    Rs {tournament.entryFee}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {tournament.registeredPlayers?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-slate-300">
                    {tournament.registeredTeams?.length || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const MonitorTools = () => {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5">
      <h3 className="text-xl font-black text-white">Monitoring Tools</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Real-time moderation monitors and tournament incident tooling can sit here
        once the live operator controls are ready.
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
    <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
            Tournaments
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Tournament Management
          </h2>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "create" && <CreateTemplate socket={socket} />}
        {activeTab === "active" && <ActiveTournaments socket={socket} />}
        {activeTab === "monitor" && <MonitorTools socket={socket} />}
      </div>
    </div>
  );
};

export default TournamentManagement;
