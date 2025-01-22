import { useEffect, useState } from "react";
import { states } from "../utils/states";
import { Form } from "react-router-dom";
import { Button, Input } from "../components";
import { formData } from "../utils/utility";
import { useDispatch, useSelector } from "react-redux";
import {
  createClan,
  fetchUserClan,
  leaveClan,
  searchClan,
} from "../store/clanSlice";
import { FaBookmark, FaShareAlt } from "react-icons/fa";
import { user_profile } from "../store/authSlice";

const Clan = () => {
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);
  const [activeMainTab, setActiveMainTab] = useState(
    profile?.clan ? "myClan" : "createClan"
  );

  const [activeSearchTab, setActiveSearchTab] = useState("searchClans");
  const [activeSocialTab, setActiveSocialTab] = useState("friends");

  useEffect(() => {
    setActiveMainTab(profile?.clan ? "myClan" : "createClan");
  }, [profile]);

  const { globalLoading } = useSelector((store) => store.loading);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    const fetchClan = async () => {
      try {
        if (profile?.clan?._id && userClanData === null) {
          await dispatch(fetchUserClan());
        }
      } catch (error) {
        console.error("Error fetching profile or clan:", error);
      }
    };
    fetchClan();
    setLoading(false);
  }, []);

  if (globalLoading || loading) <LoadingSpinner />;

  return (
    <div className="max-w-5xl mx-auto p-2 bg-gray-50 rounded-lg  mb-12">
      {/* Main Tabs */}
      <div className="flex justify-between bg-gray-800 text-white rounded-lg shadow-md">
        {[
          {
            id: profile?.clan ? "myClan" : "createClan",
            label: profile?.clan ? "My Clan" : "Create Clan",
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
      <div className="bg-white rounded-lg shadow-md mt-4">
        {activeMainTab === "createClan" && <CreateClan state={states} />}
        {activeMainTab === "myClan" && <MyClan />}
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
        .then(async () => {
          await dispatch(user_profile());
          await dispatch(fetchUserClan());
          alert("clan created successfully");
        });
    } catch (error) {
      console.error(error);
    }
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
  const [activeTab, setActiveTab] = useState("badge"); // State to switch between badge and stats
  const dispatch = useDispatch();
  const handleLeave = async () => {
    await dispatch(leaveClan());
  };

  let clanData = userClanData?.data;

  useEffect(() => {
    clanData = userClanData?.data;
  }, [userClanData]);

  if (!userClanData) {
    return (
      <div className="p-6 text-gray-600">
        <p>You are not part of any clan yet.</p>
      </div>
    );
  }

  return (
    <div className=" max-w-7xl mx-auto bg-gray-50">
      <div className="flex flex-col md:flex-row min-h-[360px] shadow-lg rounded-lg overflow-hidden bg-white">
        {/* Tabs Section (Vertical on tablets and larger) */}
        <div className="md:w-1/4 flex md:flex-col gap-1 p-1 bg-gray-200 rounded-lg md:rounded-none md:shadow-md">
          <button
            className={`flex items-center justify-center p-4 w-full transition-all duration-300 rounded-lg ${
              activeTab === "badge"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-blue-100"
            }`}
            onClick={() => setActiveTab("badge")}
          >
            <img
              src="/clan-badge.png" // Clan Badge
              alt="Clan Badge"
              className="w-12 h-12 object-contain"
            />
          </button>
          <button
            className={`flex items-center justify-center p-4 w-full transition-all duration-300 rounded-lg ${
              activeTab === "stats"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-blue-100"
            }`}
            onClick={() => setActiveTab("stats")}
          >
            <img
              src="/bar-chart.png" // Placeholder for statistics image
              alt="Clan Statistics"
              className="w-12 h-12 object-contain"
            />
          </button>
        </div>
        {/* Content Section (Bio and Details) */}
        <div className="md:w-3/4 py-6 px-6">
          {/* Clan Info */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-semibold text-gray-800">
                {clanData?.clanName}
              </h2>
              <p className="text-xl text-gray-500">{clanData?.clanTag}</p>
            </div>
            <div className="flex items-center space-x-4">
              <FaBookmark
                size={24}
                className="text-gray-600 hover:text-blue-500 cursor-pointer"
              />
              <FaShareAlt
                size={24}
                className="text-gray-600 hover:text-blue-500 cursor-pointer"
              />
            </div>
          </div>

          {/* First Tab - Clan Info (Badge Tab) */}
          {activeTab === "badge" && (
            <div className="bg-white rounded-lg">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Clan Bio */}
                <div className="md:w-3/4 text-gray-700">
                  <p className="text-lg">{clanData?.bio}</p>
                </div>
              </div>

              {/* Clan Details */}
              <div className="mt-6 border-t pt-6 space-y-4">
                <p>
                  <span className="font-semibold text-gray-600">Location:</span>{" "}
                  {clanData?.location}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">Leader:</span>{" "}
                  {clanData?.leader?.playerName}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">Members:</span>{" "}
                  {clanData?.members?.length}
                </p>
                <p>
                  <span className="font-semibold text-gray-600">
                    Created At:
                  </span>{" "}
                  {new Date(clanData?.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Second Tab - Clan Statistics */}
          {activeTab === "stats" && (
            <div className="bg-white rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="mt-6 border-t pt-6 space-y-4">
                  <p>
                    <span className="font-semibold text-gray-600">
                      Wars Won:
                    </span>{" "}
                    {clanData?.stats?.warsWon}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-600">
                      War Win Streak:
                    </span>{" "}
                    {clanData?.stats?.warWinStreak}
                  </p>
                  <p>
                    <span className="font-semibold text-gray-600">
                      War Frequency:
                    </span>{" "}
                    {clanData?.stats?.warFrequency}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-1 w-full justify-around md:justify-start space-x-4 my-2">
        <button className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition">
          Edit
        </button>
        <button className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
          War Log
        </button>
        <button className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition">
          Send Mail
        </button>
        <button
          onClick={handleLeave}
          className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
        >
          Leave
        </button>
      </div>

      {/* Member List Section */}
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4 border-b">
          Clan Members
        </h3>
        <ul className="space-y-4">
          {clanData?.members?.map((member, index) => (
            <li
              key={index}
              className="flex justify-between items-center hover:bg-slate-300"
            >
              <div>
                <span className="text-lg font-semibold">
                  {member.clanMemberName}
                </span>
                <p className="text-gray-600">{member.role}</p>
              </div>
              <div>
                <button className="text-blue-500 hover:underline">
                  Profile
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

const SearchClan = ({ activeTab, setActiveTab }) => (
  <div className="p-6">
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

const SearchClans = () => {
  const { searchClanData } = useSelector((store) => store.clan);
  const [input, setInput] = useState("");
  const dispatch = useDispatch();
  console.log(searchClanData);
  const handleSearch = () => {
    try {
      dispatch(searchClan({ clanTag: input }));
    } catch (error) {}
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 items-center p-6">
        <Input
          type="text"
          name="searchClan"
          label="Search Clan"
          placeholder="Enter Clan Tag #ABCD1234"
          onChange={(e) => {
            setInput(e.target.value);
          }}
        />
        <Button variant="success" size="xs" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {searchClanData && (
        <div className="mt-4 p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <div className="border rounded-lg p-4 flex flex-col items-center bg-white shadow-lg hover:shadow-xl transition-shadow duration-300">
            <img
              src={`/${searchClanData?.data?.badge}`} // Assuming `badge` is a URL or image path
              alt="Clan Badge"
              className="w-24 h-24 rounded-full object-cover mb-4"
            />
            <h4 className="text-xl font-semibold text-center">
              {searchClanData?.data?.clanName}
            </h4>
            <p className="text-sm text-center text-gray-600">
              {searchClanData?.data?.clanTag}
            </p>
            <p className="text-sm text-center text-gray-500">
              {searchClanData?.data?.stats?.type}
            </p>
            <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300">
              View Clan
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const BookmarkedClans = () => (
  <div className="p-6">
    <h2 className="text-lg font-bold mb-4">Bookmarked Clans</h2>
    <p>No bookmarked clans yet.</p>
  </div>
);

const Social = ({ activeTab, setActiveTab }) => (
  <div className="p-6">
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
