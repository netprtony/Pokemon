import React from "react";
import { motion } from "framer-motion";

type HeaderProps = {
  userName: string;
  userRole: string;
  userAvatar: string;
  unreadMessages?: number;
  unreadNotifications?: number;
  onSearch?: (query: string) => void;
};

const iconVariants = {
  initial: { scale: 1, rotate: 0 },
  hover: { scale: 1.2, rotate: 10 },
};

const Header: React.FC<HeaderProps> = ({
  userName,
  userRole,
  userAvatar,
  unreadMessages = 0,
  unreadNotifications = 0,
  onSearch,
}) => {
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && onSearch) {
      onSearch((e.target as HTMLInputElement).value);
    }
  };

  return (
    <header className="d-flex justify-content-between align-items-center bg-white shadow-sm px-3 py-2 rounded-bottom-4">
      {/* SEARCH BOX */}
      <div className="flex-grow-1 me-3" style={{ maxWidth: "320px" }}>
        <div className="input-group">
          <input
            type="text"
            className="form-control form-control-sm rounded-pill ps-3"
            placeholder="Search product"
            onKeyDown={handleSearch}
            aria-label="Search product"
          />
          <span
            className="input-group-text bg-transparent border-0 position-absolute end-0 me-2"
            style={{ zIndex: 5 }}
          >
            <motion.i
              className="bi bi-search text-muted"
              variants={iconVariants}
              initial="initial"
              whileHover="hover"
            />
          </span>
        </div>
      </div>

      {/* RIGHT ACTIONS */}
      <div className="d-flex align-items-center gap-3">
        {/* EMAIL */}
        <motion.div
          className="position-relative"
          role="button"
          aria-label="Messages"
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
        >
          <i className="bi bi-envelope fs-5 text-secondary"></i>
          {unreadMessages > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadMessages}
            </span>
          )}
        </motion.div>

        {/* NOTIFICATIONS */}
        <motion.div
          className="position-relative"
          role="button"
          aria-label="Notifications"
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
        >
          <i className="bi bi-bell fs-5 text-secondary"></i>
          {unreadNotifications > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadNotifications}
            </span>
          )}
        </motion.div>

        {/* USER PROFILE */}
        <motion.div
          className="d-flex align-items-center gap-2"
          role="button"
          aria-label="User Profile"
          variants={iconVariants}
          initial="initial"
          whileHover="hover"
        >
          <img
            src={userAvatar}
            alt={userName}
            className="rounded-circle border"
            style={{ width: "32px", height: "32px", objectFit: "cover" }}
          />
          <div className="d-none d-sm-flex flex-column lh-1">
            <span className="fw-semibold small text-dark">{userName}</span>
            <span className="text-muted small">{userRole}</span>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
