import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiLock, FiX } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useAuthStore } from "../../store/useStore.js";
import {
  selectSensitiveActionDialogOpen,
  settleSensitiveActionConfirmation,
} from "../../store/slices/sensitiveActionSlice.js";

const SensitiveActionDialog = () => {
  const dispatch = useDispatch();
  const isOpen = useSelector(selectSensitiveActionDialogOpen);
  const { confirmSensitiveAction } = useAuthStore();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);
  const inputRef = useRef(null);
  const confirmingRef = useRef(false);

  const cancel = useCallback(() => {
    if (confirmingRef.current) return;
    settleSensitiveActionConfirmation(dispatch, false);
  }, [dispatch]);

  useEffect(() => {
    if (!isOpen) {
      setPassword("");
      setError("");
      setConfirming(false);
      confirmingRef.current = false;
      return undefined;
    }

    const previousFocus = document.activeElement;
    inputRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") cancel();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      previousFocus?.focus?.();
    };
  }, [cancel, isOpen]);

  const confirm = async (event) => {
    event.preventDefault();
    if (!password || confirming) return;

    setError("");
    setConfirming(true);
    confirmingRef.current = true;
    try {
      await confirmSensitiveAction(password).unwrap();
      settleSensitiveActionConfirmation(dispatch, true);
    } catch (requestError) {
      setError(requestError?.message || "Password confirmation failed.");
      setConfirming(false);
      confirmingRef.current = false;
      inputRef.current?.focus();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/80 px-4 py-8 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) cancel();
      }}
    >
      <section
        aria-describedby="sensitive-action-description"
        aria-labelledby="sensitive-action-title"
        aria-modal="true"
        className="relative w-full max-w-sm rounded-2xl border border-cyan-300/20 bg-slate-900 p-5 shadow-[0_28px_80px_rgba(2,6,23,0.7)]"
        role="dialog"
      >
        <button
          aria-label="Cancel sensitive action"
          className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
          disabled={confirming}
          onClick={cancel}
          type="button"
        >
          <FiX aria-hidden="true" />
        </button>

        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
          <FiLock aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-lg font-black text-white" id="sensitive-action-title">
          Confirm this action
        </h2>
        <p className="mt-1 text-sm text-slate-400" id="sensitive-action-description">
          Enter your password to continue.
        </p>

        <form className="mt-5 space-y-3" onSubmit={confirm}>
          <input
            ref={inputRef}
            aria-label="Current password"
            autoComplete="current-password"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-2 focus:ring-cyan-300/10"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Current password"
            type="password"
            value={password}
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          <div className="flex justify-end gap-2 pt-1">
            <button
              className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-white/5 disabled:opacity-50"
              disabled={confirming}
              onClick={cancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="rounded-xl bg-cyan-300 px-4 py-2.5 text-sm font-black text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={!password || confirming}
              type="submit"
            >
              {confirming ? "Confirming..." : "Continue"}
            </button>
          </div>
        </form>
      </section>
    </div>,
    document.body,
  );
};

export default SensitiveActionDialog;
