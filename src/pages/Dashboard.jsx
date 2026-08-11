import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Outlet } from "react-router-dom";
import { SideBar } from "../components";
import StaffReadOnlyNotice from "../components/common/StaffReadOnlyNotice";
import { fetchNotifications } from "../store/slices/notificationSlice";
import { fetchWalletBalance } from "../store/slices/paymentSlice";
import unwrapThunkRequest from "../store/thunks/unwrapThunkRequest";
import {
  useAuthStore,
  useCatalogStore,
} from "../store/useStore";

const Dashboard = () => {
  const hasLoadedNotifications = useRef(false);
  const hasLoadedVerifiedData = useRef(false);
  const dispatch = useDispatch();
  const { isVerified, user } = useAuthStore();
  const { loadGames } = useCatalogStore();
  const wallet = useSelector((state) => state.payment.wallet);

  useEffect(() => {
    // The dashboard shell owns only the shared Game catalog. Competition pages
    // load their canonical Quick Match projections through their own slice.
    loadGames().catch((error) => {
      console.error("Catalog bootstrap failed:", error);
    });
  }, [loadGames]);

  useEffect(() => {
    if (!user) return;

    const requests = [];

    if (!hasLoadedNotifications.current) {
      // Account notifications remain available so an unverified player can
      // still receive useful account and verification updates.
      hasLoadedNotifications.current = true;
      requests.push(unwrapThunkRequest(dispatch(fetchNotifications())));
    }

    if (isVerified && !hasLoadedVerifiedData.current) {
      // Wallet data is private feature data. Waiting for verified status avoids
      // unnecessary 403 responses and restricted server calls.
      hasLoadedVerifiedData.current = true;

      // Clan data is now loaded only by the detailed Clan route.
      // The dashboard shell preloads only the compact wallet summary.
      if (!wallet) {
        requests.push(unwrapThunkRequest(dispatch(fetchWalletBalance())));
      }
    }

    if (requests.length === 0) return;

    Promise.all(requests).catch((error) => {
      // Individual slices retain their own failure state; this log adds one
      // diagnostic boundary without forcing unrelated dashboard data to fail.
      console.error("Dashboard bootstrap failed:", error);
    });
  }, [dispatch, isVerified, user, wallet]);

  return (
    <div className="min-w-0 w-full overflow-x-hidden min-h-[calc(100vh-64px)] bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.08),transparent_24%),#111827] md:min-h-[calc(100vh-80px)]">
      <div className="mx-auto grid w-full grid-cols-[minmax(0,1fr)] min-h-[calc(100vh-64px)] max-w-[1600px] md:grid-cols-[18rem_minmax(0,1fr)] md:px-0">
        <SideBar />

        <div className="min-w-0 min-h-0 w-full max-w-full px-3 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6">
          <StaffReadOnlyNotice />
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
