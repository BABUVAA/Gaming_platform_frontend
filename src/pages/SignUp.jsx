import React from "react";
import { Form } from "react-router-dom";
import { useDispatch } from "react-redux";
import { register } from "../store/authSlice";
import { Button, Input } from "../components";
import useNavigateHook from "../hooks/useNavigateHook";

const SignUp = () => {
  const { goToDashboard, goToLogin } = useNavigateHook();
  const dispatch = useDispatch();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const signUpData = Object.fromEntries(formData);

    dispatch(register(signUpData))
      .unwrap()
      .then(() => {
        alert("User registered successfully!");
        goToDashboard();
      })
      .catch((err) => {
        console.error("Signup failed:", err);
      });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 via-gray-200 to-white">
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
          />
          <Input
            name="email"
            type="email"
            placeholder="Enter your email address"
            label="Email Address"
            className="text-gray-700 font-medium"
          />
          <Input
            name="password"
            type="password"
            placeholder="Create a password"
            label="Password"
            className="text-gray-700 font-medium"
          />
          <Input
            name="dob"
            type="date"
            label="Date of Birth"
            className="text-gray-700 font-medium"
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
