import { useState } from "react";
import PropTypes from "prop-types";
import { FiCheckSquare, FiDollarSign, FiGrid, FiShield, FiUsers, FiZap } from "react-icons/fi";
import { EventReviewQueue, GameCatalog, PrizeReleaseReview, QuickMatchOfferingManagement, RoleManagement, WithdrawalReview } from "../components";

const ADMIN_AREAS = [
  {
    description: "Staff ownership, roles, scopes, and hiring history.",
    icon: FiUsers,
    id: "roles",
    label: "People and access",
  },
  {
    description: "Game setup, ownership, readiness, and publishing.",
    icon: FiGrid,
    id: "games",
    label: "Game control",
  },
  {
    description: "Event templates, schedules, and approval decisions.",
    icon: FiCheckSquare,
    id: "events",
    label: "Event Management",
  },
  {
    description: "Fixed-seat tournament configuration and lifecycle.",
    icon: FiZap,
    id: "quick-matches",
    label: "Tournament Management",
  },
  {
    description: "Independent review of settled winner prize releases.",
    icon: FiDollarSign,
    id: "prize-releases",
    label: "Prize Review",
  },
  {
    description: "Claim, approve, or reject player withdrawal requests.",
    icon: FiDollarSign,
    id: "withdrawals",
    label: "Withdrawal Review",
  },
];

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState("roles");
  const activeArea = ADMIN_AREAS.find((area) => area.id === activeSection);

  return (
    <div className="min-h-screen bg-[#040914] text-slate-100">
      <div className="mx-auto min-h-screen max-w-[1680px] p-3 md:p-5">
        <div className="grid min-h-[calc(100vh-2.5rem)] overflow-hidden rounded-[34px] border border-slate-800 bg-[#07111f] shadow-[0_32px_100px_rgba(0,0,0,0.42)] lg:grid-cols-[19rem_minmax(0,1fr)]">
          <aside className="border-b border-slate-800 bg-[#030813] p-5 lg:border-b-0 lg:border-r lg:p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-300 text-lg font-black text-slate-950">EG</span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">Platform</p>
                <p className="mt-1 font-black text-white">Control room</p>
              </div>
            </div>

            <p className="mt-8 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600">Workspaces</p>
            <nav className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {ADMIN_AREAS.map((area) => <WorkspaceButton active={area.id === activeSection} area={area} key={area.id} onClick={() => setActiveSection(area.id)} />)}
            </nav>

            <div className="mt-8 rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4">
              <FiShield className="text-lg text-cyan-300" />
              <p className="mt-3 text-sm font-black text-white">Admin-only changes</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">Game setup, publishing, and staff authority stay inside this workspace. Operations staff can see work but cannot change platform rules.</p>
            </div>
          </aside>

          <main className="min-w-0 p-4 md:p-6 lg:p-8">
            <header className="mb-4 flex items-center justify-between border-b border-slate-800 pb-4">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">{activeArea.label}</p>
              <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-2 text-xs font-bold text-slate-300">Governance workspace</span>
            </header>
            {activeSection === "roles" ? (
              <RoleManagement />
            ) : activeSection === "games" ? (
              <GameCatalog />
            ) : activeSection === "events" ? (
              <EventReviewQueue />
            ) : activeSection === "quick-matches" ? (
              <QuickMatchOfferingManagement />
            ) : activeSection === "prize-releases" ? (
              <PrizeReleaseReview />
            ) : (
              <WithdrawalReview />
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const WorkspaceButton = ({ active, area, onClick }) => {
  const Icon = area.icon;
  return <button className={active ? "flex items-start gap-3 rounded-2xl border border-cyan-300/25 bg-cyan-300/10 p-4 text-left" : "flex items-start gap-3 rounded-2xl border border-transparent p-4 text-left hover:bg-slate-900/70"} onClick={onClick} type="button"><span className={active ? "rounded-xl bg-cyan-300 p-2 text-slate-950" : "rounded-xl bg-slate-900 p-2 text-slate-400"}><Icon /></span><span><span className="block text-sm font-black text-white">{area.label}</span><span className="mt-1 block text-xs leading-5 text-slate-400">{area.description}</span></span></button>;
};

WorkspaceButton.propTypes = { active: PropTypes.bool.isRequired, area: PropTypes.shape({ description: PropTypes.string.isRequired, icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired }).isRequired, onClick: PropTypes.func.isRequired };

export default AdminDashboard;
