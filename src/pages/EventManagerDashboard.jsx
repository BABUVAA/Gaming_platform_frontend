import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import RankedStagePlanEditor from "../components/eventManagement/RankedStagePlanEditor.jsx";
import {
  buildDefaultRankedStages,
  projectRankedStages,
} from "../components/eventManagement/rankedStagePlanUtils.js";
import FutureRoundAdjustmentPanel from "../components/eventManagement/FutureRoundAdjustmentPanel.jsx";
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
    setEditingRunId(item._id);
    setRun({
      admissionPolicy: item.admissionPolicy || "open",
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
      <div className="mx-auto max-w-6xl space-y-6">
      <header className="rounded-3xl border border-cyan-300/15 bg-[linear-gradient(135deg,rgba(34,211,238,0.08),rgba(15,23,42,0.55))] px-5 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
          Competition operations
        </p>
        <h1 className="mt-2 text-3xl font-black">Event Manager</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          Build Event drafts for your assigned games and submit completed work
          for independent Platform Admin review.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
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
            <input
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) => updateTemplate("title", event.target.value)}
              placeholder="Event title"
              required
              value={template.title}
            />
            <textarea
              className="min-h-24 rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) =>
                updateTemplate("description", event.target.value)
              }
              placeholder="Short player-facing description"
              value={template.description}
            />
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) => updateTemplate("gameId", event.target.value)}
              required
              value={template.gameId}
            >
              <option value="">Choose assigned game</option>
              {games.map((game) => (
                <option key={game._id} value={game._id}>
                  {game.name}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              disabled={!selectedGame}
              onChange={(event) => updateTemplate("mode", event.target.value)}
              required
              value={template.mode}
            >
              <option value="">Choose configured mode</option>
              {selectedGame?.supportedModes.map((mode) => (
                <option key={mode} value={mode}>
                  {mode}
                </option>
              ))}
            </select>
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
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
            <input
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              max="100"
              min="1"
              onChange={(event) =>
                updateTemplate("teamSize", event.target.value)
              }
              placeholder="Team size"
              required
              type="number"
              value={template.teamSize}
            />
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
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
            <input
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) => setRun((current) => ({ ...current, title: event.target.value }))}
              placeholder="Schedule title (defaults to template title)"
              value={run.title}
            />
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) =>
                setRun((current) => ({ ...current, templateId: event.target.value }))
              }
              required
              value={run.templateId}
            >
              <option value="">Choose approved template</option>
              {approvedTemplates.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.title}
                </option>
              ))}
            </select>
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
                disabled={teamExecutionUnsupported || Boolean(rankedProjection.error)}
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
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
        <h2 className="font-bold text-white">Template work</h2>
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

      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
        <h2 className="font-bold text-white">Event schedules</h2>
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
      <FutureRoundAdjustmentPanel runs={runs} />
      </div>
    </main>
  );
};

export default EventManagerDashboard;
