import { useEffect, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { ROUTES } from "../routes/routeConstants";
import { saveCapturedReferral } from "../utils/referralCapture";

const ReferralLanding = () => {
  const { referralCode } = useParams();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    saveCapturedReferral(referralCode);
    setReady(true);
  }, [referralCode]);

  if (!ready) {
    return <div className="min-h-screen bg-slate-950" aria-label="Saving referral" />;
  }
  return <Navigate replace to={ROUTES.SIGNUP} />;
};

export default ReferralLanding;
