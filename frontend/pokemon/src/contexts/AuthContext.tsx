/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import { useUser } from "./UserContext";

// Định nghĩa kiểu cho AuthContext
type AuthContextType = {
  user: ReturnType<typeof useUser>["currentUser"];
  login: ReturnType<typeof useUser>["login"];
  logout: ReturnType<typeof useUser>["logout"];
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

// Provider cho AuthContext, sử dụng dữ liệu từ UserContext
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { currentUser, login, logout } = useUser();

  return (
    <AuthContext.Provider value={{ user: currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook để sử dụng AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};