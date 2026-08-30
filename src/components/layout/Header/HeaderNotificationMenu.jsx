import { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { FiBell, FiCheck } from "react-icons/fi";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "../../../store/slices/notificationSlice";

const HeaderNotificationMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();

  const {
    items: notifications = [],
    loading,
    loadingMore,
    hasMore,
    nextCursor,
    unreadCount,
  } = useSelector((state) => state.notifications);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = () => {
    if (!isOpen) dispatch(fetchNotifications());
    setIsOpen((wasOpen) => !wasOpen);
  };

  return (
    <div className="relative z-50" ref={menuRef}>
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        className="relative rounded-2xl border border-slate-600 bg-slate-800 p-3 text-slate-200 transition hover:border-cyan-400/50 hover:bg-slate-700"
      >
        <FiBell size={20} />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="fixed left-2 right-2 top-[4.5rem] overflow-hidden rounded-[24px] border border-slate-600 bg-slate-800/95 shadow-[0_24px_80px_rgba(2,8,23,0.28)] backdrop-blur md:absolute md:left-auto md:right-0 md:top-auto md:mt-3 md:w-[22rem]">
          <div className="border-b border-slate-700 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-cyan-300">
              Live Feed
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-white">Notifications</h2>
              {unreadCount > 0 ? (
                <button
                  type="button"
                  onClick={() => dispatch(markAllNotificationsAsRead())}
                  className="inline-flex items-center gap-1.5 rounded-full bg-cyan-400/15 px-3 py-1 text-[11px] font-bold text-cyan-200 transition hover:bg-cyan-400/25"
                >
                  <FiCheck /> Mark all read
                </button>
              ) : (
                <span className="rounded-full bg-slate-700 px-3 py-1 text-[11px] font-bold text-slate-300">
                  All caught up
                </span>
              )}
            </div>
          </div>

          <div className="max-h-80 divide-y divide-slate-700 overflow-y-auto">
            {loading ? (
              <div className="p-6 text-center text-sm text-slate-300">
                Syncing notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-600 bg-slate-700 text-cyan-300">
                  <FiBell size={22} />
                </div>
                <h3 className="mt-4 text-base font-bold text-white">
                  No notifications yet
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Match updates, wallet changes, and tournament notices will show up here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  onClick={() => {
                    if (!notification.isRead) {
                      dispatch(markNotificationAsRead(notification._id));
                    }
                  }}
                  className={`cursor-pointer px-4 py-4 transition ${
                    !notification.isRead
                      ? "bg-cyan-400/10 hover:bg-cyan-400/15"
                      : "hover:bg-slate-700"
                  }`}
                >
                  <p className="font-semibold text-white">{notification.title}</p>
                  {notification.message ? (
                    <p className="mt-1 text-sm text-slate-300">
                      {notification.message}
                    </p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="block text-xs uppercase tracking-[0.14em] text-slate-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </span>
                    {!notification.isRead ? (
                      <span className="rounded-full bg-cyan-400/15 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200">
                        New
                      </span>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 ? (
            hasMore ? (
              <button
                type="button"
                onClick={() => dispatch(fetchNotifications({ cursor: nextCursor }))}
                disabled={loadingMore}
                className="w-full border-t border-slate-700 px-4 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-slate-700"
              >
                {loadingMore ? "Loading..." : "Load older notifications"}
              </button>
            ) : null
          ) : null}

          <div className="border-t border-slate-700 px-4 py-3 text-center text-xs text-slate-400">
            Live alerts sync again whenever you reconnect or return to the app.
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default HeaderNotificationMenu;
