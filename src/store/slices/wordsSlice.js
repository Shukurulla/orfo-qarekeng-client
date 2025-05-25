import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { wordsAPI } from "@/utils/api";

// Async thunks
export const fetchWords = createAsyncThunk(
  "words/fetchWords",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await wordsAPI.getWords(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "So'zlar olishda xato"
      );
    }
  }
);

export const fetchWordStats = createAsyncThunk(
  "words/fetchWordStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await wordsAPI.getStats();
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Statistika olishda xato"
      );
    }
  }
);

export const searchWords = createAsyncThunk(
  "words/searchWords",
  async ({ query, params = {} }, { rejectWithValue }) => {
    try {
      const response = await wordsAPI.searchWords(query, params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || "Qidirishda xato");
    }
  }
);

export const validateWords = createAsyncThunk(
  "words/validateWords",
  async (words, { rejectWithValue }) => {
    try {
      const response = await wordsAPI.validateWords(words);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "So'zlar tekshirishda xato"
      );
    }
  }
);

export const getRandomWords = createAsyncThunk(
  "words/getRandomWords",
  async ({ count = 10, type = null }, { rejectWithValue }) => {
    try {
      const response = await wordsAPI.getRandomWords(count, type);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Tasodifiy so'zlar olishda xato"
      );
    }
  }
);

const initialState = {
  // So'zlar ro'yxati
  words: [],
  totalCount: 0,

  // Pagination
  currentPage: 1,
  totalPages: 0,
  limit: 50,
  hasNext: false,
  hasPrev: false,

  // Filters
  filters: {
    type: null, // kiril, lotin, mixed
    search: "",
    sortBy: "word",
    sortOrder: "asc",
    category: null,
  },

  // Loading states
  isLoading: false,
  isLoadingStats: false,
  isSearching: false,
  isValidating: false,
  isLoadingRandom: false,

  // Errors
  error: null,
  statsError: null,
  searchError: null,
  validateError: null,
  randomError: null,

  // Statistics
  statistics: null,

  // Search results
  searchResults: [],
  searchQuery: "",
  searchCount: 0,

  // Validation results
  validationResults: [],
  validationSummary: null,

  // Random words
  randomWords: [],

  // Selected words (for bulk operations)
  selectedWords: [],

  // View mode
  viewMode: "list", // list, grid, table

  // Export
  isExporting: false,
  exportError: null,
};

