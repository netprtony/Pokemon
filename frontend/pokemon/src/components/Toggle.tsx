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
    <div className={`toggle${disabled ? " disabled" : ""}`} style={{ display: "inline-block" }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => !disabled && onChange(e.target.checked)}
        disabled={disabled}
      />
      <label>
        {label && <span style={{ marginLeft: 85, position: "absolute" }}>{label}</span>}
      </label>
    </div>
  );
};

export default Toggle;