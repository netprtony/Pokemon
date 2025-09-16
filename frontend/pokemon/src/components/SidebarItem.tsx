import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

type ChildItem = {
  label: string;
  path: string;
  icon?: string;
};

type SidebarItemProps = {
  icon: string;               // Bootstrap icon class, e.g. "bi bi-house"
  label: string;              // main title
  path?: string;              // direct link
  subLabel?: string;          // optional right label
  dropdown?: boolean;         // if true => has children
  children?: ChildItem[];     // children links
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

  const isActive = path && location.pathname === path;
  const isChildActive = dropdown && children.some((child) => location.pathname === child.path);

  const handleClick = () => {
    if (dropdown) {
      setOpen((prev) => !prev);
    } else if (path) {
      navigate(path);
    }
  };

  // SVG chevron right
  const ChevronRight = (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4 3l3 3-3 3" stroke="#9CA3AF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  // SVG chevron down
  const ChevronDown = (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      style={{
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.2s"
      }}
    >
      <path d="M3 5l3 3 3-3" stroke="#6B7280" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  return (
    <div className="w-100">
      {/* ITEM CHA */}
      <div
        className={`d-flex align-items-center justify-content-between py-3 px-3 rounded-lg cursor-pointer 
          transition-colors duration-150 
          ${isActive || isChildActive ? "bg-light" : "hover-bg-light"}`}
        onClick={handleClick}
      >
        <div className="d-flex align-items-center gap-3">
          <i className={`${icon} fs-5 text-primary`} />
          <span className="text-dark text-sm fw-medium">{label}</span>
        </div>

        <div className="d-flex align-items-center gap-2">
          {subLabel && <span className="text-xs text-secondary">{subLabel}</span>}
          {dropdown ? (
            ChevronDown
          ) : (
            ChevronRight
          )}
        </div>
      </div>

      {/* DROPDOWN CHILDREN */}
      {dropdown && (
        <div
          className="overflow-hidden transition-all duration-300"
          style={{
            maxHeight: open ? `${children.length * 44}px` : "0",
          }}
        >
          {children.map((item, index) => {
            const childActive = location.pathname === item.path;
            return (
              <div
                key={index}
                className={`ps-5 py-2 text-sm cursor-pointer 
                  transition-colors rounded-lg d-flex align-items-center
                  ${childActive ? "bg-light text-primary fw-semibold" : "hover-bg-light text-secondary"}`}
                onClick={() => navigate(item.path)}
              >
                {item.icon && <i className={item.icon + " me-2"} />}
                {item.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
