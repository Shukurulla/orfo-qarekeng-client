// src/store/slices/spellCheckSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { checkSpelling, correctText } from "@/utils/OrfoAIService";

// Async thunks for Gemini AI
export const checkText = createAsyncThunk(
  "spellCheck/checkText",
  async ({ text, options = {} }, { rejectWithValue }) => {
    try {
      const response = await checkSpelling(text);

      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || "Gemini AI imlo tekshirishda xato"
      );
    }
  }
);

export const correctFullText = createAsyncThunk(
  "spellCheck/correctFullText",
  async (text, { rejectWithValue }) => {
    try {
      const response = await correctText(text);

      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.message || "Gemini AI matnni to'g'irlashda xato"
      );
    }
  }
);

const initialState = {
  // Asosiy matn
  originalText: "",
  currentText: "",
  correctedText: "",

  // Tekshiruv natijalari
  results: [],
  statistics: null,

  // Loading holatlari
  isChecking: false,
  isCorrecting: false,

  // Xatolar
  error: null,
  correctError: null,

  // UI holatlari
  selectedWordIndex: -1,
  showSuggestions: false,
  highlightErrors: true,
  autoCheck: false, // Gemini API expensive bo'lgani uchun avtomatik o'chirildi

  // Takliflar
  currentSuggestions: [],

  // Saqlangan versiyalar
  versions: [],
  currentVersion: 0,

  // Gemini AI specific
  aiProvider: "gemini", // gemini, openai
  processingMode: "batch", // batch, realtime
};

