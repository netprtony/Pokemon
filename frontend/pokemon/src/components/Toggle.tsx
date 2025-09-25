import React from "react";
import "../assets/css/Toggle.css";

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, disabled, label }) => {
  return (
    <label className={`mac-toggle${checked ? " checked" : ""}${disabled ? " disabled" : ""}`} style={{ display: "flex", alignItems: "center" }}>
      {label && <span className="mac-toggle-label" style={{ marginRight: "px" }}>{label}</span>}
      <input
      type="checkbox"
      checked={checked}
      onChange={e => !disabled && onChange(e.target.checked)}
      disabled={disabled}
      style={{ display: "none" }}
      />
      <span className="mac-toggle-slider"></span>
    </label>
  );
};

export default Toggle;