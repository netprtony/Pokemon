import React from "react";
import "../assets/css/Input.css";

type InputType = "text" | "money" | "number" | "datetime" | "file" | "date" | "stepper" | "textarea";

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
  // Stepper handler
  const handleStepper = (delta: number) => {
    let newValue = Number(value) + delta;
    if (typeof min === "number") newValue = Math.max(min, newValue);
    if (typeof max === "number") newValue = Math.min(max, newValue);
    const event = {
      target: {
        name: props.name,
        value: newValue,
        type: "number"
      }
    };
    onChange(event as unknown as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="mac-input-group">
      {label && <label className="mac-input-label">{label}</label>}
      {type === "money" ? (
        <input
          type="text"
          data-type="money" // ✅ để handleFormChange biết đây là money
          className="mac-input"
          value={value === "" ? "" : formatMoney(value)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "");

            // 🔧 Tạo event mới, giữ name, value và truyền dataset.type
            const customEvent = {
              ...e,
              target: {
                ...e.target,
                name: e.target.name,
                value: raw,
                dataset: { type: "money" }
              }
            } as React.ChangeEvent<HTMLInputElement>;

            onChange(customEvent);
          }}
          onBlur={(e) => {
            const raw = e.target.value.replace(/[^\d]/g, "");
            e.target.value = formatMoney(raw);
          }}
          placeholder={props.placeholder || "Nhập số tiền..."}
          {...props}
          step={undefined} // Không truyền step cho type money
        />
      ) : type === "stepper" ? (
        <div className="mac-stepper">
          <button
            type="button"
            className="mac-stepper-btn"
            onClick={() => handleStepper(-step)}
            disabled={typeof min === "number" && Number(value) <= min}
          >
            <span style={{ fontSize: 32, fontWeight: 500 }}>−</span>
          </button>
          <input
            type="number"
            className="mac-stepper-input"
            value={value}
            onChange={onChange}
            min={min}
            max={max}
            step={step}
            {...props}
            style={{ textAlign: "center", width: 60, fontSize: 20, background: "transparent", border: "none" }}
          />
          <button
            type="button"
            className="mac-stepper-btn"
            onClick={() => handleStepper(step)}
            disabled={typeof max === "number" && Number(value) >= max}
          >
            <span style={{ fontSize: 32, fontWeight: 500 }}>+</span>
          </button>
        </div>
      ) : type === "textarea" ? (
        <textarea
          className="mac-input"
          value={value}
          onChange={(e) => {
            // Cast textarea event thành input event
            const event = {
              ...e,
              target: {
                ...e.target,
                name: e.target.name,
                value: e.target.value,
              }
            } as unknown as React.ChangeEvent<HTMLInputElement>;
            onChange(event);
          }}
          placeholder={props.placeholder || "Nhập ghi chú..."}
          rows={4}
          style={{
            resize: "vertical",
            minHeight: 80,
            fontFamily: "inherit",
          }}
          {...(props as any)}
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
      ) : type === "date" ? (
        <input
          type="date"
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