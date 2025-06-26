import { useState, useRef, useEffect } from "react";
import { IoMdNotificationsOutline } from "react-icons/io";
import Button from "../../ui/Button/Button"; // Ensure this supports className

const HeaderNotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
      >
        <IoMdNotificationsOutline size={26} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-xl shadow-lg z-50">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-800">
              Notifications
            </h2>
          </div>

          <div className="flex flex-col items-center text-center p-6 text-gray-500">
            <IoMdNotificationsOutline
              size={40}
              className="text-indigo-400 mb-2"
            />
            <h3 className="font-medium text-gray-700 mb-1">No Notifications</h3>
            <p className="text-sm mb-4">
              Looks like you don’t have any notifications right now.
            </p>
            <Button className="text-sm bg-indigo-600 text-white hover:bg-indigo-700 px-4 py-2 rounded-md">
              Browse Tournaments
            </Button>
          </div>

          <div className="px-4 py-2 border-t text-sm text-indigo-600 hover:underline text-center cursor-pointer">
            View all Notifications
          </div>
        </div>
      )}
    </div>
  );
};

export default HeaderNotificationMenu;
