import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createManagedEventRun,
  createManagedEventTemplate,
  fetchManagedEvents,
  fetchScopedEventGames,
} from "../store/slices/eventManagementSlice";

const initialTemplate = {
  cadence: "one_time",
  gameId: "",
  mode: "",
  teamSize: "1",
  title: "",
};

const EventManagerDashboard = () => {
  const dispatch = useDispatch();
  const { games, runs, status, templates } = useSelector(
    (state) => state.eventManagement,
  );
  const [template, setTemplate] = useState(initialTemplate);
  const [run, setRun] = useState({
    registrationClosesAt: "",
    registrationOpensAt: "",
    startsAt: "",
    templateId: "",
  });

  useEffect(() => {
    // This endpoint returns only the game records permitted by this staff role.
    dispatch(fetchScopedEventGames());
    dispatch(fetchManagedEvents());
  }, [dispatch]);

  const submitTemplate = async (event) => {
    event.preventDefault();
    await dispatch(
      createManagedEventTemplate({
        ...template,
        teamSize: Number(template.teamSize),
      }),
    ).unwrap();
    setTemplate(initialTemplate);
  };

  const submitRun = async (event) => {
    event.preventDefault();
    await dispatch(createManagedEventRun(run)).unwrap();
    setRun({
      registrationClosesAt: "",
      registrationOpensAt: "",
      startsAt: "",
      templateId: "",
    });
  };

  const selectedGame = games.find((game) => game._id === template.gameId);

  const updateTemplate = (field, value) => {
    // Changing games invalidates previously selected capabilities from the
    // prior game, so reset them before submitting a template.
    setTemplate((current) =>
      field === "gameId"
        ? { ...current, gameId: value, map: "", mode: "" }
        : { ...current, [field]: value },
    );
  };

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 text-slate-100">
      <header>
        <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
          Competition operations
        </p>
        <h1 className="mt-2 text-3xl font-black">Event Manager</h1>
      </header>
      <section className="grid gap-6 lg:grid-cols-2">
        <form
          className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5"
          onSubmit={submitTemplate}
        >
          <h2 className="font-bold text-white">Create an Event template</h2>
          <div className="mt-4 grid gap-3">
            <input
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) => updateTemplate("title", event.target.value)}
              placeholder="Event title"
              required
              value={template.title}
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
              disabled={
                !selectedGame || selectedGame.supportedMaps.length === 0
              }
              onChange={(event) => updateTemplate("map", event.target.value)}
              value={template.map || ""}
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
                  {cadence.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <button className="rounded-xl bg-cyan-300 p-3 font-bold text-slate-950">
              Save template
            </button>
          </div>
        </form>
        <form
          className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5"
          onSubmit={submitRun}
        >
          <h2 className="font-bold text-white">Schedule an Event run</h2>
          <div className="mt-4 grid gap-3">
            <select
              className="rounded-xl border border-slate-700 bg-slate-900 p-3"
              onChange={(event) =>
                setRun({ ...run, templateId: event.target.value })
              }
              required
              value={run.templateId}
            >
              <option value="">Choose template</option>
              {templates.map((item) => (
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
            <button className="rounded-xl bg-cyan-300 p-3 font-bold text-slate-950">
              Schedule Event
            </button>
          </div>
        </form>
      </section>
      <section className="rounded-3xl border border-slate-800 bg-slate-950/90 p-5">
        <h2 className="font-bold text-white">Scheduled runs</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {runs.map((item) => (
            <article
              className="rounded-2xl border border-slate-800 p-4"
              key={item._id}
            >
              <p className="font-semibold">{item.title}</p>
              <p className="mt-1 text-sm text-slate-400">
                {item.status} · {new Date(item.startsAt).toLocaleString()}
              </p>
            </article>
          ))}
          {status === "loading" && (
            <p className="text-slate-400">Loading Events...</p>
          )}
        </div>
      </section>
    </main>
  );
};

export default EventManagerDashboard;
