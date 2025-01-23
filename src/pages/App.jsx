import { useDispatch, useSelector } from "react-redux";
import { fetchGames } from "../store/gameSlice";
import { useEffect, useState } from "react";
import { Header, Toast } from "../components";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Outlet } from "react-router-dom";
import { verifySession } from "../store/authSlice";
import { showToast, types } from "../store/toastSlice";

function App() {
  const dispatch = useDispatch();
  const { globalLoading } = useSelector((store) => store.loading);
  const { isAuthenticated } = useSelector((store) => store.auth);
  const { visible } = useSelector((store) => store.toast);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (isAuthenticated) {
          await dispatch(verifySession());
          dispatch(
            showToast({
              message: "Session Verified",
              type: types.DEAFAULT,
              position: "bottom-right",
            })
          );
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
      {visible && (
        <Toast
          message="This is a success message!"
          position="top-right"
          type="success"
        />
      )}
    </div>
  );
}

export default App;
