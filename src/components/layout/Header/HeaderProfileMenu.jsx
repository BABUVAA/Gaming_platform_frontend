import { useState, useRef, useEffect } from "react";
import { CiUser } from "react-icons/ci";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { logout } from "../../../store/authSlice";

const HeaderProfileMenu = () => {
  const dispatch = useDispatch();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-700 hover:text-indigo-600 focus:outline-none"
      >
        <CiUser size={26} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border rounded-xl shadow-lg z-50">
          <div className="p-4 border-b">
            <p className="text-sm text-gray-600">Signed in as</p>
            <p className="font-medium text-gray-800 truncate">Username</p>
          </div>

          <ul className="text-sm text-gray-700 divide-y">
            <li>
              <Link
                to="/dashboard/profile"
                className="block px-4 py-3 hover:bg-gray-100"
              >
                My Profile
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/account"
                className="block px-4 py-3 hover:bg-gray-100"
              >
                Account Settings
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/wallet"
                className="block px-4 py-3 hover:bg-gray-100"
              >
                Wallet
              </Link>
            </li>
            <li>
              <Link
                to="/dashboard/refer"
                className="block px-4 py-3 hover:bg-gray-100"
              >
                Refer a Friend
              </Link>
            </li>
            <li>
              <button
                onClick={() => dispatch(logout())}
                className="w-full text-left px-4 py-3 hover:bg-gray-100 text-red-500"
              >
                Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default HeaderProfileMenu;