const spellCheckSlice = createSlice({
  name: "spellCheck",
  initialState,
  reducers: {
    // Matn o'zgartirishlar
    setOriginalText: (state, action) => {
      state.originalText = action.payload;
      state.currentText = action.payload;
    },

    setCurrentText: (state, action) => {
      state.currentText = action.payload;
    },

    // Takliflarni qo'llash
    applySuggestion: (state, action) => {
      const { wordIndex, suggestion } = action.payload;
      if (state.results[wordIndex]) {
        const result = state.results[wordIndex];
        const text = state.currentText;

        // Word replacement with regex for better accuracy
        const wordRegex = new RegExp(
          `\\b${result.word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
          "g"
        );
        const newText = text.replace(wordRegex, suggestion);

        state.currentText = newText;
        state.originalText = newText;

        // Mark result as correct
        state.results[wordIndex].isCorrect = true;
        state.results[wordIndex].word = suggestion;

        state.selectedWordIndex = -1;
        state.showSuggestions = false;
      }
    },

    // So'z tanlash
    selectWord: (state, action) => {
      const wordIndex = action.payload;
      state.selectedWordIndex = wordIndex;
      state.showSuggestions = wordIndex >= 0;

      if (wordIndex >= 0 && state.results[wordIndex]) {
        state.currentSuggestions = state.results[wordIndex].suggestions || [];
      }
    },

    // UI sozlamalari
    setHighlightErrors: (state, action) => {
      state.highlightErrors = action.payload;
    },

    setAutoCheck: (state, action) => {
      state.autoCheck = action.payload;
    },

    setAiProvider: (state, action) => {
      state.aiProvider = action.payload;
    },

    setProcessingMode: (state, action) => {
      state.processingMode = action.payload;
    },

    // Takliflarni yopish
    closeSuggestions: (state) => {
      state.showSuggestions = false;
      state.selectedWordIndex = -1;
      state.currentSuggestions = [];
    },

    // To'g'irlangan matinni qabul qilish
    acceptCorrectedText: (state) => {
      if (state.correctedText) {
        // Eski versiyani saqlash
        state.versions.push({
          text: state.currentText,
          timestamp: new Date().toISOString(),
          type: "original",
          aiProvider: state.aiProvider,
        });

        state.currentText = state.correctedText;
        state.originalText = state.correctedText;
        state.correctedText = "";
        state.results = [];
        state.statistics = null;
        state.currentVersion = state.versions.length;
      }
    },

    // Versiyaga qaytish
    revertToVersion: (state, action) => {
      const versionIndex = action.payload;
      if (state.versions[versionIndex]) {
        state.currentText = state.versions[versionIndex].text;
        state.originalText = state.versions[versionIndex].text;
        state.currentVersion = versionIndex;
        state.results = [];
        state.statistics = null;
      }
    },

    // Xatolarni tozalash
    clearErrors: (state) => {
      state.error = null;
      state.correctError = null;
    },

    // Hammani tozalash
    clearAll: (state) => {
      state.originalText = "";
      state.currentText = "";
      state.correctedText = "";
      state.results = [];
      state.statistics = null;
      state.error = null;
      state.correctError = null;
      state.selectedWordIndex = -1;
      state.showSuggestions = false;
      state.currentSuggestions = [];
      state.versions = [];
      state.currentVersion = 0;
    },

    // Performance tracking
    addPerformanceMetric: (state, action) => {
      const { operation, duration, tokensUsed, success } = action.payload;
      if (!state.performanceMetrics) {
        state.performanceMetrics = [];
      }
      state.performanceMetrics.push({
        operation,
        duration,
        tokensUsed,
        success,
        timestamp: new Date().toISOString(),
        aiProvider: state.aiProvider,
      });

      // Keep only last 50 metrics
      if (state.performanceMetrics.length > 50) {
        state.performanceMetrics = state.performanceMetrics.slice(-50);
      }
    },
  },

  extraReducers: (builder) => {
    // checkText with Gemini
    builder
      .addCase(checkText.pending, (state) => {
        state.isChecking = true;
        state.error = null;
      })
      .addCase(checkText.fulfilled, (state, action) => {
        state.isChecking = false;
        state.results = action.payload.results || [];
        state.statistics = action.payload.statistics;

        // Add performance metric
        if (action.meta.startTime) {
          const duration = Date.now() - action.meta.startTime;
          spellCheckSlice.caseReducers.addPerformanceMetric(state, {
            payload: {
              operation: "spellCheck",
              duration,
              success: true,
            },
          });
        }
      })
      .addCase(checkText.rejected, (state, action) => {
        state.isChecking = false;
        state.error = action.payload;

        // Add error metric
        if (action.meta.startTime) {
          const duration = Date.now() - action.meta.startTime;
          spellCheckSlice.caseReducers.addPerformanceMetric(state, {
            payload: {
              operation: "spellCheck",
              duration,
              success: false,
            },
          });
        }
      });

    // correctFullText with Gemini
    builder
      .addCase(correctFullText.pending, (state) => {
        state.isCorrecting = true;
        state.correctError = null;
      })
      .addCase(correctFullText.fulfilled, (state, action) => {
        state.isCorrecting = false;
        state.correctedText = action.payload.corrected;

        // Add performance metric
        if (action.meta.startTime) {
          const duration = Date.now() - action.meta.startTime;
          spellCheckSlice.caseReducers.addPerformanceMetric(state, {
            payload: {
              operation: "autoCorrect",
              duration,
              success: true,
            },
          });
        }
      })
      .addCase(correctFullText.rejected, (state, action) => {
        state.isCorrecting = false;
        state.correctError = action.payload;

        // Add error metric
        if (action.meta.startTime) {
          const duration = Date.now() - action.meta.startTime;
          spellCheckSlice.caseReducers.addPerformanceMetric(state, {
            payload: {
              operation: "autoCorrect",
              duration,
              success: false,
            },
          });
        }
      });
  },
});

export const {
  setOriginalText,
  setCurrentText,
  applySuggestion,
  selectWord,
  setHighlightErrors,
  setAutoCheck,
  setAiProvider,
  setProcessingMode,
  closeSuggestions,
  acceptCorrectedText,
  revertToVersion,
  clearErrors,
  clearAll,
  addPerformanceMetric,
} = spellCheckSlice.actions;

export default spellCheckSlice.reducer;