const wordsSlice = createSlice({
  name: "words",
  initialState,
  reducers: {
    // Filters
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
      state.currentPage = 1; // Reset page when filters change
    },

    setSearchFilter: (state, action) => {
      state.filters.search = action.payload;
      state.currentPage = 1;
    },

    setTypeFilter: (state, action) => {
      state.filters.type = action.payload;
      state.currentPage = 1;
    },

    setSortFilter: (state, action) => {
      state.filters.sortBy = action.payload.sortBy;
      state.filters.sortOrder = action.payload.sortOrder;
      state.currentPage = 1;
    },

    // Pagination
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },

    setLimit: (state, action) => {
      state.limit = action.payload;
      state.currentPage = 1;
    },

    // Selected words
    selectWord: (state, action) => {
      const wordId = action.payload;
      if (!state.selectedWords.includes(wordId)) {
        state.selectedWords.push(wordId);
      }
    },

    deselectWord: (state, action) => {
      const wordId = action.payload;
      state.selectedWords = state.selectedWords.filter((id) => id !== wordId);
    },

    selectAllWords: (state) => {
      state.selectedWords = state.words.map((word) => word._id);
    },

    deselectAllWords: (state) => {
      state.selectedWords = [];
    },

    toggleWordSelection: (state, action) => {
      const wordId = action.payload;
      if (state.selectedWords.includes(wordId)) {
        state.selectedWords = state.selectedWords.filter((id) => id !== wordId);
      } else {
        state.selectedWords.push(wordId);
      }
    },

    // View mode
    setViewMode: (state, action) => {
      state.viewMode = action.payload;
    },

    // Clear search
    clearSearch: (state) => {
      state.searchResults = [];
      state.searchQuery = "";
      state.searchCount = 0;
      state.searchError = null;
    },

    // Clear validation
    clearValidation: (state) => {
      state.validationResults = [];
      state.validationSummary = null;
      state.validateError = null;
    },

    // Clear random words
    clearRandomWords: (state) => {
      state.randomWords = [];
      state.randomError = null;
    },

    // Clear errors
    clearErrors: (state) => {
      state.error = null;
      state.statsError = null;
      state.searchError = null;
      state.validateError = null;
      state.randomError = null;
      state.exportError = null;
    },

    // Reset filters
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.currentPage = 1;
    },

    // Clear all
    clearAll: (state) => {
      state.words = [];
      state.searchResults = [];
      state.validationResults = [];
      state.randomWords = [];
      state.selectedWords = [];
      state.error = null;
      state.currentPage = 1;
    },
  },

  extraReducers: (builder) => {
    // fetchWords
    builder
      .addCase(fetchWords.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWords.fulfilled, (state, action) => {
        state.isLoading = false;
        state.words = action.payload.words;
        state.totalCount = action.payload.pagination.totalCount;
        state.currentPage = action.payload.pagination.currentPage;
        state.totalPages = action.payload.pagination.totalPages;
        state.hasNext = action.payload.pagination.hasNext;
        state.hasPrev = action.payload.pagination.hasPrev;
        state.limit = action.payload.pagination.limit;
      })
      .addCase(fetchWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });

    // fetchWordStats
    builder
      .addCase(fetchWordStats.pending, (state) => {
        state.isLoadingStats = true;
        state.statsError = null;
      })
      .addCase(fetchWordStats.fulfilled, (state, action) => {
        state.isLoadingStats = false;
        state.statistics = action.payload.statistics;
      })
      .addCase(fetchWordStats.rejected, (state, action) => {
        state.isLoadingStats = false;
        state.statsError = action.payload;
      });

    // searchWords
    builder
      .addCase(searchWords.pending, (state) => {
        state.isSearching = true;
        state.searchError = null;
      })
      .addCase(searchWords.fulfilled, (state, action) => {
        state.isSearching = false;
        state.searchResults = action.payload.results;
        state.searchQuery = action.payload.query;
        state.searchCount = action.payload.count;
      })
      .addCase(searchWords.rejected, (state, action) => {
        state.isSearching = false;
        state.searchError = action.payload;
      });

    // validateWords
    builder
      .addCase(validateWords.pending, (state) => {
        state.isValidating = true;
        state.validateError = null;
      })
      .addCase(validateWords.fulfilled, (state, action) => {
        state.isValidating = false;
        state.validationResults = action.payload.results;
        state.validationSummary = action.payload.summary;
      })
      .addCase(validateWords.rejected, (state, action) => {
        state.isValidating = false;
        state.validateError = action.payload;
      });

    // getRandomWords
    builder
      .addCase(getRandomWords.pending, (state) => {
        state.isLoadingRandom = true;
        state.randomError = null;
      })
      .addCase(getRandomWords.fulfilled, (state, action) => {
        state.isLoadingRandom = false;
        state.randomWords = action.payload.words;
      })
      .addCase(getRandomWords.rejected, (state, action) => {
        state.isLoadingRandom = false;
        state.randomError = action.payload;
      });
  },
});

export const {
  setFilters,
  setSearchFilter,
  setTypeFilter,
  setSortFilter,
  setCurrentPage,
  setLimit,
  selectWord,
  deselectWord,
  selectAllWords,
  deselectAllWords,
  toggleWordSelection,
  setViewMode,
  clearSearch,
  clearValidation,
  clearRandomWords,
  clearErrors,
  resetFilters,
  clearAll,
} = wordsSlice.actions;

export default wordsSlice.reducer;
