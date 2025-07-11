// src/utils/authService.js
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4343/api";

// Axios instance for auth
const authClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true, // Cookie support
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - token qo'shish
authClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - token yangilash va xatolarni boshqarish
authClient.interceptors.response.use(
  (response) => {
    // Yangi token olindi
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token yaroqsiz yoki muddati tugagan
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authAPI = {
  // Ro'yxatdan o'tish
  signup: async (userData) => {
    try {
      const response = await authClient.post("/auth/signup", userData);

      if (response.data.success) {
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.data.user));
      }

      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },
};

// History API functions
export const historyAPI = {
  // Tarix olish
  getHistory: async (params = {}) => {
    try {
      const response = await authClient.get("/history", { params });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Bitta tarix elementi
  getHistoryItem: async (id) => {
    try {
      const response = await authClient.get(`/history/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Tarix elementini o'chirish
  deleteHistoryItem: async (id) => {
    try {
      const response = await authClient.delete(`/history/${id}`);
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Ko'p elementlarni o'chirish
  deleteMultipleHistory: async (ids) => {
    try {
      const response = await authClient.delete("/history/multiple", {
        data: { ids },
      });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Barcha tarixni o'chirish
  deleteAllHistory: async (action) => {
    try {
      const params = action ? { action } : {};
      const response = await authClient.delete("/history/clear", { params });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Tarix statistikasi
  getHistoryStats: async () => {
    try {
      const response = await authClient.get("/history/stats");
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Qidirish
  searchHistory: async (params) => {
    try {
      const response = await authClient.get("/history/search", { params });
      return response.data;
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },

  // Eksport qilish
  exportHistory: async (params = {}) => {
    try {
      const response = await authClient.get("/history/export", {
        params,
        responseType: "blob",
      });

      // Faylni yuklab olish
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;

      const contentDisposition = response.headers["content-disposition"];
      let fileName = "history.json";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="(.+)"/);
        if (fileNameMatch) {
          fileName = fileNameMatch[1];
        }
      }

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  },
};

// Utility functions
export const authUtils = {
  // Token mavjudligini tekshirish
  isAuthenticated: () => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    return !!(token && user);
  },

  // Foydalanuvchi ma'lumotlarini olish
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

  // Token olish
  getToken: () => {
    return localStorage.getItem("token");
  },

  // Chiqish
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/login";
  },

  // Telefon raqamini formatlash
  formatPhoneNumber: (phone) => {
    // +998901234567 formatiga keltirish
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

  // Telefon raqamini validatsiya qilish
  validatePhoneNumber: (phone) => {
    const phoneRegex = /^\+998\d{9}$/;
    return phoneRegex.test(phone);
  },

  // Parolni validatsiya qilish
  validatePassword: (password) => {
    return password && password.length >= 6;
  },

  // Limitni tekshirish
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

  // Qolgan limitni hisoblash
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

  // Plan holati
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

// Export auth client ham
export { authClient };
