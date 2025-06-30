import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { IoMdNotificationsOutline } from "react-icons/io";
import Button from "../../ui/Button/Button";
import { markNotificationAsRead } from "../../../store/notificationSlice";

const HeaderNotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();

  const notifications = useSelector((state) => state.notifications.items || []);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = (id) => {
    dispatch(markNotificationAsRead(id));
  };

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 text-gray-700 hover:text-indigo-600 focus:outline-none relative"
      >
        <IoMdNotificationsOutline size={26} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">
              Notifications
            </h2>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center text-center p-6 text-gray-500">
                <IoMdNotificationsOutline
                  size={40}
                  className="text-indigo-400 mb-2"
                />
                <h3 className="font-medium text-gray-700 mb-1">
                  No Notifications
                </h3>
                <p className="text-sm mb-4">
                  Looks like you don’t have any notifications right now.
                </p>
                <Button className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md">
                  Browse Tournaments
                </Button>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleMarkAsRead(n._id)}
                  className={`px-4 py-3 cursor-pointer transition ${
                    !n.isRead
                      ? "bg-indigo-50 hover:bg-indigo-100"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <p className="font-medium text-gray-800 truncate">
                    {n.title}
                  </p>
                  {n.message && (
                    <p className="text-sm text-gray-600 truncate">
                      {n.message}
                    </p>
                  )}
                  <span className="block text-xs text-gray-400 mt-1">
                    {new Date(n.createdAt).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="px-4 py-2 border-t text-sm text-indigo-600 hover:underline text-center cursor-pointer">
              View all Notifications
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HeaderNotificationMenu;
