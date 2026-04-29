import React, { useState } from "react";
import { Link } from "react-router-dom";
import InviteModal from "../../feature/InviteModal";
import { useSocket } from "../../../context/socketContext";
import { useSelector } from "react-redux";
import ClanVerify from "../../feature/ClanVerify";

const TournamentCard = ({ tournament, disableFetch }) => {
  const {
    _id,
    tournamentName,
    game,
    mode,
    registeredPlayers,
    registeredTeams,
    maxParticipants,
    teamSize,
    entryFee,
    prizePool,
    status,
  } = tournament;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isClanVerifyOpen, setIsClanVerifyOpen] = useState(false);
  const [clanStatus, setClanStatus] = useState(null);

  const { profile } = useSelector((store) => store.auth);
  const { wallet } = useSelector((store) => store.payment);
  const { socket } = useSocket();

  const hasGame = profile?.profile?.games?.some(
    (gameObj) => gameObj.game.link === game
  );

  const filledPercentage =
    mode === "solo"
      ? registeredPlayers
        ? (registeredPlayers.length / maxParticipants) * 100
        : 0
      : registeredTeams
        ? (registeredPlayers.length / (maxParticipants * teamSize)) * 100
        : 0;

  const handleJoinClick = (event) => {
    event.preventDefault();

    if (wallet.realMoney < entryFee) {
      alert("Charge your wallet first");
      return;
    }

    if (!hasGame && mode === "solo") {
      alert("Please connect your game.");
      return;
    }

    if (game.toLowerCase() === "coc") {
      setIsClanVerifyOpen(true);
    } else {
      const payload = { tournamentId: _id };
      socket.emit("join_tournament", payload);
    }
  };

  const handleClanValidationSuccess = (clanData) => {
    setClanStatus(clanData);
    setIsClanVerifyOpen(false);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="group rounded-3xl border border-slate-800 bg-[linear-gradient(180deg,_rgba(15,23,42,0.9),_rgba(2,6,23,0.98))] p-4 shadow-[0_18px_50px_rgba(2,8,23,0.45)] transition hover:-translate-y-1 hover:border-slate-700">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-300/80">
              {game}
            </p>
            <h2 className="mt-2 text-lg font-black text-white line-clamp-2">
              {tournamentName}
            </h2>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${
              status === "registration_open"
                ? "bg-emerald-500/15 text-emerald-300"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {status.replace("_", " ")}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <InfoChip label="Entry" value={`Rs ${entryFee}`} />
          <InfoChip label="Prize" value={`Rs ${prizePool}`} />
          <InfoChip label="Slots" value={maxParticipants} />
        </div>

        <div className="mt-4 rounded-full bg-slate-900 p-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,_#22d3ee,_#fbbf24)] transition-all duration-700"
              style={{ width: `${filledPercentage}%` }}
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-slate-400">
          <span>{mode.toUpperCase()}</span>
          <span>{registeredPlayers?.length || 0} joined</span>
        </div>

        <div className="mt-5 flex items-center justify-between gap-3">
          {status === "registration_open" && (
            <button
              onClick={handleJoinClick}
              className="rounded-2xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
            >
              Join Now
            </button>
          )}
          {!disableFetch && (
            <Link
              to={`/tournamentDeatils/${_id}`}
              className="text-sm font-semibold text-cyan-200"
            >
              Match Intel
            </Link>
          )}
        </div>
      </div>

      {isClanVerifyOpen && (
        <ClanVerify
          isOpen={isClanVerifyOpen}
          onClose={() => setIsClanVerifyOpen(false)}
          onValidationSuccess={handleClanValidationSuccess}
        />
      )}

      {isModalOpen && (
        <InviteModal
          tournamentId={_id}
          teamSize={teamSize}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          clanData={clanStatus}
        />
      )}
    </>
  );
};

const InfoChip = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-3 py-3 text-center">
    <p className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
      {label}
    </p>
    <p className="mt-1 text-sm font-bold text-white">{value}</p>
  </div>
);

export default TournamentCard;
