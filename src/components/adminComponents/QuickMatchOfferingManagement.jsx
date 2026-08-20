import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  FiEdit3,
  FiPause,
  FiPlay,
  FiPlus,
  FiRefreshCw,
  FiSlash,
} from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { fetchCatalogGames } from "../../store/slices/adminSlice";
import {
  createQuickMatchOffering,
  fetchQuickMatchOfferings,
  updateQuickMatchOffering,
} from "../../store/slices/quickMatchOfferingSlice";
import JoinProgress from "../competition/JoinProgress.jsx";

const createEmptyForm = () => ({
  currency: "INR",
  entryFeeMinor: "0",
  entryPolicy: "free",
  gameId: "",
  map: "",
  maxParticipants: "",
  mode: "",
  prizePoolMinor: "0",
  region: "india",
  schedulePolicy: "on_demand",
  teamSize: "1",
  title: "",
});

const statusStyles = {
  active: "border-emerald-300/25 bg-emerald-300/10 text-emerald-200",
  draft: "border-slate-600 bg-slate-800 text-slate-200",
  paused: "border-amber-300/25 bg-amber-300/10 text-amber-100",
  retired: "border-rose-300/25 bg-rose-300/10 text-rose-100",
};

const toForm = (offering) => ({
  currency: offering.currency,
  entryFeeMinor: String(offering.entryFeeMinor),
  entryPolicy: offering.entryPolicy,
  gameId: offering.game?._id || offering.game,
  map: offering.map || "",
  maxParticipants: String(offering.maxParticipants),
  mode: offering.mode,
  prizePoolMinor: String(offering.prizePoolMinor),
  region: offering.region,
  schedulePolicy: offering.schedulePolicy,
  teamSize: String(offering.teamSize),
  title: offering.title,
});

