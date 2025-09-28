import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/css/theme.css";

type ChildItem = { label: string; path: string; icon?: string; };
type SidebarItemProps = {
  icon: string;
  label: string;
  path?: string;
  dropdown?: boolean;
  children?: ChildItem[];
};

export default function SidebarItem({
  icon,
  label,
  path,
  dropdown,
  children = [],
}: SidebarItemProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const isChildActive = dropdown && children.some((c) => location.pathname === c.path);
  const isActive = (path && location.pathname === path) || isChildActive;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dropdown) setOpen((prev) => !prev);
    else if (path) navigate(path);
  };

  return (
    <div className="w-100">
      {/* Parent Item */}
      <div
        className={`sidebar-item-macos ${isActive ? "active" : ""}`}
        onClick={handleClick}
        style={{
          padding: "14px 22px",
          borderRadius: 18,
          margin: "4px 0",
          boxShadow: isActive
            ? "0 4px 16px 0 rgba(25, 118, 210, 0.10)"
            : "none",
          background: isActive
            ? "var(--sidebar-active-bg)"
            : "transparent",
          color: isActive
            ? "var(--sidebar-active-text)"
            : "var(--sidebar-text)",
          fontWeight: isActive ? 600 : 500,
          fontSize: 16,
          cursor: "pointer",
          transition: "background 0.2s, color 0.2s, box-shadow 0.2s",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <i
            className={icon}
            style={{
              fontSize: 22,
              color: isActive
                ? "var(--sidebar-active-text)"
                : "var(--sidebar-text)",
              filter: isActive
                ? "drop-shadow(0 2px 8px rgba(25,118,210,0.18))"
                : "none",
              transition: "color 0.2s, filter 0.2s",
            }}
          />
          <span
            style={{
              letterSpacing: 0.2,
              fontFamily: "inherit",
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {label}
          </span>
        </div>
        {dropdown && (
          <i
            className={`bi ${open ? "bi-chevron-up" : "bi-chevron-down"}`}
            style={{
              fontSize: 18,
              color: isActive
                ? "var(--sidebar-active-text)"
                : "#b0b8c7",
              transition: "color 0.2s",
            }}
          />
        )}
      </div>

      {/* Dropdown */}
      {dropdown && (
        <div
          className="sidebar-dropdown-macos"
          style={{
            maxHeight: open ? `${children.length * 44}px` : "0",
            opacity: open ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s",
            marginLeft: 8,
          }}
        >
          {children.map((item) => {
            const active = location.pathname === item.path;
            return (
              <div
                key={item.path}
                className={`sidebar-item-macos ps-5 ${active ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(item.path);
                }}
                style={{
                  padding: "11px 18px",
                  borderRadius: 14,
                  margin: "3px 0",
                  background: active
                    ? "var(--sidebar-active-bg)"
                    : "transparent",
                  color: active
                    ? "var(--sidebar-active-text)"
                    : "#b0b8c7",
                  fontWeight: active ? 600 : 500,
                  fontSize: 15,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "left",
                  gap: 10,
                  transition: "background 0.2s, color 0.2s",
                }}
              >
                {item.icon && (
                  <i
                    className={`${item.icon} me-2`}
                    style={{
                      fontSize: 18,
                      color: active
                        ? "var(--sidebar-active-text)"
                        : "#b0b8c7",
                      transition: "color 0.2s",
                    }}
                  />
                )}
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
