import { useDispatch, useSelector } from "react-redux";
import { fetchGames } from "../store/gameSlice";
import { useEffect } from "react";
import { Header, Toast } from "../components";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Outlet } from "react-router-dom";
import { verifySession } from "../store/authSlice";
import WebSocketTest from "./WebsocketTest";

function App() {
  const dispatch = useDispatch();
  const { globalLoading } = useSelector((store) => store.loading);
  const { isAuthenticated } = useSelector((store) => store.auth);
  const { visible } = useSelector((store) => store.toast);

  useEffect(() => {
    const fetchData = async () => {
      if (isAuthenticated) {
        await dispatch(verifySession());
      }
      await dispatch(fetchGames());
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
      {/* <WebSocketTest /> */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      {visible && <Toast />}
    </div>
  );
}

export default App;
