// src/hooks/useAuth.js - TO'LIQ YANGILANGAN
import { useAppSelector, useAppDispatch } from "./redux";
import {
  showLoginModal,
  showSignupModal,
  showProfileModal,
  logoutLocal,
  decrementLimit,
  updateLocalUsage,
  authUtils,
} from "../store/slices/authSlice";

export const useAuth = () => {
  const dispatch = useAppDispatch();
  const authState = useAppSelector((state) => state.auth);

  const {
    user,
    isAuthenticated,
    isLoading,
    isSigningUp,
    isLoggingIn,
    error,
    signupError,
    loginError,
  } = authState;

  // Auth actions
  const login = (redirectPath) => {
    dispatch(showLoginModal(redirectPath));
  };

  const signup = () => {
    dispatch(showSignupModal());
  };

  const profile = () => {
    dispatch(showProfileModal());
  };

  const logout = () => {
    dispatch(logoutLocal());
  };

  // Get real-time remaining limit
  const getRemainingLimit = (action) => {
    if (!isAuthenticated || !user) return 0;

    // Pro plan check
    if (
      user.plan === "pro" &&
      user.planExpiry &&
      new Date(user.planExpiry) > new Date()
    ) {
      return "∞";
    }

    const now = new Date();
    const lastReset = new Date(user.dailyUsage?.lastReset || now);

    // Reset if new day
    if (now.toDateString() !== lastReset.toDateString()) {
      return 3; // Yangi kun, to'liq limit
    }

    const usage = user.dailyUsage?.[action] || 0;
    return Math.max(0, 3 - usage);
  };

  // Check if action is allowed
  const canUse = (action) => {
    if (!isAuthenticated || !user) return false;

    const remaining = getRemainingLimit(action);
    return remaining === "∞" || remaining > 0;
  };

  // Use an action (decrements limit immediately for UI feedback)
  const useAction = async (action) => {
    if (!canUse(action)) {
      throw new Error("Kunlik limit tugagan");
    }

    // Update locally first for immediate UI feedback
    dispatch(decrementLimit(action));

    // Update on server in background (optional, for sync)
    try {
      await dispatch(updateLocalUsage(action));
    } catch (error) {
      console.error("Failed to sync usage with server:", error);
      // Don't throw error here - local update is primary
    }

    return true;
  };

  // Get plan status
  const getPlanStatus = () => {
    if (!user) return { plan: "start", isActive: false };
    return authUtils.getPlanStatus(user);
  };

  // Check daily limit with reset logic
  const checkDailyLimit = (action) => {
    if (!isAuthenticated || !user) return false;
    return authUtils.checkDailyLimit(user, action);
  };

  // Require authentication
  const requireAuth = (callback, redirectPath) => {
    if (isAuthenticated) {
      callback?.();
    } else {
      login(redirectPath);
    }
  };

  // Get usage statistics
  const getUsageStats = () => {
    if (!user || !user.dailyUsage) {
      return {
        spellCheck: { used: 0, remaining: 3, total: 3 },
        correctText: { used: 0, remaining: 3, total: 3 },
        transliterate: { used: 0, remaining: 3, total: 3 },
        documentGenerator: { used: 0, remaining: 3, total: 3 },
      };
    }

    const now = new Date();
    const lastReset = new Date(user.dailyUsage.lastReset);
    const isNewDay = now.toDateString() !== lastReset.toDateString();

    const isPro =
      user.plan === "pro" &&
      user.planExpiry &&
      new Date(user.planExpiry) > new Date();

    const total = isPro ? "∞" : 3;

    const actions = [
      "spellCheck",
      "correctText",
      "transliterate",
      "documentGenerator",
    ];
    const stats = {};

    actions.forEach((action) => {
      const used = isNewDay ? 0 : user.dailyUsage[action] || 0;
      const remaining = isPro ? "∞" : Math.max(0, 3 - used);

      stats[action] = {
        used,
        remaining,
        total,
      };
    });

    return stats;
  };

  return {
    // State
    user,
    isAuthenticated,
    isLoading,
    isSigningUp,
    isLoggingIn,
    error,
    signupError,
    loginError,

    // Actions
    login,
    signup,
    profile,
    logout,

    // Utilities
    canUse,
    useAction,
    getRemainingLimit,
    getPlanStatus,
    checkDailyLimit,
    requireAuth,
    getUsageStats,
  };
};

export default useAuth;
