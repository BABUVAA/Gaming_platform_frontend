import { useState } from "react";

const RewardDistribution = () => {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5">
      <h3 className="text-xl font-black text-white">Distribute Rewards</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Manual prize actions, campaign rewards, and operator review tools can
        live here as the next backend hooks land.
      </p>
      <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        Reward dispatch is staged for a later integration pass.
      </div>
    </div>
  );
};

const RewardHistory = () => {
  return (
    <div className="rounded-[24px] border border-slate-800 bg-[#020617] p-5">
      <h3 className="text-xl font-black text-white">Reward History</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Review past distributions, audit notes, and reward campaigns from one
        operator timeline.
      </p>
      <div className="mt-5 rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-4 text-sm text-slate-400">
        Historical reward data will appear here once the management endpoints are wired.
      </div>
    </div>
  );
};

const RewardManagement = () => {
  const [activeTab, setActiveTab] = useState("distribution");

  const tabs = [
    { key: "distribution", label: "Distribute" },
    { key: "history", label: "History" },
  ];

  return (
    <div className="rounded-[28px] border border-slate-800 bg-slate-950/90 p-6 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
            Rewards
          </p>
          <h2 className="mt-2 text-2xl font-black text-white">
            Reward Management
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Control incentives and keep prize operations organized.
          </p>
        </div>

        <div className="flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === tab.key
                  ? "bg-cyan-300 text-slate-950"
                  : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        {activeTab === "distribution" && <RewardDistribution />}
        {activeTab === "history" && <RewardHistory />}
      </div>
    </div>
  );
};

export default RewardManagement;
