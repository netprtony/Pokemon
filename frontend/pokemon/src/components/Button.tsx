import React from "react";
import "../assets/css/Button.css";

export type ButtonVariant =
  | "primary"
  | "primary-outline"
  | "primary-soft"
  | "primary-outline-soft"
  | "white"
  | "white-outline"
  | "gray"
  | "gray-outline";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: ButtonVariant;
  size?: "md" | "lg";
  loading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  ...props
}) => {
  return (
    <button
      {...props}
      className={`mac-btn mac-btn-${variant} mac-btn-${size} ${props.className ?? ""}`}
      disabled={loading || props.disabled}
    >
      {loading ? <span className="loader" /> : children}
    </button>
  );
};

export default Button;