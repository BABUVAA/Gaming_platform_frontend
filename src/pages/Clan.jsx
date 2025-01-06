import React, { useState } from "react";
import "tailwindcss/tailwind.css";

const Clan = () => {
  const [activeMainTab, setActiveMainTab] = useState("createClan");
  const [activeSearchTab, setActiveSearchTab] = useState("searchClans");
  const [activeSocialTab, setActiveSocialTab] = useState("friends");
  const isInClan = false; // Replace with actual logic to check if the player is in a clan.

  const handleMainTabChange = (tab) => setActiveMainTab(tab);
  const handleSearchTabChange = (tab) => setActiveSearchTab(tab);
  const handleSocialTabChange = (tab) => setActiveSocialTab(tab);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      {/* Main Tabs */}
      <div className="flex justify-between bg-gray-800 text-white rounded-lg shadow-md">
        {[
          {
            id: isInClan ? "myClan" : "createClan",
            label: isInClan ? "My Clan" : "Create Clan",
          },
          { id: "searchClan", label: "Search Clan" },
          { id: "social", label: "Social" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleMainTabChange(tab.id)}
            className={`flex-1 p-4 text-center font-semibold transition duration-200 ${
              activeMainTab === tab.id ? "bg-gray-700" : "hover:bg-gray-600"
            } rounded-lg`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white p-6 rounded-lg shadow-md mt-4">
        {activeMainTab === "createClan" && <CreateClan />}
        {activeMainTab === "myClan" && <MyClan />}
        {activeMainTab === "searchClan" && (
          <SearchClan
            activeTab={activeSearchTab}
            setActiveTab={handleSearchTabChange}
          />
        )}
        {activeMainTab === "social" && (
          <Social
            activeTab={activeSocialTab}
            setActiveTab={handleSocialTabChange}
          />
        )}
      </div>
    </div>
  );
};

const CreateClan = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">Create Clan</h2>
    <form className="bg-gray-100 p-6 rounded-lg shadow">
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Clan Name</label>
        <input
          type="text"
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Description</label>
        <textarea className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Clan Type</label>
        <select className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Anyone Can Join</option>
          <option>Invite Only</option>
          <option>Closed</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">
          Minimum Level to Join
        </label>
        <input
          type="number"
          className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Location</label>
        <select className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>Delhi</option>
          <option>Maharashtra</option>
          <option>Kerala</option>
        </select>
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-200">
        Create Clan
      </button>
    </form>
  </div>
);

const MyClan = () => (
  <div>
    <h2 className="text-2xl font-bold mb-4">My Clan</h2>
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Clan Name</h3>
      <p className="text-xl font-bold">#CLAN_TAG</p>
      <p className="text-gray-600">Description: Amazing Clan!</p>
    </div>
  </div>
);

const SearchClan = ({ activeTab, setActiveTab }) => (
  <div>
    <div className="border-b mb-4">
      {[
        { id: "searchClans", label: "Search Clans" },
        { id: "bookmarkedClans", label: "Bookmarked Clans" },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 font-semibold transition duration-200 ${
            activeTab === tab.id
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-blue-500"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
    {activeTab === "searchClans" && <SearchClans />}
    {activeTab === "bookmarkedClans" && <BookmarkedClans />}
  </div>
);

const SearchClans = () => (
  <div>
    <h2 className="text-lg font-bold mb-4">Search Clans</h2>
    <input
      type="text"
      placeholder="Search by Clan Name or Tag"
      className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
    <p className="text-gray-600">Filters go here...</p>
  </div>
);

const BookmarkedClans = () => (
  <div>
    <h2 className="text-lg font-bold mb-4">Bookmarked Clans</h2>
    <p>No bookmarked clans yet.</p>
  </div>
);

const Social = ({ activeTab, setActiveTab }) => (
  <div>
    <div className="border-b mb-4">
      {[
        { id: "friends", label: "Friends" },
        { id: "friendRequests", label: "Friend Requests" },
        { id: "searchPlayers", label: "Search Players" },
      ].map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 font-semibold transition duration-200 ${
            activeTab === tab.id
              ? "border-b-2 border-blue-500 text-blue-500"
              : "text-gray-500 hover:text-blue-500"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
    {activeTab === "friends" && <Friends />}
    {activeTab === "friendRequests" && <FriendRequests />}
    {activeTab === "searchPlayers" && <SearchPlayers />}
  </div>
);

const Friends = () => <p>No friends yet.</p>;
const FriendRequests = () => <p>No friend requests yet.</p>;
const SearchPlayers = () => <p>Search players by their tag.</p>;

export default Clan;
