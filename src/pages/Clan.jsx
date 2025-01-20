import { useState } from "react";
import { states } from "../utils/states";
import { Form } from "react-router-dom";
import { Button, Input } from "../components";
import { formData } from "../utils/utility";
import { useDispatch, useSelector } from "react-redux";
import { createClan } from "../store/clanSlice";

const Clan = () => {
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);

  const [activeMainTab, setActiveMainTab] = useState(
    profile.clan ? "myClan" : "createClan"
  );
  const [activeSearchTab, setActiveSearchTab] = useState("searchClans");
  const [activeSocialTab, setActiveSocialTab] = useState("friends");

  return (
    <div className="max-w-5xl mx-auto p-6 bg-gray-50 rounded-lg shadow-lg">
      {/* Main Tabs */}
      <div className="flex justify-between bg-gray-800 text-white rounded-lg shadow-md">
        {[
          {
            id: profile.clan ? "myClan" : "createClan",
            label: profile.clan ? "My Clan" : "Create Clan",
          },
          { id: "searchClan", label: "Search Clan" },
          { id: "social", label: "Social" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMainTab(tab.id)}
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
        {activeMainTab === "createClan" && <CreateClan state={states} />}
        {activeMainTab === "myClan" && <MyClan clan={userClanData} />}
        {activeMainTab === "searchClan" && (
          <SearchClan
            activeTab={activeSearchTab}
            setActiveTab={setActiveSearchTab}
          />
        )}
        {activeMainTab === "social" && (
          <Social
            activeTab={activeSocialTab}
            setActiveTab={setActiveSocialTab}
          />
        )}
      </div>
    </div>
  );
};

const CreateClan = ({ state }) => {
  const dispatch = useDispatch();
  const handleSubmit = async (event) => {
    event.preventDefault();
    const clanData = formData(event);
    try {
      const response = await dispatch(createClan(clanData))
        .unwrap()
        .then(() => {
          alert("clan created successfully");
        });
    } catch (error) {}
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Create Clan</h2>
      <Form
        onSubmit={handleSubmit}
        method="POST"
        className="bg-gray-100 p-6 rounded-lg shadow"
      >
        <div className="mb-4">
          <Input
            type="text"
            name="clanName"
            placeholder="Enter your clan name"
            label="Clan Name"
            required
            className="text-gray-700"
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Description</label>
          <textarea
            name="description"
            placeholder="Enter clan description"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>
        <div className="mb-4">
          <label className="block mb-1 text-gray-700">Clan Type</label>
          <select
            name="clanType"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option>Anyone Can Join</option>
            <option>Invite Only</option>
            <option>Closed</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block mb-1 text-gray-700">State</label>
          <select
            name="location"
            className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>
              Select State
            </option>
            {state.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </div>
        <Button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
        >
          {" "}
          Create Clan
        </Button>
      </Form>
    </div>
  );
};

const MyClan = () => {
  const { userClanData } = useSelector((store) => store.clan);

  if (!userClanData) {
    return (
      <div className="p-6 text-gray-600">
        <p>You are not part of any clan yet.</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      {/* Clan Header */}
      <div className="flex items-center space-x-4 bg-gray-100 p-6 rounded-lg shadow">
        {/* Replace the placeholder with dynamic badge when available */}
        <img
          src={`/assets/badges/${userClanData.badge || "default.png"}`} // Dynamic badge image
          alt="Clan Badge"
          className="w-16 h-16"
        />
        <div>
          <h2 className="text-2xl font-bold">{userClanData.clanName}</h2>
          <p className="text-gray-500 font-medium">{userClanData.tag}</p>
          <p className="text-gray-600">{userClanData.bio}</p>
        </div>
      </div>

      {/* Clan Details */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Clan Details</h3>
        <p>
          <span className="font-medium">Location:</span> {userClanData.location}
        </p>
        <p>
          <span className="font-medium">Leader:</span>{" "}
          {userClanData.leader?.playerName}
        </p>
        <p>
          <span className="font-medium">Created At:</span>{" "}
          {new Date(userClanData.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Clan Stats */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Clan Stats</h3>
        <p>
          <span className="font-medium">League:</span>{" "}
          {userClanData.stats?.league}
        </p>
        <p>
          <span className="font-medium">Type:</span> {userClanData.stats?.type}
        </p>
        <p>
          <span className="font-medium">Max Members:</span>{" "}
          {userClanData.stats?.maxMembers}
        </p>
        <p>
          <span className="font-medium">Required Level:</span>{" "}
          {userClanData.stats?.requiredLevel}
        </p>
        <p>
          <span className="font-medium">War Frequency:</span>{" "}
          {userClanData.stats?.warFrequency}
        </p>
      </div>

      {/* Clan Members */}
      <div className="mt-6 bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-bold mb-4">Members</h3>
        <ul>
          {userClanData.members?.map((member) => (
            <li
              key={member.user}
              className="flex items-center justify-between py-2 border-b"
            >
              <span>
                {member.playerName} ({member.playerTag})
              </span>
              <span className="text-gray-500 text-sm">{member.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SearchClan = ({ activeTab, setActiveTab }) => (
  <div>
    <TabNavigation
      tabs={[
        { id: "searchClans", label: "Search Clans" },
        { id: "bookmarkedClans", label: "Bookmarked Clans" },
      ]}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
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
    <TabNavigation
      tabs={[
        { id: "friends", label: "Friends" },
        { id: "friendRequests", label: "Friend Requests" },
        { id: "searchPlayers", label: "Search Players" },
      ]}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    />
    {activeTab === "friends" && <Friends />}
    {activeTab === "friendRequests" && <FriendRequests />}
    {activeTab === "searchPlayers" && <SearchPlayers />}
  </div>
);

const Friends = () => <p>No friends yet.</p>;
const FriendRequests = () => <p>No friend requests yet.</p>;
const SearchPlayers = () => <p>Search players by their tag.</p>;

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => (
  <div className="border-b mb-4">
    {tabs.map((tab) => (
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
);

export default Clan;
