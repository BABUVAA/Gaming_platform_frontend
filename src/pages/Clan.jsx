import React, { useState } from "react";
import "tailwindcss/tailwind.css";

const Clan = () => {
  const [activeTab, setActiveTab] = useState("myProfile");

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Tabs */}
      <div className="flex justify-between bg-gray-800 text-white rounded-t-lg">
        {[
          { id: "myProfile", label: "My Profile" },
          { id: "clans", label: "Clans" },
          { id: "social", label: "Social" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex-1 p-3 text-center font-bold ${
              activeTab === tab.id ? "bg-gray-700" : "hover:bg-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-100 p-6 rounded-b-lg shadow-md">
        {activeTab === "myProfile" && <MyProfile />}
        {activeTab === "clans" && <Clans />}
        {activeTab === "social" && <Social />}
      </div>
    </div>
  );
};

const MyProfile = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">Player Profile</h2>
    <div className="flex items-center justify-between bg-white p-4 rounded-lg shadow">
      <div>
        <h3 className="text-2xl font-semibold">Player Name</h3>
        <p className="text-gray-500">#PLAYER_TAG</p>
        <div className="mt-2">
          <span className="mr-4">Level: 257</span>
          <span>League: Legend</span>
        </div>
      </div>
      <div>
        <button className="bg-green-500 text-white px-4 py-2 rounded">
          Add Friend
        </button>
      </div>
    </div>
  </div>
);

const Clans = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">Search Clans</h2>
    <div className="bg-white p-4 rounded-lg shadow">
      <input
        type="text"
        placeholder="Search by Clan Name or Tag"
        className="w-full p-2 border rounded mb-4"
      />
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Search
      </button>
      <div className="mt-4">
        <h3 className="text-lg font-semibold">Advanced Filters</h3>
        <div className="grid grid-cols-2 gap-4 mt-2">
          <div>
            <label className="block mb-1 text-gray-700">War Frequency</label>
            <select className="w-full p-2 border rounded">
              <option>Any</option>
              <option>Always</option>
              <option>Never</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 text-gray-700">Clan Location</label>
            <select className="w-full p-2 border rounded">
              <option>Any</option>
              <option>North America</option>
              <option>Europe</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const Social = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">Friends</h2>
    <div className="bg-white p-4 rounded-lg shadow">
      <p>No friends yet.</p>
    </div>
  </div>
);

export default Clan;
