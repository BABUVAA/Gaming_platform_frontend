import { SideBar } from "../components";
import { Outlet } from "react-router-dom";

const Dashboard = () => {
  return (
    <div className="relative ">
      {/* Sidebar */}
      <SideBar />

      {/* Main Content */}
      <div className="grid md:grid-cols-[auto_1fr]">
        {/* Empty div with fixed width */}
        <div className="w-16 h-full"></div>

        {/* The second part takes the remaining space */}
        <div className="h-full w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
