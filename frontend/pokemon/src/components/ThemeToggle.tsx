import React, { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";
import Toggle from "./Toggle";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);

  return (
    <Toggle
      checked={theme === "dark"}
      onChange={() => toggleTheme()}
    />
  );
};

export default ThemeToggle;