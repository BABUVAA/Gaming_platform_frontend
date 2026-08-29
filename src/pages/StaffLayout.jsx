import { Outlet } from "react-router-dom";
import StaffSideBar from "../components/layout/StaffSidebar/StaffSideBar.jsx";

const StaffLayout = () => (
  <>
    <div className="min-h-[calc(100vh-64px)] min-w-0 w-full overflow-x-hidden bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.10),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.07),transparent_24%),#111827] md:min-h-[calc(100vh-80px)]">
      <div className="mx-auto grid min-h-[calc(100vh-64px)] w-full max-w-[1600px] grid-cols-[minmax(0,1fr)] md:grid-cols-[14rem_minmax(0,1fr)]">
        <StaffSideBar />
        <div className="min-h-0 min-w-0 w-full max-w-full px-3 pb-24 pt-4 md:col-start-2 md:px-5 md:pb-10 md:pt-5">
          <Outlet />
        </div>
      </div>
    </div>
  </>
);

export default StaffLayout;
