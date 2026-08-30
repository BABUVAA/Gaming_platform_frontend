import { ROUTES } from "./routeConstants";
import { dashboardRoute } from "./dashboardRoutes";

// Public routes stay separate from role-specific sections so the root layout
// can grow without mixing visitor, player, and admin concerns together.
export const publicRoutes = [
  { index: true, guardElement: "LandingPage" },
  { path: ROUTES.HOME, componentKey: "Home" },
  { path: ROUTES.FORGOT_PASSWORD, componentKey: "ForgotPassword" },
  { path: ROUTES.RESET_PASSWORD, componentKey: "ForgotPassword" },
  { path: ROUTES.LOGIN, componentKey: "Login" },
  { path: ROUTES.SIGNUP, componentKey: "SignUp" },
  { path: ROUTES.REFERRAL_LANDING, componentKey: "ReferralLanding" },
  { path: ROUTES.COC, componentKey: "Coc" },
  { path: ROUTES.LOGOUT, element: <></> },
  dashboardRoute,
];

export default publicRoutes;
