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

function App() {
  const dispatch = useDispatch();
  const { profile } = useSelector((store) => store.auth);
  const { userClanData } = useSelector((store) => store.clan);
  const { globalLoading } = useSelector((store) => store.loading);
  const { isAuthenticated } = useSelector((store) => store.auth);
  const { visible } = useSelector((store) => store.toast);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        await dispatch(verifySession());
      }
      await dispatch(fetchGames());
      await dispatch(fetchTournaments());
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        let currentProfile = profile;

        // Fetch profile if not already fetched
        if (profile) {
          const result = await dispatch(user_profile());
          currentProfile = result?.payload;
        }

        // Fetch clan if not available but profile has clan
        if (userClanData && currentProfile?.clan?._id) {
          await dispatch(fetchUserClan());
        }
      } catch (error) {
        console.error("Dashboard init fetch error:", error);
      } finally {
        console.log("fetching complete");
      }
    };

    if (isAuthenticated) {
      fetchInitialData();
    }
  }, [isAuthenticated]); // empty deps = on mount (refresh)

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
