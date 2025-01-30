import React from "react";
import { Form } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login } from "../store/authSlice";
import useNavigateHook from "../hooks/useNavigateHook";
import { Input, Button } from "../components";

const Login = () => {
  const { goToDashboard, goToForgetPWD, goToSignUp } = useNavigateHook();
  const dispatch = useDispatch();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const loginData = Object.fromEntries(formData);

    await dispatch(login(loginData))
      .unwrap()
      .then(() => {
        goToDashboard();
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
          />
          <Input
            name="password"
            type="password"
            placeholder="Password"
            label="Password"
            ariaLabel="Password"
            className="text-gray-700"
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
