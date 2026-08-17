import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RankedStagePlanEditor from "../components/eventManagement/RankedStagePlanEditor.jsx";
import {
  buildDefaultRankedStages,
  projectRankedStages,
} from "../components/eventManagement/rankedStagePlanUtils.js";
import FutureRoundAdjustmentPanel from "../components/eventManagement/FutureRoundAdjustmentPanel.jsx";
import EventManagerOperations from "../components/eventManagement/EventManagerOperations.jsx";
import {
  createManagedEventRun,
  createManagedEventTemplate,
  fetchManagedEvents,
  fetchScopedEventGames,
  submitManagedEventRun,
  submitManagedEventTemplate,
  updateManagedEventRun,
  updateManagedEventTemplate,
} from "../store/slices/eventManagementSlice";

const initialTemplate = {
  cadence: "one_time",
  description: "",
  gameId: "",
  map: "",
  mode: "",
  teamSize: "1",
  title: "",
};

const initialRun = {
  admissionPolicy: "open",
  entryFeeRupees: "0",
  entryPolicy: "free",
  registrationCapacity: "16",
  registrationClosesAt: "",
  registrationOpensAt: "",
  startsAt: "",
  templateId: "",
  title: "",
  waitlistEnabled: false,
  executionFormat: "single_elimination",
  participantsPerMatch: "2",
  advanceCount: "1",
  seedingPolicy: "registration_order",
  batchSpacingMinutes: "10",
  checkInMinutesBefore: "15",
  stageRows: [],
  rewardRows: [],
};

const editableStatuses = new Set(["draft", "changes_requested"]);

const formatStatus = (status) => status?.replaceAll("_", " ") || "unknown";

const toDateTimeLocal = (value) => {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  // datetime-local expects local calendar fields without a timezone suffix.
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const getReferenceId = (value) => value?._id || value || "";

const toInrMinorUnits = (value) => {
  const normalized = String(value ?? "").trim();
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(normalized)) return null;
  const [rupees, paise = ""] = normalized.split(".");
  const amountMinor = Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  return Number.isSafeInteger(amountMinor) ? amountMinor : null;
};

