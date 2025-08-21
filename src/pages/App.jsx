import { useDispatch, useSelector } from "react-redux";
import { fetchGames } from "../store/gameSlice";
import { useEffect } from "react";
import { Header, Toast } from "../components";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Outlet } from "react-router-dom";
import { verifySession } from "../store/authSlice";
import { fetchTournaments } from "../store/tournamentSlice";
import { fetchUserClan } from "../store/clanSlice";
import { user_profile } from "../store/authSlice";
import { fetchNotifications } from "../store/notificationSlice";
import { fetchWalletBalance } from "../store/paymentSlice";

function App() {
  const dispatch = useDispatch();
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);
  const { globalLoading } = useSelector((store) => store.loading);
  const { isAuthenticated } = useSelector((store) => store.auth);
  const games = useSelector((store) => store.games);
  const { tournaments } = useSelector((store) => store.tournament);
  const { visible } = useSelector((store) => store.toast);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        await dispatch(verifySession());
      }
      if (!games.data || games.data.length === 0) {
        await dispatch(fetchGames());
      }
      if (!tournaments || Object.keys(tournaments).length === 0) {
        await dispatch(fetchTournaments());
      }
    };
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        let currentProfile = profile;
        if (true) {
          const result = await dispatch(user_profile());
          currentProfile = result?.payload;
          await dispatch(fetchWalletBalance());
          await dispatch(fetchNotifications());
        }
        if (!userClanData && currentProfile?.clan?._id) {
          await dispatch(fetchUserClan());
        }
      } catch (error) {
        console.error("Dashboard init fetch error:", error);
      }
    };

    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated]);

  // Show loading spinner while fetching data
  if (globalLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <Header />
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {visible && <Toast />}
    </div>
  );
}

export default App;
