import { Outlet } from "react-router-dom";
import { SideBar } from "../components";

const Dashboard = () => {
  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#020611] md:min-h-[calc(100vh-80px)]">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] max-w-[1600px] md:grid-cols-[18rem_1fr] md:px-0">
        <SideBar />

        <div className="min-w-0 min-h-0 px-3 pb-24 pt-4 md:px-6 md:pb-10 md:pt-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
