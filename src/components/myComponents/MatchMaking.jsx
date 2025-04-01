import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSocket } from "../../context/socketContext";

const Matchmaking = () => {
  const { profile } = useSelector((store) => store.auth); // User profile
  const { userClanData } = useSelector((store) => store.clan); // Clan data
  const dispatch = useDispatch();
  const [searching, setSearching] = useState(false);
  const [match, setMatch] = useState();
  const [timeLeft, setTimeLeft] = useState(null);
  const { socket } = useSocket();

  // Join chat room and listen for messages
  useEffect(() => {
    // Listen for new messages
    const messageListener = (newMessage) => {
      console.log("New message received:", newMessage);
      setMatch(newMessage);
    };

    socket.on(`tournament_pool`, messageListener); // ✅ Use event constant

    // Cleanup on unmount
    return () => {
      socket.off(`tournament_pool`, messageListener);
    };
  }, []);

  const startMatchmaking = async () => {
    setSearching(true);

    const matchData = {
      clanId: userClanData?.data?._id, // ✅ Ensure safe access
      userId: profile?._id, // ✅ Send user ID for identification
      username: profile?.username, // ✅ Optional for logs
      timestamp: new Date(),
    };

    try {
      socket.emit("find_match_coc", matchData); // ✅ Send match data
    } catch (error) {
      console.error("Matchmaking error:", error);
      setSearching(false);
    }
  };

  const cancelMatchmaking = async () => {
    setSearching(false);
    setMatch(null);
    setTimeLeft(null);
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white">
      {!searching && !match ? (
        <button
          className="px-6 py-3 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          onClick={startMatchmaking}
        >
          Battle Now
        </button>
      ) : (
        <div className="flex flex-col items-center">
          {match ? (
            <p className="text-lg font-semibold mb-4">
              Match found!
              {`${match.userId} vs ${match.opponentId}`}
              Time left: {timeLeft} seconds
            </p>
          ) : (
            <div className="relative flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-t-transparent border-blue-500 rounded-full animate-spin"></div>
              <p className="mt-4 text-lg animate-pulse">
                Searching for a match...
              </p>
            </div>
          )}
          <button
            className="mt-4 px-6 py-2 bg-red-600 rounded-lg hover:bg-red-700 transition"
            onClick={cancelMatchmaking}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default Matchmaking;
