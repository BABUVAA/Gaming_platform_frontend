import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaFlag } from "react-icons/fa";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import MatchChat from "../components/competition/MatchChat.jsx";
import { getGameKey, getGamePresentation } from "../config/gamePresentation.js";
import useSocket from "../context/useSocket";
import { selectAuthUser } from "../store/selectors/authSelectors.js";
import { selectPlayerMatch, selectPlayerMatchActionStatus, selectPlayerMatchError, selectPlayerMatchStatus } from "../store/selectors/matchActivitySelectors.js";
import { selectIsStaffUtilityMode } from "../store/selectors/playerSelectors";
import { fetchPlayerMatch, raisePlayerMatchDispute } from "../store/slices/matchActivitySlice.js";
import { showToast, types } from "../store/slices/toastSlice";
import { STAFF_UTILITY_MESSAGE } from "../utils/staffUtilityMode";
import {
  getCompetitionRankingGroups,
  usesTeamRanking,
} from "../utils/competitionUnits.js";

const TABS = ["lobby", "chat", "dispute", "results"];
const DISPUTE_STATUSES = ["live", "result_pending", "verified"];
const STATUS_STYLE = {
  awaiting_operator: "bg-amber-300 text-slate-950", operator_assigned: "bg-cyan-200 text-slate-950",
  scheduled: "bg-sky-200 text-slate-950", lobby_ready: "bg-violet-200 text-slate-950",
  live: "bg-emerald-300 text-slate-950", result_pending: "bg-orange-200 text-slate-950",
  verified: "bg-cyan-200 text-slate-950", settled: "bg-violet-200 text-slate-950", disputed: "bg-rose-300 text-slate-950",
};
const identifier = (value) => String(value?._id || value || "");
const playerName = (participant, index) => participant?.user?.profile?.username || participant?.user?.profileTag || participant?.displayName || `Player ${index + 1}`;
const teamName = (participant) => participant?.competitionUnitName || participant?.team?.teamName || participant?.team?.name || "";
const playerInitial = (participant, index) => playerName(participant, index).charAt(0).toUpperCase();
const formatCountdown = (milliseconds) => {
  const seconds = Math.max(0, Math.floor(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60].map((value) => String(value).padStart(2, "0")).join(":");
};
const getTimingState = (match, now) => {
  const scheduledAt = match.scheduledFor ? new Date(match.scheduledFor).getTime() : null;
  const revealAt = match.lobbyRevealAt ? new Date(match.lobbyRevealAt).getTime() : null;
  if (match.status === "awaiting_operator") return "Entry closed · waiting for operator";
  if (match.status === "operator_assigned" && !scheduledAt) return "Waiting for schedule";
  if (["scheduled", "lobby_ready"].includes(match.status)) {
    if (revealAt && now < revealAt) return `Lobby opens in ${formatCountdown(revealAt - now)}`;
    if (scheduledAt && now < scheduledAt) return `Match starts in ${formatCountdown(scheduledAt - now)}`;
    if (scheduledAt && now >= scheduledAt) return "Start delayed · waiting for operator";
  }
  if (match.status === "live") return "Match live";
  if (match.status === "result_pending") return "Waiting for official result";
  return String(match.status || "Match").replaceAll("_", " ");
};
const groupParticipants = (match, size) => {
  const participants = match.participants || [];
  const serverGroups = getCompetitionRankingGroups(match).map((group) => group.participants);
  if (serverGroups.length) return serverGroups;
  // Solo and historical Quick Match records may not carry a competition key.
  const groups = [];
  for (let index = 0; index < participants.length; index += size) groups.push(participants.slice(index, index + size));
  return groups;
};
const fillTeamGroups = (match, size, capacity) => {
  const groups = groupParticipants(match, size);
  const groupCount = Math.max(groups.length, Math.ceil(capacity / size), 1);
  return Array.from({ length: groupCount }, (_, index) => groups[index] || []);
};
const PlayerSlot = ({ index, participant }) => (
  <div className="flex min-h-11 items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/70 px-3 py-2">
    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-800 text-xs font-black text-slate-400">{index + 1}</span>
    <span className={`truncate text-sm font-bold ${participant ? "text-white" : "text-slate-600"}`}>{participant ? playerName(participant, index) : "Empty"}</span>
  </div>
);

const BgmiPlayerTile = ({ isCurrentUser = false, participant, slotNumber }) => {
  const name = participant ? playerName(participant, slotNumber - 1) : "Empty slot";
  return (
    <div className={`flex min-h-32 min-w-0 flex-col rounded-xl p-2.5 ring-inset ${isCurrentUser ? "bg-cyan-300/15 ring-2 ring-cyan-300" : participant ? "bg-slate-800 ring-1 ring-white/10" : "bg-slate-900/90 ring-1 ring-slate-800"}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-slate-500">{String(slotNumber).padStart(2, "0")}</span>
        {isCurrentUser ? <span className="rounded-full bg-cyan-300 px-2 py-0.5 text-[9px] font-black text-slate-950">You</span> : participant ? <span className="h-2 w-2 rounded-full bg-emerald-400" /> : null}
      </div>
      <div className="grid flex-1 place-items-center py-3">
        {participant ? (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950 sm:h-14 sm:w-14">
            {playerInitial(participant, slotNumber - 1)}
          </div>
        ) : (
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-800 text-xl font-light text-slate-600 sm:h-14 sm:w-14">
            +
          </div>
        )}
      </div>
      <div className="flex min-h-8 items-center justify-center text-center">
        <p className={`w-full break-words text-[10px] font-bold leading-tight [overflow-wrap:anywhere] sm:text-xs ${participant ? "text-white" : "text-slate-600"}`} title={name}>{participant ? name : "Available"}</p>
      </div>
    </div>
  );
};

const CocPlayerRow = ({ isCurrentUser = false, participant, slotNumber, tone }) => (
  <div className={`flex min-h-14 items-center gap-3 rounded-xl px-3 py-2.5 ring-inset ${isCurrentUser ? tone === "red" ? "bg-rose-300/15 ring-2 ring-rose-300" : "bg-cyan-300/15 ring-2 ring-cyan-300" : participant ? "bg-slate-800 ring-1 ring-white/10" : "bg-slate-900 ring-1 ring-slate-800"}`}>
    <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-500">{slotNumber}</span>
    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-black ${participant ? tone === "red" ? "bg-rose-300 text-slate-950" : "bg-cyan-300 text-slate-950" : "bg-slate-800 text-slate-600"}`}>{participant ? playerInitial(participant, slotNumber - 1) : "+"}</div>
    <p className={`min-w-0 flex-1 break-words text-sm font-bold leading-tight [overflow-wrap:anywhere] ${participant ? "text-white" : "text-slate-600"}`}>{participant ? playerName(participant, slotNumber - 1) : "Available"}</p>
    {isCurrentUser ? <span className={`rounded-full px-2 py-1 text-[9px] font-black text-slate-950 ${tone === "red" ? "bg-rose-300" : "bg-cyan-300"}`}>You</span> : participant ? <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" /> : null}
  </div>
);
const BgmiLobby = ({ currentUserId, match }) => {
  const participants = match.participants || [];
  const mode = String(match.mode || "solo").toLowerCase();
  const teamSize = mode.includes("duo") ? 2 : mode.includes("squad") ? 4 : 1;
  const capacity = Math.max(participants.length, Number(match.maxPlayers) || 0);
  if (teamSize === 1) return <div><h3 className="text-sm font-black uppercase tracking-wider text-slate-400">Solo seats</h3><div className="mt-3 rounded-2xl bg-slate-950/50 p-2 ring-1 ring-inset ring-white/5"><div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">{Array.from({ length: capacity || 1 }, (_, index) => <BgmiPlayerTile isCurrentUser={identifier(participants[index]?.user) === currentUserId} key={index} participant={participants[index]} slotNumber={index + 1} />)}</div></div></div>;
  return <div><h3 className="text-sm font-black uppercase tracking-wider text-slate-400">{teamSize === 2 ? "Duo slots" : "Squad slots"}</h3><div className="mt-3 grid gap-3 lg:grid-cols-2">{fillTeamGroups(match, teamSize, capacity).map((group, groupIndex) => { const isCurrentTeam = group.some((participant) => identifier(participant.user) === currentUserId); return <div className={`overflow-hidden rounded-2xl bg-slate-900 ring-inset ${isCurrentTeam ? "ring-2 ring-cyan-300" : "ring-1 ring-white/8"}`} key={group[0]?.competitionUnitKey || identifier(group[0]?.team) || groupIndex}><div className={`flex items-center justify-between px-3 py-2.5 ${isCurrentTeam ? "bg-cyan-300/15" : "bg-slate-800/80"}`}><p className="text-xs font-black text-white">{teamName(group[0]) || `Team ${groupIndex + 1}`}{isCurrentTeam ? <span className="ml-2 text-cyan-200">Your team</span> : null}</p><span className="rounded-full bg-slate-700 px-2 py-1 text-[10px] font-bold text-slate-300">{group.length}/{teamSize}</span></div><div className={`grid gap-2 p-2 ${teamSize === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>{Array.from({ length: teamSize }, (_, slotIndex) => <BgmiPlayerTile isCurrentUser={identifier(group[slotIndex]?.user) === currentUserId} key={slotIndex} participant={group[slotIndex]} slotNumber={slotIndex + 1} />)}</div></div>; })}</div></div>;
};
const CocLobby = ({ currentUserId, match }) => {
  const groups = groupParticipants(match, 5);
  return <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_52px_minmax(0,1fr)] lg:items-center">{[0, 1].map((side) => { const isCurrentTeam = (groups[side] || []).some((participant) => identifier(participant.user) === currentUserId); return <div className={`overflow-hidden rounded-2xl bg-slate-900 ring-inset ${isCurrentTeam ? side ? "ring-2 ring-rose-300" : "ring-2 ring-cyan-300" : "ring-1 ring-white/8"} ${side ? "lg:col-start-3" : ""}`} key={side}><div className={`flex items-center justify-between px-4 py-3 ${side ? "bg-rose-300/10" : "bg-cyan-300/10"}`}><div><p className={`text-[10px] font-black uppercase tracking-[0.18em] ${side ? "text-rose-200" : "text-cyan-200"}`}>War side</p><h3 className="mt-0.5 font-black text-white">Team {side ? "B" : "A"}{isCurrentTeam ? <span className={side ? "ml-2 text-rose-200" : "ml-2 text-cyan-200"}>Your team</span> : null}</h3>{teamName(groups[side]?.[0]) ? <p className="mt-0.5 text-xs text-slate-400">{teamName(groups[side][0])}</p> : null}</div><span className="rounded-full bg-slate-800 px-2 py-1 text-xs font-black text-slate-300">{groups[side]?.length || 0}/5</span></div><div className="grid gap-2 p-3">{Array.from({ length: 5 }, (_, index) => <CocPlayerRow isCurrentUser={identifier(groups[side]?.[index]?.user) === currentUserId} key={identifier(groups[side]?.[index]?.user) || index} participant={groups[side]?.[index]} slotNumber={index + 1} tone={side ? "red" : "blue"} />)}</div></div>; })}<div className="flex items-center justify-center lg:col-start-2 lg:row-start-1"><span className="grid h-11 w-11 place-items-center rounded-full bg-slate-800 text-sm font-black text-white ring-1 ring-inset ring-white/10">VS</span></div></div>;
};
const LobbyTab = ({ currentUserId, isStaffUtilityMode, match }) => (
  <div className="space-y-5">
    <div className="grid gap-3 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:grid-cols-3">
      <div><p className="text-xs text-slate-500">Room ID</p><p className="mt-1 font-black text-white">{isStaffUtilityMode ? "Hidden" : match.lobby?.roomCode || "Not released"}</p></div>
      <div><p className="text-xs text-slate-500">Password</p><p className="mt-1 font-black text-white">{isStaffUtilityMode ? "Hidden" : match.lobby?.roomPassword || "Not released"}</p></div>
      <div><p className="text-xs text-slate-500">Schedule</p><p className="mt-1 font-black text-white">{match.scheduledFor ? new Date(match.scheduledFor).toLocaleString() : "Pending"}</p></div>
    </div>
    {getGameKey(match.game) === "coc" ? <CocLobby currentUserId={currentUserId} match={match} /> : <BgmiLobby currentUserId={currentUserId} match={match} />}
  </div>
);
const ResultsTab = ({ match }) => {
  const summary = match.resultSummary || {};
  const participants = match.participants || [];
  const byId = new Map(participants.map((item, index) => [identifier(item.user), playerName(item, index)]));
  const placements = Array.isArray(summary.placementRanking) ? summary.placementRanking : [];
  const rankingIds = Array.isArray(summary.rankingIds) ? summary.rankingIds : [];
  const teamRanking = usesTeamRanking(match) && placements.length > 0;
  const rows = placements.length ? placements.map((row, index) => ({
    place: row.place || row.rank || index + 1,
    name: row.name || row.teamName || row.username || row.displayName || byId.get(identifier(row.user || row.userId || row.player)) || (teamRanking ? "Team" : "Player"),
    members: teamRanking ? (row.playerIds || []).map((userId) => byId.get(identifier(userId))).filter(Boolean) : [],
  })) : rankingIds.map((userId, index) => ({ place: index + 1, name: byId.get(identifier(userId)) || "Player", members: [] }));
  return <div className="grid gap-4 lg:grid-cols-[1fr_0.7fr]"><div className="overflow-hidden rounded-2xl border border-slate-800"><div className="grid grid-cols-[70px_1fr] bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-500"><span>Place</span><span>{teamRanking ? "Team" : "Player"}</span></div>{rows.map((row) => <div className="grid grid-cols-[70px_1fr] border-t border-slate-800 px-4 py-3 text-sm" key={`${row.place}-${row.name}`}><strong className="text-amber-300">#{row.place}</strong><span className="min-w-0 font-bold text-white"><span className="block truncate">{row.name}</span>{row.members.length ? <small className="block truncate font-medium text-slate-500">{row.members.join(", ")}</small> : null}</span></div>)}{!rows.length ? <p className="px-4 py-10 text-center text-sm text-slate-500">Results will appear after operator verification.</p> : null}</div><div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-300"><p className="text-xs font-black uppercase tracking-wider text-slate-500">Result</p><p className="mt-3">{summary.finalScore || "Score pending"}</p>{summary.proofNote ? <p className="mt-3 text-slate-400">{summary.proofNote}</p> : null}</div></div>;
};

PlayerSlot.propTypes = {
  index: PropTypes.number.isRequired,
  participant: PropTypes.object,
};
BgmiPlayerTile.propTypes = {
  isCurrentUser: PropTypes.bool,
  participant: PropTypes.object,
  slotNumber: PropTypes.number.isRequired,
};
CocPlayerRow.propTypes = {
  isCurrentUser: PropTypes.bool,
  participant: PropTypes.object,
  slotNumber: PropTypes.number.isRequired,
  tone: PropTypes.oneOf(["blue", "red"]).isRequired,
};
BgmiLobby.propTypes = { currentUserId: PropTypes.string.isRequired, match: PropTypes.object.isRequired };
CocLobby.propTypes = { currentUserId: PropTypes.string.isRequired, match: PropTypes.object.isRequired };
LobbyTab.propTypes = {
  currentUserId: PropTypes.string.isRequired,
  isStaffUtilityMode: PropTypes.bool.isRequired,
  match: PropTypes.object.isRequired,
};
ResultsTab.propTypes = { match: PropTypes.object.isRequired };

const MatchRoom = () => {
  const { competitionRevision } = useSocket();
  const { id: matchId } = useParams();
  const dispatch = useDispatch();
  const match = useSelector(selectPlayerMatch);
  const matchError = useSelector(selectPlayerMatchError);
  const matchStatus = useSelector(selectPlayerMatchStatus);
  const actionStatus = useSelector(selectPlayerMatchActionStatus);
  const authUser = useSelector(selectAuthUser);
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  const [activeTab, setActiveTab] = useState("lobby");
  const [disputeReason, setDisputeReason] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const loadMatch = useCallback(() => dispatch(fetchPlayerMatch(matchId)), [dispatch, matchId]);
  useEffect(() => { const request = loadMatch(); return () => request.abort(); }, [competitionRevision, loadMatch]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  const canDispute = useMemo(() => !isStaffUtilityMode && DISPUTE_STATUSES.includes(match?.status), [isStaffUtilityMode, match?.status]);
  const submitDispute = async () => {
    const reason = disputeReason.trim();
    if (!canDispute || !reason) { dispatch(showToast({ message: "Disputes are unavailable at this match stage.", position: "bottom-right", type: types.WARNING })); return; }
    try { await dispatch(raisePlayerMatchDispute({ matchId, reason })).unwrap(); setDisputeReason(""); } catch { /* Shared thunk displays the API error. */ }
  };
  if (matchStatus === "loading" && !match) return <div className="rounded-2xl bg-slate-950 p-6 text-slate-400">Loading match...</div>;
  if (!match) return <div className="rounded-2xl bg-slate-950 p-6 text-slate-400">{matchError || "Match not found."}</div>;
  const presentation = getGamePresentation(match.game);
  return <div className="space-y-4 pb-8">
    <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 sm:p-6"><img alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" src={presentation.image} /><div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/60" /><div className="relative"><Link className="inline-flex items-center gap-2 text-sm font-bold text-cyan-200" to="/dashboard/matches"><FaArrowLeft /> Matches</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-black uppercase tracking-widest text-cyan-300">{presentation.label} · {match.mode || "Match"}</p><h1 className="mt-1 text-2xl font-black text-white sm:text-3xl">{match.title || "Match Room"}</h1></div><span className={`rounded-full px-3 py-1.5 text-xs font-black uppercase ${STATUS_STYLE[match.status] || "bg-slate-800 text-slate-200"}`}>{String(match.status || "match").replaceAll("_", " ")}</span></div><div className="mt-5 rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-3 text-sm font-black text-cyan-100">{getTimingState(match, now)}</div></div></section>
    <section className="rounded-3xl border border-slate-800 bg-slate-950 p-3 sm:p-4"><div aria-label="Match room sections" className="grid grid-cols-4 gap-1 overflow-x-auto rounded-xl bg-slate-900 p-1" role="tablist">{TABS.map((tab) => <button aria-selected={activeTab === tab} className={`min-w-20 rounded-lg px-3 py-2 text-xs font-black capitalize sm:text-sm ${activeTab === tab ? "bg-cyan-300 text-slate-950" : "text-slate-400 hover:text-white"}`} key={tab} onClick={() => setActiveTab(tab)} role="tab" type="button">{tab}</button>)}</div><div className="mt-4">
      {activeTab === "lobby" ? <LobbyTab currentUserId={identifier(authUser?.userId)} isStaffUtilityMode={isStaffUtilityMode} match={match} /> : null}
      {activeTab === "chat" ? (!isStaffUtilityMode && match.status !== "awaiting_operator" ? <MatchChat audience="player" matchId={String(match._id)} /> : <p className="rounded-xl border border-slate-800 p-8 text-center text-sm text-slate-500">Chat opens after an operator is assigned.</p>) : null}
      {activeTab === "dispute" ? (isStaffUtilityMode ? <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">{STAFF_UTILITY_MESSAGE} Disputes are player-only.</p> : <div className="max-w-2xl"><textarea className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-rose-400" maxLength={1000} onChange={(event) => setDisputeReason(event.target.value)} placeholder="Describe the issue and relevant evidence." rows={5} value={disputeReason} /><button className="mt-3 inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-sm font-black text-white disabled:opacity-50" disabled={!canDispute || !disputeReason.trim() || actionStatus === "loading"} onClick={submitDispute} type="button"><FaFlag /> Raise dispute</button></div>) : null}
      {activeTab === "results" ? <ResultsTab match={match} /> : null}
    </div></section>
  </div>;
};
export default MatchRoom;
