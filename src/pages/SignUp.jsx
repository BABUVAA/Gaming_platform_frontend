import React, { useState } from "react";
import { Form } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from "../store/authSlice";
import { Button, Input } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";
import validator from "validator";

const SignUp = () => {
  const { goToDashboard, goToLogin } = useNavigateHook();
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({
    email: "",
    password: "",
    username: "",
    date: "",
  });
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

    setErrors({}); // Clear errors if all good

    // Submit the data
    await dispatch(register(sanitized))
      .unwrap()
      .then((response) => {
        if (response.success) goToDashboard();
      })
      .catch((err) => {
        console.error("Registration error:", err);
      });
  };

  return (
    <div className="min-h-screen flex items-start sm:items-center pt-5 sm:pt-0 justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-white">
      <div className="bg-white p-10 rounded-lg shadow-xl w-full max-w-lg">
        <h1 className="text-3xl font-extrabold text-blue-600 text-center mb-8">
          E-GAMING
        </h1>
        <Form onSubmit={handleSubmit} method="POST" className="space-y-6">
          <Input
            name="username"
            type="text"
            placeholder="Enter your username"
            label="Username"
            className="text-gray-700 font-medium"
            error={errors.username}
          />
          <Input
            name="email"
            type="email"
            placeholder="Enter your email address"
            label="Email Address"
            className="text-gray-700 font-medium"
            error={errors.email}
          />
          <Input
            name="password"
            type="password"
            placeholder="Create a password"
            label="Password"
            className="text-gray-700 font-medium"
            error={errors.password}
          />
          <Input
            name="dob"
            type="date"
            label="Date of Birth"
            className="text-gray-700 font-medium"
            error={errors.date}
          />
          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 rounded-md shadow-md"
          >
            Sign Up
          </Button>
        </Form>
        <div className="text-center mt-6">
          <p className="text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={goToLogin}
              className="text-blue-500 hover:underline font-bold"
            >
              Log in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
