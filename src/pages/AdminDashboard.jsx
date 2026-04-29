import { useState } from "react";
import { useSocket } from "../context/socketContext";
import {
  RewardManagement,
  TournamentManagement,
  UserManagement,
  VerificationManagement,
  WalletManagement,
} from "../components";

const AdminDashboard = () => {
  const { socket, connected } = useSocket();
  const [activeSection, setActiveSection] = useState("verification");

  const menu = [
    {
      label: "Verification Queue",
      key: "verification",
      description: "Manual game reviews and account trust",
    },
    {
      label: "Users",
      key: "users",
      description: "Player accounts and access roles",
    },
    {
      label: "Wallets",
      key: "wallets",
      description: "Deposits, withdrawals, and ledger review",
    },
    {
      label: "Tournaments",
      key: "tournaments",
      description: "Templates, events, and monitoring",
    },
    {
      label: "Rewards",
      key: "rewards",
      description: "Prize and incentive controls",
    },
  ];

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] md:grid-cols-[18rem_1fr]">
        <aside className="border-r border-slate-800 bg-[#030812] px-4 py-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
            Operator Console
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">Admin Panel</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Review identities, inspect finance flows, and supervise live
            competition systems from one place.
          </p>

          <nav className="mt-8 space-y-2">
            {menu.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setActiveSection(item.key)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  activeSection === item.key
                    ? "border-cyan-400/30 bg-cyan-400/12 text-white"
                    : "border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                }`}
              >
                <span className="block text-sm font-bold">{item.label}</span>
                <span className="mt-1 block text-xs text-slate-500">
                  {item.description}
                </span>
              </button>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-6 md:px-6">
          <section className="mb-6 rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
                  Admin Operations
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  Platform oversight and moderation control
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                  Keep identity review, finance oversight, player management,
                  and live tournament tooling under one darker command shell.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <StatusCard label="Live socket" value={connected ? "Online" : "Offline"} />
                <StatusCard label="Active section" value={menu.find((item) => item.key === activeSection)?.label || "Overview"} />
                <StatusCard label="Mode" value="Operator" />
              </div>
            </div>
          </section>
          {activeSection === "verification" && <VerificationManagement />}
          {activeSection === "users" && <UserManagement />}
          {activeSection === "wallets" && <WalletManagement />}
          {activeSection === "tournaments" && (
            <TournamentManagement socket={socket} />
          )}
          {activeSection === "rewards" && <RewardManagement />}
        </main>
      </div>
    </div>
  );
};

const StatusCard = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-800 bg-[#020617] px-4 py-4">
    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
    <p className="mt-3 text-lg font-black text-white">{value}</p>
  </div>
);

export default AdminDashboard;
