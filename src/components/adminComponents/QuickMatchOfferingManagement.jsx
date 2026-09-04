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
import {
  createQuickMatchOffering,
  fetchQuickMatchOfferings,
  fetchTournamentManagerGames,
  updateQuickMatchOffering,
} from "../../store/slices/quickMatchOfferingSlice";
import StaffWorkspaceHeader from "../common/StaffWorkspaceHeader.jsx";
import useStaffWorkspaceTab from "../../hooks/useStaffWorkspaceTab.js";

const TOURNAMENT_MANAGER_WORKSPACE_TABS = [
  "overview",
  "create",
  "ready",
  "live",
  "history",
];

const createEmptyForm = () => ({
  currency: "INR",
  entryFeeMinor: "0",
  entryPolicy: "free",
  gameId: "",
  gameAccountVerificationWaiverEndsAt: "",
  map: "",
  maxParticipants: "",
  minimumParticipants: "",
  mode: "",
  prizePoolMinor: "0",
  rewardPolicy: "winner_split",
  placementRewards: [{ place: 1, amountMinor: "0" }],
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

const formatTeamSize = (teamSize) => {
  const size = Number(teamSize);
  if (size === 1) return "Solo";
  if (size === 2) return "Duo";
  if (size === 4) return "Squad";
  return `${size}-player team`;
};

const formatOfferingFacts = (offering) => {
  const labels = [offering.mode, offering.map, formatTeamSize(offering.teamSize)]
    .filter(Boolean)
    .reduce((unique, label) => {
      const key = String(label).toLowerCase();
      if (!unique.has(key)) unique.set(key, label);
      return unique;
    }, new Map());
  return [...labels.values()].join(" / ");
};

const toLocalDateTimeInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
};

const toForm = (offering) => ({
  currency: offering.currency,
  entryFeeMinor: String(offering.entryFeeMinor),
  entryPolicy: offering.entryPolicy,
  gameId: offering.game?._id || offering.game,
  gameAccountVerificationWaiverEndsAt: toLocalDateTimeInput(
    offering.gameAccountVerificationWaiverEndsAt,
  ),
  map: offering.map || "",
  maxParticipants: String(offering.maxParticipants),
  minimumParticipants: offering.minimumParticipants == null ? "" : String(offering.minimumParticipants),
  mode: offering.mode,
  prizePoolMinor: String(offering.prizePoolMinor),
  rewardPolicy: offering.rewardPolicy || "winner_split",
  placementRewards: (offering.placementRewards?.length ? offering.placementRewards : [{ place: 1, amountMinor: offering.prizePoolMinor }])
    .map((row) => ({ place: row.place, amountMinor: String(row.amountMinor) })),
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
  const usesPlacements = form.rewardPolicy === "placement";
  const updatePlacement = (index, value) => onChange(
    "placementRewards",
    form.placementRewards.map((row, rowIndex) => rowIndex === index ? { ...row, amountMinor: value } : row),
  );

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
        <Field label="Minimum seats for early room closure (optional)">
          <input
            min={Math.max(2, Number(form.teamSize) * 2)}
            max={form.maxParticipants || undefined}
            step={Number(form.teamSize) || 1}
            type="number"
            value={form.minimumParticipants}
            onChange={(event) => onChange("minimumParticipants", event.target.value)}
          />
          <p className="mt-2 text-xs font-normal text-slate-400">
            Leave blank for two complete teams (or all rewarded places, if greater).
            A manager may close a room early; every team must remain complete and prizes stay unchanged.
          </p>
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
        <Field label="Allow unverified game accounts until (optional)">
          <input
            disabled={isPaid}
            min={toLocalDateTimeInput(new Date())}
            type="datetime-local"
            value={form.gameAccountVerificationWaiverEndsAt}
            onChange={(event) =>
              onChange(
                "gameAccountVerificationWaiverEndsAt",
                event.target.value,
              )
            }
          />
          <small className="mt-2 block text-xs font-medium text-slate-500">
            Free offerings only. Verification becomes required again automatically at this time.
          </small>
        </Field>
        <Field label="Reward rule">
          <select value={form.rewardPolicy} onChange={(event) => onChange("rewardPolicy", event.target.value)}>
            <option value="winner_split">Split one pool between winners</option>
            <option value="placement">Place-wise rewards</option>
          </select>
        </Field>
        {!usesPlacements ? <Field label={`Prize pool (${form.currency} minor units)`}>
          <input
            min="0"
            required
            type="number"
            value={form.prizePoolMinor}
            onChange={(event) => onChange("prizePoolMinor", event.target.value)}
          />
        </Field> : <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/50 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-black text-white">Place rewards ({form.currency} minor units)</p>
            <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-bold" disabled={form.placementRewards.length >= 100} onClick={() => onChange("placementRewards", [...form.placementRewards, { place: form.placementRewards.length + 1, amountMinor: "0" }])} type="button">Add place</button>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {form.placementRewards.map((row, index) => <label className="flex items-center gap-3 rounded-xl border border-slate-800 p-3 text-sm font-bold" key={row.place}>
              <span className="w-16 text-cyan-200">#{row.place}</span>
              <input className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" min="1" required type="number" value={row.amountMinor} onChange={(event) => updatePlacement(index, event.target.value)} />
              {form.placementRewards.length > 1 ? <button aria-label={`Remove place ${row.place}`} className="text-rose-200" onClick={() => onChange("placementRewards", form.placementRewards.filter((_, rowIndex) => rowIndex !== index).map((item, rowIndex) => ({ ...item, place: rowIndex + 1 })))} type="button">Remove</button> : null}
            </label>)}
          </div>
          {Number(form.teamSize) > 1 ? <p className="mt-3 text-xs text-slate-400">Each place is a team total and is split across that team&apos;s verified members.</p> : null}
        </div>}
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
  const { error, games, offerings, status } = useSelector(
    (state) => state.quickMatchOfferings,
  );
  const [form, setForm] = useState(createEmptyForm);
  const [editing, setEditing] = useState(null);
  const [section, setSection] = useStaffWorkspaceTab(
    TOURNAMENT_MANAGER_WORKSPACE_TABS,
    "overview",
  );
  const [saving, setSaving] = useState(false);
  const activeGames = useMemo(
    () => games.filter((game) => game.status === "active"),
    [games],
  );

  useEffect(() => {
    const gamesRequest = dispatch(fetchTournamentManagerGames());
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

  useEffect(() => {
    if (section === "create") return;
    setEditing(null);
    setForm(createEmptyForm());
  }, [section]);

  const changeForm = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
      ...(field === "gameId" ? { map: "", mode: "" } : {}),
      ...(field === "entryPolicy" && value === "free"
        ? { entryFeeMinor: "0" }
        : {}),
      ...(field === "entryPolicy" && value === "paid"
        ? { gameAccountVerificationWaiverEndsAt: "" }
        : {}),
    }));
  const closeForm = (nextSection = editing ? "ready" : "overview") => {
    setEditing(null);
    setForm(createEmptyForm());
    setSection(nextSection);
  };
  const submit = async (event) => {
    event.preventDefault();
    const requestedStatus = event.nativeEvent.submitter?.value || "draft";
    const payload = {
      ...form,
      entryFeeMinor:
        form.entryPolicy === "free" ? 0 : Number(form.entryFeeMinor),
      gameAccountVerificationWaiverEndsAt:
        form.entryPolicy === "free" &&
        form.gameAccountVerificationWaiverEndsAt
          ? new Date(form.gameAccountVerificationWaiverEndsAt).toISOString()
          : null,
      maxParticipants: Number(form.maxParticipants),
      minimumParticipants: form.minimumParticipants === "" ? null : Number(form.minimumParticipants),
      prizePoolMinor: Number(form.prizePoolMinor),
      placementRewards: form.rewardPolicy === "placement"
        ? form.placementRewards.map((row, index) => ({ place: index + 1, amountMinor: Number(row.amountMinor) }))
        : [],
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
      closeForm(requestedStatus === "active" ? "live" : "ready");
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
    setSection("create");
  };

  const openSection = (nextSection) => {
    setEditing(null);
    setForm(createEmptyForm());
    setSection(nextSection);
  };
  const readyOfferings = offerings.filter((offering) =>
    ["draft", "paused"].includes(offering.status),
  );
  const liveOfferings = offerings.filter(
    (offering) => offering.status === "active",
  );
  const historyOfferings = offerings.filter(
    (offering) => offering.status === "retired",
  );
  const listContent = {
    ready: {
      description: "Edit setup, activate drafts, or resume paused tournaments.",
      empty: "No drafts or paused tournaments need setup.",
      offerings: readyOfferings,
      title: "Drafts & paused",
    },
    live: {
      description: "Monitor entry progress and pause or retire live tournaments.",
      empty: "No tournaments are currently live.",
      offerings: liveOfferings,
      title: "Live tournaments",
    },
    history: {
      description: "Read-only record of retired tournament configurations.",
      empty: "No retired tournaments are in history.",
      offerings: historyOfferings,
      title: "Tournament history",
    },
  }[section];
  const nextOffering = readyOfferings[0] || liveOfferings[0];

  return (
    <section className="space-y-4">
      <StaffWorkspaceHeader description="Quick Match offerings, rooms and rewards." title="Tournament Manager" />
      <div className="min-w-0 space-y-5">
      {section === "create" ? (
        <OfferingForm
          form={form}
          games={activeGames}
          onCancel={() => closeForm()}
          onChange={changeForm}
          onSubmit={submit}
          saving={saving}
          title={editing ? "Edit paused or draft tournament" : "Create tournament"}
        />
      ) : section === "overview" ? (
        <>
          <section className="rounded-2xl border border-cyan-300/20 bg-[#07111f] p-4">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
              Next action
            </p>
            <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">
                  {nextOffering
                    ? nextOffering.title
                    : "Create your first tournament"}
                </h2>
                <p className="mt-1 text-sm text-slate-400">
                  {readyOfferings.length
                    ? "A draft or paused tournament is waiting for a launch decision."
                    : liveOfferings.length
                      ? "Review current entry progress and keep the live tournament healthy."
                      : "Build the entry, format, schedule, and reward rules players will see."}
                </p>
              </div>
              <button
                className="rounded-xl bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950"
                onClick={() =>
                  openSection(
                    readyOfferings.length
                      ? "ready"
                      : liveOfferings.length
                        ? "live"
                        : "create",
                  )
                }
                type="button"
              >
                {readyOfferings.length
                  ? "Review setup"
                  : liveOfferings.length
                    ? "Monitor live"
                    : "Create tournament"}
              </button>
            </div>
          </section>
          <section className="grid gap-3 md:grid-cols-3">
            {[
              {
                count: readyOfferings.length,
                description: "Configure and launch",
                id: "ready",
                label: "Drafts & paused",
              },
              {
                count: liveOfferings.length,
                description: "Monitor registration",
                id: "live",
                label: "Live tournaments",
              },
              {
                count: historyOfferings.length,
                description: "Review retired records",
                id: "history",
                label: "History",
              },
            ].map((item) => (
              <button
                className="rounded-2xl border border-slate-800 bg-slate-950/55 p-4 text-left hover:border-cyan-300/40"
                key={item.id}
                onClick={() => openSection(item.id)}
                type="button"
              >
                <span className="text-2xl font-black text-white">{item.count}</span>
                <span className="mt-2 block font-bold text-cyan-100">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-400">{item.description}</span>
              </button>
            ))}
          </section>
        </>
      ) : listContent ? (
        <>
      <header className="rounded-2xl border border-slate-800 bg-slate-950/55 p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-black text-white">{listContent.title}</h2>
            <p className="mt-1 text-xs text-slate-400">{listContent.description}</p>
          </div>
          <div className="flex gap-2">
            <button
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200"
              disabled={status === "loading"}
              onClick={() => dispatch(fetchQuickMatchOfferings())}
              type="button"
            >
              <FiRefreshCw /> Refresh
            </button>
            {section === "ready" && (
              <button
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950"
                onClick={() => openSection("create")}
                type="button"
              >
                <FiPlus /> Create tournament
              </button>
            )}
          </div>
        </div>
      </header>
      {error && (
        <p className="rounded-2xl border border-rose-300/30 bg-rose-300/10 p-4 text-sm text-rose-100">
          {error}
        </p>
      )}
      <div className="space-y-2">
        {listContent.offerings.map((offering) => (
          <article
            className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"
            key={offering._id}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">
                  {offering.game?.name || offering.gameKey}
                </p>
                <h3 className="mt-1 font-black text-white">
                  {offering.title}
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  {formatOfferingFacts(offering)}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-bold ${statusStyles[offering.status]}`}
              >
                {offering.status}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
              <span>{offering.schedulePolicy === "on_demand" ? "Starts when full" : "Scheduled start"}</span>
              <span>{offering.entryPolicy === "free" ? "Free entry" : `${offering.entryFeeMinor} ${offering.currency} minor entry`}</span>
              <span>{offering.rewardPolicy === "placement" ? "Place rewards" : "Winner pool"}</span>
              <span>{offering.gameAccountVerificationWaiverEndsAt && new Date(offering.gameAccountVerificationWaiverEndsAt) > new Date() ? "Verification temporarily waived" : "Verification required"}</span>
              <span className="font-bold text-cyan-200">Room filling: {offering.joinProgress?.joinedParticipants || 0}/{offering.joinProgress?.capacity || offering.maxParticipants}</span>
            </div>
            {section !== "history" && (
            <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-800 pt-3">
              {["draft", "paused"].includes(offering.status) && (
                <Action
                  disabled={saving}
                  icon={FiEdit3}
                  label="Edit"
                  onClick={() => beginEdit(offering)}
                />
              )}
              {offering.status === "draft" && (
                <Action
                  disabled={saving}
                  icon={FiPlay}
                  label="Activate"
                  onClick={() => changeStatus(offering, "active")}
                />
              )}
              {offering.status === "active" && (
                <Action
                  disabled={saving}
                  icon={FiPause}
                  label="Pause"
                  onClick={() => changeStatus(offering, "paused")}
                />
              )}
              {offering.status === "paused" && (
                <Action
                  disabled={saving}
                  icon={FiPlay}
                  label="Reactivate"
                  onClick={() => changeStatus(offering, "active")}
                />
              )}
              {offering.status !== "retired" && (
                <Action
                  disabled={saving}
                  icon={FiSlash}
                  label="Retire"
                  onClick={() => changeStatus(offering, "retired")}
                  tone="danger"
                />
              )}
            </div>
            )}
          </article>
        ))}
        {status === "loading" && offerings.length === 0 && (
          <p className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5 text-sm text-slate-400">
            Loading tournaments...
          </p>
        )}
        {status !== "loading" && listContent.offerings.length === 0 && (
          <p className="rounded-3xl border border-dashed border-slate-700 bg-slate-950/70 p-5 text-sm text-slate-400">
            {listContent.empty}
          </p>
        )}
      </div>
        </>
      ) : null}
      </div>
    </section>
  );
};

const Action = ({ disabled = false, icon: Icon, label, onClick, tone = "default" }) => (
  <button
    className={
      tone === "danger"
        ? "inline-flex items-center gap-2 rounded-xl border border-rose-300/30 px-3 py-2 text-sm font-bold text-rose-100"
        : "inline-flex items-center gap-2 rounded-xl border border-slate-700 px-3 py-2 text-sm font-bold text-slate-200"
    }
    disabled={disabled}
    onClick={onClick}
    type="button"
  >
    <Icon /> {label}
  </button>
);
Action.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
  tone: PropTypes.oneOf(["default", "danger"]),
};

export default QuickMatchOfferingManagement;
