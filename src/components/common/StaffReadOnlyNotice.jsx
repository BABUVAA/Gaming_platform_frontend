import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { selectIsStaffUtilityMode } from "../../store/selectors/playerSelectors";
import { ROUTES } from "../../routes/routeConstants";
import { STAFF_UTILITY_MESSAGE } from "../../utils/staffUtilityMode";

const StaffReadOnlyNotice = () => {
  const isStaffUtilityMode = useSelector(selectIsStaffUtilityMode);
  if (!isStaffUtilityMode) return null;

  return (
    <section className="mb-5 flex flex-col gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-4 text-sm text-amber-50 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-black uppercase tracking-[0.16em] text-amber-200">
          Staff read-only view
        </p>
        <p className="mt-1 leading-6">{STAFF_UTILITY_MESSAGE}</p>
      </div>
      <Link
        className="shrink-0 rounded-xl bg-amber-200 px-4 py-2 text-center font-black text-slate-950"
        to={ROUTES.STAFF}
      >
        Open Staff Workspace
      </Link>
    </section>
  );
};

export default StaffReadOnlyNotice;
