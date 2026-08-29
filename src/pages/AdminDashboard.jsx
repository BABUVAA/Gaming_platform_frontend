import { useState } from "react";
import PropTypes from "prop-types";
import { FiCheckSquare, FiDollarSign, FiGrid, FiShield, FiUsers } from "react-icons/fi";
import { EventReviewQueue, GameCatalog, PaymentReconciliationReview, PrizeReleaseReview, RoleManagement, SecurityAttention, WithdrawalReview } from "../components";
import EventPrizeGovernanceReview from "../components/adminComponents/EventPrizeGovernanceReview.jsx";

const ADMIN_AREAS = [
  {
    description: "Staff ownership, roles, scopes, and hiring history.",
    icon: FiUsers,
    id: "roles",
    label: "People and access",
  },
  {
    description: "Game setup, ownership, readiness, and lifecycle.",
    icon: FiGrid,
    id: "games",
    label: "Game control",
  },
  {
    description: "Manually verify PhonePe sandbox deposits against provider status.",
    icon: FiDollarSign,
    id: "payment-reconciliation",
    label: "Sandbox Payments",
  },
  {
    description: "Authentication replay, fingerprint, and privilege-abuse signals.",
    icon: FiShield,
    id: "security",
    label: "Security Attention",
  },
  {
    description: "Event templates, schedules, and approval decisions.",
    icon: FiCheckSquare,
    id: "events",
    label: "Event Management",
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_24%),#111827] text-slate-100">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] grid-cols-[minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)]">
          <aside className="border-b border-slate-700 bg-[#182235]/90 p-3 backdrop-blur md:sticky md:top-20 md:h-[calc(100vh-5rem)] md:self-start md:overflow-y-auto md:border-b-0 md:border-r md:py-4">
            <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-1">
              {ADMIN_AREAS.map((area) => <WorkspaceButton active={area.id === activeSection} area={area} key={area.id} onClick={() => setActiveSection(area.id)} />)}
            </nav>
          </aside>

          <main className="min-w-0 p-3 pb-24 md:p-5">
            <header className="mb-4 flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/55 px-4 py-4">
              <div><h1 className="text-xl font-black text-white sm:text-2xl">{activeArea.label}</h1><p className="mt-1 text-sm text-slate-400">Platform governance</p></div>
              <span className="rounded-lg border border-slate-700 px-2.5 py-1.5 text-xs font-bold text-slate-300">Admin</span>
            </header>
            {activeSection === "roles" ? (
              <RoleManagement />
            ) : activeSection === "games" ? (
              <GameCatalog />
            ) : activeSection === "events" ? (
              <EventReviewQueue />
            ) : activeSection === "security" ? (
              <SecurityAttention />
            ) : activeSection === "prize-releases" ? (
              <><PrizeReleaseReview /><EventPrizeGovernanceReview /></>
            ) : activeSection === "payment-reconciliation" ? (
              <PaymentReconciliationReview />
            ) : (
              <WithdrawalReview />
            )}
          </main>
      </div>
    </div>
  );
};

const WorkspaceButton = ({ active, area, onClick }) => {
  const Icon = area.icon;
  return <button className={active ? "flex min-w-0 items-center gap-3 rounded-xl border border-cyan-400/40 bg-cyan-400/15 px-3 py-2.5 text-left" : "flex min-w-0 items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-left hover:bg-slate-700"} onClick={onClick} type="button"><span className={active ? "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-cyan-600 text-white" : "grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-700 text-cyan-300"}><Icon /></span><span className="min-w-0 truncate text-sm font-bold text-white">{area.label}</span></button>;
};

WorkspaceButton.propTypes = { active: PropTypes.bool.isRequired, area: PropTypes.shape({ icon: PropTypes.elementType.isRequired, label: PropTypes.string.isRequired }).isRequired, onClick: PropTypes.func.isRequired };

export default AdminDashboard;
