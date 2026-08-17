import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  getCurrentUser,
  getToken,
  login as loginService,
  logout as logoutService,
} from "../services/authService";
import { API_BASE_URL } from "../../../config/runtime";

const AuthContext = createContext(null);

const API_URL = API_BASE_URL;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function restoreSession() {
      try {
        const token = getToken();
        const storedUser = getCurrentUser();

        if (!token || !storedUser) {
          if (isMounted) {
            setUser(null);
          }

          return;
        }

        const response = await fetch(`${API_URL}/auth/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error("Invalid or expired session.");
        }

        const result = await response.json();

        const verifiedUser = {
          ...storedUser,
          ...result.user,
          id:
            result.user?.user_id ??
            storedUser.id ??
            storedUser.user_id,
          name:
            storedUser.name ??
            storedUser.full_name ??
            result.user?.full_name ??
            result.user?.email,
        };

        if (isMounted) {
          setUser(verifiedUser);
        }
      } catch (error) {
        console.warn("Session restoration failed:", error.message);

        logoutService();

        if (isMounted) {
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    restoreSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials) => {
    const result = await loginService(credentials);

    setUser(result.user);

    return result;
  };

  const logout = () => {
    logoutService();
    setUser(null);
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
  };

  const hasRole = (allowedRoles = []) => {
    if (!user) {
      return false;
    }

    if (!Array.isArray(allowedRoles) || allowedRoles.length === 0) {
      return true;
    }

    const normalizedUserRole = String(user.role || "").toLowerCase();

    return allowedRoles.some(
      (role) =>
        String(role || "").toLowerCase() === normalizedUserRole
    );
  };

  const value = useMemo(
    () => ({
      user,
      authLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateUser,
      hasRole,
    }),
    [user, authLoading]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside an AuthProvider."
    );
  }

  return context;
}
