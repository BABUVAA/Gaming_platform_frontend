import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import {
  createCatalogGame,
  fetchCatalogActivity,
  fetchCatalogGames,
  updateCatalogGame,
} from "../../store/slices/adminSlice";
import GameSetupForm from "./GameSetupForm";
import {
  createEmptyGameForm,
  createGameFormFromRecord,
} from "./gameCatalogForm";

const GameCatalog = () => {
  const dispatch = useDispatch();
  const {
    catalogActivity = [],
    catalogGames = [],
    isLoading,
  } = useSelector((state) => state.admin);
  const [createForm, setCreateForm] = useState(createEmptyGameForm);
  const [editForm, setEditForm] = useState(null);
  const [editingGameId, setEditingGameId] = useState(null);
  const [panel, setPanel] = useState("catalog");
  const [ownershipFilter, setOwnershipFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    dispatch(fetchCatalogGames());
    dispatch(fetchCatalogActivity());
  }, [dispatch]);

  const updateForm = (setter, field, value) => {
    setter((currentForm) => {
      const nextForm = { ...currentForm, [field]: value };

      // Only Clash of Clans currently has a direct provider integration. If an
      // admin changes the key, clear provider settings before submission.
      if (
        field === "link" &&
        value.trim().toLowerCase() !== "coc" &&
        currentForm.accountConnection.method === "api_token"
      ) {
        nextForm.accountConnection = {
          ...currentForm.accountConnection,
          integrationKey: "none",
          method: "manual_review",
          supportsStatsSync: false,
        };
      }
      return nextForm;
    });
  };

  const refreshHistory = () => dispatch(fetchCatalogActivity());

  const createGame = async (event) => {
    event.preventDefault();
    const status = event.nativeEvent.submitter?.value || "draft";
    await dispatch(createCatalogGame({ ...createForm, status })).unwrap();
    setCreateForm(createEmptyGameForm());
    setPanel("catalog");
    refreshHistory();
  };

  const startEditing = (game) => {
    setEditingGameId(game._id);
    setEditForm(createGameFormFromRecord(game));
    setPanel("edit");
  };

  const saveGameConfiguration = async (event) => {
    event.preventDefault();
    const changes = { ...editForm };
    // The stable key is immutable and therefore never belongs in PATCH data.
    delete changes.link;
    await dispatch(
      updateCatalogGame({ gameId: editingGameId, ...changes }),
    ).unwrap();
    setEditForm(null);
    setEditingGameId(null);
    setPanel("catalog");
    refreshHistory();
  };

  const changeGameStatus = async (gameId, status) => {
    // The server repeats readiness validation, so UI state cannot authorize publishing.
    await dispatch(updateCatalogGame({ gameId, status })).unwrap();
    refreshHistory();
  };

  const visibleGames = catalogGames.filter((game) => {
    const matchesSearch = `${game.name} ${game.link}`
      .toLowerCase()
      .includes(search.trim().toLowerCase());
    return (
      matchesSearch &&
      (statusFilter === "all" || game.status === statusFilter) &&
      (ownershipFilter === "all" ||
        (ownershipFilter === "owned" && game.hasActiveManager) ||
        (ownershipFilter === "unowned" && !game.hasActiveManager))
    );
  });
  const editingGame = catalogGames.find((game) => game._id === editingGameId);

  return (
    <section className="space-y-6">
      <div className="flex justify-end">
        <button
          className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950"
          onClick={() => setPanel("create")}
          type="button"
        >
          Create game
        </button>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-slate-800 pb-4">
        <PanelButton
          active={panel === "catalog"}
          label="Catalog"
          onClick={() => setPanel("catalog")}
        />
        <PanelButton
          active={panel === "create"}
          label="Create game"
          onClick={() => setPanel("create")}
        />
        <PanelButton
          active={panel === "history"}
          label="Game history"
          onClick={() => setPanel("history")}
        />
      </nav>

      {panel === "create" && (
        <WorkspacePanel
          description="Configure the usable game definition now. You can keep it private as a draft or publish it immediately when ready."
          title="Create a platform game"
        >
          <GameSetupForm
            actions={
              <>
                <button
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200"
                  disabled={isLoading}
                  type="submit"
                  value="draft"
                >
                  Save private draft
                </button>
                <button
                  className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"
                  disabled={isLoading}
                  type="submit"
                  value="active"
                >
                  Create and publish
                </button>
              </>
            }
            form={createForm}
            mode="create"
            onChange={(field, value) => updateForm(setCreateForm, field, value)}
            onSubmit={createGame}
          />
        </WorkspacePanel>
      )}

      {panel === "edit" && editForm && editingGame && (
        <WorkspacePanel
          description={`Update ${editingGame.name}. Active games must remain complete after every change.`}
          title="Edit game setup"
        >
          <GameSetupForm
            actions={
              <>
                <button
                  className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200"
                  onClick={() => setPanel("catalog")}
                  type="button"
                >
                  Cancel
                </button>
                <button
                  className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950"
                  disabled={isLoading}
                  type="submit"
                >
                  Save game setup
                </button>
              </>
            }
            form={editForm}
            mode="edit"
            onChange={(field, value) => updateForm(setEditForm, field, value)}
            onSubmit={saveGameConfiguration}
          />
        </WorkspacePanel>
      )}

      {panel === "catalog" && (
        <section className="rounded-[28px] border border-slate-800 bg-[#07111f] p-5 shadow-[0_18px_50px_rgba(2,8,23,0.32)] lg:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">Control board</p>
              <h3 className="mt-1 text-xl font-black text-white">Platform games</h3>
              <p className="mt-1 text-sm text-slate-500">
                Publishing readiness and manager ownership are tracked
                separately.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search games"
                value={search}
              />
              <select
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
              <select
                className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white"
                onChange={(event) => setOwnershipFilter(event.target.value)}
                value={ownershipFilter}
              >
                <option value="all">All ownership</option>
                <option value="owned">Manager assigned</option>
                <option value="unowned">Needs manager</option>
              </select>
            </div>
          </div>
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {visibleGames.map((game) => (
              <CatalogGameCard
                game={game}
                key={game._id}
                onEdit={() => startEditing(game)}
                onStatusChange={changeGameStatus}
              />
            ))}
            {!isLoading && visibleGames.length === 0 && (
              <p className="rounded-2xl border border-dashed border-slate-800 p-8 text-sm text-slate-500">
                No games match these filters.
              </p>
            )}
          </div>
        </section>
      )}

      {panel === "history" && <GameHistory activity={catalogActivity} />}
    </section>
  );
};

