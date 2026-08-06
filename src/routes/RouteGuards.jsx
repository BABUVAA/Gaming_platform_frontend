import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Navigate } from "react-router-dom";
import LoadingSpinner from "../components/common/LoadingSpinner";
import EmailVerificationDialog from "../components/common/EmailVerificationDialog";
import { useAuthStore, usePlayerStore } from "../store/useStore";
import {
  hasApprovedHostAccess,
  USER_ROLES,
} from "../utils/accessControl";
import { getDefaultRouteForRole } from "../utils/navigation";
import { ROUTES } from "./routeConstants";

// Route-level loading stays separate from pages so the router can reuse one
// fallback while auth/profile state is still resolving.
export const Loading = () => <LoadingSpinner />;

const ProfileRecoveryState = ({ onRetry, onResetSession }) => (
  <div className="mx-auto max-w-lg rounded-[28px] border border-rose-400/20 bg-slate-950/90 p-6 text-center text-slate-200 shadow-[0_18px_40px_rgba(2,8,23,0.35)]">
    <h2 className="text-xl font-bold text-white">Unable to load your profile</h2>
    <p className="mt-3 text-sm leading-7 text-slate-400">
      We stopped showing the spinner here so you can recover instead of getting
      stuck on a loading screen.
    </p>
    <div className="mt-5 flex flex-wrap justify-center gap-3">
      <button
        type="button"
        onClick={onRetry}
        className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-200"
      >
        Retry Profile Load
      </button>
      <button
        type="button"
        onClick={onResetSession}
        className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white"
      >
        Return To Login
      </button>
    </div>
  </div>
);

const useAccessSummaryGate = () => {
  const [hasRequestedSummary, setHasRequestedSummary] = useState(false);
  const {
    isAuthenticated,
    isSessionResolving,
    signOut,
  } = useAuthStore();
  const { summary, summaryStatus, loadSummary } = usePlayerStore();

  useEffect(() => {
    // Dashboard routing needs only the small identity/access response, not the
    // complete gaming profile with populated relationships.
    if (!isAuthenticated || summary || hasRequestedSummary) return;

    setHasRequestedSummary(true);
    loadSummary();
  }, [hasRequestedSummary, isAuthenticated, loadSummary, summary]);

  const retrySummaryLoad = () => {
    // Resetting the local request latch allows the effect above to retry.
    setHasRequestedSummary(false);
  };

  const resetSession = () => {
    // Route recovery uses the shared auth operation so this file does not need
    // to know which Redux thunk performs server-side logout.
    signOut();
  };

  return {
    isAuthenticated,
    isSessionResolving,
    summary,
    summaryStatus,
    retrySummaryLoad,
    resetSession,
  };
};

export const AccessSummaryGate = ({
  allowedRoles,
  hasProfileAccess,
  children,
  fallback,
}) => {
  const {
    isAuthenticated,
    isSessionResolving,
    summary,
    summaryStatus,
    retrySummaryLoad,
    resetSession,
  } = useAccessSummaryGate();

  if (isSessionResolving) {
    // Returning users remain on a neutral loading state until the backend has
    // accepted or rejected the browser's secure session cookie.
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (!summary) {
    if (summaryStatus === "failed") {
      return (
        <ProfileRecoveryState
          onRetry={retrySummaryLoad}
          onResetSession={resetSession}
        />
      );
    }

    return <Loading />;
  }

  if (allowedRoles && !allowedRoles.includes(summary.role)) {
    return <Navigate to={getDefaultRouteForRole(summary.role)} replace />;
  }

  if (hasProfileAccess && !hasProfileAccess(summary)) {
    // Capability checks run after the role check because capabilities belong
    // to a valid base role. Denied users return to their safe landing route.
    return <Navigate to={getDefaultRouteForRole(summary.role)} replace />;
  }

  // A render-function fallback keeps the gate reusable for landing redirects
  // without forcing this file to import page components directly.
  return children || (fallback ? fallback(summary) : null);
};

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isSessionResolving } = useAuthStore();

  if (isSessionResolving) {
    return <Loading />;
  }

  return isAuthenticated ? children : <Navigate to={ROUTES.LOGIN} replace />;
};

export const RoleAwareRoute = ({ allowedRoles, children }) => (
  <AccessSummaryGate allowedRoles={allowedRoles}>{children}</AccessSummaryGate>
);

export const AdminRoute = ({ children }) => (
  <AccessSummaryGate
    hasProfileAccess={(summary) =>
      summary.staffAssignments?.some((assignment) =>
        ["super_admin", "platform_admin"].includes(assignment.role),
      )
    }
  >
    {children}
  </AccessSummaryGate>
);

