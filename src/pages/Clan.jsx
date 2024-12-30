import React, { useState } from "react";
import "tailwindcss/tailwind.css";

const Clan = () => {
  const [activeMainTab, setActiveMainTab] = useState("createClan"); // Default: "createClan" or "myClan"
  const [activeSearchTab, setActiveSearchTab] = useState("searchClans");
  const [activeSocialTab, setActiveSocialTab] = useState("friends");
  const isInClan = false; // Replace with actual logic to check if the player is in a clan.

  const handleMainTabChange = (tab) => setActiveMainTab(tab);
  const handleSearchTabChange = (tab) => setActiveSearchTab(tab);
  const handleSocialTabChange = (tab) => setActiveSocialTab(tab);

  return (
    <div className="max-w-5xl mx-auto p-4">
      {/* Main Tabs */}
      <div className="flex justify-between bg-gray-800 text-white rounded-t-lg">
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
            className={`flex-1 p-3 text-center font-bold ${
              activeMainTab === tab.id ? "bg-gray-700" : "hover:bg-gray-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-gray-100 p-6 rounded-b-lg shadow-md">
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
    <h2 className="text-xl font-bold mb-4">Create Clan</h2>
    <form className="bg-white p-4 rounded-lg shadow">
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Clan Name</label>
        <input type="text" className="w-full p-2 border rounded" />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Description</label>
        <textarea className="w-full p-2 border rounded"></textarea>
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Clan Type</label>
        <select className="w-full p-2 border rounded">
          <option>Anyone Can Join</option>
          <option>Invite Only</option>
          <option>Closed</option>
        </select>
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">
          Minimum Level to Join
        </label>
        <input type="number" className="w-full p-2 border rounded" />
      </div>
      <div className="mb-4">
        <label className="block mb-1 text-gray-700">Location</label>
        <select className="w-full p-2 border rounded">
          <option>Delhi</option>
          <option>Maharashtra</option>
          <option>Kerala</option>
        </select>
      </div>
      <button className="bg-green-500 text-white px-4 py-2 rounded">
        Create Clan
      </button>
    </form>
  </div>
);

const MyClan = () => (
  <div>
    <h2 className="text-xl font-bold mb-4">My Clan</h2>
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-semibold">Clan Name</h3>
      <p>#CLAN_TAG</p>
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
          className={`px-4 py-2 font-semibold ${
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
      className="w-full p-2 border rounded mb-4"
    />
    <p>Filters go here...</p>
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
          className={`px-4 py-2 font-semibold ${
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
