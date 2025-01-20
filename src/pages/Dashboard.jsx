import { useDispatch, useSelector } from "react-redux";
import { SideBar } from "../components";
import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { user_profile } from "../store/authSlice";

const Dashboard = () => {
  const games = useSelector((store) => store.games);
  const userId = useSelector((store) => store.auth.user); // Select user ID from state
  console.log(userId);
  const { isAuthenticated } = useSelector((store) => store.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (userId && isAuthenticated) {
      dispatch(user_profile());
      
    }
  }, [dispatch, userId]); // Dependencies include userId to ensure data is fetched when user changes

  return (
    <div className="relative min-h-screen">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="grid md:grid-cols-[auto_1fr] h-full">
        {/* Empty div with fixed width */}
        <div className="w-16 h-full"></div>

        {/* The second part takes the remaining space */}
        <div className="h-full w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
