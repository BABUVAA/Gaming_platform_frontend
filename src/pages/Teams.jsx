import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiCheck, FiClock, FiPlus, FiUsers } from "react-icons/fi";
import { Button } from "../components";
import { ROUTES } from "../routes/routeConstants.js";
import { fetchGames } from "../store/slices/gameSlice.js";
import { fetchPlayerProfile } from "../store/slices/playerSlice.js";
import {
  acceptTeamInvitation,
  createTeam,
  declineTeamInvitation,
  disbandTeam,
  fetchSocialConnections,
  fetchTeams,
  inviteTeamMember,
  leaveTeam,
  removeTeamMember,
} from "../store/slices/socialSlice.js";

const idOf = (value) => String(value?._id || value || "");

const suggestedSize = (mode) => {
  const normalized = String(mode || "").toLowerCase();
  if (normalized === "duo") return 2;
  if (normalized === "squad") return 4;
  return Number(normalized.match(/^(\d+)v\d+$/)?.[1]) || 2;
};

const Teams = () => {
  const dispatch = useDispatch();
  const {
    error: profileError,
    profile,
    profileStatus,
    summary,
  } = useSelector((store) => store.player);
  const { data: catalogGames = [], status: gamesStatus } = useSelector(
    (store) => store.games,
  );
  const {
    connections,
    connectionsStatus,
    error: socialError,
    mutationStatus,
    teams,
    teamsStatus,
  } = useSelector((store) => store.social);
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({
    gameId: "",
    mode: "",
    teamName: "",
    teamSize: 2,
  });
  const [inviteSelections, setInviteSelections] = useState({});

  useEffect(() => {
    if (gamesStatus === "idle") dispatch(fetchGames());
    if (profileStatus === "idle") dispatch(fetchPlayerProfile());
    if (connectionsStatus === "idle") dispatch(fetchSocialConnections());
    if (teamsStatus === "idle") dispatch(fetchTeams());
  }, [connectionsStatus, dispatch, gamesStatus, profileStatus, teamsStatus]);

  const verifiedGameIds = useMemo(
    () =>
      new Set(
        (profile?.profile?.games || [])
          .filter((account) => account.verificationStatus === "verified")
          .map((account) => idOf(account.game?.id || account.game?._id || account.game)),
      ),
    [profile?.profile?.games],
  );
  const verifiedGames = useMemo(
    () => catalogGames.filter((game) => verifiedGameIds.has(String(game._id))),
    [catalogGames, verifiedGameIds],
  );
  const selectedGame = verifiedGames.find((game) => game._id === draft.gameId);
  const inviteCandidates = useMemo(
    () =>
      (connections.friends || []).filter(
        (friend) => idOf(friend) !== String(summary?.userId || ""),
      ),
    [connections.friends, summary?.userId],
  );
  const teamGroups = useMemo(() => {
    const groups = new Map();
    teams.forEach((team) => {
      const key = team.gameKey || team.gameRef?.link || team.game || "other";
      const current = groups.get(key) || {
        key,
        name: team.gameName || team.gameRef?.name || key,
        teams: [],
      };
      current.teams.push(team);
      groups.set(key, current);
    });
    return [...groups.values()];
  }, [teams]);

  useEffect(() => {
    if (verifiedGames.length === 0) {
      setDraft((current) => ({ ...current, gameId: "", mode: "" }));
      return;
    }
    const game =
      verifiedGames.find((item) => item._id === draft.gameId) || verifiedGames[0];
    if (game._id === draft.gameId && game.supportedModes?.includes(draft.mode)) return;
    const mode = game.supportedModes?.[0] || "";
    setDraft((current) => ({
      ...current,
      gameId: game._id,
      mode,
      teamSize: suggestedSize(mode),
    }));
  }, [draft.gameId, draft.mode, verifiedGames]);

  const refreshTeamsAfter = async (operation) => {
    try {
      await dispatch(operation).unwrap();
      await dispatch(fetchTeams()).unwrap();
      return true;
    } catch {
      return false;
    }
  };

  const updateDraft = (field, value) => {
    setDraft((current) => {
      if (field === "gameId") {
        const game = verifiedGames.find((item) => item._id === value);
        const mode = game?.supportedModes?.[0] || "";
        return { ...current, gameId: value, mode, teamSize: suggestedSize(mode) };
      }
      if (field === "mode") {
        return { ...current, mode: value, teamSize: suggestedSize(value) };
      }
      return { ...current, [field]: value };
    });
  };

  const submitTeam = async (event) => {
    event.preventDefault();
    if (!draft.teamName.trim() || !draft.gameId || !draft.mode) return;
    const created = await refreshTeamsAfter(
      createTeam({
        ...draft,
        teamName: draft.teamName.trim(),
        teamSize: Number(draft.teamSize),
      }),
    );
    if (created) {
      setDraft((current) => ({ ...current, teamName: "" }));
      setCreateOpen(false);
    }
  };

  const loading = [gamesStatus, profileStatus, teamsStatus].some((status) =>
    ["idle", "loading"].includes(status),
  );
  const busy = mutationStatus === "loading";
  const readableError = (error) =>
    typeof error === "string" ? error : error?.message || null;

  return (
    <div className="space-y-3">
      <section className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-3">
        <div>
          <h1 className="text-xl font-black text-white">Teams</h1>
          <p className="text-xs text-slate-500">{teams.length} saved</p>
        </div>
        <button
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-40"
          disabled={loading || verifiedGames.length === 0}
          onClick={() => setCreateOpen((current) => !current)}
          type="button"
        >
          <FiPlus /> {createOpen ? "Close" : "Create team"}
        </button>
      </section>

      {profileStatus === "failed" ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-300/20 bg-rose-300/5 px-4 py-3">
          <p className="text-sm font-semibold text-rose-100">
            {readableError(profileError) || "Unable to check your game accounts."}
          </p>
          <button className="text-xs font-black text-rose-100" onClick={() => dispatch(fetchPlayerProfile())} type="button">Retry</button>
        </section>
      ) : !loading && verifiedGames.length === 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3">
          <p className="text-sm font-semibold text-amber-100">
            Verify a game account before creating a team.
          </p>
          <Link
            className="rounded-lg border border-amber-200/20 px-3 py-2 text-xs font-bold text-amber-100"
            to={ROUTES.GAME_ACCOUNTS}
          >
            Open game accounts
          </Link>
        </section>
      ) : null}

      {createOpen && verifiedGames.length > 0 ? (
        <form
          className="grid gap-3 rounded-xl border border-cyan-300/15 bg-slate-950/80 p-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_.7fr_auto] xl:items-end"
          onSubmit={submitTeam}
        >
          <CompactInput
            label="Team name"
            name="teamName"
            onChange={(event) => updateDraft("teamName", event.target.value)}
            placeholder="Team name"
            required
            type="text"
            value={draft.teamName}
          />
          <CompactSelect label="Game" onChange={(value) => updateDraft("gameId", value)} value={draft.gameId}>
            {verifiedGames.map((game) => (
              <option key={game._id} value={game._id}>{game.name}</option>
            ))}
          </CompactSelect>
          <CompactSelect label="Format" onChange={(value) => updateDraft("mode", value)} value={draft.mode}>
            {(selectedGame?.supportedModes || []).map((mode) => (
              <option key={mode} value={mode}>{mode}</option>
            ))}
          </CompactSelect>
          <CompactInput
            label="Players"
            max="100"
            min="2"
            name="teamSize"
            onChange={(event) => updateDraft("teamSize", event.target.value)}
            required
            type="number"
            value={draft.teamSize}
          />
          <Button
            className="h-11 rounded-lg bg-cyan-300 px-4 text-xs font-black text-slate-950 sm:col-span-2 xl:col-span-1"
            disabled={!draft.gameId || !draft.mode}
            isLoading={busy}
            type="submit"
          >
            Create
          </Button>
        </form>
      ) : null}

      {socialError ? (
        <p className="rounded-xl border border-rose-300/20 bg-rose-300/5 px-4 py-3 text-sm text-rose-100">
          {readableError(socialError)}
        </p>
      ) : null}

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-slate-950/70 p-4 text-sm text-slate-400">Loading teams...</div>
      ) : teamGroups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-slate-950/60 p-5 text-center text-sm text-slate-500">No teams yet.</div>
      ) : (
        teamGroups.map((group) => (
          <section className="rounded-xl border border-white/10 bg-slate-950/65 p-3" key={group.key}>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-black text-white">{group.name}</h2>
              <span className="text-xs text-slate-500">{group.teams.length}</span>
            </div>
            <div className="grid gap-3 lg:grid-cols-2">
              {group.teams.map((team) => (
                <TeamCard
                  busy={busy}
                  currentUserId={String(summary?.userId || "")}
                  inviteCandidates={inviteCandidates}
                  inviteSelection={inviteSelections[team._id] || ""}
                  key={team._id}
                  onAccept={() => refreshTeamsAfter(acceptTeamInvitation(team._id))}
                  onDecline={() => refreshTeamsAfter(declineTeamInvitation(team._id))}
                  onDisband={() => refreshTeamsAfter(disbandTeam(team._id))}
                  onInvite={(playerId) => refreshTeamsAfter(inviteTeamMember({ teamId: team._id, playerId }))}
                  onLeave={() => refreshTeamsAfter(leaveTeam(team._id))}
                  onRemove={(playerId) => refreshTeamsAfter(removeTeamMember({ teamId: team._id, playerId }))}
                  onSelectInvite={(playerId) => setInviteSelections((current) => ({ ...current, [team._id]: playerId }))}
                  team={team}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  );
};

const CompactSelect = ({ children, label, onChange, value }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
    <select
      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    >
      {children}
    </select>
  </label>
);

const CompactInput = ({ label, ...props }) => (
  <label className="block">
    <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
    <input
      className="h-11 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 text-sm text-slate-100 outline-none focus:border-cyan-400"
      {...props}
    />
  </label>
);

const TeamCard = ({ busy, currentUserId, inviteCandidates, inviteSelection, onAccept, onDecline, onDisband, onInvite, onLeave, onRemove, onSelectInvite, team }) => {
  const captainId = idOf(team.createdBy);
  const isCaptain = captainId === currentUserId;
  const acceptedIds = new Set(team.players.map(idOf));
  const pendingIds = new Set(team.pendingInvites.map(idOf));
  const hasAccepted = acceptedIds.has(currentUserId);
  const hasPendingInvite = pendingIds.has(currentUserId);
  const availableMembers = inviteCandidates.filter((member) => {
    const memberId = idOf(member);
    return memberId && !acceptedIds.has(memberId) && !pendingIds.has(memberId);
  });

  return (
    <article className="rounded-xl border border-white/10 bg-slate-900/55 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-black text-white">{team.teamName}</h3>
          <p className="mt-0.5 text-xs capitalize text-slate-500">{team.mode} · {team.players.length}/{team.teamSize}</p>
        </div>
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase ${team.status === "ready" ? "bg-emerald-400/10 text-emerald-300" : "bg-amber-400/10 text-amber-200"}`}>
          {team.status === "ready" ? <FiCheck /> : <FiClock />}{team.status}
        </span>
      </div>

      <div className="mt-3 divide-y divide-white/10 rounded-lg border border-white/10 bg-black/15">
        {team.players.map((player) => {
          const playerId = idOf(player);
          const captain = playerId === captainId;
          return (
            <div className="flex items-center justify-between gap-2 px-3 py-2" key={playerId}>
              <span className="min-w-0 truncate text-sm font-semibold text-slate-200">
                {player.profile?.username || "Player"}
                {captain ? <small className="ml-2 text-[10px] text-cyan-300">Captain</small> : null}
              </span>
              {isCaptain && !captain ? (
                <button className="text-xs font-bold text-rose-300" disabled={busy} onClick={() => onRemove(playerId)} type="button">Remove</button>
              ) : null}
            </div>
          );
        })}
        {team.pendingInvites.map((player) => {
          const playerId = idOf(player);
          return (
            <div className="flex items-center justify-between gap-2 px-3 py-2" key={playerId}>
              <span className="min-w-0 truncate text-sm text-slate-300">
                {player.profile?.username || "Player"}<small className="ml-2 text-[10px] text-amber-200">Invited</small>
              </span>
              {playerId === currentUserId ? (
                <span className="flex gap-2">
                  <button className="text-xs font-bold text-cyan-200" disabled={busy} onClick={onAccept} type="button">Accept</button>
                  <button className="text-xs font-bold text-slate-400" disabled={busy} onClick={onDecline} type="button">Decline</button>
                </span>
              ) : isCaptain ? (
                <button className="text-xs font-bold text-rose-300" disabled={busy} onClick={() => onRemove(playerId)} type="button">Cancel</button>
              ) : null}
            </div>
          );
        })}
      </div>

      {isCaptain && team.status === "forming" && availableMembers.length > 0 ? (
        <div className="mt-3 flex gap-2">
          <select className="h-9 min-w-0 flex-1 rounded-lg border border-slate-800 bg-slate-950 px-2 text-xs text-slate-200" onChange={(event) => onSelectInvite(event.target.value)} value={inviteSelection}>
            <option value="">Invite friend</option>
            {availableMembers.map((member) => (
              <option key={idOf(member)} value={idOf(member)}>{member.username || member.profile?.username || member.playerTag || "Player"}</option>
            ))}
          </select>
          <button className="inline-flex h-9 items-center gap-1 rounded-lg bg-white/10 px-3 text-xs font-bold text-white disabled:opacity-40" disabled={!inviteSelection || busy} onClick={() => onInvite(inviteSelection)} type="button">
            <FiUsers /> Invite
          </button>
        </div>
      ) : null}

      <div className="mt-3 flex justify-end">
        {isCaptain ? (
          <button className="text-xs font-bold text-rose-300" disabled={busy} onClick={onDisband} type="button">Disband</button>
        ) : hasAccepted ? (
          <button className="text-xs font-bold text-rose-300" disabled={busy} onClick={onLeave} type="button">Leave team</button>
        ) : hasPendingInvite ? null : null}
      </div>
    </article>
  );
};

CompactSelect.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

CompactInput.propTypes = {
  label: PropTypes.string.isRequired,
};

TeamCard.propTypes = {
  busy: PropTypes.bool.isRequired,
  currentUserId: PropTypes.string.isRequired,
  inviteCandidates: PropTypes.arrayOf(PropTypes.object).isRequired,
  inviteSelection: PropTypes.string.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  onDisband: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  onSelectInvite: PropTypes.func.isRequired,
  team: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    createdBy: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    mode: PropTypes.string.isRequired,
    pendingInvites: PropTypes.arrayOf(PropTypes.object).isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    status: PropTypes.string.isRequired,
    teamName: PropTypes.string.isRequired,
    teamSize: PropTypes.number.isRequired,
  }).isRequired,
};

export default Teams;
