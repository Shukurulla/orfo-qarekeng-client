// src/hooks/useAuth.js
import { useAppSelector, useAppDispatch } from "./redux";
import {
  showLoginModal,
  showSignupModal,
  showProfileModal,
  logoutLocal,
  authUtils,
} from "../store/slices/AuthSlice";

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

  // Utility functions
  const canUse = (feature) => {
    if (!isAuthenticated || !user) return false;
    return authUtils.checkDailyLimit(user, feature);
  };

  const getRemainingLimit = (feature) => {
    if (!isAuthenticated || !user) return 0;
    return authUtils.getRemainingLimit(user, feature);
  };

  const getPlanStatus = () => {
    if (!user) return { plan: "start", isActive: false };
    return authUtils.getPlanStatus(user);
  };

  const requireAuth = (callback, redirectPath) => {
    if (isAuthenticated) {
      callback?.();
    } else {
      login(redirectPath);
    }
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
    getRemainingLimit,
    getPlanStatus,
    requireAuth,
  };
};

export default useAuth;
