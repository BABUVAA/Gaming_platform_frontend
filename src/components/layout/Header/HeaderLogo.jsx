import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import useNavigateHook from "../../../hooks/useNavigateHook";
import { ROUTES } from "../../../routes/routeConstants";

const HeaderLogo = ({ isStaff = false }) => {
  const { goToHome } = useNavigateHook();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => (isStaff ? navigate(ROUTES.STAFF) : goToHome())}
      className="group flex items-center gap-3 rounded-2xl border border-slate-600 bg-slate-800 px-3 py-2 text-left transition hover:border-amber-300/60 hover:bg-slate-700"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300 text-sm font-black tracking-[0.22em] text-slate-950 shadow-[0_10px_25px_rgba(251,191,36,0.22)] transition group-hover:bg-amber-200">
        EG
      </span>
      <span className="hidden sm:block">
        <span className="block text-[11px] uppercase tracking-[0.26em] text-amber-300">
          {isStaff ? "Staff Control" : "Player Arena"}
        </span>
        <span className="block text-sm font-black text-white">
          E-Gaming
        </span>
      </span>
    </button>
  );
};

HeaderLogo.propTypes = {
  isStaff: PropTypes.bool,
};

export default HeaderLogo;
