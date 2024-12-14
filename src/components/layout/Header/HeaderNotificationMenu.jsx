import "../../../styles/NotificationMenu.css";
import { IoMdNotificationsOutline } from "react-icons/io";
import Button from "../../ui/Button/Button";

const HeaderNotificationMenu = () => {
  return (
    <>
      <nav className="notification-menu">
        <input type="checkbox" id="notification-menu-active" />
        <label
          htmlFor="notification-menu-active"
          className="notification-menu-block"
        >
          <IoMdNotificationsOutline size={30} className="notification-icon" />
        </label>
        <label id="notification-overlay" htmlFor="notification-menu-active" />
        <div className="notification-links-container">
          <h2>Notifications</h2>
          <div className="notification-area">
            <IoMdNotificationsOutline size={33} />
            <h3>You dont have any Notifications</h3>
            <p>
              Looks like you don't have any notifications or updates at the
              moment, we'll update you as soon as we have something for you
            </p>
            <Button>Browse Tournaments</Button>
          </div>
          <button className="view-all-notification">
            View all Notifications
          </button>
        </div>
      </nav>
    </>
  );
};
export default HeaderNotificationMenu;