export const OperatorRoute = ({ children }) => (
  <AccessSummaryGate
    hasProfileAccess={(summary) =>
      summary.staffAssignments?.some((assignment) =>
        ["super_admin", "platform_admin", "match_operator"].includes(assignment.role),
      )
    }
  >
    {children}
  </AccessSummaryGate>
);

export const PlayerRoute = ({ children }) => (
  <RoleAwareRoute allowedRoles={[USER_ROLES.PLAYER]}>
    {children}
  </RoleAwareRoute>
);

const VerifiedAccountGate = ({ children }) => {
  const { isVerified } = useAuthStore();

  if (!isVerified) {
    // The dialog replaces the restricted route content, so the page cannot
    // mount or start wallet, clan, match, or game-account requests.
    return <EmailVerificationDialog />;
  }

  return children;
};

export const VerifiedPlayerRoute = ({ children }) => (
  <PlayerRoute>
    <VerifiedAccountGate>{children}</VerifiedAccountGate>
  </PlayerRoute>
);

const DetailedProfileGate = ({ children }) => {
  const [hasRequestedProfile, setHasRequestedProfile] = useState(false);
  const { signOut } = useAuthStore();
  const { loadProfile, profile, profileStatus } = usePlayerStore();

  useEffect(() => {
    if (profile || hasRequestedProfile) return;

    setHasRequestedProfile(true);
    loadProfile();
  }, [hasRequestedProfile, loadProfile, profile]);

  if (profile) return children;

  if (profileStatus === "failed") {
    return (
      <ProfileRecoveryState
        onRetry={() => setHasRequestedProfile(false)}
        onResetSession={signOut}
      />
    );
  }

  return <Loading />;
};

export const DetailedPlayerRoute = ({ children }) => (
  <PlayerRoute>
    <DetailedProfileGate>{children}</DetailedProfileGate>
  </PlayerRoute>
);

export const VerifiedDetailedPlayerRoute = ({ children }) => (
  <VerifiedPlayerRoute>
    <DetailedProfileGate>{children}</DetailedProfileGate>
  </VerifiedPlayerRoute>
);

export const ApprovedHostRoute = ({ children }) => (
  <AccessSummaryGate
    allowedRoles={[USER_ROLES.PLAYER]}
    hasProfileAccess={hasApprovedHostAccess}
  >
    {children}
  </AccessSummaryGate>
);

export const StaffRoute = ({ children }) => (
  <AccessSummaryGate
    hasProfileAccess={(summary) =>
      Array.isArray(summary.staffAssignments) &&
      summary.staffAssignments.length > 0
    }
  >
    {children}
  </AccessSummaryGate>
);

// Event workspace access is a staff capability, never a client-controlled
// route flag. The summary is supplied by the authenticated backend session.
export const EventManagerRoute = ({ children }) => (
  <AccessSummaryGate
    hasProfileAccess={(summary) =>
      summary.staffAssignments?.some(
        (assignment) => assignment.role === "event_manager",
      )
    }
  >
    {children}
  </AccessSummaryGate>
);

export const GameManagerRoute = ({ children }) => (
  <AccessSummaryGate
    hasProfileAccess={(summary) =>
      summary.staffAssignments?.some(
        (assignment) => assignment.role === "game_manager",
      )
    }
  >
    {children}
  </AccessSummaryGate>
);

export const DashboardLanding = () => (
  <AccessSummaryGate
    fallback={(summary) =>
      summary.staffAssignments?.length ? (
        <Navigate to={ROUTES.STAFF} replace />
      ) : summary.role === USER_ROLES.PLAYER ? (
        <Navigate to={ROUTES.GAME} replace />
      ) : (
        <Navigate to={getDefaultRouteForRole(summary.role)} replace />
      )
    }
  />
);

export const LandingPage = () => {
  const { isAuthenticated, isSessionResolving } = useAuthStore();

  if (isSessionResolving) {
    return <Loading />;
  }

  return isAuthenticated ? (
    <Navigate to={ROUTES.DASHBOARD} replace />
  ) : (
    <Navigate to={ROUTES.HOME} replace />
  );
};

ProfileRecoveryState.propTypes = {
  onRetry: PropTypes.func.isRequired,
  onResetSession: PropTypes.func.isRequired,
};

AccessSummaryGate.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string),
  hasProfileAccess: PropTypes.func,
  children: PropTypes.node,
  fallback: PropTypes.func,
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

RoleAwareRoute.propTypes = {
  allowedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
  children: PropTypes.node.isRequired,
};

AdminRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

OperatorRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

PlayerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

VerifiedAccountGate.propTypes = {
  children: PropTypes.node.isRequired,
};

VerifiedPlayerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

DetailedProfileGate.propTypes = {
  children: PropTypes.node.isRequired,
};

DetailedPlayerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

VerifiedDetailedPlayerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

ApprovedHostRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

StaffRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

EventManagerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

GameManagerRoute.propTypes = {
  children: PropTypes.node.isRequired,
};
