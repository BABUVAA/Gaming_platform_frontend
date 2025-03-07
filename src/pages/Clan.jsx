import { useEffect, useState } from "react";
import { states } from "../utils/states";
import { Form, useNavigate } from "react-router-dom";
import { Button, Input } from "../components";
import { formData } from "../utils/utility";
import { useDispatch, useSelector } from "react-redux";
import {
  createClan,
  fetchUserClan,
  joinClan,
  leaveClan,
  searchClan,
} from "../store/clanSlice";
import {
  FaBookmark,
  FaShareAlt,
  FaMapMarkerAlt,
  FaCrown,
  FaUsers,
  FaCalendarAlt,
  FaTrophy,
  FaFire,
  FaClock,
  FaEye,
  FaTrash,
  FaSignInAlt,
} from "react-icons/fa";

import { profile_data_update, user_profile } from "../store/authSlice";
import { FaRegBookmark, FaRegCopy } from "react-icons/fa6";

const Clan = () => {
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);
  const { globalLoading } = useSelector((store) => store.loading);
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const [activeMainTab, setActiveMainTab] = useState(
    profile?.clan ? "myClan" : "createClan"
  );
  const [activeSearchTab, setActiveSearchTab] = useState("searchClans");
  const [activeSocialTab, setActiveSocialTab] = useState("friends");

  useEffect(() => {
    setActiveMainTab(profile?.clan ? "myClan" : "createClan");
  }, [profile]);

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
  }, [profile]);

  if (globalLoading || loading) return <LoadingSpinner />;
  else
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
              className={`flex-1 p-1 md:p-2 lg:p-4 text-center font-semibold transition duration-200 ${
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
          {activeMainTab === "myClan" && (
            <MyClan userClanData={userClanData} profile={profile} />
          )}
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

const MyClan = ({ userClanData, profile }) => {
  const [activeTab, setActiveTab] = useState("badge"); // State to switch between badge and stats
  const dispatch = useDispatch();
  const [clanData, setClanData] = useState(null); // Start as null
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    if (userClanData?.data) {
      setClanData(userClanData.data);
    }
  }, [userClanData]);

  useEffect(() => {
    if (profile?.profile?.bookmarkedClans && clanData?._id) {
      const found = profile.profile.bookmarkedClans.some(
        (clan) => String(clan._id) === String(clanData._id)
      );
      setIsBookmarked(found);
    }
  }, [profile, clanData]);
  {
    /** copy feature */
  }
  const [copied, setCopied] = useState(false);
  const copyToClipboard = async () => {
    if (!clanData?.clanTag) return;
    try {
      await navigator.clipboard.writeText(clanData.clanTag);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500); // Reset copied state after 1.5 sec
    } catch (err) {
      console.error("Failed to copy: ", err);
    }
  };

  //Bookmark functionality
  const [loading, setLoading] = useState(false);

  const handleBookmark = async () => {
    if (loading) return;
    setLoading(true);

    try {
      if (isBookmarked) {
        await dispatch(
          profile_data_update({
            action: "remove",
            field: "profile.bookmarkedClans",
            data: clanData._id,
          })
        );
      } else {
        await dispatch(
          profile_data_update({
            action: "add",
            field: "profile.bookmarkedClans",
            data: clanData._id,
          })
        );
      }
      await dispatch(user_profile());
    } catch (error) {
      console.error("Error updating bookmark:", error);
    }
    setLoading(false);
  };

  const handleLeave = async () => {
    try {
      const response = await dispatch(leaveClan());
      await dispatch(user_profile());
    } catch (error) {
      console.error(error);
    }
  };

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
            className={`flex items-center justify-center p-2 md:p-4 w-full transition-all duration-300 rounded-lg ${
              activeTab === "badge"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-blue-100"
            }`}
            onClick={() => setActiveTab("badge")}
          >
            <img
              src="/clan-badge.png" // Clan Badge
              alt="Clan Badge"
              className="w-12 h-6 md:h-12 object-contain"
            />
          </button>
          <button
            className={`flex items-center justify-center p-2 md:p-4 w-full transition-all duration-300 rounded-lg ${
              activeTab === "stats"
                ? "bg-blue-500 text-white"
                : "bg-white text-gray-700 hover:bg-blue-100"
            }`}
            onClick={() => setActiveTab("stats")}
          >
            <img
              src="/bar-chart.png" // Placeholder for statistics image
              alt="Clan Statistics"
              className="w-12 h-6 md:h-12 object-contain"
            />
          </button>
        </div>

        {/* Content Section (Bio and Details) */}
        <div className="md:w-3/4 py-6 px-6">
          {/* Clan Info */}
          <div className=" flex items-center justify-between">
            <div>
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-gray-800">
                {clanData?.clanName}
              </h2>
              <span className="flex gap-2">
                <p className="text-xs sm:text-sm md:text-base text-gray-500">
                  {clanData?.clanTag}
                </p>
                <FaRegCopy
                  className={`cursor-pointer text-gray-500 hover:text-gray-700 ${
                    copied ? "text-green-600" : ""
                  }`}
                  onClick={copyToClipboard}
                  title="Copy to clipboard"
                />
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* Bookmark Button */}
              <button
                onClick={handleBookmark}
                disabled={loading}
                className="relative"
              >
                {isBookmarked ? (
                  <FaBookmark className="text-blue-500 w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 transition-transform transform hover:scale-110" />
                ) : (
                  <FaRegBookmark className="text-gray-600 hover:text-blue-500 cursor-pointer w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 transition-transform transform hover:scale-110" />
                )}
              </button>

              {/* Share Button */}
              <FaShareAlt className="text-gray-600 hover:text-blue-500 cursor-pointer w-6 h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 transition-transform transform hover:scale-110" />
            </div>
          </div>
          {/* First Tab - Clan Info (Badge Tab) */}
          <ClanProfile activeTab={activeTab} clanData={clanData} />
        </div>
      </div>
      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 w-full justify-center md:justify-start my-2">
        <button className="w-full md:w-auto bg-gray-600 text-sm text-white px-3 py-2 rounded-xl shadow-md hover:bg-gray-700 transition-all">
          War Log
        </button>
        <button className="w-full md:w-auto bg-green-600 text-sm text-white px-3 py-2 rounded-xl shadow-md hover:bg-green-700 transition-all">
          Send Mail
        </button>
        <button
          onClick={handleLeave}
          className="w-full md:w-auto bg-red-600 text-sm text-white px-4 py-2 rounded-xl shadow-md hover:bg-red-700 transition-all"
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

const ClanProfile = ({ clanData, activeTab }) => {
  return (
    <div className="bg-white  rounded-lg p-6 md:p-8 transition-all duration-300">
      {/* First Tab - Clan Info (Badge Tab) */}
      {activeTab === "badge" && (
        <div className="space-y-6">
          {/* Clan Bio */}
          <p className="text-gray-800 text-sm sm:text-lg font-medium border-l-4 border-blue-500 pl-4">
            {clanData?.bio}
          </p>

          {/* Clan Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            <div className="flex items-center space-x-3">
              <FaMapMarkerAlt className="text-blue-600 text-sm" />
              <p className="text-sm">
                <span className="font-semibold">Location:</span>{" "}
                {clanData?.location}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <FaCrown className="text-yellow-500 text-sm" />
              <p className="text-sm">
                <span className="font-semibold">Leader:</span>{" "}
                {clanData?.leader?.leaderName}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <FaUsers className="text-green-500 text-sm" />
              <p className="text-sm">
                <span className="font-semibold">Members:</span>{" "}
                {clanData?.members?.length}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <FaCalendarAlt className="text-purple-500 text-sm" />
              <p className="text-sm">
                <span className="font-semibold">Created At:</span>{" "}
                {new Date(clanData?.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Second Tab - Clan Statistics */}
      {activeTab === "stats" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-gray-700">
            <div className="flex items-center space-x-3">
              <FaTrophy className="text-yellow-500 text-sm" />
              <p className="text-sm">
                <span className="font-semibold">Wars Won:</span>{" "}
                {clanData?.stats?.warsWon || 0}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <FaFire className="text-red-500 text-sm" />
              <p className="text-sm">
                <span className="font-semibold">War Win Streak:</span>{" "}
                {clanData?.stats?.warWinStreak || 0}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <FaClock className="text-blue-600 text-sm" />
              <p className="text-sm">
                <span className="font-semibold">War Frequency:</span>{" "}
                {clanData?.stats?.warFrequency}
              </p>
            </div>
          </div>
        </div>
      )}
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
  const { searchClanData, loading, error } = useSelector((store) => store.clan); // Assuming you have a loading state
  const [input, setInput] = useState("");
  const dispatch = useDispatch();

  const handleSearch = async () => {
    try {
      const response = await dispatch(searchClan({ clanTag: input }));
    } catch (error) {
      console.error("Error while searching for clan:", error);
    }
  };

  const handleJoin = async (clanTag) => {
    if (clanTag) {
      try {
        await dispatch(joinClan({ clanTag: clanTag }));
        await dispatch(user_profile());
        await dispatch(fetchUserClan());
      } catch (error) {
        console.error("Error while joining the clan:", error);
      }
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-1 items-center p-6">
        <Input
          type="text"
          name="searchClan"
          label="Search Clan"
          placeholder="Enter Clan Tag #ABCD1234"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />

        <Button variant="success" size="xs" onClick={handleSearch}>
          Search
        </Button>
      </div>

      {loading && <div>Loading...</div>}

      {error && <div className="text-red-500">{error}</div>}

      {searchClanData ? (
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
            <div className="flex justify-between">
              <button
                onClick={() => handleJoin(searchClanData.data.clanTag)}
                className="mt-4 px-4 py-2 bg-green-400 text-white rounded-lg hover:bg-green-600 transition duration-300"
              >
                Join CLan
              </button>
              <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300">
                View Clan
              </button>
            </div>
          </div>
        </div>
      ) : (
        input && !loading && !error && <div>No clans found</div>
      )}
    </>
  );
};

const BookmarkedClans = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { profile } = useSelector((store) => store.auth);

  const [bookmarkedClans, setBookmarkedClans] = useState(
    profile?.profile?.bookmarkedClans || []
  );
  const [joinRequests, setJoinRequests] = useState({});

  // Handle removing a clan from bookmarks
  const handleRemoveBookmark = (clanId) => {
    setBookmarkedClans(bookmarkedClans.filter((clan) => clan._id !== clanId));

    // Dispatch action to remove from backend
    dispatch(removeClanBookmark(clanId));
  };

  // Handle sending a join request
  const handleJoinClan = (clanId) => {
    setJoinRequests((prev) => ({ ...prev, [clanId]: "Pending..." }));

    // Simulate sending request (Replace with API call)
    setTimeout(() => {
      setJoinRequests((prev) => ({ ...prev, [clanId]: "Request Sent" }));
    }, 2000);
  };

  return (
    <div className="max-w-md md:max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-lg md:text-xl font-bold mb-4">🔥 Bookmarked Clans</h2>

      {bookmarkedClans.length === 0 ? (
        <p className="text-gray-600 text-sm md:text-base">
          No bookmarked clans yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {bookmarkedClans.map((clan) => (
            <li
              key={clan._id}
              className="flex flex-wrap md:flex-nowrap justify-between items-center bg-gray-100 p-3 md:p-4 rounded-lg hover:bg-gray-200 transition cursor-pointer"
            >
              {/* Clan Badge & Name */}
              <div className="flex items-center space-x-3">
                <img
                  src={`/${clan.badge}`}
                  alt={clan.clanName}
                  className="w-8 h-8 md:w-10 md:h-10 rounded-full border"
                />
                <span className="text-sm md:text-lg font-semibold">
                  {clan.clanName}
                </span>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap space-x-2 mt-2 md:mt-0">
                {/* View Profile */}
                <button
                  className="flex items-center space-x-1 bg-blue-500 text-white px-2 md:px-3 py-1 rounded-md text-xs md:text-sm hover:bg-blue-600 transition"
                  onClick={() => navigate(`/clan/${clan._id}`)}
                >
                  <FaEye /> <span>Profile</span>
                </button>

                {/* Remove from Bookmarks */}
                <button
                  className="flex items-center space-x-1 bg-red-500 text-white px-2 md:px-3 py-1 rounded-md text-xs md:text-sm hover:bg-red-600 transition"
                  onClick={() => handleRemoveBookmark(clan._id)}
                >
                  <FaTrash /> <span>Remove</span>
                </button>

                {/* Send Join Request */}
                {joinRequests[clan._id] ? (
                  <span className="text-gray-500 text-xs md:text-sm">
                    {joinRequests[clan._id]}
                  </span>
                ) : (
                  <button
                    className="flex items-center space-x-1 bg-green-500 text-white px-2 md:px-3 py-1 rounded-md text-xs md:text-sm hover:bg-green-600 transition"
                    onClick={() => handleJoinClan(clan._id)}
                  >
                    <FaSignInAlt /> <span>Join</span>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

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
