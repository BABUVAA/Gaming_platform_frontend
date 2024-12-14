import { useNavigate } from "react-router-dom";

const useNavigateHook = () => {
  const navigate = useNavigate();

  // You can add any custom navigation logic or functions if needed
  const goToHome = () => {
    navigate("/");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };
  const goToLogin = () => {
    navigate("/login");
  };

  const goToSignUp = () => {
    navigate("/signup");
  };

  const goToForgetPWD = () => {
    navigate("/forgotPWD");
  };

  return {
    navigate,
    goToHome,
    goToDashboard,
    goToLogin,
    goToSignUp,
    goToForgetPWD,
  };
};

export default useNavigateHook;
