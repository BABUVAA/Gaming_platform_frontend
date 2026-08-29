import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiCheck, FiClock, FiPlus, FiUsers } from "react-icons/fi";
import { Button } from "../components";
import { fetchGames } from "../store/slices/gameSlice.js";
import {
  acceptTeamInvitation,
  createTeam,
  declineTeamInvitation,
  disbandTeam,
  fetchSocialConnections,
  fetchTeams,
  inviteTeamMembers,
  leaveTeam,
  removeTeamMember,
} from "../store/slices/socialSlice.js";

const idOf = (value) => String(value?._id || value || "");

const teamSizeForMode = (mode) => {
  const normalized = String(mode || "").toLowerCase();
  if (normalized === "solo") return 1;
  if (normalized === "duo") return 2;
  if (normalized === "squad") return 4;
  const versusMatch = normalized.match(/^(\d+)v(\d+)$/);
  return versusMatch && versusMatch[1] === versusMatch[2]
    ? Number(versusMatch[1])
    : null;
};

const teamModesForGame = (game) =>
  (game?.supportedModes || []).filter((mode) => teamSizeForMode(mode) >= 2);

const Teams = () => {
  const dispatch = useDispatch();
  const { summary } = useSelector((store) => store.player);
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
  });

  useEffect(() => {
    if (gamesStatus === "idle") dispatch(fetchGames());
    if (connectionsStatus === "idle") dispatch(fetchSocialConnections());
    if (teamsStatus === "idle") dispatch(fetchTeams());
  }, [connectionsStatus, dispatch, gamesStatus, teamsStatus]);

  const teamGames = useMemo(
    () =>
      catalogGames.filter(
        (game) => teamModesForGame(game).length > 0,
      ),
    [catalogGames],
  );
  const selectedGame = teamGames.find((game) => game._id === draft.gameId);
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
    if (teamGames.length === 0) {
      setDraft((current) => ({ ...current, gameId: "", mode: "" }));
      return;
    }
    const game =
      teamGames.find((item) => item._id === draft.gameId) || teamGames[0];
    const teamModes = teamModesForGame(game);
    if (game._id === draft.gameId && teamModes.includes(draft.mode)) return;
    const mode = teamModes[0] || "";
    setDraft((current) => ({
      ...current,
      gameId: game._id,
      mode,
    }));
  }, [draft.gameId, draft.mode, teamGames]);

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
        const game = teamGames.find((item) => item._id === value);
        const mode = teamModesForGame(game)[0] || "";
        return { ...current, gameId: value, mode };
      }
      if (field === "mode") {
        return { ...current, mode: value };
      }
      return { ...current, [field]: value };
    });
  };

  const submitTeam = async (event) => {
    event.preventDefault();
    if (!draft.teamName.trim() || !draft.gameId || !draft.mode) return;
    const created = await refreshTeamsAfter(
      createTeam({
        gameId: draft.gameId,
        mode: draft.mode,
        teamName: draft.teamName.trim(),
      }),
    );
    if (created) {
      setDraft((current) => ({ ...current, teamName: "" }));
      setCreateOpen(false);
    }
  };

  const loading = [gamesStatus, teamsStatus].some((status) =>
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
          disabled={loading || teamGames.length === 0}
          onClick={() => setCreateOpen((current) => !current)}
          type="button"
        >
          <FiPlus /> {createOpen ? "Close" : "Create team"}
        </button>
      </section>

      {!loading && teamGames.length === 0 ? (
        <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-300/20 bg-amber-300/5 px-4 py-3">
          <p className="text-sm font-semibold text-amber-100">
            No active games currently offer a team format.
          </p>
        </section>
      ) : null}

      {createOpen && teamGames.length > 0 ? (
        <form
          className="grid gap-3 rounded-xl border border-cyan-300/15 bg-slate-950/80 p-3 sm:grid-cols-2 xl:grid-cols-[1.2fr_1fr_1fr_auto] xl:items-end"
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
            {teamGames.map((game) => (
              <option key={game._id} value={game._id}>{game.name}</option>
            ))}
          </CompactSelect>
          <CompactSelect label="Format" onChange={(value) => updateDraft("mode", value)} value={draft.mode}>
            {teamModesForGame(selectedGame).map((mode) => (
              <option key={mode} value={mode}>{mode} · {teamSizeForMode(mode)} players</option>
            ))}
          </CompactSelect>
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
                  key={team._id}
                  onAccept={() => refreshTeamsAfter(acceptTeamInvitation(team._id))}
                  onDecline={() => refreshTeamsAfter(declineTeamInvitation(team._id))}
                  onDisband={() => refreshTeamsAfter(disbandTeam(team._id))}
                  onInvite={(playerIds) => refreshTeamsAfter(inviteTeamMembers({ teamId: team._id, playerIds }))}
                  onLeave={() => refreshTeamsAfter(leaveTeam(team._id))}
                  onRemove={(playerId) => refreshTeamsAfter(removeTeamMember({ teamId: team._id, playerId }))}
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

const TeamCard = ({ busy, currentUserId, inviteCandidates, onAccept, onDecline, onDisband, onInvite, onLeave, onRemove, team }) => {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
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
  const remainingSlots = Math.max(
    0,
    team.teamSize - team.players.length - team.pendingInvites.length,
  );
  const toggleCandidate = (playerId) => {
    setSelectedIds((current) =>
      current.includes(playerId)
        ? current.filter((value) => value !== playerId)
        : current.length < remainingSlots
          ? [...current, playerId]
          : current,
    );
  };
  const submitInvites = async () => {
    if (selectedIds.length === 0) return;
    if (await onInvite(selectedIds)) {
      setSelectedIds([]);
      setInviteOpen(false);
    }
  };

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

      {isCaptain && team.status === "forming" && remainingSlots > 0 && availableMembers.length > 0 ? (
        <div className="mt-3">
          <button className="inline-flex h-9 items-center gap-1 rounded-lg bg-white/10 px-3 text-xs font-bold text-white" onClick={() => setInviteOpen((current) => !current)} type="button">
            <FiUsers /> Invite players
          </button>
          {inviteOpen ? (
            <div className="mt-2 overflow-hidden rounded-lg border border-white/10 bg-slate-950/80">
              <div className="max-h-44 divide-y divide-white/10 overflow-y-auto">
                {availableMembers.map((member) => {
                  const playerId = idOf(member);
                  const selected = selectedIds.includes(playerId);
                  const selectionFull = selectedIds.length >= remainingSlots;
                  return (
                    <label className="flex cursor-pointer items-center gap-3 px-3 py-2" key={playerId}>
                      <input
                        checked={selected}
                        className="h-4 w-4 accent-cyan-300"
                        disabled={!selected && selectionFull}
                        onChange={() => toggleCandidate(playerId)}
                        type="checkbox"
                      />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-200">
                        {member.username || member.profile?.username || member.playerTag || "Player"}
                      </span>
                    </label>
                  );
                })}
              </div>
              <div className="flex items-center justify-between border-t border-white/10 px-3 py-2">
                <span className="text-xs text-slate-500">{selectedIds.length}/{remainingSlots} selected</span>
                <button className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-black text-slate-950 disabled:opacity-40" disabled={selectedIds.length === 0 || busy} onClick={submitInvites} type="button">Invite selected</button>
              </div>
            </div>
          ) : null}
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
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  onDisband: PropTypes.func.isRequired,
  onInvite: PropTypes.func.isRequired,
  onLeave: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  team: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    createdBy: PropTypes.oneOfType([PropTypes.string, PropTypes.object]).isRequired,
    gameRef: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    mode: PropTypes.string.isRequired,
    pendingInvites: PropTypes.arrayOf(PropTypes.object).isRequired,
    players: PropTypes.arrayOf(PropTypes.object).isRequired,
    status: PropTypes.string.isRequired,
    teamName: PropTypes.string.isRequired,
    teamSize: PropTypes.number.isRequired,
  }).isRequired,
};

export default Teams;
