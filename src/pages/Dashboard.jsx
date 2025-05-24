import { useDispatch, useSelector } from "react-redux";
import { SideBar } from "../components";
import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { fetchUserClan } from "../store/clanSlice";
import { user_profile } from "../store/authSlice";
import LoadingSpinner from "../components/common/LoadingSpinner";

const Dashboard = () => {
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);
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
        if (userClanData === null && profile?.clan?._id) {
          await dispatch(fetchUserClan());
        }
      } catch (error) {
        console.error("Error fetching profile or clan:", error);
      }
    };
    fetchProfileAndClan();
    setLoading(false);
  }, [profile]);

  if (globalLoading || loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="relative ">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="grid md:grid-cols-[auto_1fr]">
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
