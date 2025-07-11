// src/contexts/AuthContext.jsx - INFINITE LOOP MUAMMOSI TUZATILGAN
import React, { createContext, useContext, useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../hooks/redux";
import { syncUserFromStorage, getMe } from "../store/slices/authSlice";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);
  const { user, isAuthenticated, isLoading } = authState;

  // Ref to prevent multiple initialization calls
  const initializedRef = useRef(false);

  // Initialize auth state on app start - ONLY ONCE
  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;

    // Sync user from localStorage first
    dispatch(syncUserFromStorage());

    // Check if we have a token but no user data
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && !storedUser) {
      // Only fetch if we have token but no stored user
      dispatch(getMe()).catch((error) => {
        console.error("Failed to get user data:", error);
        // If token is invalid, clear it
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });
    }
  }, []); // Empty dependency array to run only once

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem("token");
  };

  // Get usage info
  const getUsageInfo = () => {
    if (!user || !user.dailyUsage) {
      return {
        unlimited: false,
        usage: {
          spellCheck: 0,
          correctText: 0,
          transliterate: 0,
          documentGenerator: 0,
        },
        remaining: {
          spellCheck: 3,
          correctText: 3,
          transliterate: 3,
          documentGenerator: 3,
        },
        limit: 3,
      };
    }

    const now = new Date();
    const lastReset = new Date(user.dailyUsage.lastReset);
    const isNewDay = now.toDateString() !== lastReset.toDateString();

    // Check if user has pro plan
    const isPro =
      user.plan === "pro" &&
      user.planExpiry &&
      new Date(user.planExpiry) > new Date();

    if (isPro) {
      return {
        unlimited: true,
        usage: user.dailyUsage,
        remaining: {
          spellCheck: "∞",
          correctText: "∞",
          transliterate: "∞",
          documentGenerator: "∞",
        },
        limit: "∞",
      };
    }

    // For start plan users
    const usage = isNewDay
      ? {
          spellCheck: 0,
          correctText: 0,
          transliterate: 0,
          documentGenerator: 0,
        }
      : user.dailyUsage;

    const remaining = {
      spellCheck: Math.max(0, 3 - (usage.spellCheck || 0)),
      correctText: Math.max(0, 3 - (usage.correctText || 0)),
      transliterate: Math.max(0, 3 - (usage.transliterate || 0)),
      documentGenerator: Math.max(0, 3 - (usage.documentGenerator || 0)),
    };

    return {
      unlimited: false,
      usage,
      remaining,
      limit: 3,
    };
  };

  const value = {
    // Auth state
    user,
    isAuthenticated,
    isLoading,

    // Auth utilities
    getAuthToken,
    getUsageInfo,

    // Full auth state for components that need it
    ...authState,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};

// Export both named and default
export { AuthContext };
export default AuthProvider;
