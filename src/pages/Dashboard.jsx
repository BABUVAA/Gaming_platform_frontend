import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { SideBar } from "../components";
import { fetchUserClan } from "../store/slices/clanSlice";
import { fetchNotifications } from "../store/slices/notificationSlice";
import { fetchWalletBalance } from "../store/slices/paymentSlice";
import { useAuthStore, useCatalogStore } from "../store/useStore";

const Dashboard = () => {
  const hasLoadedPrivateData = useRef(false);
  const dispatch = useDispatch();
  const { profile } = useAuthStore();
  const { loadCatalog } = useCatalogStore();
  const userClanData = useSelector((state) => state.clan.userClanData);

  useEffect(() => {
    // Dashboard pages consume games and tournaments, so this layout owns their
    // bootstrap instead of making every public route pay for those requests.
    loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    if (!profile || hasLoadedPrivateData.current) return;

    hasLoadedPrivateData.current = true;

    // Independent dashboard summaries load concurrently after the profile has
    // established the user's role and optional clan relationship.
    const requests = [
      dispatch(fetchWalletBalance()),
      dispatch(fetchNotifications()),
    ];

    if (!userClanData && profile.clan?._id) {
      requests.push(dispatch(fetchUserClan()));
    }

    Promise.all(requests).catch((error) => {
      // Individual slices retain their own failure state; this log adds one
      // diagnostic boundary without forcing unrelated dashboard data to fail.
      console.error("Dashboard bootstrap failed:", error);
    });
  }, [dispatch, profile, userClanData]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#020611] md:min-h-[calc(100vh-80px)]">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1600px] md:grid-cols-[18rem_1fr] md:px-0">
        <SideBar />

        <div className="min-w-0 min-h-0 px-3 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
