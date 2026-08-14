import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiKey,
  FiLogOut,
  FiMail,
  FiMonitor,
  FiRefreshCw,
  FiShield,
  FiUser,
} from "react-icons/fi";
import { useAccountStore, useAuthStore } from "../store/useStore";
import { ROUTES } from "../routes/routeConstants";

const formatDate = (dateValue, includeTime = false) => {
  if (!dateValue) return "Not available";

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    ...(includeTime
      ? {
          hour: "numeric",
          minute: "2-digit",
        }
      : {}),
  }).format(parsedDate);
};

const AccountSettings = () => {
  const { account, accountStatus, error, loadAccount } = useAccountStore();
  const { confirmSensitiveAction, isVerified, signOut } = useAuthStore();
  const [password, setPassword] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [confirmationError, setConfirmationError] = useState("");

  useEffect(() => {
    // Account Settings owns this request because no other dashboard page needs
    // the private account-information payload.
    if (accountStatus === "idle") {
      loadAccount();
    }
  }, [accountStatus, loadAccount]);

  if (accountStatus === "loading" && !account) {
    return <AccountLoadingState />;
  }

  if (accountStatus === "failed" && !account) {
    return <AccountErrorState error={error} onRetry={loadAccount} />;
  }

  const username = account?.username || "Not available";
  const email = account?.email || "Not available";
  const dateOfBirth = formatDate(account?.dateOfBirth);
  const accountCreatedAt = formatDate(account?.createdAt);
  const lastLoginAt = formatDate(account?.lastLoginAt, true);

  const confirmPassword = async (event) => {
    event.preventDefault();
    setConfirmationError("");
    setConfirming(true);
    try {
      await confirmSensitiveAction(password).unwrap();
      setPassword("");
    } catch (requestError) {
      setConfirmationError(requestError?.message || "Password confirmation failed.");
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      <header>
        <h1 className="text-2xl font-black text-white">Account settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Your sign-in information and account security.
        </p>
      </header>

      <SettingsSection title="Account information">
        <SettingsRow icon={FiUser} label="Username" value={username} />
        <SettingsRow
          action={
            isVerified ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-300">
                <FiCheckCircle aria-hidden="true" />
                Verified
              </span>
            ) : (
              <button
                type="button"
                aria-label="Verify email"
                className="cursor-not-allowed rounded-lg border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-xs font-black text-amber-300 opacity-70"
                disabled
                title="Email confirmation will be available soon"
              >
                Verify
              </button>
            )
          }
          icon={FiMail}
          label="Email address"
          value={email}
        />
        <SettingsRow
          icon={FiCalendar}
          label="Date of birth"
          value={dateOfBirth}
        />
        <SettingsRow
          icon={FiClock}
          label="Account created"
          value={accountCreatedAt}
        />
      </SettingsSection>

      <SettingsSection title="Security">
        <SettingsRow
          action={
            <Link
              className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-300 transition hover:bg-cyan-300/15 hover:text-cyan-200"
              to={ROUTES.CHANGE_PASSWORD}
            >
              Change
            </Link>
          }
          icon={FiKey}
          label="Password"
          value="Password is set"
        />
        <SettingsRow
          icon={FiMonitor}
          label="Recent sign in"
          value={lastLoginAt}
        />
        <form className="border-t border-slate-700 p-4 md:p-5" onSubmit={confirmPassword}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="flex items-center gap-2 text-sm font-bold text-white"><FiShield className="text-cyan-300" /> Confirm sensitive actions</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Confirm your password before governance or wallet actions. This expires after 15 minutes.</p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <input aria-label="Current password for sensitive actions" autoComplete="current-password" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white sm:w-56" onChange={(event) => setPassword(event.target.value)} placeholder="Current password" required type="password" value={password} />
              <button className="shrink-0 rounded-lg border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-black text-cyan-200 disabled:opacity-60" disabled={confirming} type="submit">{confirming ? "Confirming..." : "Confirm"}</button>
            </div>
          </div>
          {confirmationError ? <p className="mt-2 text-sm text-rose-300">{confirmationError}</p> : null}
        </form>
        <div className="border-t border-slate-700 p-4 md:p-5">
          <button
            type="button"
            onClick={signOut}
            className="inline-flex items-center gap-2 rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-2.5 text-sm font-bold text-rose-200 transition hover:bg-rose-400/15"
          >
            <FiLogOut />
            Sign out
          </button>
        </div>
      </SettingsSection>
    </div>
  );
};

const AccountLoadingState = () => (
  <div
    aria-label="Loading account information"
    className="mx-auto max-w-4xl space-y-5 pb-8"
    role="status"
  >
    <div className="h-8 w-44 animate-pulse rounded-lg bg-slate-700" />
    <div className="h-64 animate-pulse rounded-2xl border border-slate-700 bg-slate-800" />
  </div>
);

const AccountErrorState = ({ error, onRetry }) => (
  <section className="mx-auto max-w-xl rounded-2xl border border-rose-400/20 bg-slate-800 p-6 text-center">
    <h1 className="text-xl font-black text-white">
      Account information is unavailable
    </h1>
    <p className="mt-2 text-sm leading-6 text-slate-400">
      {error || "Please try loading your account again."}
    </p>
    <button
      type="button"
      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200"
      onClick={onRetry}
    >
      <FiRefreshCw aria-hidden="true" />
      Try again
    </button>
  </section>
);

const SettingsSection = ({ children, title }) => (
  <section className="overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 shadow-[0_14px_34px_rgba(2,8,23,0.16)]">
    <div className="border-b border-slate-700 px-4 py-3 md:px-5">
      <h2 className="text-sm font-black text-white">{title}</h2>
    </div>
    <div className="divide-y divide-slate-700">{children}</div>
  </section>
);

const SettingsRow = ({ action, icon: Icon, label, value }) => (
  <div className="flex items-center gap-4 px-4 py-3.5 md:px-5">
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-700 text-cyan-300">
      <Icon />
    </span>
    <div className="min-w-0 flex-1">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-0.5 break-words text-sm font-bold text-white">{value}</p>
    </div>
    {action ? <div className="shrink-0">{action}</div> : null}
  </div>
);

SettingsSection.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string.isRequired,
};

AccountErrorState.propTypes = {
  error: PropTypes.string,
  onRetry: PropTypes.func.isRequired,
};

SettingsRow.propTypes = {
  action: PropTypes.node,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
};

export default AccountSettings;
