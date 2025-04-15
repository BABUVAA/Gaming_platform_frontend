import { useDispatch, useSelector } from "react-redux";
import {
  FaDiscord,
  FaEdit,
  FaFacebook,
  FaInstagram,
  FaPlus,
  FaRegCopy,
  FaSteam,
  FaTwitch,
  FaTwitter,
  FaYoutube,
} from "react-icons/fa";
import { useState } from "react";
import {
  profile_data_update,
  profile_file_update,
  user_profile,
} from "../store/authSlice";

const Profile = () => {
  const { profile } = useSelector((store) => store.auth);

  // Example data, replace with actual data from user profile
  const games = ["pubg", "Coc", "valorant", "fortnite"];
  const tournamentStats = {
    tournamentsEntered: 5,
    gamesPlayed: 150,
    totalEarnings: 10000,
  };

  const pastTournaments = [
    { name: "PUBG Invitational", date: "2024-11-10", result: "Won" },
    { name: "Coc World Cup", date: "2024-10-5", result: "Runner-Up" },
  ];

  //Section 1: Profile Information

  const ProfileHeader = ({ profile }) => {
    const [profilePic, setProfilePic] = useState(
      profile?.profile.avatar || "/profile-pic.png"
    );
    const [bannerPic, setBannerPic] = useState(
      profile?.profile.banner || "/pubg_background.jpg"
    );
    const [selectedImageType, setSelectedImageType] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
    const [socialAccounts, setSocialAccounts] = useState(
      profile.profile.linkedAccounts || {
        instagram: "",
        youtube: "",
        twitter: "",
        facebook: "",
      }
    );

    const dispatch = useDispatch();

    const handleImageChange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const imageUrl = URL.createObjectURL(file);
        if (selectedImageType === "profile") {
          setProfilePic(imageUrl);
          handleProfileUpdate("profile.avatar", file);
        } else if (selectedImageType === "banner") {
          setBannerPic(imageUrl);
          handleProfileUpdate("profile.banner", file);
        }
        setIsModalOpen(false);
      }
    };

    {
      /* Social accounts handling */
    }
    const [editableFields, setEditableFields] = useState({});

    const handleEditClick = (platform) => {
      setEditableFields((prev) => ({ ...prev, [platform]: true }));
    };

    const handleBlur = (e) => {
      const { name, value } = e.target;

      setSocialAccounts((prev) => {
        const updatedAccounts = { ...prev };

        if (value.trim()) {
          // If there's a value, update it
          updatedAccounts[name] = value;
        } else {
          // If empty, remove the key
          updatedAccounts[name] = null;
        }

        return updatedAccounts;
      });

      setEditableFields((prev) => ({ ...prev, [name]: false })); // Disable input again
    };

    {
      /** copy feature */
    }
    const [copied, setCopied] = useState(false);
    const copyToClipboard = async () => {
      if (!profile?.profileTag) return;
      try {
        await navigator.clipboard.writeText(profile.profileTag);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500); // Reset copied state after 1.5 sec
      } catch (err) {
        console.error("Failed to copy: ", err);
      }
    };

    {
      /*profile data update function */
    }
    const handleProfileUpdate = async (field, data) => {
      try {
        await dispatch(profile_file_update({ field: field, data: data }));
        await dispatch(user_profile());
      } catch (error) {
        console.log(error);
      }
    };

    return (
      <div className="bg-white relative rounded-lg mb-6 overflow-hidden h-[300px]">
        {/* Banner */}
        <div
          className="absolute top-0 left-0 w-full h-[160px] bg-cover bg-center cursor-pointer"
          style={{ backgroundImage: `url(${bannerPic})` }}
          onClick={() => {
            setSelectedImageType("banner");
            setIsModalOpen(true);
          }}
        >
          {/* Edit Button for Banner */}
          <button
            className="absolute z-40 top-2 right-2 bg-black bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition"
            onClick={() => {
              setSelectedImageType("banner");
              setIsModalOpen(true);
            }}
          >
            <FaEdit className="text-lg" />
          </button>
        </div>

        {/* Overlay for Banner */}
        <div className="absolute inset-0 bg-white opacity-30"></div>

        {/* Profile Picture, Username, and Social Icons */}
        <div className="relative flex items-start justify-between p-4 pt-[160px] pt- sm:p-6 sm:pt-[160px] h-full">
          {/* Profile Picture */}
          <div className="flex flex-col items-center absolute bottom-10">
            {/* Profile Picture with Edit Button at Bottom-Right */}
            <div className="relative">
              <img
                src={profilePic}
                alt="Profile"
                className="w-28 h-28 rounded-full border-4 border-white"
              />
              <button
                className="absolute bottom-2 right-2 bg-blue-600 text-white p-1 rounded-full shadow-md hover:bg-blue-700 transition duration-200"
                onClick={() => {
                  setSelectedImageType("profile");
                  setIsModalOpen(true);
                }}
              >
                <FaEdit className="text-sm" />
              </button>
            </div>
            <h2 className="text-xl font-bold text-black">
              {profile?.profile.username || "Player"}
            </h2>
            <div className="right-2 mt-2 flex items-center space-x-2">
              <h2 className="text-sm font-bold text-black">
                {profile?.profileTag}
              </h2>

              <FaRegCopy
                className={`cursor-pointer text-gray-500 hover:text-gray-700 ${
                  copied ? "text-green-600" : ""
                }`}
                onClick={copyToClipboard}
                title="Copy to clipboard"
              />
            </div>
          </div>

          {/* Social Icons & Add Social Accounts */}
          <SocialAccounts
            linkedAccounts={profile.profile.linkedAccounts}
            onUpdate={() => {
              setIsSocialModalOpen(true);
            }}
          />
        </div>

        {/* Image Change Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
              <h2 className="text-xl font-bold mb-4">
                Change {selectedImageType === "profile" ? "Profile" : "Banner"}{" "}
                Picture
              </h2>
              <img
                src={selectedImageType === "profile" ? profilePic : bannerPic}
                alt="Current"
                className="w-full h-[200px] object-cover rounded-md mb-4"
              />
              <label className="block text-center bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700">
                Select New Image
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </label>
              <button
                className="mt-4 w-full bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Social Accounts Modal */}
        {isSocialModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
              <h2 className="text-xl font-bold mb-4">Add Social Accounts</h2>
              <div className="space-y-3">
                {Object.keys(socialAccounts).map((platform) => (
                  <div
                    key={platform}
                    className="flex items-center justify-between border p-2 rounded"
                  >
                    <span className="capitalize">{platform}</span>
                    <div className="flex items-center w-2/3">
                      <input
                        type="text"
                        name={platform}
                        defaultValue={socialAccounts[platform] || ""}
                        placeholder={`Enter ${platform} URL`}
                        className="border rounded px-2 py-1 w-full"
                        disabled={
                          socialAccounts[platform]
                            ? !editableFields[platform]
                            : ""
                        } // Disable unless editing
                        onBlur={handleBlur} // Update on losing focus
                      />
                      {!editableFields[platform] &&
                        socialAccounts[platform] && (
                          <button
                            className="ml-2 text-blue-600 hover:underline"
                            onClick={() => handleEditClick(platform)}
                          >
                            Edit
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
                  onClick={() => setIsSocialModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                  onClick={async () => {
                    console.log(socialAccounts);
                    await dispatch(
                      profile_data_update({
                        field: "profile.linkedAccounts",
                        data: socialAccounts,
                      })
                    );
                    await dispatch(user_profile());
                    setIsSocialModalOpen(false);
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  const SocialAccounts = ({ linkedAccounts, onUpdate }) => {
    const socialIcons = {
      discord: <FaDiscord className="text-purple-600" />,
      instagram: <FaInstagram className="text-pink-500" />,
      steam: <FaSteam className="text-gray-600" />,
      twitch: <FaTwitch className="text-purple-500" />,
      twitter: <FaTwitter className="text-blue-400" />,
      youtube: <FaYoutube className="text-red-600" />,
    };
    return (
      <div className="absolute bottom-2 right-2 flex flex-wrap items-center w-20 gap-2">
        {/* Render linked accounts */}
        {Object.entries(linkedAccounts).map(([platform, link]) =>
          link ? (
            <a
              key={platform}
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:scale-110 transition-transform"
            >
              {socialIcons[platform] || null}
            </a>
          ) : null
        )}

        {/* Button to update accounts */}
        <button
          onClick={onUpdate}
          className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 flex items-center justify-center"
        >
          <FaPlus size={15} />
        </button>
      </div>
    );
  };

  // Section 2: Career Statistics with Tab System
  const CareerStatistics = () => {
    const [activeTab, setActiveTab] = useState("PUBG");

    // Example data for games
    const gameStats = {
      PUBG: {
        tournamentsEntered: 3,
        gamesPlayed: 120,
        totalEarnings: 5000,
      },
      CoC: {
        tournamentsEntered: 2,
        gamesPlayed: 30,
        totalEarnings: 2000,
      },
    };

    const games = ["PUBG", "CoC"];
    const activeGameStats = gameStats[activeTab];

    return (
      <div className="career-statistics-wrapper mb-6 bg-gradient-to-b from-blue-50 to-blue-100 ">
        {/* Container */}
        <div className="career-statistics  bg-white p-8 rounded-lg shadow-lg mx-auto">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Career Statistics
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            Explore your performance across different games
          </p>

          {/* Tabs */}
          <div className="tabs flex justify-start gap-6 border-b pb-2 mb-6">
            {games.map((game) => (
              <button
                key={game}
                className={`relative py-2 px-4 text-sm font-medium rounded-t-md focus:outline-none transition-colors ${
                  activeTab === game
                    ? "text-blue-600 border-b-4 border-blue-500"
                    : "text-gray-500 hover:text-blue-400"
                }`}
                onClick={() => setActiveTab(game)}
              >
                {game}
              </button>
            ))}
          </div>

          {/* Active Game Stats */}
          <div className="game-stats grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="stat-card bg-blue-50 p-6 rounded-md shadow-md text-center">
              <h4 className="text-lg font-semibold text-gray-700">
                Tournaments Entered
              </h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {activeGameStats.tournamentsEntered}
              </p>
            </div>
            <div className="stat-card bg-blue-50 p-6 rounded-md shadow-md text-center">
              <h4 className="text-lg font-semibold text-gray-700">
                Games Played
              </h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {activeGameStats.gamesPlayed}
              </p>
            </div>
            <div className="stat-card bg-blue-50 p-6 rounded-md shadow-md text-center">
              <h4 className="text-lg font-semibold text-gray-700">
                Total Earnings
              </h4>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                ${activeGameStats.totalEarnings}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Section 3: Active Tournaments
  const ActiveTournaments = ({ tournament }) => {
    console.log("Active tournament", tournament);

    return (
      <div className="active-tournaments-wrapper mb-6 bg-gradient-to-b from-purple-50 to-purple-100 ">
        <div className="active-tournaments bg-white p-8 rounded-lg shadow-lg  mx-auto">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">
            Active Tournaments
          </h3>
          {tournament.length > 0 ? (
            <div className="tournament-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {tournament.map((tournament, index) => (
                <div
                  key={index}
                  className="tournament-card bg-purple-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                >
                  <h4 className="text-lg font-bold text-gray-700 mb-2">
                    {tournament.tournamentName}
                  </h4>
                  <p className="text-sm text-gray-600">
                    <strong>Date:</strong> {tournament.startDate}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">No active tournaments</p>
          )}
        </div>
      </div>
    );
  };

  // Section 4: Past Tournaments
  const PastTournaments = () => (
    <div className="past-tournaments-wrapper bg-gradient-to-b from-blue-50 to-blue-100 mb-12">
      <div className="past-tournaments bg-white p-8 rounded-lg shadow-lg  mx-auto">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">
          Past Tournaments
        </h3>
        {pastTournaments.length > 0 ? (
          <div className="tournament-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastTournaments.map((tournament, index) => (
              <div
                key={index}
                className="tournament-card bg-blue-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow"
              >
                <h4 className="text-lg font-bold text-gray-700 mb-2">
                  {tournament.name}
                </h4>
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {tournament.date}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Result:</strong> {tournament.result}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No past tournaments</p>
        )}
      </div>
    </div>
  );
  return (
    <div className="profile-container bg-gray-100 p-2 gap-1">
      <ProfileHeader profile={profile} />
      <CareerStatistics />
      <ActiveTournaments tournament={profile.profile.tournaments} />
      <PastTournaments />
    </div>
  );
};

export default Profile;
