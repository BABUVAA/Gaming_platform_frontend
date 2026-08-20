import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchPlayerEventStandings,
  fetchPlayerEvents,
  registerForEvent,
  selectEventProgression,
} from "../store/slices/eventRegistrationSlice.js";
import { selectPlayerSummary } from "../store/selectors/playerSelectors.js";
import EventProgression from "../components/EventProgression.jsx";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not scheduled" : date.toLocaleString();
};

const Events = () => {
  const dispatch = useDispatch();
  const {
    actionById,
    error,
    events,
    standingsById,
    standingsErrorById,
    standingsStatusById,
    status,
  } = useSelector(
    (state) => state.eventRegistration,
  );
  const staffReadOnly = useSelector(selectPlayerSummary)?.role === "staff";

  useEffect(() => {
    const request = dispatch(fetchPlayerEvents());
    return () => request.abort();
  }, [dispatch]);

  useEffect(() => {
    const requests = events
      .filter(
        (event) =>
          event.registration.mine && event.status === "completed",
      )
      .map((event) =>
        dispatch(fetchPlayerEventStandings({ runId: event.id })),
      );
    return () => requests.forEach((request) => request.abort());
  }, [dispatch, events]);

  const commitRegistration = (event) => {
    const fee = event.entryTerms?.policy === "paid"
      ? ` INR ${(event.entryTerms.entryFeeMinor / 100).toFixed(2)}${event.entryTerms.testMoney ? " in test money" : ""} will be held.`
      : "";
    if (
      globalThis.confirm(
        `Event registration is final and cannot be cancelled.${fee} Continue?`,
      )
    ) {
      dispatch(registerForEvent(event.id));
    }
  };

  return (
    <main className="space-y-6">
      <section className="rounded-3xl border border-violet-300/20 bg-violet-300/5 p-6">
        <p className="text-xs font-bold uppercase tracking-[.24em] text-violet-200">
          Scheduled Events
        </p>
        <h1 className="mt-2 text-3xl font-black text-white">
          Register for the full competition.
        </h1>
        <p className="mt-2 text-sm text-slate-300">
          {staffReadOnly
            ? "Staff can inspect Event availability here, but cannot participate."
            : "After registration closes, your Event card follows your server-assigned stage and Match."}
        </p>
      </section>

      {status === "loading" ? (
        <p className="text-slate-300">Loading Events...</p>
      ) : null}
      {status === "failed" ? (
        <button
          className="rounded-xl border border-rose-300/30 p-3 text-rose-100"
          onClick={() => dispatch(fetchPlayerEvents())}
          type="button"
        >
          Retry: {error}
        </button>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        {events.map((event) => {
          const mine = event.registration.mine;
          const busy = actionById[event.id] === "loading";
          const active = ["registered", "waitlisted"].includes(mine?.status);
          const standingPage = standingsById[event.id];
          const progression = selectEventProgression(event, standingPage);
          return (
            <article
              className="rounded-3xl border border-slate-800 bg-slate-950 p-5"
              key={event.id}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-200">
                    {event.game?.name} / {event.format?.mode}
                  </p>
                  <h2 className="mt-2 text-xl font-black text-white">
                    {event.title}
                  </h2>
                </div>
                <span className="rounded-full border border-slate-700 px-3 py-1 text-xs font-bold capitalize text-slate-300">
                  {(event.status || "scheduled").replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                {event.registration.admissionPolicy.replaceAll("_", " ")} / {event.registration.registeredCount}/{event.registration.capacity} seats
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Registration closes {formatDate(event.registration.closesAt)}
              </p>
              <p className="mt-2 text-sm font-bold text-emerald-200">
                {event.entryTerms?.policy === "paid"
                  ? `Entry INR ${(event.entryTerms.entryFeeMinor / 100).toFixed(2)} per player${event.entryTerms.testMoney ? " / test money" : ""}`
                  : "Free entry"}
              </p>
              {event.entryTerms?.blockedCode ? (
                <p className="mt-1 text-xs text-amber-200">
                  Paid registration is unavailable in this environment.
                </p>
              ) : null}
              {!staffReadOnly && !active ? (
                <p className="mt-2 text-xs text-amber-200">
                  Registration is final once confirmed.
                </p>
              ) : null}

              {mine ? (
                <p className="mt-4 text-sm font-bold capitalize text-cyan-200">
                  Your registration: {mine.status.replaceAll("_", " ")}
                </p>
              ) : null}
              {event.execution?.rosterFrozenAt ? (
                <p className="mt-2 text-sm text-slate-400">
                  Roster frozen with {event.execution.rosterCount} players.
                </p>
              ) : null}
              <EventProgression
                progression={progression}
                standings={standingPage?.standings || []}
              />
              {standingsErrorById[event.id] ? (
                <button
                  className="mt-3 text-sm font-bold text-rose-200"
                  onClick={() =>
                    dispatch(fetchPlayerEventStandings({ runId: event.id }))
                  }
                  type="button"
                >
                  Retry standings: {standingsErrorById[event.id]}
                </button>
              ) : null}
              {standingPage?.nextCursor ? (
                <button
                  className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
                  disabled={standingsStatusById[event.id] === "loading"}
                  onClick={() =>
                    dispatch(
                      fetchPlayerEventStandings({
                        cursor: standingPage.nextCursor,
                        runId: event.id,
                      }),
                    )
                  }
                  type="button"
                >
                  Load more standings
                </button>
              ) : null}
              {event.cancellation ? (
                <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/5 p-4 text-sm text-rose-100">
                  <p className="font-black">Event cancelled</p>
                  <p className="mt-1 text-xs text-rose-100/70">
                    {event.cancellation.code} / {formatDate(event.cancellation.at)}
                  </p>
                </div>
              ) : null}

              {staffReadOnly ? (
                <p className="mt-5 text-sm font-bold text-cyan-200">
                  Read-only Event view
                </p>
              ) : active ? (
                <p className="mt-5 text-sm font-bold text-cyan-200">
                  Registration committed
                </p>
              ) : !active ? (
                <button
                  className="mt-5 rounded-xl bg-cyan-300 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                  disabled={busy || !event.registration.isOpen || event.entryTerms?.paidEntryAvailable === false}
                  onClick={() => commitRegistration(event)}
                  type="button"
                >
                  {busy
                    ? "Saving..."
                    : event.entryTerms?.paidEntryAvailable === false
                      ? "Paid entry unavailable"
                      : event.registration.isOpen
                      ? event.entryTerms?.policy === "paid"
                        ? "Hold fee and register"
                        : "Register"
                      : "Registration closed"}
                </button>
              ) : null}
            </article>
          );
        })}
      </section>

      {status === "succeeded" && events.length === 0 ? (
        <p className="rounded-2xl border border-slate-800 p-5 text-slate-400">
          No Event registration or stage activity is available right now.
        </p>
      ) : null}
    </main>
  );
};

export default Events;
