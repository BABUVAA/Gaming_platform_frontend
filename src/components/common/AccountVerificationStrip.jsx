import { FiAlertTriangle, FiChevronRight } from "react-icons/fi";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { ROUTES } from "../../routes/routeConstants";
import {
  selectIsAuthenticated,
  selectIsVerified,
} from "../../store/selectors/authSelectors";

const AccountVerificationStrip = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isVerified = useSelector(selectIsVerified);

  // Public visitors and verified accounts do not need verification guidance.
  if (!isAuthenticated || isVerified) return null;

  return (
    <section
      aria-live="polite"
      className="border-b border-amber-400/20 bg-[linear-gradient(90deg,#3b3020,#45351f,#3b3020)] text-amber-100"
      role="status"
    >
      {/* The whole message is interactive so users do not have to locate a
          small button before continuing their email verification flow. */}
      <Link
        to={ROUTES.ACCOUNT_SETTINGS}
        aria-label="Verify your email from the account page"
        className="group mx-auto flex max-w-[1600px] items-start gap-3 px-4 py-3 outline-none transition hover:bg-amber-300/[0.06] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-300 md:items-center md:px-6"
      >
          <span className="mt-0.5 rounded-full border border-amber-400/30 bg-amber-300/10 p-2 text-amber-300 md:mt-0">
            <FiAlertTriangle aria-hidden="true" className="text-base" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-amber-100">
              Verify your email to complete your account
            </p>
            <p className="mt-0.5 text-xs leading-5 text-amber-200/75 md:text-sm">
              Confirm your email before adding money, joining tournaments,
              linking game accounts, joining clans, or playing matches.
            </p>
          </div>

          <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-xs font-black uppercase tracking-[0.12em] text-amber-300 md:mt-0">
            <span className="hidden sm:inline">Verify email</span>
            <FiChevronRight
              aria-hidden="true"
              className="text-lg transition group-hover:translate-x-1"
            />
          </span>
      </Link>
    </section>
  );
};

export default AccountVerificationStrip;
