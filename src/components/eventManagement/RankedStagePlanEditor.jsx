import PropTypes from "prop-types";
import {
  buildDefaultRankedStages,
  projectRankedStages,
} from "./rankedStagePlanUtils.js";

const clamp = (value, minimum, maximum) =>
  Math.min(Math.max(Number(value) || minimum, minimum), maximum);

const StageNumberInput = ({ label, max, min, onChange, value }) => (
  <label className="text-xs font-bold text-slate-400">
    {label}
    <input
      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 p-2.5 text-sm text-white"
      max={max}
      min={min}
      onChange={(event) => onChange(event.target.value)}
      required
      type="number"
      value={value}
    />
  </label>
);

StageNumberInput.propTypes = {
  label: PropTypes.string.isRequired,
  max: PropTypes.number.isRequired,
  min: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired,
};

const RankedStagePlanEditor = ({ capacity, onChange, stages }) => {
  const projection = projectRankedStages(Number(capacity), stages);

  const updateStage = (index, field, value) =>
    onChange(stages.map((stage, stageIndex) =>
      stageIndex === index ? { ...stage, [field]: value } : stage));

  const addQualifyingRound = () => {
    const finalStage = stages.at(-1) || buildDefaultRankedStages(capacity).at(-1);
    const prior = stages.at(-2) || {
      advanceCount: "10",
      batchSpacingMinutes: "0",
      checkInMinutesBefore: "15",
      participantsPerMatch: "100",
      stageDelayMinutes: "0",
    };
    onChange([
      ...stages.slice(0, -1),
      { ...prior, advanceCount: String(clamp(prior.advanceCount, 1, 99)) },
      finalStage,
    ]);
  };

  return (
    <fieldset className="rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
      <legend className="px-2 text-sm font-bold text-white">Ranked rounds</legend>
      <p className="mb-4 text-xs leading-5 text-slate-400">
        Define every round independently. The server balances the registered list into rooms,
        advances the reviewed top-N from each room, and requires the final list to fit one room.
      </p>

      <div className="space-y-3">
        {stages.map((stage, index) => {
          const isFinal = index === stages.length - 1;
          const preview = projection.rows[index];
          return (
            <article className="rounded-2xl border border-slate-700 bg-slate-950/60 p-4" key={`stage-${index + 1}`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-black text-white">Round {index + 1}{isFinal ? " / Final" : ""}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {preview
                      ? `${preview.participantCount.toLocaleString("en-IN")} players / ${preview.batchCount.toLocaleString("en-IN")} rooms${isFinal ? " / final ranking" : ` / ${preview.qualifiedCount.toLocaleString("en-IN")} qualify`}`
                      : "Complete the round rules to see the projection."}
                  </p>
                </div>
                {!isFinal ? (
                  <button
                    className="rounded-lg border border-rose-400/30 px-2.5 py-1.5 text-xs font-bold text-rose-200"
                    onClick={() => onChange(stages.filter((_, stageIndex) => stageIndex !== index))}
                    type="button"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                <StageNumberInput label="Players per room" max={100} min={2} onChange={(value) => updateStage(index, "participantsPerMatch", value)} value={stage.participantsPerMatch} />
                {isFinal ? (
                  <div className="rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-xs text-slate-300">
                    <span className="block font-bold text-slate-400">Qualification</span>
                    Final ranking
                  </div>
                ) : (
                  <StageNumberInput label="Top players per room" max={99} min={1} onChange={(value) => updateStage(index, "advanceCount", value)} value={stage.advanceCount} />
                )}
                <StageNumberInput label="Room spacing (minutes)" max={1440} min={0} onChange={(value) => updateStage(index, "batchSpacingMinutes", value)} value={stage.batchSpacingMinutes} />
                <StageNumberInput label="Check-in before (minutes)" max={1440} min={0} onChange={(value) => updateStage(index, "checkInMinutesBefore", value)} value={stage.checkInMinutesBefore} />
                <StageNumberInput label="Delay after prior round" max={10080} min={0} onChange={(value) => updateStage(index, "stageDelayMinutes", value)} value={stage.stageDelayMinutes} />
              </div>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <button
          className="rounded-xl border border-cyan-300/30 px-3 py-2 text-sm font-bold text-cyan-100 disabled:opacity-50"
          disabled={stages.length >= 32}
          onClick={addQualifyingRound}
          type="button"
        >
          Add qualifying round
        </button>
        <p className={projection.error ? "text-xs font-bold text-rose-300" : "text-xs font-bold text-emerald-300"}>
          {projection.error || "Round projection is valid."}
        </p>
      </div>
    </fieldset>
  );
};

RankedStagePlanEditor.propTypes = {
  capacity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  onChange: PropTypes.func.isRequired,
  stages: PropTypes.arrayOf(PropTypes.shape({
    advanceCount: PropTypes.string.isRequired,
    batchSpacingMinutes: PropTypes.string.isRequired,
    checkInMinutesBefore: PropTypes.string.isRequired,
    participantsPerMatch: PropTypes.string.isRequired,
    stageDelayMinutes: PropTypes.string.isRequired,
  })).isRequired,
};

export default RankedStagePlanEditor;
