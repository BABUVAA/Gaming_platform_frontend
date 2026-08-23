import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import EventProgression from "../components/EventProgression.jsx";
import CompetitionEntryDialog from "../components/competition/CompetitionEntryDialog.jsx";
import JoinProgress from "../components/competition/JoinProgress.jsx";
import {
  fetchPlayerEventDetails,
  fetchPlayerEventLeaderboard,
  fetchPlayerEventStandings,
  registerForEvent,
  selectEventProgression,
} from "../store/slices/eventRegistrationSlice.js";
import { selectPlayerSummary } from "../store/selectors/playerSelectors.js";
import { getGamePresentation } from "../config/gamePresentation.js";

const amount = (minor = 0) =>
  (minor / 100).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2,
  });
const money = (minor = 0) => `₹${amount(minor)}`;

const countdown = (target, now) => {
  const seconds = Math.max(
    0,
    Math.floor((new Date(target).getTime() - now) / 1000),
  );
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return `${days ? `${days}d ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
};

const EventDetails = () => {
  const { runId } = useParams();
  const dispatch = useDispatch();
  const [now, setNow] = useState(Date.now());
  const [confirmingEntry, setConfirmingEntry] = useState(false);
  const [detailsTab, setDetailsTab] = useState("rewards");
  const state = useSelector((root) => root.eventRegistration);
  const event = state.detailsById[runId];
  const eventId = event?.id;
  const standingPage = state.standingsById[runId];
  const leaderboardPage = state.leaderboardsById[runId];
  const staffReadOnly = useSelector(selectPlayerSummary)?.role === "staff";
  const busy = state.actionById[runId] === "loading";

  useEffect(() => {
    const request = dispatch(fetchPlayerEventDetails(runId));
    const refreshTimer = window.setInterval(
      () => dispatch(fetchPlayerEventDetails(runId)),
      10000,
    );
    return () => {
      request.abort();
      window.clearInterval(refreshTimer);
    };
  }, [dispatch, runId]);

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!["in_progress", "completed"].includes(event?.status)) return undefined;
    const request = dispatch(fetchPlayerEventStandings({ runId }));
    return () => request.abort();
  }, [dispatch, event?.status, runId]);

  useEffect(() => {
    if (!eventId) return undefined;
    const request = dispatch(fetchPlayerEventLeaderboard({ runId }));
    return () => request.abort();
  }, [dispatch, eventId, runId]);

  if (state.detailsStatusById[runId] === "loading" && !event) {
    return (
      <main className="rounded-2xl border border-slate-800 p-6 text-slate-300">
        Loading Event...
      </main>
    );
  }
  if (!event) {
    return (
      <main className="rounded-2xl border border-rose-400/20 p-6">
        <p className="text-rose-100">
          {state.detailsErrorById[runId] || "This Event is unavailable."}
        </p>
        <Link
          className="mt-4 inline-block font-bold text-cyan-200"
          to="/dashboard"
        >
          Back to Compete
        </Link>
      </main>
    );
  }

  const mine = event.registration?.mine;
  const committed = ["registered", "waitlisted"].includes(mine?.status);
  const presentation = getGamePresentation(event.game?.key);
  const progression = selectEventProgression(event, standingPage);
  const showFinalRanks =
    event.status === "completed" && standingPage?.standings?.length > 0;
  const leaderboardRows = showFinalRanks
    ? standingPage.standings.map((standing) => ({
        id: `${standing.placement}:${standing.player.profileTag || standing.player.displayName}`,
        player: { displayName: standing.player.displayName },
        rank: standing.placement,
      }))
    : leaderboardPage?.items || [];
  const startsLater = new Date(event.startsAt).getTime() > now;
  const register = () => {
    dispatch(registerForEvent(event.id));
    setConfirmingEntry(false);
  };

  return (
    <main className="space-y-4 pb-8">
      <Link
        className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-cyan-200 sm:text-sm"
        to="/dashboard"
      >
        ← Back to Compete
      </Link>
      <section className="relative overflow-hidden rounded-[24px] border border-cyan-300/20 bg-slate-950 shadow-[0_18px_44px_rgba(2,8,23,0.3)]">
        <img
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[68%_center] opacity-40"
          src={presentation.image}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.54),rgba(2,6,23,0.94)_42%,rgba(2,6,23,0.99)_100%)]" />
        <div className="relative p-4 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              {event.game?.name || "Event"}
            </p>
            <h1 className="mt-2 text-2xl font-black leading-tight text-white sm:text-3xl">
              {event.title}
            </h1>
            <p className="mt-2 text-sm capitalize text-slate-400">
              {event.format?.mode || "Open mode"}
              {event.format?.map ? ` / ${event.format.map}` : ""} /{" "}
              {(event.status || "scheduled").replaceAll("_", " ")}
            </p>
          </div>
          {startsLater ? (
            <div className="rounded-xl border border-cyan-300/20 bg-slate-950/70 px-3 py-2 text-right backdrop-blur">
              <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">Starts in</p>
              <p className="mt-0.5 whitespace-nowrap font-mono text-sm font-black text-cyan-100 sm:text-lg">
                {countdown(event.startsAt, now)}
              </p>
            </div>
          ) : null}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Fact
            label="Entry"
            value={
              event.entryTerms?.policy === "paid"
                ? money(event.entryTerms.entryFeeMinor)
                : "Free"
            }
          />
          <Fact
            label="Registration"
            value={event.registration?.isOpen ? "Open" : "Closed"}
          />
          <Fact
            label="Players"
            value={
              event.registration?.capacity > 0
                ? `${(event.registration?.registeredCount || 0).toLocaleString("en-IN")} / ${event.registration.capacity.toLocaleString("en-IN")}`
                : (event.registration?.registeredCount || 0).toLocaleString("en-IN")
            }
          />
          <Fact
            label="Access"
            value={(event.registration?.admissionPolicy || "open").replaceAll(
              "_",
              " ",
            )}
          />
        </div>
        {event.registration?.capacity > 0 ? (
          <div className="mt-4">
            <JoinProgress
              capacity={event.registration.capacity}
              joined={event.registration.registeredCount || 0}
              label="Registration progress"
              status={
                event.registration.isOpen
                  ? "Registration open"
                  : "Registration closed"
              }
            />
          </div>
        ) : null}
        {!staffReadOnly && !committed && event.registration?.isOpen ? (
          <button
            className="mt-4 w-full rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50 sm:w-auto"
            disabled={busy || event.entryTerms?.paidEntryAvailable === false}
            onClick={() => setConfirmingEntry(true)}
            type="button"
          >
            {busy
              ? "Registering..."
              : event.entryTerms?.paidEntryAvailable === false
                ? "Paid entry unavailable"
                : "Join Now"}
          </button>
        ) : null}
        {committed ? (
          <button
            className="mt-4 w-full cursor-default rounded-xl border border-emerald-300/25 bg-emerald-300/10 px-4 py-2.5 text-sm font-black capitalize text-emerald-100 sm:w-auto"
            disabled
            type="button"
          >
            Joined · {mine.status.replaceAll("_", " ")}
          </button>
        ) : null}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-800 bg-slate-950 p-4 sm:p-5">
        <div
          aria-label="Event details"
          className="grid grid-cols-2 rounded-xl bg-slate-900 p-1"
          role="tablist"
        >
          {[
            ["rewards", "Rewards"],
            ["leaderboard", "Leaderboard"],
          ].map(([value, label]) => (
            <button
              aria-selected={detailsTab === value}
              className={`rounded-lg px-3 py-2 text-sm font-black transition ${
                detailsTab === value
                  ? "bg-cyan-300 text-slate-950"
                  : "text-slate-400 hover:text-white"
              }`}
              key={value}
              onClick={() => setDetailsTab(value)}
              role="tab"
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        {detailsTab === "rewards" ? (
          event.rewardTerms?.placements?.length ? (
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
              <div className="grid grid-cols-[1fr_auto] bg-slate-900/80 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <span>Place</span>
                <span>Reward (₹)</span>
              </div>
              {event.rewardTerms.placements.map((reward) => (
                <div
                  className="grid grid-cols-[1fr_auto] border-t border-slate-800 px-3 py-2.5 text-sm"
                  key={reward.place}
                >
                  <span className="font-bold text-slate-200">#{reward.place}</span>
                  <span className="font-black text-emerald-200">
                    {amount(reward.amountMinor)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-500">
              No placement rewards configured.
            </p>
          )
        ) : (
          <>
            <div className="mt-3 overflow-hidden rounded-xl border border-slate-800">
              <div className="grid grid-cols-[3.5rem_minmax(0,1fr)] bg-slate-900/80 px-3 py-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
                <span>Rank</span>
                <span>Player</span>
              </div>
              {leaderboardRows.map((row) => (
                <div
                  className="grid grid-cols-[3.5rem_minmax(0,1fr)] border-t border-slate-800 px-3 py-2.5 text-sm"
                  key={row.id}
                >
                  <span className="font-black text-cyan-200">
                    {row.rank ? `#${row.rank}` : "-"}
                  </span>
                  <span className="truncate font-bold text-slate-200">
                    {row.player.displayName}
                  </span>
                </div>
              ))}
              {!leaderboardRows.length ? (
                <p className="border-t border-slate-800 px-3 py-3 text-sm text-slate-500">
                  {state.leaderboardsStatusById[runId] === "loading"
                    ? "Loading players..."
                    : "No players have joined yet."}
                </p>
              ) : null}
            </div>
            {state.leaderboardsErrorById[runId] ? (
              <button
                className="mt-3 text-sm font-bold text-rose-200"
                onClick={() => dispatch(fetchPlayerEventLeaderboard({ runId }))}
                type="button"
              >
                Retry leaderboard
              </button>
            ) : null}
            {(showFinalRanks
              ? standingPage?.nextCursor
              : leaderboardPage?.page?.nextCursor) ? (
              <button
                className="mt-3 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50"
                disabled={
                  showFinalRanks
                    ? state.standingsStatusById[runId] === "loading"
                    : state.leaderboardsStatusById[runId] === "loading"
                }
                onClick={() =>
                  dispatch(
                    showFinalRanks
                      ? fetchPlayerEventStandings({
                          cursor: standingPage.nextCursor,
                          runId,
                        })
                      : fetchPlayerEventLeaderboard({
                          cursor: leaderboardPage.page.nextCursor,
                          runId,
                        }),
                  )
                }
                type="button"
              >
                Load more
              </button>
            ) : null}
          </>
        )}
      </section>

      {mine ? (
        <section className="rounded-[22px] border border-slate-800 bg-slate-950 p-4 sm:p-5">
          <h2 className="text-xl font-black text-white">Your Event</h2>
          <EventProgression progression={progression} />
        </section>
      ) : null}
      <CompetitionEntryDialog
        actionLabel="Proceed & register"
        currency={event.entryTerms?.currency || "INR"}
        entryFeeMinor={event.entryTerms?.entryFeeMinor || 0}
        isOpen={confirmingEntry}
        onClose={() => setConfirmingEntry(false)}
        onProceed={register}
        testMoney={event.entryTerms?.testMoney}
        title={event.title}
        type="Event"
      />
    </main>
  );
};

const Fact = ({ label, value }) => (
  <div className="min-w-0 rounded-xl border border-white/10 bg-slate-950/65 p-3 backdrop-blur">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {label}
    </p>
    <p className="mt-1 truncate text-sm font-black capitalize text-white sm:text-base">{value}</p>
  </div>
);

Fact.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default EventDetails;
