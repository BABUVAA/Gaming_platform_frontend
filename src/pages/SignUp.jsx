import { useMemo, useState } from "react";
import { Form } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from "../store/slices/authSlice";
import { AuthShell, Button, Input } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";
import validator from "validator";
import { FiCalendar, FiLock, FiMail, FiUser } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";

const SignUp = () => {
  const { goToLogin } = useNavigateHook();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingRegistration, setPendingRegistration] = useState(null);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    username: "",
    dob: "",
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
      email: validator.normalizeEmail(rawData.email || "") || "",
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
    };

    await dispatch(register(payload))
      .unwrap()
      .then((registration) => {
        // Stay on the pending state because no User or login session exists
        // until the future OTP verification flow promotes this registration.
        setPendingRegistration(registration);
      })
      .catch((err) => {
        const fieldErrors = err?.fieldErrors || {};
        setErrors({
          username: fieldErrors.username || "",
          email: fieldErrors.email || "",
          password: fieldErrors.password || "",
          dob: fieldErrors.dob || "",
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
      {pendingRegistration ? (
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
          </div>
          <p className="text-sm leading-6 text-slate-400">
            Requesting and verifying an email OTP will be enabled in the next
            step. No email has been sent yet.
          </p>
          <Button
            type="button"
            size="large"
            className="w-full"
            onClick={() => setPendingRegistration(null)}
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

      <Form onSubmit={handleSubmit} method="POST" className="space-y-2">
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
      </Form>
        </>
      )}
    </AuthShell>
  );
};

export default SignUp;
