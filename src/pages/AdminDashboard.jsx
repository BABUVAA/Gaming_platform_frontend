import { useState } from "react";
import PropTypes from "prop-types";
import { GameCatalog, RoleManagement } from "../components";

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("roles");

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100">
      <div className="mx-auto grid min-h-screen max-w-[1600px] md:grid-cols-[18rem_1fr]">
        <aside className="border-r border-slate-800 bg-[#030812] px-4 py-6">
          <p className="text-[11px] uppercase tracking-[0.3em] text-cyan-300/80">
            Admin Console
          </p>
          <h1 className="mt-3 text-3xl font-black text-white">Admin Panel</h1>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Configure staff access before enabling additional platform tools.
          </p>

          <nav className="mt-8 space-y-2">
            <button className={activeSection === "roles" ? "w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-4 text-left text-white" : "w-full rounded-2xl border border-slate-800 px-4 py-4 text-left text-slate-300"} onClick={() => setActiveSection("roles")} type="button">
              <span className="block text-sm font-bold">Role Management</span>
              <span className="mt-1 block text-xs text-slate-400">
                Employees, access roles, and scopes
              </span>
            </button>
            <button className={activeSection === "games" ? "w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-4 py-4 text-left text-white" : "w-full rounded-2xl border border-slate-800 px-4 py-4 text-left text-slate-300"} onClick={() => setActiveSection("games")} type="button">
              <span className="block text-sm font-bold">Game Management</span>
              <span className="mt-1 block text-xs text-slate-400">Drafts, readiness, publishing and history</span>
            </button>
          </nav>
        </aside>

        <main className="min-w-0 px-4 py-6 md:px-6">
          <section className="mb-6 rounded-[28px] border border-slate-800 bg-slate-950/80 p-5 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
                  Admin Access
                </p>
                <h2 className="mt-2 text-2xl font-black text-white">
                  {activeSection === "roles" ? "Role management" : "Game management"}
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-400">
                  {activeSection === "roles"
                    ? "Assign staff roles, scopes, and hiring approvals."
                    : "Create game identities, review readiness, and control publishing."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <StatusCard label="Active section" value={activeSection === "roles" ? "Role Management" : "Game Management"} />
                <StatusCard label="Mode" value="Admin" />
              </div>
            </div>
          </section>
          {activeSection === "roles" ? <RoleManagement /> : <GameCatalog />}
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

StatusCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default AdminDashboard;
