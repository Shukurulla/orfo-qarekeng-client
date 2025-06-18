import axios from "axios";

// Base API configuration
const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || "http://localhost:4343/api";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 sekund (timeout oshirildi)
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - YANGILANGAN
apiClient.interceptors.request.use(
  (config) => {
    // Add timestamp to prevent caching
    config.params = {
      ...config.params,
      _t: Date.now(),
    };

    // Performance monitoring
    config.metadata = { startTime: Date.now() };

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

// Response interceptor - YANGILANGAN
apiClient.interceptors.response.use(
  (response) => {
    // Performance logging
    const duration = Date.now() - response.config.metadata.startTime;
    console.log(
      `✅ API Response: ${response.config.method?.toUpperCase()} ${
        response.config.url
      } - ${response.status} (${duration}ms)`
    );

    // Cache info logging
    if (response.data.fromCache) {
      console.log("💾 Response from cache");
    }

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

// Spell Check API - YANGILANGAN
export const spellCheckAPI = {
  // Matn imlosini tekshirish - OPTIMIZATSIYA QILINGAN
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

  // Avtomatik to'g'rilash - YANGI
  autoCorrect: (text) => {
    return apiClient.post("/check/auto-correct", { text });
  },

  // Cache yangilash
  refreshCache: () => {
    return apiClient.post("/check/refresh-cache");
  },

  // Performance statistikasi - YANGI
  getStats: () => {
    return apiClient.get("/check/stats");
  },
};

// Transliterate API - YANGILANGAN
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

// Helper functions - YANGILANGAN
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

  // Retry mechanism - YAXSHILANGAN
  retry: async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;

        // Exponential backoff
        const backoffDelay = delay * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1} after ${backoffDelay}ms`);

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  },

  // Debounced API call - YANGI
  createDebouncedApiCall: (apiFunction, delay = 300) => {
    let timeoutId;
    return (...args) => {
      return new Promise((resolve, reject) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          try {
            const result = await apiFunction(...args);
            resolve(result);
          } catch (error) {
            reject(error);
          }
        }, delay);
      });
    };
  },

  // Cache wrapper - YANGI
  withCache: (apiFunction, cacheKey, ttl = 300000) => {
    // 5 minut default
    const cache = new Map();

    return async (...args) => {
      const key = `${cacheKey}_${JSON.stringify(args)}`;
      const cached = cache.get(key);

      if (cached && Date.now() - cached.timestamp < ttl) {
        console.log(`💾 Cache hit for ${key}`);
        return cached.data;
      }

      try {
        const result = await apiFunction(...args);
        cache.set(key, {
          data: result,
          timestamp: Date.now(),
        });

        // Cache cleanup (har 100 ta entry dan keyin)
        if (cache.size > 100) {
          const oldestKey = cache.keys().next().value;
          cache.delete(oldestKey);
        }

        return result;
      } catch (error) {
        throw error;
      }
    };
  },

  // Performance monitoring - YANGI
  measurePerformance: (apiFunction, name) => {
    return async (...args) => {
      const startTime = performance.now();
      try {
        const result = await apiFunction(...args);
        const duration = performance.now() - startTime;
        console.log(`⚡ ${name} took ${duration.toFixed(2)}ms`);
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        console.log(`❌ ${name} failed after ${duration.toFixed(2)}ms`);
        throw error;
      }
    };
  },
};

// Optimized API calls - YANGI
export const optimizedAPI = {
  // Debounced spell check
  debouncedSpellCheck: apiHelpers.createDebouncedApiCall(
    spellCheckAPI.checkText,
    500
  ),

  // Cached word suggestions
  cachedSuggestions: apiHelpers.withCache(
    spellCheckAPI.getSuggestions,
    "suggestions",
    600000 // 10 minut
  ),

  // Performance monitored auto-correct
  monitoredAutoCorrect: apiHelpers.measurePerformance(
    spellCheckAPI.autoCorrect,
    "AutoCorrect"
  ),
};

// Export default API client
export default apiClient;
