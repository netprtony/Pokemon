import React, { useState } from "react";
import "../assets/css/Option.css";

export interface OptionItem {
  label: string;
  disabled?: boolean;
  shortcut?: string;
  submenu?: OptionItem[];
  onClick?: () => void;
  isDivider?: boolean;
  arrow?: boolean;
}

interface OptionProps {
  items: OptionItem[];
  style?: React.CSSProperties;
}

const Option: React.FC<OptionProps> = ({ items, style }) => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <div className="mac-menu" style={style}>
      {items.map((item, idx) =>
        item.isDivider ? (
          <div key={idx} className="mac-menu-divider" />
        ) : (
          <div
            key={idx}
            className={`mac-menu-item${item.disabled ? " disabled" : ""}`}
            onClick={() => {
              if (!item.disabled && item.onClick) item.onClick();
            }}
            tabIndex={item.disabled ? -1 : 0}
            style={{ cursor: item.disabled ? "default" : "pointer", position: "relative" }}
            onMouseEnter={() => item.submenu && setOpenIdx(idx)}
            onMouseLeave={() => item.submenu && setOpenIdx(null)}
          >
            <span className="mac-menu-label">{item.label}</span>
            {item.arrow || item.submenu ? (
              <span className="mac-menu-arrow">{">"}</span>
            ) : null}
            {item.shortcut && (
              <span className="mac-menu-shortcut">{item.shortcut}</span>
            )}
            {/* Dropdown submenu */}
            {item.submenu && openIdx === idx && (
              <div
                className="mac-menu mac-menu-dropdown"
                style={{
                  position: "absolute",
                  top: 0,
                  left: "100%",
                  zIndex: 10,
                  minWidth: 180,
                  marginLeft: 8,
                }}
              >
                <Option items={item.submenu} />
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default Option;