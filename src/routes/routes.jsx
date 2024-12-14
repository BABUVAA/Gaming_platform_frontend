import { createBrowserRouter } from "react-router-dom";
import React, { lazy, Suspense } from "react";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { useSelector } from "react-redux";
import Coc from "../pages/Coc.jsx";

// Lazy load the page components
const App = lazy(() => import("../pages/App"));
const Home = lazy(() => import("../pages/Home"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const Game = lazy(() => import("../pages/Game"));
const Tournament = lazy(() => import("../pages/Tournament"));
const Profile = lazy(() => import("../pages/Profile"));
const Account = lazy(() => import("../pages/Account"));
const Refer = lazy(() => import("../pages/Refer"));
const Wallet = lazy(() => import("../pages/Wallet"));
const Admin = lazy(() => import("../pages/Admin"));
const Login = lazy(() => import("../pages/Login"));
const SignUp = lazy(() => import("../pages/SignUp"));
const Clan = lazy(() => import("../pages/Clan"));

// Fallback loading component while waiting for lazy-loaded components
const Loading = () => <LoadingSpinner />;

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = useSelector((store) => store.auth.isAuthenticated);
  return isAuthenticated ? children : <Login />;
};

// Add the routes with lazy-loaded components
const routes = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense fallback={<Loading />}>
        <App />
      </Suspense>
    ), // Wrap the top-level route with Suspense
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<Loading />}>
            <Home />
          </Suspense>
        ),
      },
      {
        path: "forgotPWD",
        element: (
          <Suspense fallback={<Loading />}>
            <ForgotPassword />
          </Suspense>
        ),
      },
      {
        path: "login",
        element: (
          <Suspense fallback={<Loading />}>
            <Login />
          </Suspense>
        ),
      },
      {
        path: "signup",
        element: (
          <Suspense fallback={<Loading />}>
            <SignUp />
          </Suspense>
        ),
      },
      {
        path: "dashboard",
        element: (
          <Suspense fallback={<Loading />}>
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          </Suspense>
        ),
        children: [
          {
            path: "game",
            index: true,
            element: (
              <Suspense fallback={<Loading />}>
                <Game />
              </Suspense>
            ),
          },
          {
            path: "tournament",
            element: (
              <Suspense fallback={<Loading />}>
                <Tournament />
              </Suspense>
            ),
          },
          {
            path: "clan",
            element: (
              <Suspense fallback={<Loading />}>
                <Clan />
              </Suspense>
            ),
          },
          {
            path: "profile",
            element: (
              <Suspense fallback={<Loading />}>
                <Profile />
              </Suspense>
            ),
          },
          {
            path: "wallet",
            element: (
              <Suspense fallback={<Loading />}>
                <Wallet />
              </Suspense>
            ),
          },
        ],
      },

      {
        path: "account",
        element: (
          <Suspense fallback={<Loading />}>
            <Account />
          </Suspense>
        ),
      },
      {
        path: "refer",
        element: (
          <Suspense fallback={<Loading />}>
            <Refer />
          </Suspense>
        ),
      },

      {
        path: "logout",
        element: <></>,
      },
    ],
  },
  {
    path: "/panelAdmin", // Path for admin panel
    element: (
      <Suspense fallback={<Loading />}>
        <Admin />
      </Suspense>
    ), // Wrap admin route in Suspense
  },
  {
    path: "/coc",
    element: (
      <Suspense fallback={<Loading />}>
        <Coc />
      </Suspense>
    ),
  },
]);

export default routes;
