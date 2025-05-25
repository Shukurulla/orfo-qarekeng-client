import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { spellCheckAPI } from "@/utils/api";

// Async thunks
export const checkText = createAsyncThunk(
  "spellCheck/checkText",
  async ({ text, options = {} }, { rejectWithValue }) => {
    try {
      const response = await spellCheckAPI.checkText(text, options);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Imlo tekshirishda xato"
      );
    }
  }
);

export const checkWord = createAsyncThunk(
  "spellCheck/checkWord",
  async (word, { rejectWithValue }) => {
    try {
      const response = await spellCheckAPI.checkWord(word);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "So'z tekshirishda xato"
      );
    }
  }
);

export const getSuggestions = createAsyncThunk(
  "spellCheck/getSuggestions",
  async ({ word, limit = 5 }, { rejectWithValue }) => {
    try {
      const response = await spellCheckAPI.getSuggestions(word, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Takliflar olishda xato"
      );
    }
  }
);

const initialState = {
  // Asosiy matn
  originalText: "",
  currentText: "",

  // Tekshiruv natijalari
  results: [],
  statistics: null,

  // Loading holatlari
  isChecking: false,
  isCheckingWord: false,
  isLoadingSuggestions: false,

  // Xatolar
  error: null,
  wordError: null,
  suggestionsError: null,

  // UI holatlari
  selectedWordIndex: -1,
  showSuggestions: false,
  highlightErrors: true,
  autoCheck: true,

  // Takliflar
  currentSuggestions: [],
  selectedSuggestionIndex: 0,

  // Tarix
  history: [],
  historyIndex: -1,
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

    updateTextAtPosition: (state, action) => {
      const { start, end, newText } = action.payload;
      const text = state.currentText;
      state.currentText = text.slice(0, start) + newText + text.slice(end);
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
        state.results[wordIndex].isCorrect = true;
        state.results[wordIndex].word = suggestion;
        state.selectedWordIndex = -1;
        state.showSuggestions = false;
      }
    },

    // So'z tanlash
    selectWord: (state, action) => {
      state.selectedWordIndex = action.payload;
      state.showSuggestions = action.payload >= 0;
      state.selectedSuggestionIndex = 0;
    },

    // Takliflar bilan ishlash
    selectNextSuggestion: (state) => {
      if (state.currentSuggestions.length > 0) {
        state.selectedSuggestionIndex =
          (state.selectedSuggestionIndex + 1) % state.currentSuggestions.length;
      }
    },

    selectPrevSuggestion: (state) => {
      if (state.currentSuggestions.length > 0) {
        state.selectedSuggestionIndex =
          state.selectedSuggestionIndex === 0
            ? state.currentSuggestions.length - 1
            : state.selectedSuggestionIndex - 1;
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

    // Xatolarni tozalash
    clearErrors: (state) => {
      state.error = null;
      state.wordError = null;
      state.suggestionsError = null;
    },

    // Hammani tozalash
    clearAll: (state) => {
      state.originalText = "";
      state.currentText = "";
      state.results = [];
      state.statistics = null;
      state.error = null;
      state.selectedWordIndex = -1;
      state.showSuggestions = false;
      state.currentSuggestions = [];
    },

    // Tarixga qo'shish
    addToHistory: (state, action) => {
      const entry = {
        text: action.payload.text,
        results: action.payload.results,
        timestamp: new Date().toISOString(),
      };

      state.history.unshift(entry);
      if (state.history.length > 10) {
        state.history = state.history.slice(0, 10);
      }
      state.historyIndex = 0;
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
        state.results = action.payload.results;
        state.statistics = action.payload.statistics;

        // Tarixga qo'shish
        const entry = {
          text: state.currentText,
          results: action.payload.results,
          statistics: action.payload.statistics,
          timestamp: new Date().toISOString(),
        };

        state.history.unshift(entry);
        if (state.history.length > 10) {
          state.history = state.history.slice(0, 10);
        }
      })
      .addCase(checkText.rejected, (state, action) => {
        state.isChecking = false;
        state.error = action.payload;
      });

    // checkWord
    builder
      .addCase(checkWord.pending, (state) => {
        state.isCheckingWord = true;
        state.wordError = null;
      })
      .addCase(checkWord.fulfilled, (state, action) => {
        state.isCheckingWord = false;
        // Word check natijasini saqlash kerak bo'lsa
      })
      .addCase(checkWord.rejected, (state, action) => {
        state.isCheckingWord = false;
        state.wordError = action.payload;
      });

    // getSuggestions
    builder
      .addCase(getSuggestions.pending, (state) => {
        state.isLoadingSuggestions = true;
        state.suggestionsError = null;
      })
      .addCase(getSuggestions.fulfilled, (state, action) => {
        state.isLoadingSuggestions = false;
        state.currentSuggestions = action.payload.suggestions || [];
      })
      .addCase(getSuggestions.rejected, (state, action) => {
        state.isLoadingSuggestions = false;
        state.suggestionsError = action.payload;
        state.currentSuggestions = [];
      });
  },
});

export const {
  setOriginalText,
  setCurrentText,
  updateTextAtPosition,
  applySuggestion,
  selectWord,
  selectNextSuggestion,
  selectPrevSuggestion,
  setHighlightErrors,
  setAutoCheck,
  closeSuggestions,
  clearErrors,
  clearAll,
  addToHistory,
} = spellCheckSlice.actions;

export default spellCheckSlice.reducer;
