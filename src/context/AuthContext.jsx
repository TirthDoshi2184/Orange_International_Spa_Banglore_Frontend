import { createContext, useContext, useState } from "react";
import { setAuthToken } from "../api/axios";

const AuthContext = createContext(null);
const STORAGE_KEY = "orange_spa_admin_token";

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));

  const login = (newToken) => {
    setAuthToken(newToken);            // set header immediately, synchronously
    localStorage.setItem(STORAGE_KEY, newToken);
    setToken(newToken);
  };

  const logout = () => {
    setAuthToken(null);
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};