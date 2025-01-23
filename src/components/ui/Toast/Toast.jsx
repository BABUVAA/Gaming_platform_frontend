import { useState, useEffect } from "react";

// Toast component
const Toast = ({ message, position = "top-right", type = "info", onClose }) => {
  const [showToast, setShowToast] = useState(true);

  const closeToast = () => {
    setShowToast(false);
    if (onClose) onClose();
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000); // Auto close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  if (!showToast) return null;

  // Dynamic positioning classes based on the 'position' prop
  const positionClasses = {
    "top-left": "top-5 left-5",
    "top-right": "top-5 right-5",
    "bottom-left": "bottom-5 left-5",
    "bottom-right": "bottom-5 right-5",
  };

  // Dynamic style based on the 'type' prop (info, success, error)
  const typeClasses = {
    info: "bg-blue-600 text-white",
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
  };

  return (
    <div
      className={`fixed flex items-center w-full max-w-xs p-4 space-x-4 text-gray-500 bg-white divide-x rtl:divide-x-reverse divide-gray-200 rounded-lg shadow dark:text-gray-400 dark:divide-gray-700 dark:bg-gray-800 ${positionClasses[position]} ${typeClasses[type]}`}
      role="alert"
    >
      <div className="text-sm font-normal">{message}</div>
      <button
        onClick={closeToast}
        type="button"
        className="ms-auto -mx-1.5 -my-1.5 bg-white items-center justify-center flex-shrink-0 text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
        aria-label="Close"
      >
        <span className="sr-only">Close</span>
        <svg
          className="w-3 h-3"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 14 14"
        >
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
          />
        </svg>
      </button>
    </div>
  );
};

export default Toast;
