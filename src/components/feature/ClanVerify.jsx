import { useState } from "react";
import api from "../../api/axios-api";

const ClanVerify = ({ isOpen, onClose }) => {
  const [clanTag, setClanTag] = useState("");
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!clanTag) {
      alert("Enter a clan tag first");
      return;
    }
    setLoading(true);

    try {
      // Send request to backend
      const res = await api.post("/api/games/clanWar", { clanTag });
      setResponse(res.data);
    } catch (err) {
      setResponse({
        error: err.response?.data?.message || "Failed to fetch clan data",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-2">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-5 relative">
        {/* Header */}
        <h2 className="text-lg font-bold mb-4">Verify Clan</h2>

        {/* Input + Fetch */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={clanTag}
            onChange={(e) => setClanTag(e.target.value)}
            placeholder="Enter Clan ID"
            className="w-full p-2 border rounded text-gray-900 placeholder-gray-400 bg-white"
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Fetching..." : "Fetch"}
          </button>
        </div>

        {/* JSON Response */}
        <textarea
          readOnly
          value={response ? JSON.stringify(response, null, 2) : ""}
          className="w-full h-40 border border-gray-300 rounded p-2 text-xs font-mono resize-none overflow-auto"
        />

        {/* Close Button */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClanVerify;
