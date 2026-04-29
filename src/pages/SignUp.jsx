import React, { useMemo, useState } from "react";
import { Form } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from "../store/authSlice";
import { AuthShell, Button, Input } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";
import validator from "validator";
import { FiCalendar, FiLock, FiMail, FiUser } from "react-icons/fi";
import { FaArrowRight } from "react-icons/fa6";

const SignUp = () => {
  const { goToDashboard, goToLogin } = useNavigateHook();
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    username: "",
    date: "",
  });
  const authStats = useMemo(
    () => [
      { label: "Verification", value: "CoC auto, BGMI review" },
      { label: "Modes", value: "Quick battle and customs" },
      { label: "Clans", value: "Roster and social progression" },
    ],
    []
  );
  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const rawData = Object.fromEntries(formData);

    // Sanitize input
    const sanitized = {
      username: validator.trim(validator.escape(rawData.username || "")),
      email: validator.normalizeEmail(rawData.email || "") || "",
      password: validator.trim(rawData.password || ""),
      dob: validator.trim(rawData.dob || ""),
    };

    const newErrors = {};

    // Validate each field
    if (!sanitized.username) {
      newErrors.username = "Username is required.";
    } else if (!validator.isLength(sanitized.username, { min: 5, max: 20 })) {
      newErrors.username = "Username must be 5-20 characters long.";
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

    if (!validator.isDate(sanitized.dob, { format: "YYYY-MM-DD" })) {
      newErrors.date = "Invalid date format.";
    } else {
      const dob = new Date(sanitized.dob);
      const ageDifMs = Date.now() - dob.getTime();
      const ageDate = new Date(ageDifMs); // miliseconds from epoch
      const age = Math.abs(ageDate.getUTCFullYear() - 1970);
      if (age < 13) {
        newErrors.date = "You must be at least 13 years old to sign up.";
      }
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    await dispatch(register(sanitized))
      .unwrap()
      .then((response) => {
        if (response.success) goToDashboard();
      })
      .catch((err) => {
        console.error("Registration error:", err);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <AuthShell
      eyebrow="Player Onboarding"
      title="Build your competition identity."
      description="Create the player account that will hold your verified game profiles, clan membership, wallet history, and live tournament activity."
      badges={["Clan Ready", "Wallet Enabled", "Multi-Game Expansion"]}
      asideTitle="What unlocks next"
      asideCopy="Once you're in, we can connect your game accounts, send BGMI verification for review, and move you into tournaments, clans, and live match rooms."
      asideStats={authStats}
      footer={
        <p>
          Already registered?{" "}
          <button
            type="button"
            onClick={goToLogin}
            className="font-semibold text-cyan-300 transition hover:text-cyan-200"
          >
            Return to login
          </button>
        </p>
      }
    >
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
        />
        <Input
          name="email"
          type="email"
          placeholder="you@example.com"
          label="Email address"
          iconStart={<FiMail />}
          error={errors.email}
        />
        <Input
          name="password"
          type="password"
          placeholder="Create a strong password"
          label="Password"
          iconStart={<FiLock />}
          error={errors.password}
        />
        <Input
          name="dob"
          type="date"
          label="Date of birth"
          iconStart={<FiCalendar />}
          error={errors.date}
        />
        <p className="pt-1 text-xs leading-6 text-slate-500">
          You need to be at least 13 years old. Strong passwords help protect linked accounts and wallet activity.
        </p>
        <Button
          type="submit"
          isLoading={isSubmitting}
          className="mt-3 h-14 w-full rounded-2xl bg-cyan-300 text-sm font-black uppercase tracking-[0.16em] text-slate-950 hover:bg-cyan-200"
          endIcon={!isSubmitting ? <FaArrowRight /> : null}
        >
          Create Player Account
        </Button>
      </Form>
    </AuthShell>
  );
};

export default SignUp;
