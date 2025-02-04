import { useState, useEffect } from "react";
import api from "../../api/axios-api";
import { useDispatch } from "react-redux";
import { fetchTournaments } from "../../store/tournamentSlice";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_SERVER_URL);
const Matchmaking = () => {
  const dispatch = useDispatch();
  const [searching, setSearching] = useState(false);
  const [match, setMatch] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);

  const startMatchmaking = async () => {
    setSearching(true);
    try {
      const response = await dispatch(fetchTournaments());
      setMatch(response.data.match);
      setTimeLeft(response.data.timeLimit);
    } catch (error) {
      console.error("Matchmaking error:", error);
      setSearching(false);
    }
  };

  const cancelMatchmaking = async () => {
    setSearching(false);
    setMatch(null);
    setTimeLeft(null);
    await api.post("/api/matchmaking/cancel");
  };

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft === 0 && match) {
      axios
        .post("/api/matchmaking/resolve", { matchId: match.id })
        .then((response) => {
          console.log("Match result fetched:", response.data);
        })
        .catch((error) => console.error("Result fetch error:", error));
    }
  }, [timeLeft, match]);

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
              Match found! Time left: {timeLeft} seconds
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