const WorkspacePanel = ({ children, description, title }) => (
  <section className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6">
    <div className="mb-6">
      <h3 className="text-xl font-black text-white">{title}</h3>
      <p className="mt-2 max-w-3xl text-sm text-slate-400">{description}</p>
    </div>
    {children}
  </section>
);

const Metric = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-3 text-center">
    <p className="text-xl font-black text-cyan-100">{value}</p>
    <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
      {label}
    </p>
  </div>
);

const PanelButton = ({ active, label, onClick }) => (
  <button
    className={
      active
        ? "rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"
        : "rounded-xl px-4 py-2 text-sm font-bold text-slate-400 hover:bg-slate-900"
    }
    onClick={onClick}
    type="button"
  >
    {label}
  </button>
);

const GameHistory = ({ activity }) => (
  <section className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6">
    <h3 className="text-lg font-black text-white">Game activity</h3>
    <p className="mt-1 text-sm text-slate-400">
      Draft creation, configuration, publication, and lifecycle decisions.
    </p>
    <div className="mt-5 space-y-3">
      {activity.map((item) => (
        <article
          className="flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between"
          key={item._id}
        >
          <div>
            <p className="font-bold capitalize text-white">
              {item.action.replaceAll("_", " ").toLowerCase()}
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {item.actor?.profile?.username ||
                item.actor?.email ||
                "Unknown staff"}{" "}
              / {item.metadata?.gameId || "game"} /{" "}
              {item.metadata?.status || ""}
            </p>
          </div>
          <time className="text-xs text-slate-500">
            {new Date(item.createdAt).toLocaleString()}
          </time>
        </article>
      ))}
      {activity.length === 0 && (
        <p className="text-sm text-slate-500">
          No game activity has been recorded.
        </p>
      )}
    </div>
  </section>
);

