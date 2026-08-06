import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchManagedGames,
  updateManagedGame,
} from "../store/slices/gameManagementSlice";

const toList = (value) => value.split(",").map((item) => item.trim()).filter(Boolean);

const GameManagerDashboard = () => {
  const dispatch = useDispatch();
  const { games, status } = useSelector((state) => state.gameManagement);
  const [editingGameId, setEditingGameId] = useState(null);

  useEffect(() => {
    // The server returns only records included in this manager's assignment scope.
    dispatch(fetchManagedGames());
  }, [dispatch]);

  const saveConfiguration = async (event, game) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await dispatch(updateManagedGame({
      gameId: game._id,
      supportedMaps: toList(form.get("supportedMaps")),
      supportedModes: toList(form.get("supportedModes")),
      accountConnection: {
        instructions: form.get("verificationInstructions"),
        integrationKey: form.get("integrationKey"),
        method: form.get("verificationMethod"),
        supportsStatsSync: form.get("supportsStatsSync") === "on",
      },
    })).unwrap();
    setEditingGameId(null);
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 text-slate-100">
      <header><p className="text-xs uppercase tracking-[0.22em] text-cyan-300">Game workspace</p><h1 className="mt-2 text-3xl font-black">Game Manager</h1><p className="mt-2 text-sm text-slate-400">Update competition and player-verification settings for the games assigned to you. Platform Admin controls game identity and publishing.</p></header>
      <section className="grid gap-5 lg:grid-cols-2">
        {games.map((game) => <GameConfigurationCard editing={editingGameId === game._id} game={game} key={game._id} onSave={saveConfiguration} onToggle={() => setEditingGameId(editingGameId === game._id ? null : game._id)} />)}
        {status === "loading" && <p className="text-slate-400">Loading assigned games...</p>}
        {status !== "loading" && games.length === 0 && <p className="rounded-3xl border border-slate-800 bg-slate-950/90 p-6 text-slate-400">No games are assigned to your Game Manager role yet. Ask a Platform Admin to add game scope in Role Management.</p>}
      </section>
    </main>
  );
};

const GameConfigurationCard = ({ editing, game, onSave, onToggle }) => {
  const connection = game.accountConnection || {
    instructions: game.verificationInstructions || "",
    integrationKey: game.link === "coc" ? "supercell_coc" : "none",
    method: game.verificationMethod || "manual_review",
    supportsStatsSync: game.supportsStatsSync === true,
  };

  return <article className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5"><div className="flex items-start justify-between gap-4"><div><h2 className="font-bold text-white">{game.name}</h2><p className="mt-1 text-xs text-slate-500">{game.id} · {game.status}</p></div><button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200" onClick={onToggle} type="button">{editing ? "Close" : "Edit configuration"}</button></div>{editing && <form className="mt-5 grid gap-3" onSubmit={(event) => onSave(event, game)}><input className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm" defaultValue={game.supportedModes.join(", ")} name="supportedModes" placeholder="Modes, separated by commas" /><input className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm" defaultValue={game.supportedMaps.join(", ")} name="supportedMaps" placeholder="Maps, separated by commas" /><select className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm" defaultValue={connection.method} name="verificationMethod"><option value="manual_review">Manual verification</option><option value="api_token">API token verification</option><option value="not_supported">No account connection</option></select><select className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm" defaultValue={connection.integrationKey} name="integrationKey"><option value="none">No direct integration</option><option value="supercell_coc">Supercell Clash of Clans</option></select><textarea className="min-h-24 rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm" defaultValue={connection.instructions} name="verificationInstructions" placeholder="Player verification instructions" /><label className="text-sm text-slate-300"><input className="mr-2" defaultChecked={connection.supportsStatsSync} name="supportsStatsSync" type="checkbox" />Supports stats sync</label><button className="rounded-xl bg-cyan-300 p-3 text-sm font-bold text-slate-950">Save configuration</button></form>}</article>;
};

GameConfigurationCard.propTypes = {
  editing: PropTypes.bool.isRequired,
  game: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    accountConnection: PropTypes.object,
    id: PropTypes.string,
    link: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    supportedMaps: PropTypes.arrayOf(PropTypes.string).isRequired,
    supportedModes: PropTypes.arrayOf(PropTypes.string).isRequired,
    supportsStatsSync: PropTypes.bool,
    verificationInstructions: PropTypes.string,
    verificationMethod: PropTypes.string,
  }).isRequired,
  onSave: PropTypes.func.isRequired,
  onToggle: PropTypes.func.isRequired,
};

export default GameManagerDashboard;
