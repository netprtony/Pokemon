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
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  ...props
}) => {
  return (
    <button
      {...props}
      className={`mac-btn mac-btn-${variant} mac-btn-${size} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
};

export default Button;