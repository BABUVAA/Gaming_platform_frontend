import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import EventProgression from "../components/EventProgression.jsx";
import {
  fetchPlayerEventDetails,
  fetchPlayerEventStandings,
  registerForEvent,
  selectEventProgression,
} from "../store/slices/eventRegistrationSlice.js";
import { selectPlayerSummary } from "../store/selectors/playerSelectors.js";

const formatDate = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not scheduled" : date.toLocaleString();
};

const money = (minor = 0) => `INR ${(minor / 100).toFixed(2)}`;

const countdown = (target, now) => {
  const seconds = Math.max(0, Math.floor((new Date(target).getTime() - now) / 1000));
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
  const state = useSelector((root) => root.eventRegistration);
  const event = state.detailsById[runId];
  const standingPage = state.standingsById[runId];
  const staffReadOnly = useSelector(selectPlayerSummary)?.role === "staff";
  const busy = state.actionById[runId] === "loading";

  useEffect(() => {
    const request = dispatch(fetchPlayerEventDetails(runId));
    return () => request.abort();
  }, [dispatch, runId]);

  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!event?.registration?.mine || !["in_progress", "completed"].includes(event.status)) return undefined;
    const request = dispatch(fetchPlayerEventStandings({ runId }));
    return () => request.abort();
  }, [dispatch, event?.registration?.mine, event?.status, runId]);

  if (state.detailsStatusById[runId] === "loading" && !event) {
    return <main className="rounded-2xl border border-slate-800 p-6 text-slate-300">Loading Event...</main>;
  }
  if (!event) {
    return <main className="rounded-2xl border border-rose-400/20 p-6"><p className="text-rose-100">{state.detailsErrorById[runId] || "This Event is unavailable."}</p><Link className="mt-4 inline-block font-bold text-cyan-200" to="/dashboard">Back to Compete</Link></main>;
  }

  const mine = event.registration?.mine;
  const committed = ["registered", "waitlisted"].includes(mine?.status);
  const progression = selectEventProgression(event, standingPage);
  const startsLater = new Date(event.startsAt).getTime() > now;
  const register = () => {
    const fee = event.entryTerms?.policy === "paid" ? ` ${money(event.entryTerms.entryFeeMinor)}${event.entryTerms.testMoney ? " in test money" : ""} will be held.` : "";
    if (globalThis.confirm(`Event registration is final and cannot be cancelled.${fee} Continue?`)) dispatch(registerForEvent(event.id));
  };

  return (
    <main className="space-y-5">
      <Link className="inline-flex text-sm font-bold text-slate-400 hover:text-cyan-200" to="/dashboard">Back to Compete</Link>
      <section className="rounded-3xl border border-cyan-300/20 bg-slate-950 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">{event.game?.name || "Event"}</p>
            <h1 className="mt-2 text-3xl font-black text-white">{event.title}</h1>
            <p className="mt-2 text-sm capitalize text-slate-400">{event.format?.mode || "Open mode"}{event.format?.map ? ` / ${event.format.map}` : ""} / {(event.status || "scheduled").replaceAll("_", " ")}</p>
          </div>
          {startsLater ? <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-3 text-right"><p className="text-xs text-slate-400">Event starts in</p><p className="mt-1 font-mono text-xl font-black text-cyan-100">{countdown(event.startsAt, now)}</p></div> : null}
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Fact label="Entry" value={event.entryTerms?.policy === "paid" ? money(event.entryTerms.entryFeeMinor) : "Free"} />
          <Fact label="Registration" value={event.registration?.isOpen ? "Open" : "Closed"} />
          <Fact label="Players" value={`${(event.registration?.registeredCount || 0).toLocaleString("en-IN")} / ${(event.registration?.capacity || 0).toLocaleString("en-IN")}`} />
          <Fact label="Access" value={(event.registration?.admissionPolicy || "open").replaceAll("_", " ")} />
        </div>
        <div className="mt-4 grid gap-3 text-sm text-slate-400 sm:grid-cols-3">
          <p>Opens <span className="block font-bold text-slate-200">{formatDate(event.registration?.opensAt)}</span></p>
          <p>Closes <span className="block font-bold text-slate-200">{formatDate(event.registration?.closesAt)}</span></p>
          <p>Starts <span className="block font-bold text-slate-200">{formatDate(event.startsAt)}</span></p>
        </div>
        {!staffReadOnly && !committed && event.registration?.isOpen ? <button className="mt-5 rounded-xl bg-cyan-300 px-5 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50" disabled={busy || event.entryTerms?.paidEntryAvailable === false} onClick={register} type="button">{busy ? "Registering..." : event.entryTerms?.paidEntryAvailable === false ? "Paid entry unavailable" : "Register for Event"}</button> : null}
        {committed ? <p className="mt-5 text-sm font-bold capitalize text-cyan-200">Your entry: {mine.status.replaceAll("_", " ")}</p> : null}
      </section>

      <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6">
        <h2 className="text-xl font-black text-white">Rewards</h2>
        {event.rewardTerms?.placements?.length ? <div className="mt-4 overflow-hidden rounded-2xl border border-slate-800">{event.rewardTerms.placements.map((reward) => <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 text-sm last:border-b-0" key={reward.place}><span className="font-black text-cyan-200">Place #{reward.place}</span><span className="font-black text-emerald-200">{money(reward.amountMinor)}</span></div>)}</div> : <p className="mt-3 text-sm text-slate-500">No placement rewards configured.</p>}
      </section>

      {mine ? <section className="rounded-3xl border border-slate-800 bg-slate-950 p-6"><h2 className="text-xl font-black text-white">Your Event</h2><EventProgression progression={progression} standings={standingPage?.standings || []} />{standingPage?.status === "pending" ? <p className="mt-3 text-sm text-slate-500">Final leaderboard will appear as results are finalized.</p> : null}{state.standingsErrorById[runId] ? <button className="mt-3 text-sm font-bold text-rose-200" onClick={() => dispatch(fetchPlayerEventStandings({ runId }))} type="button">Retry leaderboard</button> : null}{standingPage?.nextCursor ? <button className="mt-4 rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-200 disabled:opacity-50" disabled={state.standingsStatusById[runId] === "loading"} onClick={() => dispatch(fetchPlayerEventStandings({ cursor: standingPage.nextCursor, runId }))} type="button">Load more standings</button> : null}</section> : null}
    </main>
  );
};

const Fact = ({ label, value }) => <div className="rounded-2xl border border-slate-800 p-4"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 font-black capitalize text-white">{value}</p></div>;
Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string.isRequired };

export default EventDetails;
