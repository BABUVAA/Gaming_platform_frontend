import { useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import {
  register,
  resendEmailVerification,
  verifyEmailRegistration,
} from "../store/slices/authSlice";
import { AuthShell, Button, Input } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";
import validator from "validator";
import { FiCalendar, FiGift, FiLock, FiMail, FiUser } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import {
  clearPendingSignup,
  loadPendingSignup,
  savePendingSignup,
} from "../utils/pendingSignupRecovery";
import {
  clearCapturedReferral,
  loadCapturedReferral,
} from "../utils/referralCapture";

const SignUp = () => {
  const { goToLogin } = useNavigateHook();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referralCode, setReferralCode] = useState(() => loadCapturedReferral());
  const [referralLocked, setReferralLocked] = useState(() => Boolean(loadCapturedReferral()));
  const [pendingRegistration, setPendingRegistration] = useState(() =>
    loadPendingSignup(),
  );
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [verificationError, setVerificationError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    dob: "",
    referralCode: "",
    form: "",
  });
  const authStats = useMemo(
    () => [
      { label: "Rewards", value: "Cash pools and coins" },
      { label: "Games", value: "CoC and BGMI" },
      { label: "Clans", value: "Friends and squads" },
    ],
    []
  );

  useEffect(() => {
    const availableAt = pendingRegistration?.resendAvailableAt;
    if (!availableAt) {
      setResendSeconds(0);
      return undefined;
    }

    const refreshCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil((new Date(availableAt).getTime() - Date.now()) / 1000),
      );
      setResendSeconds(remaining);
    };
    refreshCountdown();
    const timer = window.setInterval(refreshCountdown, 1000);
    return () => window.clearInterval(timer);
  }, [pendingRegistration?.resendAvailableAt]);

  const getAgeFromDob = (dobValue) => {
    const today = new Date();
    const birthDate = new Date(dobValue);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDelta = today.getMonth() - birthDate.getMonth();

    if (
      monthDelta < 0 ||
      (monthDelta === 0 && today.getDate() < birthDate.getDate())
    ) {
      age -= 1;
    }

    return age;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const rawData = Object.fromEntries(formData);

    // Sanitize input
    const sanitized = {
      username: validator.trim(validator.escape(rawData.username || "")),
      // Keep the familiar address for the confirmation view and delivery.
      // Server-side identity matching applies its canonical representation.
      email: validator.trim(rawData.email || ""),
      // Passwords are opaque credentials. Trimming would silently change what
      // the user chose and make signup behavior differ from login.
      password: String(rawData.password || ""),
      confirmPassword: String(rawData.confirmPassword || ""),
      dob: validator.trim(rawData.dob || ""),
    };

    const newErrors = {};

    // Validate each field
    if (!sanitized.username) {
      newErrors.username = "Username is required.";
    } else if (!validator.isLength(sanitized.username, { min: 3, max: 20 })) {
      newErrors.username = "Username must be 3-20 characters long.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(sanitized.username)) {
      newErrors.username =
        "Username can only contain letters, numbers, and underscores.";
    }

    if (!validator.isEmail(sanitized.email)) {
      newErrors.email = "Invalid email address.";
    }

    if (
      !validator.isStrongPassword(sanitized.password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      newErrors.password =
        "Password must be 8+ characters with uppercase, lowercase, number & symbol.";
    }

    if (sanitized.password !== sanitized.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!validator.isDate(sanitized.dob, { format: "YYYY-MM-DD" })) {
      newErrors.dob = "Invalid date format.";
    } else {
      const dob = new Date(sanitized.dob);
      const age = getAgeFromDob(sanitized.dob);
      if (dob > new Date()) {
        newErrors.dob = "Date of birth cannot be in the future.";
      }
      if (age < 13) {
        newErrors.dob = "You must be at least 13 years old to sign up.";
      }
    }
    if (referralCode && !/^[A-Z0-9_-]{3,40}$/.test(referralCode)) {
      newErrors.referralCode = "Enter a valid referral code.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    const payload = {
      username: sanitized.username,
      email: sanitized.email,
      password: sanitized.password,
      dob: sanitized.dob,
      ...(referralCode ? { referralCode } : {}),
    };

    await dispatch(register(payload))
      .unwrap()
      .then((registration) => {
        // Stay on the pending state because no User or login session exists
        // until the future OTP verification flow promotes this registration.
        setPendingRegistration(registration);
        savePendingSignup(registration);
        clearCapturedReferral();
      })
      .catch((err) => {
        const fieldErrors = err?.fieldErrors || {};
        setErrors({
          username: fieldErrors.username || "",
          email: fieldErrors.email || "",
          password: fieldErrors.password || "",
          dob: fieldErrors.dob || "",
          referralCode: fieldErrors.referralCode || "",
          form:
            err?.message ||
            Object.values(fieldErrors).find(Boolean) ||
            "Unable to create account. Please review your details.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleVerification = async (event) => {
    event.preventDefault();
    setVerificationError("");
    setIsVerifying(true);
    try {
      await dispatch(
        verifyEmailRegistration({
          code: verificationCode,
          email: pendingRegistration.email,
        }),
      ).unwrap();
      setVerificationComplete(true);
      clearPendingSignup();
      // Verification creates the player account but never a session. Take the
      // player straight to the one credential/session entry point.
      goToLogin();
    } catch (error) {
      setVerificationError(
        error?.fieldErrors?.code ||
          error?.message ||
          "Unable to verify this code.",
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    setVerificationError("");
    try {
      const result = await dispatch(
        resendEmailVerification({ email: pendingRegistration.email }),
      ).unwrap();
      setPendingRegistration((current) => {
        const updated = {
          ...current,
          resendAvailableAt: result.resendAvailableAt,
          verificationEmailSent: true,
        };
        savePendingSignup(updated);
        return updated;
      });
    } catch (error) {
      setVerificationError(error?.message || "Unable to resend the code.");
    }
  };

  return (
    <AuthShell
      eyebrow="Player Onboarding"
      title="Build your competition identity."
      description="Create the account that carries your player profile, verified game IDs, clan identity, wallet history, and tournament rewards."
      badges={["Real Rewards", "Clan Ready", "Wallet Enabled"]}
      asideTitle="Your player base"
      asideCopy="After signup, you can connect game accounts, join tournaments, build your clan circle, and track rewards from your wallet."
      asideStats={authStats}
      footer={
        <p>
          Already registered?{" "}
          <button
            type="button"
            onClick={goToLogin}
            className="font-semibold text-amber-200 transition hover:text-amber-100"
          >
            Return to login
          </button>
        </p>
      }
    >
      {verificationComplete ? (
        <section className="space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/30 bg-emerald-300/10 text-2xl text-emerald-200">
            <FiMail />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Account verified</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Your player account is active. Sign in with the password you
              created to open your dashboard.
            </p>
          </div>
          <Button type="button" size="large" className="w-full" onClick={goToLogin}>
            Continue to login
          </Button>
        </section>
      ) : pendingRegistration ? (
        <section className="space-y-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/30 bg-amber-300/10 text-2xl text-amber-200">
            <FiMail />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">
              Verify your email address
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Your registration details are saved securely, but no player
              account, wallet, or login session has been created yet.
            </p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Pending email
            </p>
            <p className="mt-1 break-all font-semibold text-white">
              {pendingRegistration.email}
            </p>
            {pendingRegistration.referralApplied ? (
              <p className="mt-2 text-xs font-semibold text-emerald-300">
                Referral attached successfully
              </p>
            ) : null}
          </div>
          <p className="text-sm leading-6 text-slate-400">
            {pendingRegistration.verificationEmailSent
              ? "Enter the 6-digit code we sent. It expires after 10 minutes."
              : "Email delivery was unavailable. Use resend to request a code."}
          </p>
          <form onSubmit={handleVerification} className="space-y-3">
            <Input
              name="verificationCode"
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              label="Verification code"
              value={verificationCode}
              onChange={(event) =>
                setVerificationCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              error={verificationError}
            />
            <Button
              type="submit"
              size="large"
              className="w-full"
              isLoading={isVerifying}
              disabled={verificationCode.length !== 6}
            >
              Verify email
            </Button>
          </form>
          <Button
            type="button"
            variant="secondary"
            size="large"
            className="w-full"
            disabled={resendSeconds > 0}
            onClick={handleResend}
          >
            {resendSeconds > 0
              ? `Resend code in ${resendSeconds}s`
              : "Resend verification code"}
          </Button>
          <Button
            type="button"
            size="large"
            className="w-full"
            onClick={() => {
              clearPendingSignup();
              setPendingRegistration(null);
              setVerificationCode("");
              setVerificationError("");
            }}
          >
            Use another email
          </Button>
        </section>
      ) : (
        <>
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white">Create account</h2>
        <p className="mt-2 text-sm text-slate-400">
          Start with your player identity. We&apos;ll handle game linking and verification next.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {referralCode && referralLocked ? (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Referral applied
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{referralCode}</p>
              {errors.referralCode ? (
                <p className="mt-1 text-xs text-rose-200">{errors.referralCode}</p>
              ) : null}
            </div>
            <button
              className="text-xs font-bold text-slate-300 hover:text-white"
              onClick={() => {
                clearCapturedReferral();
                setReferralCode("");
                setReferralLocked(false);
              }}
              type="button"
            >
              Remove
            </button>
          </div>
        ) : (
          <Input
            autoComplete="off"
            error={errors.referralCode}
            iconStart={<FiGift />}
            label="Referral code (optional)"
            name="referralCode"
            onChange={(event) =>
              setReferralCode(
                event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, "").slice(0, 40),
              )
            }
            placeholder="Enter your friend's code"
            type="text"
            value={referralCode}
          />
        )}
        <Input
          name="username"
          type="text"
          placeholder="Choose your player name"
          label="Username"
          iconStart={<FiUser />}
          error={errors.username}
          autoComplete="username"
        />
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          label="Email address"
          iconStart={<FiMail />}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          name="password"
          type="password"
          placeholder="Create a strong password"
          label="Password"
          iconStart={<FiLock />}
          error={errors.password}
          autoComplete="new-password"
        />
        <Input
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          label="Confirm password"
          iconStart={<FiLock />}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />
        <Input
          name="dob"
          type="date"
          label="Date of birth"
          iconStart={<FiCalendar />}
          error={errors.dob}
          max={new Date().toISOString().split("T")[0]}
        />
        <p className="pt-1 text-xs leading-6 text-slate-500">
          You need to be at least 13 years old. Strong passwords help protect linked accounts and wallet activity.
        </p>
        {errors.form ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
            {errors.form}
          </div>
        ) : null}
        <Button
          type="submit"
          isLoading={isSubmitting}
          size="large"
          className="mt-3 w-full"
          endIcon={!isSubmitting ? <FaArrowRight /> : null}
        >
          Create Player Account
        </Button>
      </form>
        </>
      )}
    </AuthShell>
  );
};

export default SignUp;
