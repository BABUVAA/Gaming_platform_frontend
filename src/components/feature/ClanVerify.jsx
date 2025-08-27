import { useState } from "react";
import api from "../../api/axios-api";

const ClanVerify = ({ isOpen, onClose, onValidationSuccess }) => {
  const [clanTag, setClanTag] = useState("");
  const [clanData, setClanData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!clanTag) {
      alert("Enter a clan tag first");
      return;
    }
    setLoading(true);
    try {
      const res = await api.post("/api/games/checkClanStatus", { clanTag });
      const { clanName, clanBadge, warState } = res.data;

      setClanData({ clanName, clanBadge, warState });

      // Determine eligibility
      if (warState === "notInWar" || warState === "warEnded") {
        setStatus({
          label: "Eligible",
          type: "success",
        });
        onValidationSuccess?.(clanTag);
      } else {
        setStatus({
          label: "Not Eligible",
          type: "error",
        });
      }
    } catch (err) {
      setStatus({
        label: "Error",
        type: "error",
      });
      setClanData(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const statusColors = {
    success: "border-green-500 text-green-700 bg-green-50",
    error: "border-red-500 text-red-700 bg-red-50",
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-2">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-5 relative">
        <h2 className="text-lg font-bold mb-2">Clan Verification</h2>
        <p className="text-sm text-gray-600 mb-4">
          This step checks if your clan is eligible to register for the
          tournament.
        </p>

        {/* Input + Validate */}
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={clanTag}
            onChange={(e) => setClanTag(e.target.value)}
            placeholder="Enter Clan Tag"
            className="w-full p-2 border rounded text-gray-900 placeholder-gray-400 bg-white"
          />
          <button
            onClick={handleFetch}
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Validate"}
          </button>
        </div>

        {/* Clan Info */}
        {clanData && (
          <div className="flex items-center gap-3 mb-3 border rounded p-3">
            <img
              src={clanData.clanBadge}
              alt="Clan Badge"
              className="w-12 h-12 rounded"
            />
            <div>
              <p className="font-bold  text-gray-700">{clanData.clanName}</p>
              <p className="text-sm text-gray-700">
                War State: {clanData.warState}
              </p>
            </div>
          </div>
        )}

        {/* Eligibility Status */}
        {status && (
          <div
            className={`border rounded p-3 text-sm ${
              statusColors[status.type] || ""
            }`}
          >
            <p className="font-bold">{status.label}</p>
          </div>
        )}

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
