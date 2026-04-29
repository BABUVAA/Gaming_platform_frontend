import { useState } from "react";
import { useSelector } from "react-redux";
import { FiCopy, FiGift, FiShare2, FiUsers } from "react-icons/fi";

const Refer = () => {
  const { profile } = useSelector((store) => store.auth);
  const [copied, setCopied] = useState(false);

  const referralCode = profile?.profileTag || profile?._id || "PLAYERCODE";
  const referralLink = `https://egaming.example/ref/${referralCode}`;

  const copyReferral = async (value) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      console.error("Unable to copy referral data:", error);
    }
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(34,211,238,0.16),_transparent_28%),linear-gradient(180deg,_rgba(8,15,28,0.96),_rgba(2,6,17,0.98))] p-6 shadow-[0_24px_70px_rgba(2,8,23,0.45)] md:p-8">
        <p className="text-xs uppercase tracking-[0.28em] text-cyan-300/80">
          Referral Program
        </p>
        <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">
              Bring your squad onto the platform.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">
              Share your player code with teammates, clan members, and tournament partners so onboarding feels organized from day one.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard icon={<FiUsers />} label="Best for" value="Clans and squads" />
            <MetricCard icon={<FiGift />} label="Use case" value="Roster growth" />
            <MetricCard icon={<FiShare2 />} label="Current code" value={referralCode} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
            Share Kit
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Referral assets</h2>

          <div className="mt-6 space-y-4">
            <ShareRow
              label="Referral code"
              value={referralCode}
              actionLabel={copied ? "Copied" : "Copy"}
              onAction={() => copyReferral(referralCode)}
            />
            <ShareRow
              label="Referral link"
              value={referralLink}
              actionLabel={copied ? "Copied" : "Copy"}
              onAction={() => copyReferral(referralLink)}
            />
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-slate-950/80 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/70">
            Suggested Use
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">Where referrals help most</h2>
          <div className="mt-6 grid gap-3">
            {[
              "Pull your current clan into one shared competition home.",
              "Get squads registered faster for customs and bracketed events.",
              "Keep social and competitive identity connected from the start.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-sm leading-6 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

const MetricCard = ({ icon, label, value }) => (
  <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
    <div className="flex items-center gap-2 text-cyan-300">
      {icon}
      <span className="text-xs uppercase tracking-[0.18em]">{label}</span>
    </div>
    <p className="mt-3 text-sm font-bold text-white">{value}</p>
  </div>
);

const ShareRow = ({ label, value, actionLabel, onAction }) => (
  <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{label}</p>
    <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <p className="break-all text-sm font-semibold text-white">{value}</p>
      <button
        type="button"
        onClick={onAction}
        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400/15"
      >
        <FiCopy />
        {actionLabel}
      </button>
    </div>
  </div>
);

export default Refer;
