import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ROUTES } from "../../routes/routeConstants.js";
import { selectAuthUser } from "../../store/selectors/authSelectors.js";
import { fetchTeams } from "../../store/slices/socialSlice.js";
import TeamPaymentChoice from "./TeamPaymentChoice.jsx";

const normalize = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  return normalized === "pubg" ? "bgmi" : normalized;
};
const identifier = (value) => String(value?._id || value || "");

const EventTeamPicker = ({ event, onClose, onSelect }) => {
  const dispatch = useDispatch();
  const [teamId, setTeamId] = useState("");
  const [paymentMode, setPaymentMode] = useState("captain_pays");
  const [rewardMode, setRewardMode] = useState("captain_keeps");
  const authUser = useSelector(selectAuthUser);
  const teams = useSelector((state) => state.social.teams);
  const teamsStatus = useSelector((state) => state.social.teamsStatus);
  const currentUserId = identifier(authUser?.userId);
  const eventGameKey = event.game?.key || event.format?.gameKey;
  const isTeamsPending = ["idle", "loading"].includes(teamsStatus);
  const available = teams.filter((team) =>
    team.status === "ready" &&
    identifier(team.createdBy) === currentUserId &&
    team.players?.length === Number(event.format?.teamSize) &&
    normalize(team.gameKey || team.game) === normalize(eventGameKey) &&
    normalize(team.mode) === normalize(event.format?.mode));

  useEffect(() => {
    if (teamsStatus !== "idle") return undefined;
    const request = dispatch(fetchTeams());
    return () => request.abort();
  }, [dispatch, teamsStatus]);

  return (
    <div className="fixed inset-0 z-[500] flex items-end justify-center bg-slate-950/75 p-3 backdrop-blur-sm sm:items-center">
      <section aria-labelledby="event-team-picker-title" aria-modal="true" className="w-full max-w-md rounded-[24px] border border-slate-700 bg-slate-950 p-5 shadow-2xl" role="dialog">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-xs font-black uppercase tracking-wider text-cyan-300">Team entry</p><h2 className="mt-1 text-xl font-black text-white" id="event-team-picker-title">Choose your team</h2></div>
          <button aria-label="Close team selection" className="text-slate-400 hover:text-white" onClick={onClose} type="button">✕</button>
        </div>
        <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
          {isTeamsPending ? <div aria-label="Loading saved teams" className="h-20 animate-pulse rounded-xl bg-slate-800" /> : null}
          {available.map((team) => (
            <button className={`w-full rounded-xl border p-3 text-left ${teamId === team._id ? "border-cyan-300 bg-cyan-300/10" : "border-slate-800 bg-slate-900"}`} key={team._id} onClick={() => setTeamId(team._id)} type="button">
              <strong className="block text-sm text-white">{team.teamName}</strong>
              <span className="text-xs text-slate-400">{team.players.length} players · ready</span>
            </button>
          ))}
          {teamsStatus === "failed" ? <div className="rounded-xl border border-rose-400/20 bg-rose-400/10 p-4 text-center text-sm text-rose-100">Unable to load your saved teams.<button className="mt-3 block w-full font-bold text-cyan-200" onClick={() => dispatch(fetchTeams())} type="button">Retry</button></div> : null}
          {teamsStatus === "succeeded" && !available.length ? <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-sm text-slate-400">No matching ready team you can register.<br/><Link className="mt-3 inline-block font-bold text-cyan-200" onClick={onClose} to={ROUTES.TEAMS}>Create a team</Link></div> : null}
        </div>
        <TeamPaymentChoice
          currency={event.entryTerms?.currency || "INR"}
          entryFeeMinor={event.entryTerms?.entryFeeMinor || 0}
          onChange={setPaymentMode}
          onRewardChange={setRewardMode}
          rewardValue={rewardMode}
          teamSize={Number(event.format?.teamSize || 1)}
          value={paymentMode}
        />
        <button className="mt-4 w-full rounded-xl bg-cyan-300 py-3 text-sm font-black text-slate-950 disabled:opacity-40" disabled={!teamId} onClick={() => onSelect({ paymentMode, rewardMode, teamId })} type="button">Register team</button>
      </section>
    </div>
  );
};

EventTeamPicker.propTypes = {
  event: PropTypes.shape({ entryTerms: PropTypes.object, format: PropTypes.object, game: PropTypes.object }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default EventTeamPicker;
