// src/store/slices/authSlice.js - TO'LIQ TUZATILGAN VERSIYA
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// API base URL
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4343/api";

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
    if (!phone || typeof phone !== "string") {
      return "";
    }

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

    const now = new Date();
    const lastReset = new Date(user.dailyUsage.lastReset);

    // Agar yangi kun bo'lsa, limitni reset qilish
    if (now.toDateString() !== lastReset.toDateString()) {
      return true; // Yangi kun, limit reset
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
      return "∞";
    }

    const now = new Date();
    const lastReset = new Date(user.dailyUsage.lastReset);

    // Agar yangi kun bo'lsa, limitni reset qilish
    if (now.toDateString() !== lastReset.toDateString()) {
      return 3; // Yangi kun, to'liq limit
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

// API functions
const authAPI = {
  signup: async (userData) => {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ro'yxatdan o'tishda xato");
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
    }

    return data;
  },

  login: async (credentials) => {
    console.log("Login request to:", `${API_BASE_URL}/auth/login`);
    console.log("Login credentials:", credentials);

    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    console.log("Login response:", data);

    if (!response.ok) {
      throw new Error(data.error || "Kirishda xato");
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.data.user));
    }

    return data;
  },

  logout: async () => {
    const token = localStorage.getItem("token");

    if (token) {
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Logout API error:", error);
      }
    }

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return { success: true };
  },

  getMe: async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      throw new Error("Token not found");
    }

    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Ma'lumot olishda xato");
    }

    localStorage.setItem("user", JSON.stringify(data.data.user));
    return data;
  },

  updateMe: async (userData) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/auth/update-me`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Yangilashda xato");
    }

    localStorage.setItem("user", JSON.stringify(data.data.user));
    return data;
  },

  updatePassword: async (passwordData) => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/auth/update-password`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(passwordData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Parol yangilashda xato");
    }

    if (data.token) {
      localStorage.setItem("token", data.token);
    }

    return data;
  },

  getStats: async () => {
    const token = localStorage.getItem("token");

    const response = await fetch(`${API_BASE_URL}/auth/stats`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Statistika olishda xato");
    }

    return data;
  },
};

// Async thunks
export const signup = createAsyncThunk(
  "auth/signup",
  async (userData, { rejectWithValue }) => {
    try {
      const result = await authAPI.signup(userData);
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
      const result = await authAPI.login(credentials);
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
      const result = await authAPI.logout();
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
      const result = await authAPI.getMe();
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateMe = createAsyncThunk(
  "auth/updateMe",
  async (userData, { rejectWithValue }) => {
    try {
      const result = await authAPI.updateMe(userData);
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePassword = createAsyncThunk(
  "auth/updatePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const result = await authAPI.updatePassword(passwordData);
      return result;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const getStats = createAsyncThunk(
  "auth/getStats",
  async (_, { rejectWithValue }) => {
    try {
      const result = await authAPI.getStats();
      return result.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Local usage update thunk
export const updateLocalUsage = createAsyncThunk(
  "auth/updateLocalUsage",
  async (action, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const user = auth.user;

      if (!user) {
        return rejectWithValue("User not found");
      }

      const now = new Date();
      const lastReset = new Date(user.dailyUsage.lastReset);

      // Reset if new day
      let updatedUsage = { ...user.dailyUsage };
      if (now.toDateString() !== lastReset.toDateString()) {
        updatedUsage = {
          spellCheck: 0,
          correctText: 0,
          transliterate: 0,
          documentGenerator: 0,
          lastReset: now.toISOString(),
        };
      }

      // Increment the specific action
      updatedUsage[action] = (updatedUsage[action] || 0) + 1;

      const updatedUser = {
        ...user,
        dailyUsage: updatedUsage,
      };

      // Update localStorage
      localStorage.setItem("user", JSON.stringify(updatedUser));

      return { user: updatedUser };
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
      state.loginError = null;
    },

    showSignupModal: (state) => {
      state.showSignupModal = true;
    },

    hideSignupModal: (state) => {
      state.showSignupModal = false;
      state.signupError = null;
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

    // Real-time usage decrement
    decrementLimit: (state, action) => {
      const actionType = action.payload;
      if (state.user && state.user.dailyUsage) {
        const now = new Date();
        const lastReset = new Date(state.user.dailyUsage.lastReset);

        // Reset if new day
        if (now.toDateString() !== lastReset.toDateString()) {
          state.user.dailyUsage = {
            spellCheck: 0,
            correctText: 0,
            transliterate: 0,
            documentGenerator: 0,
            lastReset: now.toISOString(),
          };
        }

        // Increment usage
        state.user.dailyUsage[actionType] =
          (state.user.dailyUsage[actionType] || 0) + 1;

        // Update localStorage
        localStorage.setItem("user", JSON.stringify(state.user));
      }
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

    // Update me
    builder
      .addCase(updateMe.pending, (state) => {
        state.isUpdating = true;
        state.updateError = null;
      })
      .addCase(updateMe.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.user = action.payload.user;
      })
      .addCase(updateMe.rejected, (state, action) => {
        state.isUpdating = false;
        state.updateError = action.payload;
      });

    // Update password
    builder
      .addCase(updatePassword.pending, (state) => {
        state.isUpdatingPassword = true;
        state.passwordError = null;
      })
      .addCase(updatePassword.fulfilled, (state) => {
        state.isUpdatingPassword = false;
      })
      .addCase(updatePassword.rejected, (state, action) => {
        state.isUpdatingPassword = false;
        state.passwordError = action.payload;
      });

    // Get stats
    builder
      .addCase(getStats.pending, (state) => {
        state.isLoadingStats = true;
        state.statsError = null;
      })
      .addCase(getStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.stats = action.payload;
      })
      .addCase(getStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.statsError = action.payload;
      });

    // Update local usage
    builder
      .addCase(updateLocalUsage.fulfilled, (state, action) => {
        state.user = action.payload.user;
      })
      .addCase(updateLocalUsage.rejected, (state, action) => {
        console.error("Failed to update local usage:", action.payload);
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
  decrementLimit,
  logoutLocal,
} = authSlice.actions;

// Export auth utils
export { authUtils };

export default authSlice.reducer;
