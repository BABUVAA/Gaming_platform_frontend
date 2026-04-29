import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { FiBell, FiChevronRight } from "react-icons/fi";
import { markNotificationAsRead } from "../../../store/notificationSlice";

const HeaderNotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();

  const { items: notifications = [], loading } = useSelector(
    (state) => state.notifications
  );
  const unreadCount = notifications.filter((item) => !item.isRead).length;
  const sortedNotifications = [...notifications].sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  );

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
        className="relative rounded-2xl border border-white/10 bg-white/5 p-3 text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/10"
      >
        <FiBell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 mt-3 w-[22rem] overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/95 shadow-[0_24px_80px_rgba(2,8,23,0.55)] backdrop-blur">
          <div className="border-b border-white/10 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300/75">
              Live Feed
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">Notifications</h2>
              <span className="rounded-full bg-white/5 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-300">
                {unreadCount} unread
              </span>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-white/10">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-400">
                Syncing notifications...
              </div>
            ) : sortedNotifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-cyan-300">
                  <FiBell size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  No notifications yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Match updates, wallet changes, and tournament notices will show up here.
                </p>
              </div>
            ) : (
              sortedNotifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => {
                    if (!notification.isRead) {
                      dispatch(markNotificationAsRead(notification._id));
                    }
                  }}
                  className={`cursor-pointer px-4 py-4 transition ${
                    !notification.isRead
                      ? "bg-cyan-400/8 hover:bg-cyan-400/12"
                      : "hover:bg-white/5"
                  }`}
                >
                  <p className="font-semibold text-white">{notification.title}</p>
                  {notification.message ? (
                    <p className="mt-1 text-sm text-slate-400">
                      {notification.message}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="block text-xs uppercase tracking-[0.14em] text-slate-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {!notification.isRead ? (
                      <span className="rounded-full bg-cyan-400/10 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                        New
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          {sortedNotifications.length > 0 ? (
            <Link
              to="/dashboard/chats"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center gap-2 border-t border-white/10 px-4 py-3 text-sm font-semibold text-cyan-200 transition hover:bg-white/5"
            >
              Open communication center
              <FiChevronRight />
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default HeaderNotificationMenu;
