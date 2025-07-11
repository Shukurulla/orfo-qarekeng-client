// src/store/slices/authSlice.js - TO'LIQ FAYL
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Utility functions
const authUtils = {
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return !!(token && user);
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error("Error parsing user data:", error);
        localStorage.removeItem("user");
      }
    }
    return null;
  },

  formatPhoneNumber: (phone) => {
    let cleaned = phone.replace(/\D/g, "");

    if (cleaned.startsWith("998")) {
      cleaned = "+" + cleaned;
    } else if (cleaned.startsWith("8") && cleaned.length === 9) {
      cleaned = "+998" + cleaned.substring(1);
    } else if (cleaned.length === 9) {
      cleaned = "+998" + cleaned;
    }

    return cleaned;
  },

  checkDailyLimit: (user, action) => {
    if (!user || !user.dailyUsage) return true;

    // Pro plan uchun limit yo'q
    if (
      user.plan === "pro" &&
      user.planExpiry &&
      new Date(user.planExpiry) > new Date()
    ) {
      return true;
    }

    // Start plan uchun limit tekshirish
    const usage = user.dailyUsage[action] || 0;
    return usage < 3;
  },

  getRemainingLimit: (user, action) => {
    if (!user || !user.dailyUsage) return 3;

    // Pro plan uchun cheksiz
    if (
      user.plan === "pro" &&
      user.planExpiry &&
      new Date(user.planExpiry) > new Date()
    ) {
      return "Cheksiz";
    }

    // Start plan uchun qolgan limit
    const usage = user.dailyUsage[action] || 0;
    return Math.max(0, 3 - usage);
  },

  getPlanStatus: (user) => {
    if (!user) return { plan: "start", isActive: false };

    const isPro =
      user.plan === "pro" &&
      user.planExpiry &&
      new Date(user.planExpiry) > new Date();

    return {
      plan: user.plan,
      isActive: isPro,
      expiry: user.planExpiry,
      daysLeft: isPro
        ? Math.ceil(
            (new Date(user.planExpiry) - new Date()) / (1000 * 60 * 60 * 24)
          )
        : 0,
    };
  },
};

// Mock API functions (siz haqiqiy authService.js yaratguncha)
const mockAPI = {
  signup: async (userData) => {
    // Mock signup - haqiqiy API ishlatguncha
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const user = {
      _id: Date.now().toString(),
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber: userData.phoneNumber,
      plan: "start",
      dailyUsage: {
        spellCheck: 0,
        correctText: 0,
        transliterate: 0,
        documentGenerator: 0,
        lastReset: new Date(),
      },
      createdAt: new Date().toISOString(),
    };

    const token = "mock-jwt-token-" + Date.now();
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    return {
      success: true,
      data: { user },
      token,
    };
  },

  login: async (credentials) => {
    // Mock login
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (
      credentials.phoneNumber === "+998901234567" &&
      credentials.password === "password123"
    ) {
      const user = {
        _id: "1",
        firstName: "Test",
        lastName: "User",
        phoneNumber: "+998901234567",
        plan: "start",
        dailyUsage: {
          spellCheck: 1,
          correctText: 0,
          transliterate: 2,
          documentGenerator: 0,
          lastReset: new Date(),
        },
        createdAt: new Date().toISOString(),
      };

      const token = "mock-jwt-token-" + Date.now();
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      return {
        success: true,
        data: { user },
        token,
      };
    }

    return {
      success: false,
      error: "Telefon raqami yoki parol xato",
    };
  },

  logout: async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true };
  },

  getMe: async () => {
    const user = authUtils.getCurrentUser();
    if (user) {
      return {
        success: true,
        data: { user },
      };
    }
    return {
      success: false,
      error: "User not found",
    };
  },
};

// Async thunks
export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const result = await mockAPI.signup(userData);
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const result = await mockAPI.login(credentials);
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      const result = await mockAPI.logout();
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getMe = createAsyncThunk(
  "auth/getMe",
  async (_, { rejectWithValue }) => {
    try {
      const result = await mockAPI.getMe();
      if (!result.success) {
        return rejectWithValue(result.error);
      }
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  // User ma'lumotlari
  user: authUtils.getCurrentUser(),
  isAuthenticated: authUtils.isAuthenticated(),

  // Loading states
  isLoading: false,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdating: false,
  isUpdatingPassword: false,

  // Error states
  error: null,
  signupError: null,
  loginError: null,
  updateError: null,
  passwordError: null,

  // Stats
  stats: null,
  isLoadingStats: false,
  statsError: null,

  // UI states
  showLoginModal: false,
  showSignupModal: false,
  showProfileModal: false,
  redirectAfterLogin: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Error clearing
    clearErrors: (state) => {
      state.error = null;
      state.signupError = null;
      state.loginError = null;
      state.updateError = null;
      state.passwordError = null;
      state.statsError = null;
    },

    // Modal controls
    showLoginModal: (state, action) => {
      state.showLoginModal = true;
      state.redirectAfterLogin = action.payload || null;
    },

    hideLoginModal: (state) => {
      state.showLoginModal = false;
      state.redirectAfterLogin = null;
    },

    showSignupModal: (state) => {
      state.showSignupModal = true;
    },

    hideSignupModal: (state) => {
      state.showSignupModal = false;
    },

    showProfileModal: (state) => {
      state.showProfileModal = true;
    },

    hideProfileModal: (state) => {
      state.showProfileModal = false;
    },

    // User update from localStorage
    syncUserFromStorage: (state) => {
      const user = authUtils.getCurrentUser();
      const isAuthenticated = authUtils.isAuthenticated();

      state.user = user;
      state.isAuthenticated = isAuthenticated;
    },

    // Manual logout
    logoutLocal: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.stats = null;
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    },
  },

  extraReducers: (builder) => {
    // Signup
    builder
      .addCase(signup.pending, (state) => {
        state.isSigningUp = true;
        state.signupError = null;
      })
      .addCase(signup.fulfilled, (state, action) => {
        state.isSigningUp = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.showSignupModal = false;
      })
      .addCase(signup.rejected, (state, action) => {
        state.isSigningUp = false;
        state.signupError = action.payload;
      });

    // Login
    builder
      .addCase(login.pending, (state) => {
        state.isLoggingIn = true;
        state.loginError = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoggingIn = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
        state.showLoginModal = false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoggingIn = false;
        state.loginError = action.payload;
      });

    // Logout
    builder
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.stats = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        // Xato bo'lsa ham logout qilish
        state.user = null;
        state.isAuthenticated = false;
        state.stats = null;
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      });

    // Get me
    builder
      .addCase(getMe.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getMe.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(getMe.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        // Token yaroqsiz bo'lsa logout
        if (
          action.payload?.includes("401") ||
          action.payload?.includes("token")
        ) {
          state.user = null;
          state.isAuthenticated = false;
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      });
  },
});

export const {
  clearErrors,
  showLoginModal,
  hideLoginModal,
  showSignupModal,
  hideSignupModal,
  showProfileModal,
  hideProfileModal,
  syncUserFromStorage,
  logoutLocal,
} = authSlice.actions;

// Export auth utils
export { authUtils };

export default authSlice.reducer;
