import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";

const clock = (milliseconds) => {
  const total = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  return `${days ? `${days}d ` : ""}${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const timelineFor = (event, now) => {
  const opens = new Date(event.registration?.opensAt).getTime();
  const closes = new Date(event.registration?.closesAt).getTime();
  const starts = new Date(event.startsAt).getTime();
  if (Number.isFinite(opens) && now < opens) return { label: "Registration opens in", target: opens };
  if (event.registration?.isOpen && Number.isFinite(closes) && now < closes) return { label: "Registration closes in", target: closes };
  if (Number.isFinite(starts) && now < starts) return { label: "Event starts in", target: starts };
  if (["stages_ready", "in_progress"].includes(event.status)) return { label: "Live now", live: true };
  if (event.status === "completed") return { label: "Completed" };
  if (event.status === "cancelled") return { label: "Cancelled" };
  return { label: "Registration closed" };
};

const money = (minor = 0) => `INR ${(minor / 100).toFixed(2)}`;

const EventCompetitionCard = ({ busy, event, onRegister, staffReadOnly }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = globalThis.setInterval(() => setNow(Date.now()), 1000);
    return () => globalThis.clearInterval(timer);
  }, []);
  const timeline = timelineFor(event, now);
  const mine = event.registration?.mine;
  const committed = ["registered", "waitlisted"].includes(mine?.status);
  const rewards = useMemo(() => event.rewardTerms?.placements || [], [event.rewardTerms]);

  return (
    <article className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-[0_14px_34px_rgba(2,8,23,0.18)]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">Event / {event.game?.name || "Game"}</p>
          <h3 className="mt-1 truncate text-xl font-black text-white">{event.title}</h3>
          <p className="mt-1 text-sm text-slate-400">{event.format?.mode || "Open mode"}{event.format?.map ? ` / ${event.format.map}` : ""}</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${timeline.live ? "border-rose-400/40 bg-rose-400/10 text-rose-200" : "border-slate-600 text-slate-300"}`}>{timeline.label}</span>
      </div>

      {timeline.target ? <div className="mt-4 rounded-xl border border-cyan-300/15 bg-cyan-300/5 px-4 py-3"><p className="text-xs text-slate-400">{timeline.label}</p><p className="mt-1 font-mono text-2xl font-black tracking-tight text-cyan-100">{clock(timeline.target - now)}</p></div> : null}

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <Fact label="Entry" value={event.entryTerms?.policy === "paid" ? money(event.entryTerms.entryFeeMinor) : "Free"} />
        <Fact label="Registered" value={(event.registration?.registeredCount || 0).toLocaleString("en-IN")} />
        <Fact label="Access" value={(event.registration?.admissionPolicy || "open").replaceAll("_", " ")} />
      </div>

      {rewards.length ? <p className="mt-3 text-xs font-bold text-emerald-200">Rewards: {rewards.slice(0, 3).map((reward) => `#${reward.place} ${money(reward.amountMinor)}`).join(" / ")}{rewards.length > 3 ? ` / +${rewards.length - 3} places` : ""}</p> : null}
      {mine ? <p className="mt-3 text-sm font-bold capitalize text-cyan-200">Your entry: {mine.status.replaceAll("_", " ")}</p> : null}
      {event.execution?.progression?.status && event.execution.progression.status !== "active" ? <p className="mt-2 text-sm font-black capitalize text-amber-200">Result: {event.execution.progression.status.replaceAll("_", " ")}</p> : null}
      {event.execution?.myBatch?.matchId ? <Link className="mt-4 block rounded-xl border border-cyan-300/30 px-4 py-2.5 text-center text-sm font-black text-cyan-100" to={`/dashboard/matches/${event.execution.myBatch.matchId}`}>Open my Match</Link> : null}

      {!staffReadOnly && !committed ? <button className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-50" disabled={busy || !event.registration?.isOpen || event.entryTerms?.paidEntryAvailable === false} onClick={() => onRegister(event)} type="button">{busy ? "Registering..." : event.entryTerms?.paidEntryAvailable === false ? "Paid entry unavailable" : event.registration?.isOpen ? "Register for Event" : "Registration closed"}</button> : null}
      {committed ? <p className="mt-4 text-xs font-bold text-slate-400">Registration committed / cancellation unavailable</p> : null}
      {staffReadOnly ? <p className="mt-4 text-xs font-bold text-cyan-200">Staff read-only view</p> : null}
    </article>
  );
};

const Fact = ({ label, value }) => <div className="min-w-0 rounded-xl border border-slate-800 p-3"><p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p><p className="mt-1 truncate font-black capitalize text-white">{value}</p></div>;
Fact.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired };
EventCompetitionCard.propTypes = { busy: PropTypes.bool.isRequired, event: PropTypes.object.isRequired, onRegister: PropTypes.func.isRequired, staffReadOnly: PropTypes.bool.isRequired };

export default EventCompetitionCard;
