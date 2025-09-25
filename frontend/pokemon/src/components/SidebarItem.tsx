import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../assets/css/theme.css";
type ChildItem = {
  label: string;
  path: string;
  icon?: string;
};

type SidebarItemProps = {
  icon: string;
  label: string;
  path?: string;
  subLabel?: string;
  dropdown?: boolean;
  children?: ChildItem[];
};

export default function SidebarItem({
  icon,
  label,
  path,
  subLabel,
  dropdown,
  children = [],
}: SidebarItemProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Xác định active: cha active khi path trùng hoặc có con active
  const isChildActive = dropdown && children.some((child) => location.pathname === child.path);
  const isActive = (path && location.pathname === path) || isChildActive;

  /** ✅ Sửa: Nếu là dropdown thì chỉ mở/đóng, không điều hướng */
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // chặn nổi bọt click từ child
    if (dropdown) {
      setOpen((prev) => !prev);
    } else if (path) {
      navigate(path);
    }
  };

  // SVG icons
  const ChevronRight = (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M4 3l3 3-3 3"
        stroke="#9CA3AF"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  const ChevronDown = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s",
      }}
    >
      <path
        d="M3 5l3 3 3-3"
        stroke="#6B7280"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );

  return (
    <div className="w-100">
      {/* ITEM CHA */}
      <div
        className={`sidebar-item-macos d-flex align-items-center justify-content-between py-3 px-3
          rounded-4 transition-colors
          ${isActive ? "active" : ""}
        `}
        onClick={handleClick}
        style={{
          cursor: "pointer",
          userSelect: "none",
          background: isActive ? "#e4e4e4" : "transparent",
          color: isActive ? "#222" : "#222",
        }}
      >
        <div className="d-flex align-items-center gap-3">
          <i className={`${icon} fs-5`} style={{ color: isActive ? "#1976d2" : "#222", opacity: 1 }} />
          <span style={{ color: isActive ? "#222" : "#222", fontWeight: 500, fontSize: 15 }}>{label}</span>
        </div>
        <div className="d-flex align-items-center gap-2">
          {subLabel && <span style={{ color: "#949494", fontSize: 13 }}>{subLabel}</span>}
          {dropdown ? ChevronDown : ChevronRight}
        </div>
      </div>

      {/* DROPDOWN CHILDREN */}
      {dropdown && (
        <div
          className="sidebar-dropdown-macos"
          style={{
            maxHeight: open ? `${children.length * 44}px` : "0",
            opacity: open ? 1 : 0,
            overflow: "hidden",
            transition: "max-height 0.35s cubic-bezier(.4,0,.2,1), opacity 0.25s",
          }}
        >
          {children.map((item, index) => {
            const childActive = location.pathname === item.path;
            return (
              <div
                key={index}
                className={`sidebar-item-macos d-flex align-items-center ps-5 py-2 rounded-4
                  ${childActive ? "active" : ""}
                `}
                style={{
                  color: childActive ? "#222" : "#949494",
                  background: childActive ? "#e4e4e4" : "transparent",
                  fontWeight: childActive ? 600 : 400,
                  fontSize: 14,
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s",
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(item.path);
                }}
                onMouseEnter={(e) => {
                  if (!childActive) e.currentTarget.style.background = "#f5f5f5";
                }}
                onMouseLeave={(e) => {
                  if (!childActive) e.currentTarget.style.background = "transparent";
                }}
              >
                {item.icon && <i className={item.icon + " me-2"} style={{ color: "#000000ff", opacity: 0.8 }} />}
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
