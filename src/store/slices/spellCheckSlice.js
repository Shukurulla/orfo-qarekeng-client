// src/store/slices/spellCheckSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { checkSpelling, correctText } from "@/utils/chatgptService";

// Async thunks
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
      return rejectWithValue(error.message || "Imlo tekshirishda xato");
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
      return rejectWithValue(error.message || "Matnni to'g'irlashda xato");
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
  autoCheck: false, // ChatGPT API expensive bo'lgani uchun avtomatik o'chirildi

  // Takliflar
  currentSuggestions: [],

  // Saqlangan versiyalar
  versions: [],
  currentVersion: 0,
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
        const newText =
          text.slice(0, result.start) + suggestion + text.slice(result.end);

        state.currentText = newText;

        // Natijalarni yangilash
        const lengthDiff = suggestion.length - result.word.length;
        state.results[wordIndex].isCorrect = true;
        state.results[wordIndex].word = suggestion;

        // Keyingi so'zlarning pozitsiyasini yangilash
        for (let i = wordIndex + 1; i < state.results.length; i++) {
          state.results[i].start += lengthDiff;
          state.results[i].end += lengthDiff;
        }

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
  },

  extraReducers: (builder) => {
    // checkText
    builder
      .addCase(checkText.pending, (state) => {
        state.isChecking = true;
        state.error = null;
      })
      .addCase(checkText.fulfilled, (state, action) => {
        state.isChecking = false;
        state.results = action.payload.results || [];
        state.statistics = action.payload.statistics;
      })
      .addCase(checkText.rejected, (state, action) => {
        state.isChecking = false;
        state.error = action.payload;
      });

    // correctFullText
    builder
      .addCase(correctFullText.pending, (state) => {
        state.isCorrecting = true;
        state.correctError = null;
      })
      .addCase(correctFullText.fulfilled, (state, action) => {
        state.isCorrecting = false;
        state.correctedText = action.payload.corrected;
      })
      .addCase(correctFullText.rejected, (state, action) => {
        state.isCorrecting = false;
        state.correctError = action.payload;
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
  closeSuggestions,
  acceptCorrectedText,
  revertToVersion,
  clearErrors,
  clearAll,
} = spellCheckSlice.actions;

export default spellCheckSlice.reducer;
