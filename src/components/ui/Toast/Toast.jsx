import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "../../../store/toastSlice";
import { CiWarning } from "react-icons/ci";
import { IoCloseCircleOutline, IoCloseOutline } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";
import { CiCircleInfo } from "react-icons/ci";

const Toast = () => {
  const dispatch = useDispatch();
  const toasts = useSelector((store) => store.toast.toasts);

  useEffect(() => {
    toasts.forEach((toast) => {
      const timer = setTimeout(() => {
        dispatch(hideToast(toast.id));
      }, 5000);

      return () => clearTimeout(timer); // Cleanup timeout to prevent memory leaks
    });
  }, [toasts, dispatch]);

  if (toasts.length === 0) return null;

  const typeClasses = {
    success: "bg-green-100 text-green-700 border-green-500",
    danger: "bg-red-100 text-red-700 border-red-500",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-500",
    default: "bg-blue-100 text-blue-700 border-blue-500",
  };

  const getIcon = (type) => {
    switch (type) {
      case "success":
        return <FaCheckCircle size={30} className="text-green-500" />;
      case "danger":
        return <IoCloseCircleOutline size={30} className="text-red-500" />;
      case "warning":
        return <CiWarning size={30} className="text-yellow-500" />;
      default:
        return <CiCircleInfo size={30} className="text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2">
      {toasts.map((toast) => {
        const typeClass = typeClasses[toast.type] || typeClasses["default"];

        return (
          <div
            key={toast.id}
            className={`flex items-center p-4 border rounded-lg shadow-lg ${typeClass}`}
            role="alert"
          >
            <div className="w-8 h-8">{getIcon(toast.type)}</div>
            <div className="ms-3 text-sm font-medium">{toast.message}</div>
            <button
              onClick={() => dispatch(hideToast(toast.id))}
              type="button"
              className="ms-auto p-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 hover:bg-opacity-30 transition duration-150 ease-in-out"
              aria-label="Close"
            >
              <span className="sr-only">Close</span>
              <IoCloseOutline size={20} className="text-gray-500" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default Toast;
