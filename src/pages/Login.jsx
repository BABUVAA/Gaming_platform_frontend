import { useState } from "react";
import { Form } from "react-router-dom";
import useNavigateHook from "../hooks/useNavigateHook";
import { AuthShell, Input, Button } from "../components";
import validator from "validator";
import { FiEye, FiEyeOff, FiLock, FiMail, FiShield } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";
import { useAuthStore } from "../store/useStore";

// Static presentation data lives outside the component so React does not need
// to recreate or memoize it during every form-state update.
const AUTH_STATS = [
  { label: "Play", value: "Find your next match" },
  { label: "Compete", value: "Enter live tournaments" },
  { label: "Connect", value: "Rejoin your squad" },
];

const Login = () => {
  const { goToDashboard, goToForgetPWD, goToSignUp } = useNavigateHook();
  const { signIn } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    form: "",
  });

  const handleSubmit = async (event) => {
    event.preventDefault();

    // The button is disabled while loading, and this guard also protects the
    // handler if submission is triggered programmatically during that period.
    if (isSubmitting) return;

    const formData = new FormData(event.target);
    const rawData = Object.fromEntries(formData);

    // Email identity is case-insensitive and safe to normalize. Passwords must
    // remain exactly as entered because surrounding spaces can be significant.
    const credentials = {
      email: validator.normalizeEmail(String(rawData.email || "")) || "",
      password: String(rawData.password || ""),
    };

    const newErrors = {};

    if (!validator.isEmail(credentials.email)) {
      newErrors.email = "Invalid email address.";
    }

    if (!credentials.password) {
      newErrors.password = "Password is required.";
    }

    // Invalid local input never reaches the backend or starts loading state.
    if (Object.keys(newErrors).length > 0) {
      setErrors({
        email: newErrors.email || "",
        password: newErrors.password || "",
        form: "",
      });
      return;
    }

    setErrors({ email: "", password: "", form: "" });
    setIsSubmitting(true);

    try {
      // Unwrapping converts a rejected Redux thunk into a normal catchable
      // error while successful authentication continues to the dashboard.
      await signIn(credentials).unwrap();
      goToDashboard();
    } catch (error) {
      const fieldErrors = error?.fieldErrors || {};

      setErrors({
        email: fieldErrors.email || "",
        password: fieldErrors.password || "",
        form:
          error?.message ||
          fieldErrors.email ||
          fieldErrors.password ||
          "Unable to login. Please check your details.",
      });
    } finally {
      // A failed request re-enables the form; navigation unmounts the page
      // after a successful request.
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Player Access"
      title="Welcome back."
      description="Sign in and jump back into the action."
      badges={["Live Matches", "Tournaments", "Clans"]}
      asideTitle="Ready for your next match?"
      asideCopy="Rejoin your squad, enter tournaments, and keep climbing."
      asideStats={AUTH_STATS}
      footer={
        <p>
          New to the platform?{" "}
          <button
            type="button"
            onClick={goToSignUp}
            className="font-semibold text-amber-200 transition hover:text-amber-100"
          >
            Create your player account
          </button>
        </p>
      }
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-3 text-amber-200">
            <FiShield className="text-xl" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">Login</h2>
            <p className="mt-1 text-sm text-slate-400">
              Use your registered email and password to continue.
            </p>
          </div>
        </div>
      </div>

      <Form onSubmit={handleSubmit} method="POST" className="space-y-2">
        <Input
          name="email"
          type="email"
          placeholder="captain@yourteam.com"
          label="Email"
          ariaLabel="Email"
          iconStart={<FiMail />}
          error={errors.email}
          autoComplete="email"
        />
        <Input
          name="password"
          type={showPassword ? "text" : "password"}
          placeholder="Enter your password"
          label="Password"
          ariaLabel="Password"
          iconStart={<FiLock />}
          iconEnd={showPassword ? <FiEyeOff /> : <FiEye />}
          iconEndLabel={showPassword ? "Hide password" : "Show password"}
          onIconEndClick={() => setShowPassword((current) => !current)}
          error={errors.password}
          autoComplete="current-password"
        />

        {errors.form ? (
          <div
            role="alert"
            aria-live="polite"
            className="rounded-xl border border-rose-400/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-100"
          >
            {errors.form}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-slate-500">Your next match is waiting.</span>
          <button
            type="button"
            onClick={goToForgetPWD}
            className="font-semibold text-amber-200 transition hover:text-amber-100"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          size="large"
          className="mt-3 w-full"
          endIcon={!isSubmitting ? <FaArrowRight /> : null}
        >
          Enter Platform
        </Button>
      </Form>
    </AuthShell>
  );
};

export default Login;
