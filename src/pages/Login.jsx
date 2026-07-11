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
    form: "",
  });
  const authStats = useMemo(
    () => [
      { label: "Prize access", value: "Wallet and rewards" },
      { label: "Match ready", value: "Rooms and check-ins" },
      { label: "Account trust", value: "Verified game IDs" },
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

    if (!sanitized.password) {
      newErrors.password = "Password is required.";
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({ email: "", password: "", form: "" });
    setIsSubmitting(true);

    await dispatch(login(sanitized))
      .unwrap()
      .then(() => {
        goToDashboard();
      })
      .catch((err) => {
        setErrors({
          email: err?.errors?.email || "",
          password: err?.errors?.password || "",
          form:
            err?.message ||
            err?.errors?.email ||
            err?.errors?.password ||
            "Unable to login. Please check your details.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <AuthShell
      eyebrow="Player Access"
      title="Get back into the arena."
      description="Sign in to manage your player profile, wallet, clans, tournaments, match rooms, and reward history."
      badges={["Tournament Ready", "Wallet Access", "Clan Ready"]}
      asideTitle="Secure player access"
      asideCopy="Your session protects wallet activity, linked game identities, friend activity, and tournament entries."
      asideStats={authStats}
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
          type="password"
          placeholder="Enter your password"
          label="Password"
          ariaLabel="Password"
          iconStart={<FiLock />}
          error={errors.password}
          autoComplete="current-password"
        />

        {errors.form ? (
          <div className="rounded-xl border border-rose-400/30 bg-rose-950/30 px-4 py-3 text-sm text-rose-100">
            {errors.form}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 py-2 text-sm">
          <span className="text-slate-500">Protected session for wallet and tournaments</span>
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
