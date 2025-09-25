import React from "react";
import { motion } from "framer-motion";
import ThemeToggle from "./ThemeToggle";

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
    <header
      className="d-flex justify-content-between align-items-center shadow-sm px-3 py-2 rounded-bottom-4"
      style={{
        background: "var(--header-bg)",
        color: "var(--header-text)",
        transition: "background 0.2s, color 0.2s",
      }}
    >
      {/* SEARCH BOX */}
      <div className="flex-grow-1 me-3" style={{ maxWidth: "320px" }}>
        <div className="input-group">
          <input
            type="text"
            className="form-control form-control-sm rounded-pill ps-3"
            
            onKeyDown={handleSearch}
            aria-label="Search product"
            style={{
              background: "var(--header-bg)",
              color: "var(--header-text)",
              border: "1px solid #ccc",
            }}
          />
          <span
            className="input-group-text bg-transparent border-0 position-absolute end-0 me-2"
            style={{ zIndex: 5 }}
          >
            <motion.i
              className="bi bi-search"
              style={{ color: "var(--header-text)" }}
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
          <i
            className="bi bi-envelope fs-5"
            style={{ color: "var(--header-text)" }}
          ></i>
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
          <i
            className="bi bi-bell fs-5"
            style={{ color: "var(--header-text)" }}
          ></i>
          {unreadNotifications > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
              {unreadNotifications}
            </span>
          )}
        </motion.div>

        {/* TOGGLE THEME */}
        <ThemeToggle />

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
            src={
              userAvatar && userAvatar !== "None"
          ? `public/images/avatars/${userAvatar}`
          : `public/images/avatars/default.png`
            }
            alt={userName}
            className="rounded-circle border"
            style={{ width: "32px", height: "32px", objectFit: "cover" }}
          />
          <div className="d-none d-sm-flex flex-column lh-1">
            <span
              className="fw-semibold small"
              style={{ color: "var(--header-text)" }}
            >
              {userName}
            </span>
            <span className="text-muted small">{userRole}</span>
          </div>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;
