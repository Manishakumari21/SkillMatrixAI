import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

function parseJwt(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token"));

  const isTokenExpired = useCallback(() => {
    if (!token) return true;
    const payload = parseJwt(token);
    if (!payload || !payload.exp) return false;
    return payload.exp * 1000 < Date.now() + 60_000;
  }, [token]);

  useEffect(() => {
    if (token && isTokenExpired()) {
      localStorage.removeItem("token");
      setToken(null);
    }
  }, [token, isTokenExpired]);

  function login(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
  }

  const value = {
    token,
    isLoggedIn: !!token && !isTokenExpired(),
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
