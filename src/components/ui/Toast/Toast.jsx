import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "../../../store/toastSlice";
import { FiAlertCircle, FiBell, FiCheckCircle, FiInfo, FiX } from "react-icons/fi";

const Toast = () => {
  const dispatch = useDispatch();
  const toasts = useSelector((store) => store.toast.toasts);

  useEffect(() => {
    const timers = toasts.map((toast) =>
      setTimeout(() => {
        dispatch(hideToast(toast.id));
      }, toast.duration || 5000)
    );

    return () => {
      timers.forEach((timer) => clearTimeout(timer));
    };
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  const typeClasses = {
    success: {
      shell: "border-emerald-400/35 bg-emerald-500/12 text-emerald-50",
      icon: "text-emerald-300",
      accent: "from-emerald-400 to-cyan-300",
      label: "Success",
    },
    danger: {
      shell: "border-rose-400/35 bg-rose-500/12 text-rose-50",
      icon: "text-rose-300",
      accent: "from-rose-400 to-orange-300",
      label: "Issue",
    },
    warning: {
      shell: "border-amber-400/35 bg-amber-500/12 text-amber-50",
      icon: "text-amber-300",
      accent: "from-amber-300 to-yellow-200",
      label: "Warning",
    },
    default: {
      shell: "border-cyan-400/35 bg-cyan-500/12 text-cyan-50",
      icon: "text-cyan-300",
      accent: "from-cyan-300 to-blue-300",
      label: "Update",
    },
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <FiCheckCircle className="text-xl" />;
      case "danger":
        return <FiAlertCircle className="text-xl" />;
      case "warning":
        return <FiBell className="text-xl" />;
      default:
        return <FiInfo className="text-xl" />;
    }
  };

  return (
    <div className="pointer-events-none fixed right-4 top-20 z-[70] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3 md:right-6 md:top-24">
      {toasts.map((toast) => {
        const typeClass = typeClasses[toast.type] || typeClasses.default;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto relative overflow-hidden rounded-3xl border p-4 shadow-[0_18px_50px_rgba(2,8,23,0.45)] backdrop-blur-xl ${typeClass.shell}`}
            role="alert"
          >
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${typeClass.accent}`} />
            <div className="flex gap-3">
              <div className={`mt-0.5 rounded-2xl border border-white/10 bg-black/20 p-2 ${typeClass.icon}`}>
                {getIcon(toast.type)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-white/70">
                      {toast.title || typeClass.label}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-white/90">
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={() => dispatch(hideToast(toast.id))}
                    type="button"
                    className="rounded-full border border-white/10 bg-white/5 p-1.5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                    aria-label="Close"
                  >
                    <FiX className="text-base" />
                  </button>
                </div>
              </div>
            </div>
            <button
              type="button"
              className="sr-only"
            >
              Close
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
