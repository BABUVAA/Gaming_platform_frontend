import PropTypes from "prop-types";

const money = (minor, currency) =>
  new Intl.NumberFormat("en-IN", { currency, style: "currency" }).format(minor / 100);

const REWARD_CHOICES = Object.freeze([
  { detail: "You funded every seat", label: "Keep full reward", value: "captain_keeps" },
  { detail: "Entry cost back first, then split winnings", label: "Share with team", value: "reimburse_then_split" },
]);

const TeamPaymentChoice = ({ currency = "INR", entryFeeMinor, onChange, onRewardChange, rewardValue, teamSize, value }) => {
  if (!entryFeeMinor || teamSize < 2) return null;
  const total = entryFeeMinor * teamSize;
  const choices = [
    {
      detail: `${money(total, currency)} from your wallet`,
      label: "I pay for everyone",
      value: "captain_pays",
    },
    {
      detail: `${money(entryFeeMinor, currency)} from each member`,
      label: "Split between team",
      value: "split",
    },
  ];

  return (
    <fieldset className="mt-4">
      <legend className="text-xs font-black uppercase tracking-wider text-slate-400">
        Payment
      </legend>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {choices.map((choice) => (
          <label
            className={`cursor-pointer rounded-xl border p-3 ${value === choice.value ? "border-cyan-300 bg-cyan-300/10" : "border-slate-700 bg-slate-900"}`}
            key={choice.value}
          >
            <input
              checked={value === choice.value}
              className="sr-only"
              name="team-payment-mode"
              onChange={() => onChange(choice.value)}
              type="radio"
              value={choice.value}
            />
            <span className="block text-sm font-black text-white">{choice.label}</span>
            <span className="mt-1 block text-xs text-slate-400">{choice.detail}</span>
          </label>
        ))}
      </div>
      {value === "captain_pays" ? (
        <div className="mt-3">
          <p className="text-xs font-black uppercase tracking-wider text-slate-400">If your team wins</p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {REWARD_CHOICES.map((choice) => (
              <label className={`cursor-pointer rounded-xl border p-3 ${rewardValue === choice.value ? "border-emerald-300 bg-emerald-300/10" : "border-slate-700 bg-slate-900"}`} key={choice.value}>
                <input checked={rewardValue === choice.value} className="sr-only" name="team-reward-mode" onChange={() => onRewardChange(choice.value)} type="radio" value={choice.value} />
                <span className="block text-sm font-black text-white">{choice.label}</span>
                <span className="mt-1 block text-xs text-slate-400">{choice.detail}</span>
              </label>
            ))}
          </div>
        </div>
      ) : null}
    </fieldset>
  );
};

TeamPaymentChoice.propTypes = {
  currency: PropTypes.string,
  entryFeeMinor: PropTypes.number.isRequired,
  onChange: PropTypes.func.isRequired,
  onRewardChange: PropTypes.func.isRequired,
  rewardValue: PropTypes.oneOf(["captain_keeps", "reimburse_then_split"]).isRequired,
  teamSize: PropTypes.number.isRequired,
  value: PropTypes.oneOf(["captain_pays", "split"]).isRequired,
};

export default TeamPaymentChoice;
