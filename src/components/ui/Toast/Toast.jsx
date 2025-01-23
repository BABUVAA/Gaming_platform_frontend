import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { hideToast } from "../../../store/toastSlice";
import { CiWarning } from "react-icons/ci";
import { IoCloseCircleOutline } from "react-icons/io5";
import { IoCloseOutline } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";
import { CiCircleInfo } from "react-icons/ci";

const Toast = () => {
  const dispatch = useDispatch();
  const { visible, message, type, position } = useSelector(
    (store) => store.toast
  );

  // Auto close after 5 seconds
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        dispatch(hideToast());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, dispatch]);

  if (!visible) return null;

  // Position and type classes
  const positionClasses = {
    "top-left": "top-5 left-5",
    "top-right": "top-5 right-5",
    "bottom-left": "bottom-5 left-5",
    "bottom-right": "bottom-5 right-5",
  };

  const typeClasses = {
    success: "bg-green-100 text-green-700 border-green-500",
    danger: "bg-red-100 text-red-700 border-red-500",
    warning: "bg-yellow-100 text-yellow-700 border-yellow-500",
    default: "bg-blue-100 text-blue-700 border-blue-500",
  };

  const iconClasses = () => {
    switch (type) {
      case "success":
        return <FaCheckCircle size={30} className="text-green-500" />;
      case "danger":
        return <IoCloseCircleOutline size={30} className="text-red-500" />;
      case "warning":
        return <CiWarning size={30} className="text-yellow-500" />;
      case "default":
      default:
        return <CiCircleInfo size={30} className="text-blue-500" />;
    }
  };

  const positionClass =
    positionClasses[position] || positionClasses["top-right"];
  const typeClass = typeClasses[type] || typeClasses["default"];

  const closeToast = () => {
    dispatch(hideToast());
  };

  return (
    <div
      id={`toast-${type}`}
      className={`flex items-center w-full max-w-xs p-4 border rounded-lg shadow-lg fixed z-50 ${positionClass} ${typeClass}`}
      role="alert"
    >
      <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-lg">
        {iconClasses()}
      </div>
      <div className="ms-3 text-sm font-medium">{message}</div>
      <button
        onClick={closeToast}
        type="button"
        className="ms-auto -mx-1.5 -my-1.5 p-1.5 rounded-lg focus:ring-2 focus:ring-gray-300 hover:bg-opacity-30 transition duration-150 ease-in-out"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <IoCloseOutline size={20} className="text-gray-500" />
      </button>
    </div>
  );
};

export default Toast;
