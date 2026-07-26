import { useSelector } from "react-redux";
import { Header, Toast } from "../components";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { Outlet } from "react-router-dom";

function App() {
  const { globalLoading } = useSelector((store) => store.loading);

  // Only user-blocking mutations use the global loading state. Route and domain
  // fetches render their own loading UI instead of replacing the entire shell.
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
