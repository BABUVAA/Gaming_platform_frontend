import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { TeamPanel } from "./Clan.jsx";
import { fetchGames } from "../store/slices/gameSlice.js";
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

const Teams = () => {
  const dispatch = useDispatch();
  const { summary } = useSelector((store) => store.player);
  const { data: catalogGames = [], status: gamesStatus } = useSelector(
    (store) => store.games,
  );
  const {
    connections,
    connectionsStatus,
    mutationStatus,
    teams,
    teamsStatus,
  } = useSelector((store) => store.social);
  useEffect(() => {
    if (gamesStatus === "idle") dispatch(fetchGames());
    if (connectionsStatus === "idle") dispatch(fetchSocialConnections());
    if (teamsStatus === "idle") dispatch(fetchTeams());
  }, [connectionsStatus, dispatch, gamesStatus, teamsStatus]);

  const inviteCandidates = useMemo(() => {
    const candidates = [...(connections.friends || [])];
    return candidates.filter((item) => String(item._id) !== String(summary?.userId));
  }, [connections.friends, summary?.userId]);

  const refreshTeamsAfter = async (operation) => {
    try {
      await dispatch(operation).unwrap();
      await dispatch(fetchTeams()).unwrap();
    } catch {
      // The shared API thunk already presents the actionable server error.
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <section className="clan-surface">
        <h1 className="text-2xl font-black text-white">Teams</h1>
        <p className="mt-1 text-sm text-slate-400">
          Build lineups with your friends. Clan membership is not required.
        </p>
      </section>

      <TeamPanel
        catalogGames={catalogGames}
        currentUserId={String(summary?.userId || "")}
        inviteCandidates={inviteCandidates}
        isBusy={mutationStatus === "loading"}
        isLoading={["idle", "loading"].includes(teamsStatus)}
        onAcceptInvitation={(teamId) =>
          refreshTeamsAfter(acceptTeamInvitation(teamId))
        }
        onCreateTeam={(team) => refreshTeamsAfter(createTeam(team))}
        onDeclineInvitation={(teamId) =>
          refreshTeamsAfter(declineTeamInvitation(teamId))
        }
        onDisbandTeam={(teamId) => refreshTeamsAfter(disbandTeam(teamId))}
        onInviteMember={(teamId, playerId) =>
          refreshTeamsAfter(inviteTeamMember({ teamId, playerId }))
        }
        onLeaveTeam={(teamId) => refreshTeamsAfter(leaveTeam(teamId))}
        onRemoveMember={(teamId, playerId) =>
          refreshTeamsAfter(removeTeamMember({ teamId, playerId }))
        }
        teams={teams}
      />
    </div>
  );
};

export default Teams;
