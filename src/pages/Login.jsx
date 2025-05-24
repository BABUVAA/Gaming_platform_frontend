import React, { useState } from "react";
import { Form } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import useNavigateHook from "../hooks/useNavigateHook";
import { Input, Button } from "../components";
import validator from "validator";

const Login = () => {
  const { goToDashboard, goToForgetPWD, goToSignUp } = useNavigateHook();
  const dispatch = useDispatch();
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

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

    await dispatch(login(sanitized))
      .unwrap()
      .then(() => {
        goToDashboard();
      })
      .catch((err) => {
        console.error("Login error:", err);
      });
  };

  return (
    <div className="min-h-screen flex items-start pt-5 sm:items-center sm:pt-0 justify-center bg-gradient-to-br from-white via-gray-100 to-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-blue-600 text-center mb-6">
          E-GAMING
        </h1>
        <Form onSubmit={handleSubmit} method="POST" className="space-y-4">
          <Input
            name="email"
            type="email"
            placeholder="Email"
            label="Email"
            ariaLabel="Email"
            className="text-gray-700"
            error={errors.email}
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            label="Password"
            ariaLabel="Password"
            className="text-gray-700"
            error={errors.password}
          />
          <div className="text-right">
            <button
              type="button"
              onClick={goToForgetPWD}
              className="text-sm text-blue-600 hover:underline"
            >
              Forgot Password?
            </button>
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg"
          >
            Log in
          </Button>
        </Form>
        <div className="text-center mt-4">
          <p className="text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={goToSignUp}
              className="text-blue-500 hover:underline font-semibold"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