const CatalogGameCard = ({ game, onEdit, onStatusChange }) => {
  const readiness = game.activationReadiness || { checks: [], ready: false };
  // A restarted frontend can briefly receive an older backend payload during
  // local development or rollout. Ownership remains readable in both shapes.
  const activeManagers = game.activeManagers || [];
  const hasActiveManager =
    game.hasActiveManager === true || activeManagers.length > 0;
  const connectionMethod =
    game.accountConnection?.method ||
    game.verificationMethod ||
    "manual_review";

  return (
    <article className="rounded-2xl border border-slate-800 bg-slate-900/50 p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-bold text-white">{game.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {game.id} / {game.link}
          </p>
        </div>
        <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2 py-1 text-xs font-semibold capitalize text-cyan-200">
          {game.status}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {game.supportedModes.map((mode) => (
          <span
            className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-300"
            key={mode}
          >
            {mode}
          </span>
        ))}
        {game.supportedModes.length === 0 && (
          <span className="text-xs text-slate-600">No modes configured</span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        <InfoCell label="Maps" value={String(game.supportedMaps.length)} />
        <InfoCell
          label="Connection"
          value={connectionMethod.replaceAll("_", " ")}
        />
      </div>

      <div
        className={
          hasActiveManager
            ? "mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3"
            : "mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3"
        }
      >
        <p
          className={
            hasActiveManager
              ? "text-xs font-bold text-emerald-300"
              : "text-xs font-bold text-amber-200"
          }
        >
          {hasActiveManager
            ? `Game Manager${activeManagers.length === 1 ? "" : "s"} assigned`
            : "No Game Manager assigned"}
        </p>
        {hasActiveManager && activeManagers.length > 0 && (
          <p className="mt-1 text-xs text-slate-400">
            {activeManagers.map((manager) => manager.name).join(", ")}
          </p>
        )}
        {!hasActiveManager && (
          <p className="mt-1 text-xs text-slate-500">
            This does not block publishing. Assign ownership from Role
            Management.
          </p>
        )}
      </div>

      {game.status === "draft" && (
        <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Publishing checklist
          </p>
          <div className="mt-3 space-y-2">
            {readiness.checks.map((check) => (
              <p
                className={
                  check.complete
                    ? "text-xs text-emerald-300"
                    : "text-xs text-slate-500"
                }
                key={check.code}
              >
                {check.complete ? "Ready" : "Needed"}: {check.label}
              </p>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
          onClick={onEdit}
          type="button"
        >
          Edit setup
        </button>
        {game.status === "draft" && (
          <button
            className="rounded-lg bg-cyan-300 px-3 py-2 text-xs font-bold text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            disabled={!readiness.ready}
            onClick={() => onStatusChange(game._id, "active")}
            type="button"
          >
            Publish game
          </button>
        )}
        {game.status === "active" && (
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
            onClick={() => onStatusChange(game._id, "archived")}
            type="button"
          >
            Archive
          </button>
        )}
        {game.status === "archived" && (
          <button
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold text-slate-200"
            onClick={() => onStatusChange(game._id, "draft")}
            type="button"
          >
            Return to draft
          </button>
        )}
      </div>
    </article>
  );
};

const InfoCell = ({ label, value }) => (
  <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
    <p className="uppercase tracking-wider text-slate-600">{label}</p>
    <p className="mt-1 capitalize text-slate-300">{value}</p>
  </div>
);

WorkspacePanel.propTypes = {
  children: PropTypes.node.isRequired,
  description: PropTypes.string.isRequired,
  title: PropTypes.string.isRequired,
};

Metric.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.number.isRequired,
};

PanelButton.propTypes = {
  active: PropTypes.bool.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

GameHistory.propTypes = {
  activity: PropTypes.arrayOf(PropTypes.object).isRequired,
};

CatalogGameCard.propTypes = {
  game: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    accountConnection: PropTypes.shape({ method: PropTypes.string }),
    activationReadiness: PropTypes.shape({
      checks: PropTypes.arrayOf(
        PropTypes.shape({
          code: PropTypes.string.isRequired,
          complete: PropTypes.bool.isRequired,
          label: PropTypes.string.isRequired,
        }),
      ).isRequired,
      ready: PropTypes.bool.isRequired,
    }),
    activeManagers: PropTypes.arrayOf(
      PropTypes.shape({
        _id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
    hasActiveManager: PropTypes.bool,
    id: PropTypes.string,
    link: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    supportedMaps: PropTypes.arrayOf(PropTypes.string).isRequired,
    supportedModes: PropTypes.arrayOf(PropTypes.string).isRequired,
    verificationMethod: PropTypes.string,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  onStatusChange: PropTypes.func.isRequired,
};

InfoCell.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default GameCatalog;
