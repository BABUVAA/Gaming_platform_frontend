import { useDispatch, useSelector } from "react-redux";
import { fetchGames } from "../store/gameSlice";
import { useEffect } from "react";
import { Header } from "../components";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Outlet } from "react-router-dom";
import { verifySession } from "../store/authSlice";

function App() {
  const dispatch = useDispatch();

  const { globalLoading } = useSelector((store) => store.loading);
  const { isAuthenticated } = useSelector((store) => store.auth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated) {
          await dispatch(verifySession());
        }
        await dispatch(fetchGames());
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

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
    </div>
  );
}

export default App;
