import React, { useMemo, useState } from "react";
import { Form } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import useNavigateHook from "../hooks/useNavigateHook";
import { AuthShell, Input, Button } from "../components";
import validator from "validator";
import { FiLock, FiMail, FiShield } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";

const Login = () => {
  const { goToDashboard, goToForgetPWD, goToSignUp } = useNavigateHook();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });
  const authStats = useMemo(
    () => [
      { label: "Account Trust", value: "Linked game identity" },
      { label: "Queue Ready", value: "Tournament and match access" },
      { label: "Ops Coverage", value: "Live operator oversight" },
    ],
    []
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const rawData = Object.fromEntries(formData);

    // Sanitize input
    const sanitized = {
      email: validator.normalizeEmail(rawData.email || "") || "",
      password: validator.trim(rawData.password || ""),
    };

    const newErrors = {};

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
      newErrors.password = "Incorrect Password";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({ email: "", password: "" });
    setIsSubmitting(true);

    await dispatch(login(sanitized))
      .unwrap()
      .then(() => {
        goToDashboard();
      })
      .catch((err) => {
        console.error("Login error:", err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <AuthShell
      eyebrow="Player Access"
      title="Get back into the arena."
      description="Sign in to manage your linked accounts, join live tournaments, and step into operator-managed match flow without losing your place."
      badges={["Tournament Ready", "Wallet Access", "Live Match Alerts"]}
      asideTitle="Competition access"
      asideCopy="The same account gets you into match check-in, clan coordination, wallet history, and verification review updates."
      asideStats={authStats}
      footer={
        <p>
          New to the platform?{" "}
          <button
            type="button"
            onClick={goToSignUp}
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Create your player account
          </button>
        </p>
      }
    >
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 p-3 text-cyan-300">
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
        />
        <Input
          name="password"
          type="password"
          placeholder="Enter your password"
          label="Password"
          ariaLabel="Password"
          iconStart={<FiLock />}
          error={errors.password}
        />

        <div className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-slate-500">Secure session with account verification</span>
          <button
            type="button"
            onClick={goToForgetPWD}
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Forgot password?
          </button>
        </div>

        <Button
          type="submit"
          isLoading={isSubmitting}
          className="mt-3 h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.16em] text-slate-950 hover:bg-cyan-200"
          endIcon={!isSubmitting ? <FaArrowRight /> : null}
        >
          Enter Platform
        </Button>
      </Form>
    </AuthShell>
  );
};

export default Login;
