import { useDispatch, useSelector } from "react-redux";
import { SideBar } from "../components";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserClan } from "../store/clanSlice";
import { user_profile } from "../store/authSlice";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Dashboard = () => {
  const { profile } = useSelector((store) => store.auth);
  const { globalLoading } = useSelector((store) => store.loading);
  const [loading, setLoading] = useState(false);

  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    const fetchProfileAndClan = async () => {
      try {
        if (profile === null) {
          const profileData = await dispatch(user_profile()); // Ensure this returns profile data
          if (profileData?.payload?.clan?._id) {
            await dispatch(fetchUserClan());
          }
        }
      } catch (error) {
        console.error("Error fetching profile or clan:", error);
      }
    };
    fetchProfileAndClan();
    setLoading(false);
  }, []);

  if (globalLoading || loading) <LoadingSpinner />;
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
