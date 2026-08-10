import { useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import validator from "validator";
import { AuthShell, Button, Input } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";
import {
  confirmPasswordReset,
  requestPasswordReset,
} from "../store/slices/authSlice";
import { FiLock, FiMail, FiRefreshCw } from "react-icons/fi";

const ForgotPassword = () => {
  const { goToLogin } = useNavigateHook();
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const userId = searchParams.get("userId") || "";
  const isResetLink = Boolean(token && userId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const handleRequest = async (event) => {
    event.preventDefault();
    const email = validator.normalizeEmail(
      new FormData(event.currentTarget).get("email") || "",
    );
    if (!email || !validator.isEmail(email)) {
      setErrors({ email: "Enter a valid email address." });
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await dispatch(requestPasswordReset({ email })).unwrap();
      setMessage(result.message);
    } catch (error) {
      setErrors({ form: error?.message || "Unable to request a reset link." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const newPassword = String(data.newPassword || "");
    const confirmPassword = String(data.confirmPassword || "");
    const nextErrors = {};
    if (
      !validator.isStrongPassword(newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
    ) {
      nextErrors.newPassword =
        "Use 8+ characters with uppercase, lowercase, number, and symbol.";
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      const result = await dispatch(
        confirmPasswordReset({ newPassword, token, userId }),
      ).unwrap();
      setMessage(result.message);
    } catch (error) {
      setErrors({
        newPassword: error?.fieldErrors?.newPassword || "",
        form: error?.message || "Unable to reset this password.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Reset access without losing momentum."
      description="Use the email attached to your player account to recover access securely."
      badges={["Secure Recovery", "Single-use Link", "Account Protection"]}
      asideTitle="Why this matters"
      asideCopy="Your account controls tournament entry, wallet history, linked games, and verification requests, so recovery needs to stay deliberate."
      asideStats={[
        { label: "Protected Areas", value: "Wallet, clans, matches" },
        { label: "Reset Method", value: "Email-based recovery" },
        { label: "Next Step", value: "Return and sign back in" },
      ]}
      footer={
        <button
          type="button"
          onClick={goToLogin}
          className="font-semibold text-cyan-300 transition hover:text-cyan-200"
        >
          Back to login
        </button>
      }
    >
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
          <FiRefreshCw className="text-xl" />
        </div>
        <div>
          <h2 className="text-2xl font-black text-white">
            {isResetLink ? "Choose a new password" : "Password reset"}
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            {isResetLink
              ? "This secure link can be used once."
              : "We’ll send the next recovery step to your email."}
          </p>
        </div>
      </div>

      {message ? (
        <section className="space-y-4">
          <div className="rounded-xl border border-emerald-400/30 bg-emerald-950/30 px-4 py-3 text-sm leading-6 text-emerald-100">
            {message}
          </div>
          {isResetLink ? (
            <Button type="button" size="large" className="w-full" onClick={goToLogin}>
              Continue to login
            </Button>
          ) : null}
        </section>
      ) : (
        <form
          onSubmit={isResetLink ? handleReset : handleRequest}
          className="space-y-3"
        >
          {isResetLink ? (
            <>
              <Input
                type="password"
                placeholder="Create a strong password"
                name="newPassword"
                label="New password"
                autoComplete="new-password"
                iconStart={<FiLock />}
                error={errors.newPassword}
              />
              <Input
                type="password"
                placeholder="Repeat your new password"
                name="confirmPassword"
                label="Confirm new password"
                autoComplete="new-password"
                iconStart={<FiLock />}
                error={errors.confirmPassword}
              />
            </>
          ) : (
            <Input
              type="email"
              placeholder="registered@email.com"
              name="email"
              label="Email address"
              autoComplete="email"
              iconStart={<FiMail />}
              error={errors.email}
            />
          )}
          {errors.form ? (
            <div className="rounded-xl border border-rose-400/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
              {errors.form}
            </div>
          ) : null}
          <Button
            type="submit"
            isLoading={isSubmitting}
            className="h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.16em] text-slate-950 hover:bg-cyan-200"
          >
            {isResetLink ? "Reset Password" : "Send Reset Link"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
