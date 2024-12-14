import { useLocation } from "react-router-dom";

const useLocationHook = () => {
  const location = useLocation();

  // You can add logic to work with the location if needed
  const isOnHomePage = location.pathname === "/";

  return {
    location,
    isOnHomePage,
  };
};

export default useLocationHook;
