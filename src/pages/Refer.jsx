import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import { useDispatch, useSelector } from "react-redux";
import { FiCheckCircle, FiClock, FiCopy, FiGift, FiRefreshCw, FiUsers } from "react-icons/fi";
import { fetchMyReferrals } from "../store/slices/referralSlice";

const formatMinor = (amountMinor = 0) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
    .format(Number(amountMinor || 0) / 100);

const statusLabels = {
  awaiting_first_tournament: "Waiting for first tournament",
  pending_verification: "Waiting for email verification",
  rewarded: "Reward earned",
};

const Refer = () => {
  const dispatch = useDispatch();
  const { data, error, status } = useSelector((store) => store.referrals);
  const [copied, setCopied] = useState("");
  const referralCode = data?.code || "";
  const referralLink = referralCode
    ? `${window.location.origin}/ref/${encodeURIComponent(referralCode)}`
    : "";

  useEffect(() => {
    if (status === "idle") dispatch(fetchMyReferrals());
  }, [dispatch, status]);

  const copyReferral = async (value, key) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1500);
    } catch {
      setCopied("");
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-300">Refer & Earn</p>
            <h1 className="mt-2 text-2xl font-black text-white">Earn ₹10 tournament credit.</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Invite a new player. Your reward is credited after they verify their email and complete their first tournament.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Metric label="Per success" value={formatMinor(data?.rewardMinor || 1000)} />
            <Metric label="Successful" value={data?.counts?.rewarded || 0} />
            <Metric label="Total earned" value={formatMinor(data?.totalEarnedMinor)} />
          </div>
        </div>
      </section>

      {error ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-950/25 px-4 py-3 text-sm text-rose-100">
          <span>{error.message || "Unable to load referral rewards."}</span>
          <button className="inline-flex items-center gap-2 font-bold" onClick={() => dispatch(fetchMyReferrals())} type="button">
            <FiRefreshCw /> Retry
          </button>
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
          <h2 className="text-lg font-black text-white">Share your invite</h2>
          <p className="mt-1 text-sm text-slate-500">The referral stays attached through signup and OTP verification.</p>
          <div className="mt-4 space-y-2">
            <ShareRow actionLabel={copied === "code" ? "Copied" : "Copy"} label="Referral code" onAction={() => copyReferral(referralCode, "code")} value={referralCode || "Loading…"} />
            <ShareRow actionLabel={copied === "link" ? "Copied" : "Copy"} label="Referral link" onAction={() => copyReferral(referralLink, "link")} value={referralLink || "Loading…"} />
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
          <h2 className="text-lg font-black text-white">Earning rules</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-slate-300">
            <Rule>Invite a new player using your unique referral link or code.</Rule>
            <Rule>They must verify their email and complete their first Quick Match or Event.</Rule>
            <Rule>You receive ₹10 once; repeat tournaments do not create another reward.</Rule>
            <Rule>The credit can pay tournament entry fees. It cannot be withdrawn, transferred, or converted to cash.</Rule>
            <Rule>Self-referrals, duplicate accounts, circular referrals, and restricted accounts are not eligible.</Rule>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
        <div className="flex items-center justify-between gap-3">
          <div><h2 className="text-lg font-black text-white">Invite progress</h2><p className="mt-1 text-sm text-slate-500">Up to 50 recent invites.</p></div>
          <FiUsers className="text-xl text-cyan-300" />
        </div>
        <div className="mt-4 grid gap-2">
          {status === "loading" && !data ? (
            <p className="rounded-xl bg-white/[0.03] px-4 py-5 text-sm text-slate-500">Loading invite progress…</p>
          ) : data?.invites?.length ? (
            data.invites.map((invite) => <InviteRow invite={invite} key={invite.id} />)
          ) : (
            <p className="rounded-xl bg-white/[0.03] px-4 py-5 text-sm text-slate-500">No invites yet. Share your link to get started.</p>
          )}
        </div>
      </section>
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div className="min-w-24 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
    <p className="mt-1 text-sm font-black text-white">{value}</p>
  </div>
);

const Rule = ({ children }) => (
  <div className="flex gap-3"><FiCheckCircle className="mt-1 shrink-0 text-emerald-300" /><p>{children}</p></div>
);

const ShareRow = ({ actionLabel, label, onAction, value }) => (
  <div className="flex flex-col gap-2 rounded-xl border border-white/10 bg-black/20 p-3 sm:flex-row sm:items-center sm:justify-between">
    <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 truncate text-sm font-semibold text-white">{value}</p></div>
    <button className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-cyan-300/10 px-3 text-xs font-black text-cyan-200 disabled:opacity-40" disabled={!value || value === "Loading…"} onClick={onAction} type="button"><FiCopy />{actionLabel}</button>
  </div>
);

const InviteRow = ({ invite }) => {
  const rewarded = invite.status === "rewarded";
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
      <div className="min-w-0"><p className="truncate text-sm font-bold text-white">{invite.inviteeName}</p><p className="mt-1 text-xs text-slate-500">{statusLabels[invite.status] || "In progress"}</p></div>
      <div className={`inline-flex shrink-0 items-center gap-2 text-xs font-black ${rewarded ? "text-emerald-300" : "text-amber-200"}`}>{rewarded ? <FiGift /> : <FiClock />}{rewarded ? formatMinor(invite.rewardMinor) : "Pending"}</div>
    </div>
  );
};

Metric.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node.isRequired };
Rule.propTypes = { children: PropTypes.node.isRequired };
ShareRow.propTypes = { actionLabel: PropTypes.string.isRequired, label: PropTypes.string.isRequired, onAction: PropTypes.func.isRequired, value: PropTypes.string.isRequired };
InviteRow.propTypes = { invite: PropTypes.shape({ id: PropTypes.string.isRequired, inviteeName: PropTypes.string.isRequired, rewardMinor: PropTypes.number.isRequired, status: PropTypes.string.isRequired }).isRequired };

export default Refer;
