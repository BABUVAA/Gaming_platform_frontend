import { useState } from "react";
import api from "../../api/axios-api";

const CLAN_STATES = {
  clanNotFound: "Clan Not Found",
  accessDenied: "Access Denied",
  notInWar: "Not in War",
  inMatchmaking: "In Matchmaking",
  enterWar: "Entering War",
  matched: "Matched",
  preparation: "Preparation",
  war: "War",
  inWar: "In War",
  warEnded: "War Ended",
};

const ClanVerify = ({ isOpen, onClose, onValidationSuccess }) => {
  const [clanTag, setClanTag] = useState("");
  const [clanData, setClanData] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleFetch = async () => {
    if (!clanTag) return alert("Enter a clan tag first");
    setLoading(true);
    try {
      const res = await api.post("/api/games/checkClanStatus", { clanTag });
      const data = res.data;

      // Map warState to readable status
      const warState = data?.warState || "unknown";
      setStatus(CLAN_STATES[warState] || "Unknown");

      // Save all clan details including members and war log public
      setClanData({
        clanName: data.clanName,
        clanBadge: data.clanBadge,
        warState: warState,
        clanTag: data.clanTag,
        clanLevel: data.clanLevel,
        isWarLogPublic: data.isWarLogPublic,
        members: data.members || [],
      });
    } catch (err) {
      setStatus("Error fetching clan data");
      setClanData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (clanData?.isWarLogPublic) {
      onValidationSuccess(clanData); // send full clanData including members
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 px-2">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-5 relative">
        <h2 className="text-lg font-bold mb-2">Clan Verification</h2>
        <p className="text-sm text-gray-600 mb-4">
          This step validates your clan before proceeding to the tournament.
          Clan must have war log public to register.
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
          <div className="border p-3 rounded mb-3 flex flex-col gap-3 bg-gray-50">
            <div className="flex items-center gap-3">
              <img
                src={clanData.clanBadge}
                alt="Clan Badge"
                className="w-12 h-12"
              />
              <div className="text-gray-800">
                <p className="font-bold text-gray-900 text-sm">
                  {clanData.clanName}
                </p>
                <p className="text-sm">
                  Tag: <span className="font-medium">{clanData.clanTag}</span>
                </p>
                <p className="text-sm">
                  Level:{" "}
                  <span className="font-medium">{clanData.clanLevel}</span>
                </p>
                <p className="text-sm">
                  War State:{" "}
                  <span className="font-medium">{clanData.warState}</span>
                </p>
                <p className="text-sm">
                  War Log Public:{" "}
                  <span
                    className={`font-medium ${
                      clanData.isWarLogPublic
                        ? "text-green-700"
                        : "text-red-600"
                    }`}
                  >
                    {clanData.isWarLogPublic ? "Yes" : "No"}
                  </span>
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Warning if war log not public */}
        {clanData && !clanData.isWarLogPublic && (
          <p className="text-red-600 text-sm mb-2">
            Clan war log is private. You cannot register for this tournament.
          </p>
        )}

        {/* Next Button */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
          >
            Close
          </button>
          <button
            onClick={handleNext}
            disabled={!clanData || !clanData.isWarLogPublic}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>

        {/* Status if fetch fails */}
        {status && !clanData && (
          <p className="text-sm text-red-500 mt-2">{status}</p>
        )}
      </div>
    </div>
  );
};

export default ClanVerify;
