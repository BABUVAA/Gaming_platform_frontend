import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  createCatalogGame,
  fetchCatalogGames,
  updateCatalogGame,
} from "../../store/slices/adminSlice";

const INITIAL_FORM = {
  link: "",
  name: "",
};

const GameCatalog = () => {
  const dispatch = useDispatch();
  const { catalogGames, isLoading } = useSelector((state) => state.admin);
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    dispatch(fetchCatalogGames());
  }, [dispatch]);

  const updateField = (field, value) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  };

  const createGame = async (event) => {
    event.preventDefault();
    await dispatch(
      createCatalogGame({
        ...form,
      }),
    ).unwrap();
    setForm(INITIAL_FORM);
  };

  const changeGameStatus = (gameId, status) => {
    // Publishing is a deliberate admin action, never an accidental form default.
    dispatch(updateCatalogGame({ gameId, status }));
  };

  return (
    <section className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">Game Setup</p>
        <h2 className="mt-2 text-2xl font-black text-white">Game Catalog</h2>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Create the game identity here. Assign a Game Manager in Role Management to configure how players connect and which formats it supports.
        </p>
      </header>

      <form className="grid gap-4 rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 md:grid-cols-2" onSubmit={createGame}>
        <FormField field="name" form={form} label="Game name" onChange={updateField} />
        <FormField field="link" form={form} label="Stable game key, for example bgmi" onChange={updateField} />
        <button className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 md:col-span-2" disabled={isLoading}>
          Create draft game
        </button>
      </form>

      <section className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6">
        <div className="flex items-center justify-between gap-4"><h3 className="text-lg font-bold text-white">Drafts and published games</h3><span className="text-sm text-slate-500">{catalogGames.length} total</span></div>
        <div className="mt-5 grid gap-4 xl:grid-cols-2">
          {catalogGames.map((game) => <CatalogGameCard game={game} key={game._id} onStatusChange={changeGameStatus} />)}
          {!isLoading && catalogGames.length === 0 && <p className="text-sm text-slate-400">No games have been created yet.</p>}
        </div>
      </section>
    </section>
  );
};

const FormField = ({ field, form, label, onChange, required = true }) => (
  <input className="rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white" onChange={(event) => onChange(field, event.target.value)} placeholder={label} required={required} value={form[field]} />
);

FormField.propTypes = {
  field: PropTypes.string.isRequired,
  form: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  required: PropTypes.bool,
};

const CatalogGameCard = ({ game, onStatusChange }) => (
  <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
    <div className="flex items-start justify-between gap-3"><div><p className="font-bold text-white">{game.name}</p><p className="mt-1 text-xs text-slate-500">{game.id} · /{game.link}</p></div><span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-semibold capitalize text-cyan-200">{game.status}</span></div>
    <p className="mt-4 text-sm text-slate-400">{game.supportedModes.length || 0} modes · {game.supportedMaps.length || 0} maps · {(game.accountConnection?.method || game.verificationMethod || "manual_review").replaceAll("_", " ")}</p>
    <div className="mt-4 flex flex-wrap gap-2">
      {game.status === "draft" && <button className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950" onClick={() => onStatusChange(game._id, "active")} type="button">Review and activate</button>}
      {game.status === "active" && <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200" onClick={() => onStatusChange(game._id, "archived")} type="button">Archive</button>}
      {game.status === "archived" && <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200" onClick={() => onStatusChange(game._id, "draft")} type="button">Return to draft</button>}
    </div>
  </article>
);

CatalogGameCard.propTypes = {
  game: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    id: PropTypes.string,
    link: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    supportedMaps: PropTypes.arrayOf(PropTypes.string).isRequired,
    supportedModes: PropTypes.arrayOf(PropTypes.string).isRequired,
    accountConnection: PropTypes.shape({ method: PropTypes.string }),
    verificationMethod: PropTypes.string,
  }).isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

export default GameCatalog;
