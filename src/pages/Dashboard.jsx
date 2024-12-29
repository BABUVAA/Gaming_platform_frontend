import { useSelector } from "react-redux";
import { SideBar } from "../components";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  const games = useSelector((store) => store.games);

  return (
    <div className=" relative min-h-screen">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className=" lg:ml-16 pt-2 lg:pt-0 flex-1">
        <Outlet />
      </div>
    </div>
  );
};

export default Dashboard;
