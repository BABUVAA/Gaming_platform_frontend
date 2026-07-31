import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { FiAlertTriangle, FiArrowRight, FiX } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routes/routeConstants";

const EmailVerificationDialog = () => {
  const dialogRef = useRef(null);
  const primaryActionRef = useRef(null);
  const navigate = useNavigate();

  const returnToCompete = () => {
    // Closing cannot reveal the restricted route underneath, so players return
    // to the accessible Compete page instead.
    navigate(ROUTES.GAME, { replace: true });
  };

  const openAccountSettings = () => {
    // Verification begins from Account Settings while the actual restricted
    // feature stays unmounted.
    navigate(ROUTES.ACCOUNT_SETTINGS, { replace: true });
  };

  useEffect(() => {
    const previouslyFocusedElement = document.activeElement;
    primaryActionRef.current?.focus();

    const handleDialogKeyDown = (event) => {
      if (event.key === "Escape") {
        // Use the router directly here so the keyboard listener depends only
        // on React Router's stable navigation function.
        navigate(ROUTES.GAME, { replace: true });
        return;
      }

      if (event.key !== "Tab") return;

      // Keep keyboard focus inside the blocking dialog until the player picks
      // one of its available actions.
      const focusableElements = dialogRef.current?.querySelectorAll("button");
      if (!focusableElements?.length) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleDialogKeyDown);

    return () => {
      document.removeEventListener("keydown", handleDialogKeyDown);
      previouslyFocusedElement?.focus?.();
    };
  }, [navigate]);

  const dialog = (
    <div
      className="fixed inset-0 z-[100] grid place-items-center bg-slate-950/75 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        // Only a click on the backdrop closes the dialog; clicks inside the
        // card must not accidentally navigate the player away.
        if (event.target === event.currentTarget) returnToCompete();
      }}
    >
      <section
        ref={dialogRef}
        aria-describedby="email-verification-description"
        aria-labelledby="email-verification-title"
        aria-modal="true"
        className="relative w-full max-w-md overflow-hidden rounded-[28px] border border-amber-300/20 bg-[linear-gradient(145deg,#1e293b,#111827)] p-6 text-slate-100 shadow-[0_30px_90px_rgba(2,6,23,0.65)] sm:p-7"
        role="dialog"
      >
        <button
          type="button"
          aria-label="Close verification message"
          className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
          onClick={returnToCompete}
        >
          <FiX aria-hidden="true" />
        </button>

        <div className="mb-5 inline-flex rounded-2xl border border-amber-300/25 bg-amber-300/10 p-3 text-amber-300">
          <FiAlertTriangle aria-hidden="true" className="text-2xl" />
        </div>

        <h2
          id="email-verification-title"
          className="pr-10 text-2xl font-black tracking-tight text-white"
        >
          Verify your email first
        </h2>
        <p
          id="email-verification-description"
          className="mt-3 text-sm leading-6 text-slate-300"
        >
          Confirm your email to continue with matches, tournaments, clans,
          wallet, and game accounts.
        </p>

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-bold text-slate-200 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300"
            onClick={returnToCompete}
          >
            Back to Compete
          </button>
          <button
            ref={primaryActionRef}
            type="button"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-100 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            onClick={openAccountSettings}
          >
            Verify email
            <FiArrowRight aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );

  // Portalling keeps the overlay above the dashboard header and sidebar,
  // regardless of their stacking or overflow rules.
  return createPortal(dialog, document.body);
};

export default EmailVerificationDialog;
