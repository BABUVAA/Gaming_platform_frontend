import { useDispatch, useSelector } from "react-redux";
import { fetchGames } from "../store/gameSlice";
import { useEffect, useRef } from "react";
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
  const hasVerifiedSession = useRef(false);
  const hasLoadedInitialData = useRef(false);
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);
  const { globalLoading } = useSelector((store) => store.loading);
  const { isAuthenticated } = useSelector((store) => store.auth);
  const games = useSelector((store) => store.games);
  const { tournaments } = useSelector((store) => store.tournament);

  useEffect(() => {
    const bootstrapShellData = async () => {
      // We always verify once on mount so a valid cookie can rebuild auth
      // even when persisted Redux state has been cleared or is stale.
      if (!hasVerifiedSession.current) {
        hasVerifiedSession.current = true;
        await dispatch(verifySession());
      }

      // Catalog data is public shell data, so we can hydrate it regardless
      // of whether the user is currently authenticated.
      if (!games.data || games.data.length === 0) {
        await dispatch(fetchGames());
      }
      if (!tournaments || Object.keys(tournaments).length === 0) {
        await dispatch(fetchTournaments());
      }
    };

    bootstrapShellData();
  }, [dispatch, games.data, tournaments]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // The profile drives wallet, notifications, and clan bootstrap.
        // We refresh it first so downstream requests work with the latest user data.
        let currentProfile = profile;
        const result = await dispatch(user_profile());
        currentProfile = result?.payload;

        // Abort the rest of the bootstrap if the profile request failed.
        if (!currentProfile) {
          hasLoadedInitialData.current = false;
          return;
        }

        await dispatch(fetchWalletBalance());
        await dispatch(fetchNotifications());
        if (!userClanData && currentProfile?.clan?._id) {
          await dispatch(fetchUserClan());
        }
      } catch (error) {
        console.error("Dashboard init fetch error:", error);
      }
    };

    if (isAuthenticated) {
      if (hasLoadedInitialData.current) return;
      hasLoadedInitialData.current = true;
      fetchInitialData();
    } else {
      // Logging out should allow the next successful login to rerun the
      // authenticated bootstrap from a clean slate.
      hasLoadedInitialData.current = false;
    }
  }, [dispatch, isAuthenticated, profile, userClanData]);

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
      <Toast />
    </div>
  );
}

export default App;
