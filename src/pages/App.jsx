import { useDispatch, useSelector } from "react-redux";
import { fetchGames } from "../store/gameSlice";
import { useEffect } from "react";
import { Header } from "../components";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Outlet } from "react-router-dom";
import { verifySession } from "../store/authSlice";

function App() {
  const dispatch = useDispatch();
  const { loading } = useSelector((store) => store.games);
  const { isAuthenticated, isLoading, user } = useSelector(
    (store) => store.auth
  );

  useEffect(() => {
    dispatch(fetchGames());
    !isAuthenticated ? dispatch(verifySession()) : "";
  }, [dispatch]);
  //if games data loadings
  if (loading || isLoading) {
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
