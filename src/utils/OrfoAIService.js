// src/utils/OrfoAIService.js - UPDATED FOR BACKEND API

import axios from "axios";

// Backend API configuration
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4343/api";

// Axios instance for API calls
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60 seconds
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
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
      `❌ API Response Error:`,
      error.response?.data || error.message
    );

    if (!error.response) {
      return Promise.reject({
        message: "Network error. Please check your internet connection.",
        type: "network",
      });
    }

    switch (error.response.status) {
      case 429:
        return Promise.reject({
          message: "Too many requests. Please wait a moment.",
          type: "rate_limit",
        });
      case 500:
        return Promise.reject({
          message: "Server error. Please try again later.",
          type: "server_error",
        });
      case 503:
        return Promise.reject({
          message: "Service temporarily unavailable.",
          type: "service_unavailable",
        });
      default:
        return Promise.reject(error);
    }
  }
);

// Local script detection function (still needed for frontend)
export const detectScript = (text) => {
  const cyrillicCount = (text.match(/[а-яәғқңөүһҳ]/gi) || []).length;
  const latinCount = (text.match(/[a-zәğqńöüşıĞQŃÖÜŞI]/gi) || []).length;
  const totalLetters = cyrillicCount + latinCount;

  if (totalLetters === 0) return "unknown";

  if (cyrillicCount > latinCount) return "cyrillic";
  if (latinCount > cyrillicCount) return "latin";
  return "mixed";
};

// API Functions

// Spell checking
export const checkSpelling = async (text, options = {}) => {
  try {
    const { language = "uz", script } = options;

    const response = await apiClient.post("/spell-check", {
      text,
      language,
      script: script || detectScript(text),
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Spell check error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error || error.message || "Spell check failed",
    };
  }
};

// Text correction
export const correctText = async (text, options = {}) => {
  try {
    const { language = "uz", script } = options;

    const response = await apiClient.post("/correct-text", {
      text,
      language,
      script: script || detectScript(text),
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Text correction error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Text correction failed",
    };
  }
};

// Transliteration
export const transliterate = async (text, targetScript, options = {}) => {
  try {
    const { language = "kaa" } = options;

    const response = await apiClient.post("/transliterate", {
      text,
      targetScript,
      language,
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Transliteration error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Transliteration failed",
    };
  }
};

// Auto transliteration
export const autoTransliterate = async (text, options = {}) => {
  try {
    const { language = "kaa" } = options;

    const response = await apiClient.post("/auto-transliterate", {
      text,
      language,
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Auto transliteration error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Auto transliteration failed",
    };
  }
};

// Text improvement
export const improveText = async (text, options = {}) => {
  try {
    const {
      language = "uz",
      script = "latin",
      style = "professional",
      level = 3,
    } = options;

    const response = await apiClient.post("/improve-text", {
      text,
      language,
      script,
      style,
      level,
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Text improvement error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Text improvement failed",
    };
  }
};

// Song generation
export const generateSong = async (options = {}) => {
  try {
    const {
      topic,
      style = "classik",
      language = "uz",
      script = "latin",
      conditions = "",
    } = options;

    if (!topic || !topic.trim()) {
      return {
        success: false,
        error: "Topic is required for song generation",
      };
    }

    const response = await apiClient.post("/generate-song", {
      topic,
      style,
      language,
      script,
      conditions,
    });

    return {
      success: true,
      data: response.data.data,
    };
  } catch (error) {
    console.error("Song generation error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Song generation failed",
    };
  }
};

// Test API connection
export const testConnection = async () => {
  try {
    const response = await apiClient.get("/test-connection");
    return response.data;
  } catch (error) {
    console.error("Connection test error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error ||
        error.message ||
        "Connection test failed",
    };
  }
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await apiClient.get("/health");
    return response.data;
  } catch (error) {
    console.error("Health check error:", error);
    return {
      success: false,
      error:
        error.response?.data?.error || error.message || "Health check failed",
    };
  }
};

// Helper functions
export const apiHelpers = {
  // Format error messages
  formatError: (error) => {
    if (typeof error === "string") return error;
    if (error?.response?.data?.error) return error.response.data.error;
    if (error?.message) return error.message;
    return "Unknown error occurred";
  },

  // Create abort controller for request cancellation
  createAbortController: () => {
    return new AbortController();
  },

  // Retry mechanism
  retry: async (fn, retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === retries - 1) throw error;

        const backoffDelay = delay * Math.pow(2, i);
        console.log(`Retry attempt ${i + 1} after ${backoffDelay}ms`);

        await new Promise((resolve) => setTimeout(resolve, backoffDelay));
      }
    }
  },

  // Debounced API call
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
};

// Optimized API calls
export const optimizedAPI = {
  // Debounced spell check
  debouncedSpellCheck: apiHelpers.createDebouncedApiCall(checkSpelling, 500),

  // Retry wrapper for important operations
  retrySpellCheck: (text, options = {}) =>
    apiHelpers.retry(() => checkSpelling(text, options), 3, 1000),

  retryCorrectText: (text, options = {}) =>
    apiHelpers.retry(() => correctText(text, options), 3, 1000),

  retryTransliterate: (text, targetScript, options = {}) =>
    apiHelpers.retry(() => transliterate(text, targetScript, options), 3, 1000),
};

// Batch operations (if needed)
export const batchOperations = {
  // Batch spell check multiple texts
  batchCheckSpelling: async (texts, options = {}) => {
    const results = [];

    for (const text of texts) {
      try {
        const result = await checkSpelling(text, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          text: text,
        });
      }
    }

    return {
      success: true,
      data: results,
    };
  },

  // Batch transliteration
  batchTransliterate: async (texts, targetScript, options = {}) => {
    const results = [];

    for (const text of texts) {
      try {
        const result = await transliterate(text, targetScript, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          error: error.message,
          text: text,
        });
      }
    }

    return {
      success: true,
      data: results,
    };
  },
};

// Export main API client
export { apiClient };

// Default export
export default {
  checkSpelling,
  correctText,
  transliterate,
  autoTransliterate,
  improveText,
  generateSong,
  testConnection,
  healthCheck,
  detectScript,
  apiHelpers,
  optimizedAPI,
  batchOperations,
};
