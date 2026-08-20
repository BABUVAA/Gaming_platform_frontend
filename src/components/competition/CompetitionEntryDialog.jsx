import PropTypes from "prop-types";
import { createPortal } from "react-dom";
import { FiArrowRight, FiShield, FiX } from "react-icons/fi";

const formatAmount = (amountMinor, currency) => {
  if (!amountMinor) return "Free";
  try {
    return new Intl.NumberFormat("en-IN", {
      currency,
      style: "currency",
    }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
};

const CompetitionEntryDialog = ({
  actionLabel = "Proceed",
  currency,
  entryFeeMinor,
  isOpen,
  onClose,
  onProceed,
  testMoney = false,
  teamSize = 1,
  title,
  type = "Tournament",
}) => {
  if (!isOpen) return null;
  const isPaid = entryFeeMinor > 0;
  return createPortal(
    <div
      aria-labelledby="competition-entry-title"
      aria-modal="true"
      className="fixed inset-0 z-[1200] grid place-items-end bg-slate-950/80 p-0 backdrop-blur-sm sm:place-items-center sm:p-4"
      role="dialog"
    >
      <section className="w-full rounded-t-[28px] border border-slate-700 bg-[#0b1424] p-5 shadow-2xl sm:max-w-md sm:rounded-[28px] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
              Confirm {type} entry
            </p>
            <h2
              className="mt-2 text-xl font-black text-white"
              id="competition-entry-title"
            >
              {title}
            </h2>
          </div>
          <button
            aria-label="Close entry confirmation"
            className="rounded-xl border border-slate-700 p-2 text-slate-300"
            onClick={onClose}
            type="button"
          >
            <FiX />
          </button>
        </div>
        <div className="mt-5 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 p-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Entry amount
          </p>
          <p className="mt-2 text-3xl font-black text-white">
            {formatAmount(entryFeeMinor, currency)}
          </p>
          {testMoney ? (
            <p className="mt-2 text-xs font-bold text-amber-200">
              PhonePe sandbox / test money
            </p>
          ) : null}
        </div>
        <div className="mt-4 flex gap-3 rounded-2xl border border-slate-700 bg-slate-950/50 p-4 text-sm leading-6 text-slate-300">
          <FiShield className="mt-1 shrink-0 text-cyan-300" />
          <p>
            {isPaid
              ? teamSize > 1
                ? `This is the amount per player. Proceeding with a complete ${teamSize}-player team moves this amount from every member's Available balance to Entry held.`
                : "This amount moves from Available balance to Entry held when you proceed. Settlement or cancellation remains server-controlled."
              : "No wallet amount will be held for this entry."}{" "}
            No password is required.
          </p>
        </div>
        {type === "Event" ? (
          <p className="mt-3 text-xs leading-5 text-amber-100">
            Event registration is final and cannot be cancelled by the player.
          </p>
        ) : null}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            className="rounded-xl border border-slate-700 px-4 py-3 text-sm font-bold text-slate-300"
            onClick={onClose}
            type="button"
          >
            Back
          </button>
          <button
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-black text-slate-950"
            onClick={onProceed}
            type="button"
          >
            {actionLabel}
            <FiArrowRight />
          </button>
        </div>
      </section>
    </div>,
    document.body,
  );
};

CompetitionEntryDialog.propTypes = {
  actionLabel: PropTypes.string,
  currency: PropTypes.string.isRequired,
  entryFeeMinor: PropTypes.number.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onProceed: PropTypes.func.isRequired,
  testMoney: PropTypes.bool,
  teamSize: PropTypes.number,
  title: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["Event", "Tournament"]),
};

export default CompetitionEntryDialog;
