import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
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
  registrationClosesAt: "",
  registrationOpensAt: "",
  startsAt: "",
  templateId: "",
  title: "",
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
    const action = editingRunId
      ? updateManagedEventRun({ changes: run, runId: editingRunId })
      : createManagedEventRun(run);

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
      registrationClosesAt: toDateTimeLocal(item.registrationClosesAt),
      registrationOpensAt: toDateTimeLocal(item.registrationOpensAt),
      startsAt: toDateTimeLocal(item.startsAt),
      templateId: getReferenceId(item.template),
      title: item.title || "",
    });
    window.scrollTo({ behavior: "smooth", top: 0 });
  };

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
    <main className="mx-auto max-w-6xl space-y-6 p-6 text-slate-100">
      <header>
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
              onChange={(event) => setRun({ ...run, title: event.target.value })}
              placeholder="Schedule title (defaults to template title)"
              value={run.title}
            />
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) =>
                setRun({ ...run, templateId: event.target.value })
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
            {[
              ["registrationOpensAt", "Registration opens"],
              ["registrationClosesAt", "Registration closes"],
              ["startsAt", "Event starts"],
            ].map(([key, label]) => (
              <label className="text-sm text-slate-300" key={key}>
                {label}
                <input
                  className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900 p-3"
                  onChange={(event) =>
                    setRun({ ...run, [key]: event.target.value })
                  }
                  required
                  type="datetime-local"
                  value={run[key]}
                />
              </label>
            ))}
            <div className="flex gap-2">
              <button className="flex-1 rounded-xl bg-cyan-300 p-3 font-bold text-slate-950">
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
    </main>
  );
};

export default EventManagerDashboard;