const OfferingForm = ({
  form,
  games,
  onCancel,
  onChange,
  onSubmit,
  saving,
  title,
}) => {
  const selectedGame = games.find((game) => game._id === form.gameId);
  const isPaid = form.entryPolicy === "paid";

  return (
    <form
      className="space-y-4 rounded-3xl border border-cyan-300/20 bg-[#07111f] p-5"
      onSubmit={onSubmit}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
            Tournament setup
          </p>
          <h2 className="mt-1 text-xl font-black text-white">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            A fixed-capacity tournament creates one match when it fills. Fees
            and prizes are configured in minor units; no player charge is made
            by this screen.
          </p>
        </div>
        {onCancel && (
          <button
            className="text-sm font-bold text-slate-400 hover:text-white"
            onClick={onCancel}
            type="button"
          >
            Cancel
          </button>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Offering title">
          <input
            required
            value={form.title}
            onChange={(event) => onChange("title", event.target.value)}
          />
        </Field>
        <Field label="Game">
          <select
            required
            value={form.gameId}
            onChange={(event) => onChange("gameId", event.target.value)}
          >
            <option value="">Choose active game</option>
            {games.map((game) => (
              <option key={game._id} value={game._id}>
                {game.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Mode">
          <select
            required
            disabled={!selectedGame}
            value={form.mode}
            onChange={(event) => onChange("mode", event.target.value)}
          >
            <option value="">Choose mode</option>
            {selectedGame?.supportedModes?.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Map (optional)">
          <select
            disabled={!selectedGame || selectedGame.supportedMaps.length === 0}
            value={form.map}
            onChange={(event) => onChange("map", event.target.value)}
          >
            <option value="">No map requirement</option>
            {selectedGame?.supportedMaps?.map((map) => (
              <option key={map} value={map}>
                {map}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Team size">
          <input
            min="1"
            required
            type="number"
            value={form.teamSize}
            onChange={(event) => onChange("teamSize", event.target.value)}
          />
        </Field>
        <Field label="Fixed participant seats">
          <input
            min="2"
            required
            type="number"
            value={form.maxParticipants}
            onChange={(event) =>
              onChange("maxParticipants", event.target.value)
            }
          />
        </Field>
        <Field label="Region">
          <input
            required
            value={form.region}
            onChange={(event) => onChange("region", event.target.value)}
          />
        </Field>
        <Field label="Start policy">
          <select
            value={form.schedulePolicy}
            onChange={(event) => onChange("schedulePolicy", event.target.value)}
          >
            <option value="on_demand">Start when full</option>
            <option value="scheduled">Scheduled</option>
          </select>
        </Field>
        <Field label="Entry policy">
          <select
            value={form.entryPolicy}
            onChange={(event) => onChange("entryPolicy", event.target.value)}
          >
            <option value="free">Free</option>
            <option value="paid">Paid</option>
          </select>
        </Field>
        <Field label={`Entry fee (${form.currency} minor units)`}>
          <input
            disabled={!isPaid}
            min="0"
            required
            type="number"
            value={form.entryFeeMinor}
            onChange={(event) => onChange("entryFeeMinor", event.target.value)}
          />
        </Field>
        <Field label={`Prize pool (${form.currency} minor units)`}>
          <input
            min="0"
            required
            type="number"
            value={form.prizePoolMinor}
            onChange={(event) => onChange("prizePoolMinor", event.target.value)}
          />
        </Field>
        <Field label="Currency">
          <input
            maxLength="3"
            required
            value={form.currency}
            onChange={(event) =>
              onChange("currency", event.target.value.toUpperCase())
            }
          />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-3">
        <button
          className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200 disabled:opacity-60"
          disabled={saving}
          name="status"
          type="submit"
          value="draft"
        >
          Save draft
        </button>
        <button
          className="rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
          disabled={saving}
          name="status"
          type="submit"
          value="active"
        >
          {saving ? "Saving..." : "Activate offering"}
        </button>
      </div>
    </form>
  );
};

OfferingForm.propTypes = {
  form: PropTypes.object.isRequired,
  games: PropTypes.arrayOf(PropTypes.object).isRequired,
  onCancel: PropTypes.func,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
};

const Field = ({ children, label }) => (
  <label className="block text-sm font-bold text-slate-300">
    {label}
    <span className="mt-2 block [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-slate-700 [&_input]:bg-slate-950 [&_input]:px-3 [&_input]:py-3 [&_input]:text-white [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-slate-700 [&_select]:bg-slate-950 [&_select]:px-3 [&_select]:py-3 [&_select]:text-white">
      {children}
    </span>
  </label>
);
Field.propTypes = {
  children: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
};

const QuickMatchOfferingManagement = () => {
  const dispatch = useDispatch();
  const { catalogGames = [] } = useSelector((state) => state.admin);
  const { error, offerings, status } = useSelector(
    (state) => state.quickMatchOfferings,
  );
  const [form, setForm] = useState(createEmptyForm);
  const [editing, setEditing] = useState(null);
  const [mode, setMode] = useState("list");
  const [saving, setSaving] = useState(false);
  const activeGames = useMemo(
    () => catalogGames.filter((game) => game.status === "active"),
    [catalogGames],
  );

  useEffect(() => {
    const gamesRequest = dispatch(fetchCatalogGames());
    const offeringRequest = dispatch(fetchQuickMatchOfferings());
    const refreshTimer = window.setInterval(
      () => dispatch(fetchQuickMatchOfferings()),
      5000,
    );
    return () => {
      gamesRequest.abort();
      offeringRequest.abort();
      window.clearInterval(refreshTimer);
    };
  }, [dispatch]);

  const changeForm = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "gameId" ? { map: "", mode: "" } : {}),
      ...(field === "entryPolicy" && value === "free"
        ? { entryFeeMinor: "0" }
        : {}),
    }));
  const closeForm = () => {
    setEditing(null);
    setForm(createEmptyForm());
    setMode("list");
  };
  const submit = async (event) => {
    event.preventDefault();
    const requestedStatus = event.nativeEvent.submitter?.value || "draft";
    const payload = {
      ...form,
      entryFeeMinor:
        form.entryPolicy === "free" ? 0 : Number(form.entryFeeMinor),
      maxParticipants: Number(form.maxParticipants),
      prizePoolMinor: Number(form.prizePoolMinor),
      status: requestedStatus,
      teamSize: Number(form.teamSize),
    };
    if (editing) delete payload.gameId;
    setSaving(true);
    try {
      if (editing)
        await dispatch(
          updateQuickMatchOffering({ ...payload, offeringId: editing._id }),
        ).unwrap();
      else await dispatch(createQuickMatchOffering(payload)).unwrap();
      closeForm();
    } catch {
      // API errors are normalized into the shared toast; keep the form open.
    } finally {
      setSaving(false);
    }
  };
  const changeStatus = async (offering, nextStatus) => {
    setSaving(true);
    try {
      await dispatch(
        updateQuickMatchOffering({
          offeringId: offering._id,
          status: nextStatus,
        }),
      ).unwrap();
    } catch {
      /* Shared toast explains policy failures. */
    } finally {
      setSaving(false);
    }
  };
  const beginEdit = (offering) => {
    setEditing(offering);
    setForm(toForm(offering));
    setMode("edit");
  };

  if (mode !== "list")
    return (
      <OfferingForm
        form={form}
        games={activeGames}
        onCancel={closeForm}
        onChange={changeForm}
        onSubmit={submit}
        saving={saving}
        title={
          editing ? "Edit paused or draft tournament" : "Create tournament"
        }
      />
    );

  return (
    <section className="space-y-5">
      <header className="rounded-3xl border border-slate-800 bg-[radial-gradient(circle_at_top_right,_rgba(34,211,238,0.14),_transparent_38%),#07111f] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Competition configuration
            </p>
            <h2 className="mt-1 text-xl font-black text-white">
              Tournament Management
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Publish fixed-seat tournaments for active catalog games. A live
              tournament must be paused before its competition rules change.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-200"
              disabled={status === "loading"}
              onClick={() => dispatch(fetchQuickMatchOfferings())}
              type="button"
            >
              <FiRefreshCw /> Refresh
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
              onClick={() => setMode("create")}
              type="button"
            >
              <FiPlus /> Create tournament
            </button>
          </div>
        </div>
      </header>
      {error && (
        <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">
          {error}
        </p>
      )}
      <div className="grid gap-4 xl:grid-cols-2">
        {offerings.map((offering) => (
          <article
            className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5"
            key={offering._id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  {offering.game?.name || offering.gameKey}
                </p>
                <h3 className="mt-2 text-lg font-black text-white">
                  {offering.title}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {offering.mode}
                  {offering.map ? ` / ${offering.map}` : ""} /{" "}
                  {offering.teamSize}-player teams / {offering.maxParticipants}{" "}
                  seats
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-bold ${statusStyles[offering.status]}`}
              >
                {offering.status}
              </span>
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Detail
                label="Start"
                value={
                  offering.schedulePolicy === "on_demand"
                    ? "When full"
                    : "Scheduled"
                }
              />
              <Detail label="Region" value={offering.region} />
              <Detail
                label="Entry"
                value={
                  offering.entryPolicy === "free"
                    ? "Free"
                    : `${offering.entryFeeMinor} ${offering.currency} minor`
                }
              />
              <Detail
                label="Prize pool"
                value={`${offering.prizePoolMinor} ${offering.currency} minor`}
              />
            </dl>
            <div className="mt-4">
              <JoinProgress
                capacity={offering.joinProgress?.capacity || offering.maxParticipants}
                joined={offering.joinProgress?.joinedParticipants || 0}
                label="Live seat progress"
                status={offering.joinProgress?.isFull ? "Match generated" : "Queue open"}
              />
            </div>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-800 pt-4">
              {["draft", "paused"].includes(offering.status) && (
                <Action
                  icon={FiEdit3}
                  label="Edit"
                  onClick={() => beginEdit(offering)}
                />
              )}
              {offering.status === "draft" && (
                <Action
                  icon={FiPlay}
                  label="Activate"
                  onClick={() => changeStatus(offering, "active")}
                />
              )}
              {offering.status === "active" && (
                <Action
                  icon={FiPause}
                  label="Pause"
                  onClick={() => changeStatus(offering, "paused")}
                />
              )}
              {offering.status === "paused" && (
                <Action
                  icon={FiPlay}
                  label="Reactivate"
                  onClick={() => changeStatus(offering, "active")}
                />
              )}
              {offering.status !== "retired" && (
                <Action
                  icon={FiSlash}
                  label="Retire"
                  onClick={() => changeStatus(offering, "retired")}
                  tone="danger"
                />
              )}
            </div>
          </article>
        ))}
        {status === "loading" && offerings.length === 0 && (
          <p className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
            Loading tournaments...
          </p>
        )}
        {status !== "loading" && offerings.length === 0 && (
          <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-5 text-sm text-slate-400">
            No tournaments exist yet. Create a draft for an active catalog game,
            then activate it when ready.
          </p>
        )}
      </div>
    </section>
  );
};

const Detail = ({ label, value }) => (
  <div>
    <dt className="text-xs uppercase tracking-[0.14em] text-slate-500">
      {label}
    </dt>
    <dd className="mt-1 font-bold text-slate-200">{value}</dd>
  </div>
);
Detail.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};
const Action = ({ icon: Icon, label, onClick, tone = "default" }) => (
  <button
    className={
      tone === "danger"
        ? "inline-flex items-center gap-2 rounded-xl border border-rose-300/30 px-3 py-2 text-sm font-bold text-rose-100"
        : "inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200"
    }
    disabled={false}
    onClick={onClick}
    type="button"
  >
    <Icon /> {label}
  </button>
);
Action.propTypes = {
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  tone: PropTypes.oneOf(["default", "danger"]),
};

export default QuickMatchOfferingManagement;
