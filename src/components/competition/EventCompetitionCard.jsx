import { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import JoinProgress from "./JoinProgress.jsx";
import { getGamePresentation } from "../../config/gamePresentation.js";

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
  if (Number.isFinite(opens) && now < opens)
    return { label: "Registration opens in", target: opens };
  if (event.registration?.isOpen && Number.isFinite(closes) && now < closes)
    return { label: "Registration closes in", target: closes };
  if (Number.isFinite(starts) && now < starts)
    return { label: "Event starts in", target: starts };
  if (["stages_ready", "in_progress"].includes(event.status))
    return { label: "Live now", live: true };
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
  const rewards = useMemo(
    () => event.rewardTerms?.placements || [],
    [event.rewardTerms],
  );
  const presentation = getGamePresentation(event.game?.key);
  const canRegister =
    !staffReadOnly && !committed && event.registration?.isOpen;

  return (
    <article className="group relative min-h-[18rem] overflow-hidden rounded-[22px] border border-slate-700 bg-slate-900 shadow-[0_14px_32px_rgba(2,8,23,0.28)] transition duration-300 hover:-translate-y-1 hover:border-cyan-400/60">
      <img
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[68%_center] transition duration-500 group-hover:scale-105"
        src={presentation.image}
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.5),rgba(2,6,23,0.86)_38%,rgba(2,6,23,0.99)_100%)]" />

      <div className="relative flex min-h-[18rem] flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full border border-white/20 bg-slate-950/75 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur">
            Event
          </span>
          <span
            className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] backdrop-blur ${timeline.live ? "border-rose-300/40 bg-rose-500/20 text-rose-100" : "border-cyan-300/30 bg-slate-950/75 text-cyan-100"}`}
          >
            {timeline.label}
          </span>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">
            {presentation.label}
          </p>
          <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-white drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] sm:text-xl">
            {event.title}
          </h3>
          <p className="mt-1 text-xs capitalize text-slate-300">
            {event.format?.mode || "Open mode"}
            {event.format?.map ? ` / ${event.format.map}` : ""}
          </p>

          {timeline.target ? (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-cyan-300/15 bg-slate-950/55 px-3 py-2 backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-300">
                {timeline.label}
              </p>
              <p className="whitespace-nowrap font-mono text-sm font-black text-cyan-100">
                {clock(timeline.target - now)}
              </p>
            </div>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
            <Fact
              label="Entry"
              value={
                event.entryTerms?.policy === "paid"
                  ? money(event.entryTerms.entryFeeMinor)
                  : "Free"
              }
            />
            <Fact
              label="Registered"
              value={(event.registration?.registeredCount || 0).toLocaleString(
                "en-IN",
              )}
            />
            <Fact
              label="Access"
              value={(
                event.registration?.admissionPolicy || "open"
              ).replaceAll("_", " ")}
            />
          </div>

          {event.registration?.capacity > 0 ? (
            <div className="mt-2">
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

          {rewards.length ? (
            <p className="mt-2 line-clamp-1 text-[11px] font-bold text-emerald-200">
              Rewards:{" "}
              {rewards
                .slice(0, 3)
                .map(
                  (reward) =>
                    `#${reward.place} ${money(reward.amountMinor)}`,
                )
                .join(" / ")}
              {rewards.length > 3 ? ` / +${rewards.length - 3} places` : ""}
            </p>
          ) : null}

          {mine ? (
            <p className="mt-2 text-xs font-bold capitalize text-cyan-200">
              Your entry: {mine.status.replaceAll("_", " ")}
            </p>
          ) : null}
          {event.execution?.progression?.status &&
          event.execution.progression.status !== "active" ? (
            <p className="mt-2 text-xs font-black capitalize text-amber-200">
              Result: {event.execution.progression.status.replaceAll("_", " ")}
            </p>
          ) : null}
          {event.execution?.myBatch?.matchId ? (
            <Link
              className="mt-3 block rounded-xl border border-cyan-300/30 bg-slate-950/45 px-3 py-2 text-center text-xs font-black text-cyan-100"
              to={`/dashboard/matches/${event.execution.myBatch.matchId}`}
            >
              Open my Match
            </Link>
          ) : null}

          <div
            className={`mt-3 grid gap-2 ${canRegister ? "grid-cols-2" : "grid-cols-1"}`}
          >
            <Link
              className="flex h-9 items-center justify-center rounded-xl border border-white/15 bg-slate-950/55 px-3 text-xs font-black text-slate-100 hover:border-cyan-300/40 hover:text-cyan-100"
              to={`/dashboard/events/${event.id}`}
            >
              View Event
            </Link>

            {canRegister ? (
              <button
                className="h-9 rounded-xl bg-cyan-300 px-3 text-xs font-black text-slate-950 disabled:opacity-50"
                disabled={
                  busy || event.entryTerms?.paidEntryAvailable === false
                }
                onClick={() => onRegister(event)}
                type="button"
              >
                {busy
                  ? "Registering..."
                  : event.entryTerms?.paidEntryAvailable === false
                    ? "Unavailable"
                    : "Join Event"}
              </button>
            ) : null}
          </div>

          {committed ? (
            <p className="mt-2 text-[10px] font-bold text-slate-300">
              Registration committed / cancellation unavailable
            </p>
          ) : null}
          {staffReadOnly ? (
            <p className="mt-2 text-[10px] font-bold text-cyan-200">
              Staff read-only view
            </p>
          ) : null}
        </div>
      </div>
    </article>
  );
};

const Fact = ({ label, value }) => (
  <div className="min-w-0 rounded-xl border border-white/15 bg-slate-950/75 p-2 backdrop-blur-sm">
    <p className="text-[9px] uppercase tracking-wide text-slate-400">{label}</p>
    <p className="mt-0.5 truncate font-black capitalize text-white">{value}</p>
  </div>
);

Fact.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
};

EventCompetitionCard.propTypes = {
  busy: PropTypes.bool.isRequired,
  event: PropTypes.object.isRequired,
  onRegister: PropTypes.func.isRequired,
  staffReadOnly: PropTypes.bool.isRequired,
};

export default EventCompetitionCard;