const EventManagerDashboard = () => {
  const dispatch = useDispatch();
  const { games, runs, status, templates } = useSelector(
    (state) => state.eventManagement,
  );
  const [template, setTemplate] = useState(initialTemplate);
  const [run, setRun] = useState(initialRun);
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingRunId, setEditingRunId] = useState(null);
  const [activeSubmission, setActiveSubmission] = useState(null);
  const [activeTab, setActiveTab] = useState("templates");
  const [selectedRunId, setSelectedRunId] = useState(null);

  useEffect(() => {
    // This endpoint returns only the games assigned to this Event Manager.
    dispatch(fetchScopedEventGames());
    dispatch(fetchManagedEvents());
  }, [dispatch]);

  const selectedGame = games.find((game) => game._id === template.gameId);
  const approvedTemplates = templates.filter((item) => item.status === "active");
  const selectedRunTemplate = approvedTemplates.find(
    (item) => item._id === run.templateId,
  );
  const teamExecutionUnsupported = selectedRunTemplate?.teamSize > 1;
  const entryFeeMinor = run.entryPolicy === "paid"
    ? toInrMinorUnits(run.entryFeeRupees)
    : 0;
  const entryFeeInvalid = run.entryPolicy === "paid" && (!entryFeeMinor || entryFeeMinor < 1);
  const rankedProjection = run.executionFormat === "ranked_stages"
    ? projectRankedStages(Number(run.registrationCapacity), run.stageRows)
    : { error: "" };

  const updateTemplate = (field, value) => {
    // Changing games invalidates capabilities selected from the previous game.
    setTemplate((current) =>
      field === "gameId"
        ? { ...current, gameId: value, map: "", mode: "" }
        : { ...current, [field]: value },
    );
  };

  const saveTemplate = async (event) => {
    event.preventDefault();
    const payload = { ...template, teamSize: Number(template.teamSize) };
    const action = editingTemplateId
      ? updateManagedEventTemplate({
          changes: payload,
          templateId: editingTemplateId,
        })
      : createManagedEventTemplate(payload);

    try {
      await dispatch(action).unwrap();
      setTemplate(initialTemplate);
      setEditingTemplateId(null);
    } catch {
      // createApiThunk already normalizes and displays the backend error.
    }
  };

  const saveRun = async (event) => {
    event.preventDefault();
    const submittedDates = new FormData(event.currentTarget);
    const payload = {
      admissionPolicy: run.admissionPolicy,
      executionPlan: run.executionFormat === "ranked_stages"
        ? {
            format: "ranked_stages",
            stages: run.stageRows.map((stage, index) => ({
              advanceCount: index === run.stageRows.length - 1
                ? 0
                : Number(stage.advanceCount),
              batchSpacingMinutes: Number(stage.batchSpacingMinutes),
              checkInMinutesBefore: Number(stage.checkInMinutesBefore),
              participantsPerMatch: Number(stage.participantsPerMatch),
              qualificationRule: index === run.stageRows.length - 1
                ? "final_ranking"
                : "top_n",
              stageDelayMinutes: Number(stage.stageDelayMinutes),
            })),
          }
        : {
            advanceCount: Number(run.advanceCount),
            batchSpacingMinutes: Number(run.batchSpacingMinutes),
            checkInMinutesBefore: Number(run.checkInMinutesBefore),
            format: "single_elimination",
            participantsPerMatch: Number(run.participantsPerMatch),
            seedingPolicy: run.seedingPolicy,
          },
      registrationCapacity: Number(run.registrationCapacity),
      entryTerms: {
        currency: "INR",
        entryFeeMinor,
        policy: run.entryPolicy,
      },
      rewardTerms: {
        currency: "INR",
        placements: run.rewardRows.map((row) => ({
          place: Number(row.place),
          // The UI accepts rupees, while the money boundary accepts paise.
          amountMinor: Math.round(Number(row.amountRupees) * 100),
        })),
      },
      // Read the date controls at submit time as well as preserving them in
      // state. This prevents a rapid native date entry from losing a field
      // before React schedules its controlled-state update.
      registrationClosesAt: submittedDates.get("registrationClosesAt") || run.registrationClosesAt,
      registrationOpensAt: submittedDates.get("registrationOpensAt") || run.registrationOpensAt,
      startsAt: submittedDates.get("startsAt") || run.startsAt,
      templateId: run.templateId,
      title: run.title,
      waitlistEnabled: run.waitlistEnabled,
    };
    const action = editingRunId
      ? updateManagedEventRun({ changes: payload, runId: editingRunId })
      : createManagedEventRun(payload);

    try {
      await dispatch(action).unwrap();
      setRun(initialRun);
      setEditingRunId(null);
    } catch {
      // Keep the form intact so the manager can correct the rejected values.
    }
  };

  const editTemplate = (item) => {
    setActiveTab("templates");
    setEditingTemplateId(item._id);
    setTemplate({
      cadence: item.cadence || "one_time",
      description: item.description || "",
      gameId: getReferenceId(item.game),
      map: item.map || "",
      mode: item.mode || "",
      teamSize: String(item.teamSize || 1),
      title: item.title || "",
    });
    window.scrollTo({ behavior: "smooth", top: 0 });
  };

  const editRun = (item) => {
    setActiveTab("events");
    setEditingRunId(item._id);
    setRun({
      admissionPolicy: item.admissionPolicy || "open",
      entryFeeRupees: String((item.entryTerms?.entryFeeMinor || 0) / 100),
      entryPolicy: item.entryTerms?.policy || "free",
      registrationCapacity: String(item.registrationCapacity || 16),
      registrationClosesAt: toDateTimeLocal(item.registrationClosesAt),
      registrationOpensAt: toDateTimeLocal(item.registrationOpensAt),
      startsAt: toDateTimeLocal(item.startsAt),
      templateId: getReferenceId(item.template),
      title: item.title || "",
      waitlistEnabled: item.waitlistEnabled === true,
      executionFormat: item.executionPlan?.format || "single_elimination",
      participantsPerMatch: String(
        item.executionPlan?.participantsPerMatch || 2,
      ),
      advanceCount: String(item.executionPlan?.advanceCount || 1),
      batchSpacingMinutes: String(
        item.executionPlan?.batchSpacingMinutes ?? 10,
      ),
      checkInMinutesBefore: String(
        item.executionPlan?.checkInMinutesBefore ?? 15,
      ),
      seedingPolicy:
        item.executionPlan?.seedingPolicy || "registration_order",
      stageRows: (item.executionPlan?.stages || []).map((stage) => ({
        advanceCount: String(stage.advanceCount ?? 0),
        batchSpacingMinutes: String(stage.batchSpacingMinutes ?? 0),
        checkInMinutesBefore: String(stage.checkInMinutesBefore ?? 15),
        participantsPerMatch: String(stage.participantsPerMatch ?? 100),
        stageDelayMinutes: String(stage.stageDelayMinutes ?? 0),
      })),
      rewardRows: (item.rewardTerms?.placements || []).map((item) => ({
        place: String(item.place),
        amountRupees: String(item.amountMinor / 100),
      })),
    });
    window.scrollTo({ behavior: "smooth", top: 0 });
  };

  const updateRewardRow = (index, field, value) => {
    setRun((current) => ({
      ...current,
      rewardRows: current.rewardRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row,
      ),
    }));
  };

  const addRewardRow = () => setRun((current) => ({
    ...current,
    rewardRows: [...current.rewardRows, { place: String(current.rewardRows.length + 1), amountRupees: "" }],
  }));

  const removeRewardRow = (index) => setRun((current) => ({
    ...current,
    rewardRows: current.rewardRows.filter((_, rowIndex) => rowIndex !== index),
  }));

  const submitForReview = async (kind, id) => {
    const submissionKey = [kind, id].join(":");
    setActiveSubmission(submissionKey);

    try {
      const action =
        kind === "template"
          ? submitManagedEventTemplate(id)
          : submitManagedEventRun(id);
      await dispatch(action).unwrap();
    } catch {
      // The shared thunk keeps the actionable API message in the toast.
    } finally {
      setActiveSubmission(null);
    }
  };

  const gameNameFor = (item) => {
    if (item.game?.name) return item.game.name;
    const gameId = getReferenceId(item.game);
    return games.find((game) => game._id === gameId)?.name || "Game";
  };

  return (
    <main className="min-h-screen bg-[#050b14] px-4 py-6 text-slate-100 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto grid max-w-7xl items-start gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="rounded-3xl border border-slate-800 bg-slate-950/90 p-4 lg:sticky lg:top-6">
          <div className="border-b border-slate-800 px-2 pb-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">Staff workspace</p>
            <h1 className="mt-1 text-xl font-black text-white">Event Manager</h1>
          </div>
          <nav aria-label="Event Manager sections" className="mt-3 grid gap-2" role="tablist">
          <button
            aria-selected={activeTab === "templates"}
            className={activeTab === "templates"
              ? "rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-left"
              : "rounded-2xl border border-transparent px-4 py-3 text-left hover:bg-slate-900"}
            onClick={() => setActiveTab("templates")}
            role="tab"
            type="button"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-black text-white">Templates</span>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-cyan-200">{templates.length}</span>
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-400">
              Reusable setups
            </span>
          </button>
          <button
            aria-selected={activeTab === "events"}
            className={activeTab === "events"
              ? "rounded-2xl border border-cyan-300/30 bg-cyan-300/10 px-4 py-3 text-left"
              : "rounded-2xl border border-transparent px-4 py-3 text-left hover:bg-slate-900"}
            onClick={() => setActiveTab("events")}
            role="tab"
            type="button"
          >
            <span className="flex items-center justify-between gap-3">
              <span className="font-black text-white">Events</span>
              <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-cyan-200">{runs.length}</span>
            </span>
            <span className="mt-1 block text-xs leading-5 text-slate-400">
              Scheduled competitions
            </span>
          </button>
          </nav>
          <div className="mt-5 border-t border-slate-800 px-2 pt-4 text-xs leading-5 text-slate-500">
            <p><span className="font-black text-slate-300">1.</span> Approve a Template</p>
            <p><span className="font-black text-slate-300">2.</span> Create Events from it</p>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">

      <section>
        {activeTab === "templates" ? (
        <form
          className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5"
          onSubmit={saveTemplate}
        >
          <h2 className="font-bold text-white">
            {editingTemplateId
              ? "Edit template draft"
              : "Create a template draft"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Save the setup first. Submission is a separate review step.
          </p>
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-slate-300">
              Template name
              <input
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                onChange={(event) => updateTemplate("title", event.target.value)}
                placeholder="Example: BGMI Ranked Solo"
                required
                value={template.title}
              />
            </label>
            <label className="text-sm text-slate-300">
              Player-facing description
              <textarea
                className="mt-1 min-h-24 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                onChange={(event) =>
                  updateTemplate("description", event.target.value)
                }
                placeholder="Describe the reusable competition format"
                value={template.description}
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm text-slate-300">
                Assigned game
                <select
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                  onChange={(event) => updateTemplate("gameId", event.target.value)}
                  required
                  value={template.gameId}
                >
                  <option value="">Choose game</option>
                  {games.map((game) => (
                    <option key={game._id} value={game._id}>
                      {game.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Game mode
                <select
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                  disabled={!selectedGame}
                  onChange={(event) => updateTemplate("mode", event.target.value)}
                  required
                  value={template.mode}
                >
                  <option value="">Choose mode</option>
                  {selectedGame?.supportedModes.map((mode) => (
                    <option key={mode} value={mode}>
                      {mode}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Map
                <select
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                  disabled={!selectedGame || selectedGame.supportedMaps.length === 0}
                  onChange={(event) => updateTemplate("map", event.target.value)}
                  value={template.map}
                >
                  <option value="">No map requirement</option>
                  {selectedGame?.supportedMaps.map((map) => (
                    <option key={map} value={map}>
                      {map}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm text-slate-300">
                Team size
                <input
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                  max="100"
                  min="1"
                  onChange={(event) =>
                    updateTemplate("teamSize", event.target.value)
                  }
                  required
                  type="number"
                  value={template.teamSize}
                />
              </label>
            </div>
            <label className="text-sm text-slate-300">
              Intended reuse
              <select
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                onChange={(event) =>
                  updateTemplate("cadence", event.target.value)
                }
                value={template.cadence}
              >
                {["one_time", "daily", "weekly", "monthly"].map((cadence) => (
                  <option key={cadence} value={cadence}>
                    {formatStatus(cadence)}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl bg-cyan-300 p-3 font-bold text-slate-950">
                {editingTemplateId ? "Save changes" : "Save draft"}
              </button>
              {editingTemplateId && (
                <button
                  className="rounded-xl border border-slate-700 px-4 text-slate-300"
                  onClick={() => {
                    setEditingTemplateId(null);
                    setTemplate(initialTemplate);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
        ) : (
        <form
          className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5"
          onSubmit={saveRun}
        >
          <h2 className="font-bold text-white">
            {editingRunId ? "Edit Event schedule" : "Create an Event schedule"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            A schedule can only be built from an approved template.
          </p>
          <div className="mt-4 grid gap-3">
            <label className="text-sm text-slate-300">
              Event name
              <input
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                onChange={(event) => setRun((current) => ({ ...current, title: event.target.value }))}
                placeholder="Example: BGMI Sunday Showdown"
                value={run.title}
              />
            </label>
            <label className="text-sm text-slate-300">
              Approved Template
              <select
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                onChange={(event) =>
                  setRun((current) => ({ ...current, templateId: event.target.value }))
                }
                required
                value={run.templateId}
              >
                <option value="">Choose approved Template</option>
                {approvedTemplates.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title}
                  </option>
                ))}
              </select>
            </label>
            {teamExecutionUnsupported ? (
              <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
                Team Event execution is not available yet. Choose an approved
                solo template for this first-stage workflow.
              </p>
            ) : null}
            {[
              ["registrationOpensAt", "Registration opens"],
              ["registrationClosesAt", "Registration closes"],
              ["startsAt", "Event starts"],
            ].map(([key, label]) => (
              <label className="text-sm text-slate-300" key={key}>
                {label}
                <input
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                  name={key}
                  onInput={(event) =>
                    setRun((current) => ({ ...current, [key]: event.target.value }))
                  }
                  required
                  type="datetime-local"
                  value={run[key]}
                />
              </label>
            ))}
            <label className="text-sm text-slate-300">
              Admission policy
              <select
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                onChange={(event) =>
                  setRun((current) => ({
                    ...current,
                    admissionPolicy: event.target.value,
                    waitlistEnabled:
                      event.target.value === "limited_seats"
                        ? current.waitlistEnabled
                        : false,
                  }))
                }
                value={run.admissionPolicy}
              >
                <option value="open">Open registration</option>
                <option value="invitation_only">Invitation only</option>
                <option value="limited_seats">Limited seats</option>
              </select>
            </label>
            <label className="text-sm text-slate-300">
              Registration capacity
              <input
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                min="1"
                onChange={(event) =>
                  setRun((current) => ({ ...current, registrationCapacity: event.target.value }))
                }
                required
                type="number"
                value={run.registrationCapacity}
              />
            </label>
            <fieldset className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
              <legend className="px-2 text-sm font-bold text-white">Entry terms</legend>
              <p className="mb-3 text-xs leading-5 text-slate-400">
                Platform Admin reviews and locks this per-player INR amount. Registration commands never accept a client-selected fee.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-300">
                  Entry policy
                  <select
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                    onChange={(event) => setRun((current) => ({
                      ...current,
                      entryFeeRupees: event.target.value === "free" ? "0" : current.entryFeeRupees,
                      entryPolicy: event.target.value,
                    }))}
                    value={run.entryPolicy}
                  >
                    <option value="free">Free entry</option>
                    <option value="paid">Paid entry</option>
                  </select>
                </label>
                <label className="text-sm text-slate-300">
                  Fee per player (INR)
                  <input
                    className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 disabled:opacity-50"
                    disabled={run.entryPolicy === "free"}
                    min={run.entryPolicy === "paid" ? "0.01" : "0"}
                    onChange={(event) => setRun((current) => ({ ...current, entryFeeRupees: event.target.value }))}
                    required
                    step="0.01"
                    type="number"
                    value={run.entryFeeRupees}
                  />
                </label>
              </div>
            </fieldset>
            {entryFeeInvalid ? (
              <p className="text-sm text-rose-200">
                Enter a paid entry fee with no more than two decimal places.
              </p>
            ) : null}
            {run.admissionPolicy === "limited_seats" ? (
              <label className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-sm text-slate-200">
                <input
                  checked={run.waitlistEnabled}
                  onChange={(event) =>
                  setRun((current) => ({ ...current, waitlistEnabled: event.target.checked }))
                  }
                  type="checkbox"
                />
                Allow waitlist after every seat is filled
              </label>
            ) : null}
            <label className="text-sm text-slate-300">
              Competition format
              <select
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                onChange={(event) => {
                  const executionFormat = event.target.value;
                  setRun((current) => ({
                    ...current,
                    executionFormat,
                    stageRows: executionFormat === "ranked_stages"
                      ? buildDefaultRankedStages(current.registrationCapacity)
                      : [],
                  }));
                }}
                value={run.executionFormat}
              >
                <option value="single_elimination">Head-to-head bracket</option>
                <option value="ranked_stages">Ranked rooms / top-N rounds</option>
              </select>
            </label>
            {run.executionFormat === "ranked_stages" ? (
              <RankedStagePlanEditor
                capacity={run.registrationCapacity}
                onChange={(stageRows) => setRun((current) => ({ ...current, stageRows }))}
                stages={run.stageRows}
              />
            ) : (
              <fieldset className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
                <legend className="px-2 text-sm font-bold text-white">
                  Head-to-head plan
                </legend>
                <p className="mb-3 text-xs leading-5 text-slate-500">
                  Two-player rooms advance one winner in registration order.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    Players per match
                    <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3" disabled type="number" value="2" />
                  </label>
                  <label className="text-sm text-slate-300">
                    Advance per match
                    <input className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3" disabled type="number" value="1" />
                  </label>
                  <label className="text-sm text-slate-300">
                    Minutes between matches
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                      max="1440"
                      min="0"
                      onChange={(event) => setRun((current) => ({ ...current, batchSpacingMinutes: event.target.value }))}
                      required
                      type="number"
                      value={run.batchSpacingMinutes}
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    Check-in opens before (minutes)
                    <input
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                      max="1440"
                      min="0"
                      onChange={(event) => setRun((current) => ({ ...current, checkInMinutesBefore: event.target.value }))}
                      required
                      type="number"
                      value={run.checkInMinutesBefore}
                    />
                  </label>
                </div>
              </fieldset>
            )}
            <fieldset className="rounded-2xl border border-emerald-300/20 bg-emerald-300/5 p-4">
              <legend className="px-2 text-sm font-bold text-white">Placement rewards</legend>
              <p className="mb-3 text-xs leading-5 text-slate-400">
                Optional fixed rewards in rupees. A tied standing gives every player at that place the same reward. Platform Admin reviews this table before it is locked.
              </p>
              <div className="space-y-2">
                {run.rewardRows.map((row, index) => (
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-2" key={`${index}-${row.place}`}>
                    <input aria-label={`Reward place ${index + 1}`} className="rounded-xl border border-slate-700 bg-slate-900 p-3" min="1" onChange={(event) => updateRewardRow(index, "place", event.target.value)} placeholder="Place" required type="number" value={row.place} />
                    <input aria-label={`Reward amount ${index + 1}`} className="rounded-xl border border-slate-700 bg-slate-900 p-3" min="0.01" onChange={(event) => updateRewardRow(index, "amountRupees", event.target.value)} placeholder="Rupees" required step="0.01" type="number" value={row.amountRupees} />
                    <button className="rounded-xl border border-rose-400/30 px-3 text-sm font-bold text-rose-200" onClick={() => removeRewardRow(index)} type="button">Remove</button>
                  </div>
                ))}
              </div>
              <button className="mt-3 rounded-xl border border-emerald-300/30 px-3 py-2 text-sm font-bold text-emerald-100" onClick={addRewardRow} type="button">Add placement reward</button>
            </fieldset>
            <div className="flex gap-2">
              <button
                className="flex-1 rounded-xl bg-cyan-300 p-3 font-bold text-slate-950 disabled:opacity-50"
                disabled={teamExecutionUnsupported || entryFeeInvalid || Boolean(rankedProjection.error)}
              >
                {editingRunId ? "Save changes" : "Save draft"}
              </button>
              {editingRunId && (
                <button
                  className="rounded-xl border border-slate-700 px-4 text-slate-300"
                  onClick={() => {
                    setEditingRunId(null);
                    setRun(initialRun);
                  }}
                  type="button"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </form>
        )}

      </section>

      {activeTab === "templates" ? (
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Reusable library</p>
          <h2 className="mt-1 font-bold text-white">Your Templates</h2>
          <p className="mt-1 text-sm text-slate-400">Approved Templates remain available for future Events. Editing a reviewed format creates another governed revision.</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {templates.map((item) => (
            <article
              className="rounded-2xl border border-slate-800 p-4"
              key={item._id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {gameNameFor(item)} / {item.mode} / revision {item.revision || 1}
                  </p>
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-cyan-200">
                  {formatStatus(item.status)}
                </span>
              </div>
              {item.latestReviewNote && (
                <p className="mt-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-sm text-amber-100">
                  Reviewer note: {item.latestReviewNote}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {editableStatuses.has(item.status) && (
                  <button
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm"
                    onClick={() => editTemplate(item)}
                    type="button"
                  >
                    Edit draft
                  </button>
                )}
                {item.status === "draft" && (
                  <button
                    className="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
                    disabled={activeSubmission === "template:" + item._id}
                    onClick={() => submitForReview("template", item._id)}
                    type="button"
                  >
                    {activeSubmission === "template:" + item._id
                      ? "Submitting..."
                      : "Submit for review"}
                  </button>
                )}
              </div>
            </article>
          ))}
          {status !== "loading" && templates.length === 0 && (
            <p className="text-sm text-slate-500">No template drafts yet.</p>
          )}
        </div>
      </section>
      ) : (
      <>
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-300">Scheduled competitions</p>
          <h2 className="mt-1 font-bold text-white">Your Events</h2>
          <p className="mt-1 text-sm text-slate-400">Each Event has its own registration window, player access, execution plan and review lifecycle.</p>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {runs.map((item) => (
            <article
              className="rounded-2xl border border-slate-800 p-4"
              key={item._id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-400">
                    {new Date(item.startsAt).toLocaleString()} / revision {item.revision || 1}
                  </p>
                  <p className="mt-1 text-xs font-bold text-emerald-200">
                    {item.entryTerms?.policy === "paid"
                      ? `Paid entry / INR ${(item.entryTerms.entryFeeMinor / 100).toFixed(2)} per player`
                      : "Free entry"}
                  </p>
                  {item.executionPlan ? (
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <p className="font-bold capitalize text-cyan-100/70">
                        {formatStatus(item.executionPlan.format)}
                      </p>
                      {item.executionPlan.format === "ranked_stages"
                        ? item.executionPlan.stages?.map((stage) => (
                            <p key={stage.number}>
                              Round {stage.number} / {stage.participantsPerMatch} per room /
                              {stage.qualificationRule === "final_ranking"
                                ? " final ranking"
                                : ` top ${stage.advanceCount} qualify`}
                            </p>
                          ))
                        : (
                            <p>Two-player matches / one winner advances</p>
                          )}
                    </div>
                  ) : null}
                  {item.executionHandoff ? (
                    <div className="mt-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.15em] text-cyan-300">
                        Operations handoff / {formatStatus(item.executionHandoff.state)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-300">
                        <span>{item.executionHandoff.stageCount} stages</span>
                        <span>/ {item.executionHandoff.roomCount} rooms</span>
                        <span>/ {item.executionHandoff.awaitingOperator} awaiting operator</span>
                        <span>/ {item.executionHandoff.inProgress} live</span>
                        <span>/ {item.executionHandoff.resultAttention} result attention</span>
                        <span>/ {item.executionHandoff.completed} completed</span>
                      </div>
                    </div>
                  ) : null}
                </div>
                <span className="rounded-full bg-slate-800 px-3 py-1 text-xs capitalize text-cyan-200">
                  {formatStatus(item.status)}
                </span>
              </div>
              {item.latestReviewNote && (
                <p className="mt-3 rounded-xl border border-amber-800/60 bg-amber-950/30 p-3 text-sm text-amber-100">
                  Reviewer note: {item.latestReviewNote}
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-2">
                {editableStatuses.has(item.status) && (
                  <button
                    className="rounded-lg border border-slate-700 px-3 py-2 text-sm"
                    onClick={() => editRun(item)}
                    type="button"
                  >
                    Edit draft
                  </button>
                )}
                {item.status === "draft" && (
                  <button
                    className="rounded-lg bg-cyan-300 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-60"
                    disabled={activeSubmission === "run:" + item._id}
                    onClick={() => submitForReview("run", item._id)}
                    type="button"
                  >
                    {activeSubmission === "run:" + item._id
                      ? "Submitting..."
                      : "Submit for review"}
                  </button>
                )}
                <button
                  className="rounded-lg border border-cyan-300/30 px-3 py-2 text-sm font-bold text-cyan-100"
                  onClick={() => setSelectedRunId(item._id)}
                  type="button"
                >
                  View details
                </button>
              </div>
            </article>
          ))}
          {status === "loading" && (
            <p className="text-slate-400">Loading Events...</p>
          )}
          {status !== "loading" && runs.length === 0 && (
            <p className="text-sm text-slate-500">
              No schedules yet. An approved template is required first.
            </p>
          )}
        </div>
      </section>
      {selectedRunId ? (
        <EventManagerOperations onClose={() => setSelectedRunId(null)} runId={selectedRunId} />
      ) : null}
      <FutureRoundAdjustmentPanel runs={runs} />
      </>
      )}
        </div>
      </div>
    </main>
  );
};

export default EventManagerDashboard;
