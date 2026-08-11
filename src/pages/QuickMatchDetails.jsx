import { useEffect } from "react";
import PropTypes from "prop-types";
import { FiArrowLeft, FiClock, FiMapPin, FiShield, FiUsers } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import QuickMatchCard from "../components/ui/GameCard/QuickMatchCard";
import { getGamePresentation } from "../config/gamePresentation";
import { ROUTES } from "../routes/routeConstants";
import {
  selectPlayerQuickMatchDetail,
  selectPlayerQuickMatchDetailError,
  selectPlayerQuickMatchDetailStatus,
} from "../store/selectors/quickMatchOfferingSelectors";
import { fetchPlayerQuickMatchOfferingById } from "../store/slices/quickMatchOfferingSlice";

const QuickMatchDetails = () => {
  const { id } = useParams();
  const dispatch = useDispatch();
  const offering = useSelector((state) =>
    selectPlayerQuickMatchDetail(state, id),
  );
  const status = useSelector((state) =>
    selectPlayerQuickMatchDetailStatus(state, id),
  );
  const error = useSelector((state) =>
    selectPlayerQuickMatchDetailError(state, id),
  );

  useEffect(() => {
    const request = dispatch(fetchPlayerQuickMatchOfferingById(id));
    return () => request.abort();
  }, [dispatch, id]);

  if (!offering && ["idle", "loading"].includes(status)) {
    return (
      <div className="animate-pulse space-y-5">
        <div className="h-10 w-40 rounded-xl bg-slate-800" />
        <div className="h-80 rounded-[32px] bg-slate-800" />
      </div>
    );
  }

  if (!offering) {
    return (
      <section className="mx-auto max-w-xl rounded-[28px] border border-rose-400/20 bg-rose-500/10 p-8 text-center">
        <h1 className="text-2xl font-black text-white">Tournament unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-rose-100">
          {error || "This tournament is no longer active or could not be found."}
        </p>
        <Link className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-slate-950" to={ROUTES.TOURNAMENT}>
          <FiArrowLeft /> Browse tournaments
        </Link>
      </section>
    );
  }

  const presentation = getGamePresentation(offering.gameKey);

  return (
    <div className="space-y-6 pb-8">
      <Link className="inline-flex items-center gap-2 text-sm font-bold text-slate-300 hover:text-white" to={ROUTES.TOURNAMENT}>
        <FiArrowLeft /> Back to tournaments
      </Link>

      <section className="relative overflow-hidden rounded-[34px] border border-slate-700 bg-slate-950 shadow-[0_24px_70px_rgba(2,8,23,0.45)]">
        <img alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" src={presentation.image} />
        <div className="relative grid gap-8 bg-gradient-to-r from-slate-950 via-slate-950/95 to-slate-950/65 p-6 md:p-9 lg:grid-cols-[1fr_22rem]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-300">{offering.game?.name || presentation.label}</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">{offering.title}</h1>
            <div className="mt-6 flex flex-wrap gap-3 text-sm text-slate-200">
              <Fact icon={FiUsers} text={`${offering.maxParticipants} seats`} />
              <Fact icon={FiShield} text={offering.teamSize === 1 ? "Solo" : `${offering.teamSize} players per team`} />
              <Fact icon={FiMapPin} text={[offering.mode, offering.map, offering.region].filter(Boolean).join(" / ")} />
              <Fact icon={FiClock} text={offering.schedulePolicy === "on_demand" ? "Starts when full" : "Published schedule"} />
            </div>
          </div>
          <QuickMatchCard offering={offering} showDetails={false} />
        </div>
      </section>
    </div>
  );
};

const Fact = ({ icon: Icon, text }) => (
  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2">
    <Icon className="text-cyan-300" /> {text}
  </span>
);

Fact.propTypes = {
  icon: PropTypes.elementType.isRequired,
  text: PropTypes.string.isRequired,
};

export default QuickMatchDetails;
