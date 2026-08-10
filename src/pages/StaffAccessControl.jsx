import { Link } from "react-router-dom";
import RoleManagement from "../components/adminComponents/RoleManagement";
import { ROUTES } from "../routes/routeConstants";

const StaffAccessControl = () => (
  <main className="min-h-screen bg-[#030812] px-4 py-6 text-slate-100 lg:px-8">
    <div className="mx-auto max-w-[1500px]">
      <Link className="mb-5 inline-flex rounded-xl border border-slate-700 px-4 py-2 text-sm font-bold text-slate-300 hover:border-cyan-300 hover:text-white" to={ROUTES.STAFF}>Back to staff workspace</Link>
      <RoleManagement showStaffingActions={false} />
    </div>
  </main>
);

export default StaffAccessControl;
