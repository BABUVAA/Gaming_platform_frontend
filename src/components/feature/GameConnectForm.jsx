import { useState } from "react";
import { useSocket } from "../../context/socketContext";

const GameConnectForm = ({ game, onClose, onSubmit, setSelectedGame }) => {
  const { socket } = useSocket();
  const [step, setStep] = useState(1);
  const [playerTag, setPlayerTag] = useState("");
  const [gameToken, setGameToken] = useState("");
  const [playerInfo, setPlayerInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const handleVerifyPlayer = () => {
    if (!playerTag) return alert("Please enter your player tag.");
    setLoading(true);

    socket.emit("verify_game_data", {
      gameKey: game.link,
      tag: playerTag,
      operation: "VERIFY_ID",
    });

    socket.once("verify_game_data_response", (data) => {
      setLoading(false);
      if (data?.success) {
        setPlayerInfo(data.playerInfo);
        setStep(2);
      } else {
        alert(data?.message || "Verification failed.");
      }
    });
  };

  // Step 2: Handle API Token Submission
  const handleSubmit = () => {
    if (!gameToken) return alert("Please enter your API Token.");
    setLoading(true);

    socket.emit("verify_game_data", {
      gameKey: game.link,
      tag: playerTag,
      token: gameToken,
      operation: "VERIFY_TOKEN",
    });

    socket.once("verify_game_data_response", async (data) => {
      setLoading(false);
      if (data?.success) {
        alert("API Token verified successfully.");
        const newGameData = {
          game: game._id, // Game ObjectId from backend
          accountUsername: playerInfo.name,
          accountId: playerInfo.tag,
          additionalDetails: playerInfo, // optional extras
        };
        await setSelectedGame(newGameData);
        onSubmit();
        onClose(); // Close the form after successful submission
      } else {
        alert(data?.message || "Token verification failed.");
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-6 space-y-6">
        <h2 className="text-2xl font-semibold text-center">
          Connect {game.name}
        </h2>

        {/* Step 1: Player Tag */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Player Tag
              </label>
              <input
                type="text"
                value={playerTag}
                onChange={(e) => setPlayerTag(e.target.value)}
                placeholder="#ABC123"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleVerifyPlayer}
                disabled={loading}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                {loading && (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                )}
                {loading ? "Verifying..." : "Verify"}
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Show Info & Ask for API Token */}
        {step === 2 && playerInfo && (
          <div className="space-y-4">
            <div className="bg-gray-100 p-4 rounded-md text-sm text-gray-800">
              <p>
                ✅ <strong>{playerInfo.name}</strong> ({playerInfo.tag})
              </p>
              {playerInfo.avatar && (
                <img
                  src={playerInfo.avatar}
                  alt="Player Avatar"
                  className="mt-2 w-12 h-12 rounded-full"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                API Token
              </label>
              <input
                type="text"
                value={gameToken}
                onChange={(e) => setGameToken(e.target.value)}
                placeholder="Paste your API token"
                className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
              >
                Connect
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameConnectForm;
