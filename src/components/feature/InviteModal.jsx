import React, { useState } from "react";
import { useSelector } from "react-redux";
import { useSocket } from "../../context/socketContext";

const InviteModal = ({ isOpen, onClose, tournamentId, teamSize }) => {
  const [activeTab, setActiveTab] = useState("clan");
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { socket } = useSocket();

  console.log(teamSize);
  const clanMembers = useSelector(
    (store) => store.clan.userClanData.data.members || []
  );
  const friends = useSelector((store) => store.auth.profile.profile || []);
  // const teams = useSelector((store) => store.team.myTeams || []); // update according to your store

  if (!isOpen) return null;

  const handleSelect = (userId) => {
    const isAlreadySelected = selectedUsers.includes(userId);
    if (!isAlreadySelected && selectedUsers.length >= teamSize) {
      alert(`You can only select up to ${teamSize} players.`);
      return;
    }

    setSelectedUsers((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  };

  const handleJoin = () => {
    if (selectedUsers.length === 0) return alert("Select at least one user!");
    if (selectedUsers.length !== teamSize)
      return alert(`Select atleast or max ${teamSize} players`);

    const payload = {
      tournamentId,
      members: selectedUsers,
    };
    // Emit socket event
    socket.emit("join_tournament", payload);
    console.log("Sent join_tournament with", payload);
    onClose();
  };

  const renderList = (list, type) => (
    <ul className="space-y-2">
      {list.length === 0 ? (
        <p className="text-sm text-gray-500">No {type} found.</p>
      ) : (
        list.map((item) => {
          const id = item.user || item._id || item.id;
          const name =
            item.clanMemberName ||
            item.profile.username ||
            item.fullName ||
            "Unknown";
          const isSelected = selectedUsers.includes(id);

          return (
            <li
              key={id}
              onClick={() => handleSelect(id)}
              className={`cursor-pointer p-2 rounded-md border text-gray-800 font-medium ${
                isSelected
                  ? "bg-indigo-100 border-indigo-500"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {name}
            </li>
          );
        })
      )}
    </ul>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[500]">
      <div className="bg-white w-full max-w-md p-6 rounded-lg shadow-lg relative">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-2 right-3 text-gray-600 hover:text-gray-800 text-xl"
        >
          ✖
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">
          Join Tournament
        </h2>

        {/* Tabs */}
        <div className="flex justify-between mb-4 border-b">
          {["clan", "friends", "teams"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 text-center py-2 capitalize ${
                activeTab === tab
                  ? "border-b-2 border-indigo-500 text-indigo-600 font-semibold"
                  : "text-gray-500"
              }`}
            >
              {tab === "clan"
                ? "Clan Members"
                : tab === "friends"
                ? "Friend List"
                : "My Teams"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="h-48 overflow-y-auto">
          {activeTab === "clan" && renderList(clanMembers, "clan members")}
          {activeTab === "friends" && renderList(friends, "friends")}
          {/* {activeTab === "teams" && renderList(teams, "teams")} */}
        </div>

        {/* Selected Count */}
        <div className="text-sm text-gray-500 mt-3">
          Selected: {selectedUsers.length}
        </div>

        {/* Join Button */}
        <button
          onClick={handleJoin}
          className="w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 mt-4 rounded-lg"
        >
          Confirm & Join
        </button>
      </div>
    </div>
  );
};

export default InviteModal;
