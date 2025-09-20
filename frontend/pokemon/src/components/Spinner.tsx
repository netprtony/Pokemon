import React from "react";
import "../assets/css/Spinner.css";

interface SpinnerProps {
  text?: string;
}

const Spinner: React.FC<SpinnerProps> = ({ text = "Loading..." }) => (
  <div className="mac-spinner-container">
    <div className="mac-spinner"></div>
    <span className="mac-spinner-text">{text}</span>
  </div>
);

export default Spinner;