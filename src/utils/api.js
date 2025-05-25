import axios from "axios";

// Base API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };

    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${
        response.config.url
      } - ${response.status}`
    );
    return response;
  },
  (error) => {
    console.error(
      `❌ API Response Error: ${error.config?.method?.toUpperCase()} ${
        error.config?.url
      }`,
      error.response?.data || error.message
    );

    // Handle network errors
    if (!error.response) {
      return Promise.reject({
        message: "Tarmoq xatosi. Internet aloqasini tekshiring.",
        type: "network",
      });
    }

    // Handle specific status codes
    switch (error.response.status) {
      case 429:
        return Promise.reject({
          message: "Juda ko'p so'rov yuborildi. Biroz kuting.",
          type: "rate_limit",
        });
      case 500:
        return Promise.reject({
          message: "Server xatosi. Keyinroq urinib ko'ring.",
          type: "server_error",
        });
      case 503:
        return Promise.reject({
          message: "Xizmat vaqtincha mavjud emas.",
          type: "service_unavailable",
        });
      default:
        return Promise.reject(error);
    }
  }
);

// Spell Check API
export const spellCheckAPI = {
  // Matn imlosini tekshirish
  checkText: (text, options = {}) => {
    return apiClient.post("/check", { text, options });
  },

  // Bitta so'zni tekshirish
  checkWord: (word) => {
    return apiClient.post("/check/word", { word });
  },

  // Takliflar olish
  getSuggestions: (word, limit = 5) => {
    return apiClient.get(`/check/suggestions/${encodeURIComponent(word)}`, {
      params: { limit },
    });
  },

  // Ko'p so'zlarni bir vaqtda tekshirish
  batchCheck: (words) => {
    return apiClient.post("/check/batch", { words });
  },

  // Cache yangilash
  refreshCache: () => {
    return apiClient.post("/check/refresh-cache");
  },
};

// Transliterate API
export const transliterateAPI = {
  // Matnni transliteratsiya qilish
  convertText: (text, mode = "auto") => {
    return apiClient.post("/convert", { text, mode });
  },

  // Alifbo turini aniqlash
  detectScript: (text) => {
    return apiClient.post("/convert/detect", { text });
  },

  // Ko'p matnlarni transliteratsiya qilish
  batchConvert: (texts, mode = "auto") => {
    return apiClient.post("/convert/batch", { texts, mode });
  },

  // Test uchun
  getTest: () => {
    return apiClient.get("/convert/test");
  },
};

// Words API
export const wordsAPI = {
  // So'zlar ro'yxatini olish
  getWords: (params = {}) => {
    return apiClient.get("/words", { params });
  },

  // Statistika olish
  getStats: () => {
    return apiClient.get("/words/stats");
  },

  // So'z qidirish
  searchWords: (query, params = {}) => {
    return apiClient.get(`/words/search/${encodeURIComponent(query)}`, {
      params,
    });
  },

  // So'zlarni tekshirish
  validateWords: (words) => {
    return apiClient.post("/words/validate", { words });
  },

  // Tasodifiy so'zlar
  getRandomWords: (count = 10, type = null) => {
    const params = { count };
    if (type) params.type = type;
    return apiClient.get("/words/random", { params });
  },

  // Eksport
  exportWords: (type = null, format = "json") => {
    const params = { format };
    if (type) params.type = type;
    return apiClient.get("/words/export", { params });
  },
};

// Health check
export const healthAPI = {
  check: () => {
    return apiClient.get("/health");
  },
};

// Helper functions
export const apiHelpers = {
  // Xato xabarini formatlash
  formatError: (error) => {
    if (typeof error === "string") return error;
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.message) return error.message;
    return "Noma'lum xato yuz berdi";
  },

  // So'rov bekor qilish uchun AbortController yaratish
  createAbortController: () => {
    return new AbortController();
  },

  // Fayl yuklash uchun FormData yaratish
  createFormData: (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== null && data[key] !== undefined) {
        formData.append(key, data[key]);
      }
    });
    return formData;
  },

  // URL parametrlarini yaratish
  createUrlParams: (params) => {
    const urlParams = new URLSearchParams();
    Object.keys(params).forEach((key) => {
      if (
        params[key] !== null &&
        params[key] !== undefined &&
        params[key] !== ""
      ) {
        urlParams.append(key, params[key]);
      }
    });
    return urlParams.toString();
  },

  // Retry mechanism
  retry: async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, delay * Math.pow(2, i))
        );
      }
    }
  },
};

// Export default API client
export default apiClient;
