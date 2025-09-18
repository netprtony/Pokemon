import React from "react";
import "../assets/css/Input.css";

type InputType = "text" | "money" | "number" | "datetime" | "file";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  type?: InputType;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  step?: number;
  min?: number;
  max?: number;
}

export const formatMoney = (value: string | number) => {
  if (!value) return "";
  return Number(value).toLocaleString("vi-VN");
};

const Input: React.FC<InputProps> = ({
  label,
  type = "text",
  value,
  onChange,
  step = 1,
  min,
  max,
  ...props
}) => {
  return (
    <div className="mac-input-group">
      {label && <label className="mac-input-label">{label}</label>}
      {type === "money" ? (
        <input
          type="text"
          className="mac-input"
          value={formatMoney(value)}
          onChange={(e) => {
            // Chỉ nhận số, bỏ dấu phẩy
            const raw = e.target.value.replace(/[^\d]/g, "");
            onChange({
              ...e,
              target: { ...e.target, value: raw }
            });
          }}
          placeholder={props.placeholder || "Nhập số tiền..."}
          {...props}
        />
      ) : type === "number" ? (
        <input
          type="number"
          className="mac-input"
          value={value}
          onChange={onChange}
          min={min}
          max={max}
          step={step}
          {...props}
        />
      ) : type === "datetime" ? (
        <input
          type="datetime-local"
          className="mac-input"
          value={value}
          onChange={onChange}
          {...props}
        />
      ) : type === "file" ? (
        <input
          type="file"
          className="mac-input"
          onChange={onChange}
          {...props}
        />
      ) : (
        <input
          type="text"
          className="mac-input"
          value={value}
          onChange={onChange}
          {...props}
        />
      )}
    </div>
  );
};

export default Input;