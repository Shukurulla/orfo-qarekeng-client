import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { transliterateAPI } from "@/utils/api";

// Async thunks
export const convertText = createAsyncThunk(
  "transliterate/convertText",
  async ({ text, mode = "auto" }, { rejectWithValue }) => {
    try {
      const response = await transliterateAPI.convertText(text, mode);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Transliteratsiya xatosi"
      );
    }
  }
);

export const detectScript = createAsyncThunk(
  "transliterate/detectScript",
  async (text, { rejectWithValue }) => {
    try {
      const response = await transliterateAPI.detectScript(text);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Alifbo aniqlashda xato"
      );
    }
  }
);

export const batchConvert = createAsyncThunk(
  "transliterate/batchConvert",
  async ({ texts, mode = "auto" }, { rejectWithValue }) => {
    try {
      const response = await transliterateAPI.batchConvert(texts, mode);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || "Batch transliteratsiya xatosi"
      );
    }
  }
);

const initialState = {
  // Asosiy matnlar
  originalText: "",
  convertedText: "",

  // Transliteratsiya ma'lumotlari
  fromScript: null,
  toScript: null,
  detectedScript: null,
  conversionMode: "auto", // auto, toLatin, toCyrillic

  // Loading holatlari
  isConverting: false,
  isDetecting: false,
  isBatchConverting: false,

  // Xatolar
  error: null,
  detectError: null,
  batchError: null,

  // Batch konvertatsiya
  batchResults: [],
  batchSummary: null,

  // Alifbo statistikalari
  scriptStatistics: null,

  // Tarix
  history: [],

  // UI sozlamalari
  showStatistics: false,
  autoDetect: true,
  preserveFormatting: true,
};

const transliterateSlice = createSlice({
  name: "transliterate",
  initialState,
  reducers: {
    // Matn o'zgartirishlar
    setOriginalText: (state, action) => {
      state.originalText = action.payload;
    },

    setConvertedText: (state, action) => {
      state.convertedText = action.payload;
    },

    // Konvertatsiya rejimi
    setConversionMode: (state, action) => {
      state.conversionMode = action.payload;
    },

    // Matnlarni almashtirish
    swapTexts: (state) => {
      const temp = state.originalText;
      state.originalText = state.convertedText;
      state.convertedText = temp;

      // Skriptlarni ham almashtirish
      const tempScript = state.fromScript;
      state.fromScript = state.toScript;
      state.toScript = tempScript;
    },

    // Natijani original matniga ko'chirish
    copyResultToOriginal: (state) => {
      state.originalText = state.convertedText;
    },

    // UI sozlamalari
    setShowStatistics: (state, action) => {
      state.showStatistics = action.payload;
    },

    setAutoDetect: (state, action) => {
      state.autoDetect = action.payload;
    },

    setPreserveFormatting: (state, action) => {
      state.preserveFormatting = action.payload;
    },

    // Xatolarni tozalash
    clearErrors: (state) => {
      state.error = null;
      state.detectError = null;
      state.batchError = null;
    },

    // Batch natijalarini tozalash
    clearBatchResults: (state) => {
      state.batchResults = [];
      state.batchSummary = null;
    },

    // Hammani tozalash
    clearAll: (state) => {
      state.originalText = "";
      state.convertedText = "";
      state.fromScript = null;
      state.toScript = null;
      state.detectedScript = null;
      state.error = null;
      state.batchResults = [];
      state.batchSummary = null;
      state.scriptStatistics = null;
    },

    // Tarixga qo'shish
    addToHistory: (state, action) => {
      const entry = {
        original: action.payload.original,
        converted: action.payload.converted,
        from: action.payload.from,
        to: action.payload.to,
        mode: action.payload.mode,
        timestamp: new Date().toISOString(),
      };

      state.history.unshift(entry);
      if (state.history.length > 20) {
        state.history = state.history.slice(0, 20);
      }
    },

    // Tarixdan yuklash
    loadFromHistory: (state, action) => {
      const entry = state.history[action.payload];
      if (entry) {
        state.originalText = entry.original;
        state.convertedText = entry.converted;
        state.fromScript = entry.from;
        state.toScript = entry.to;
        state.conversionMode = entry.mode;
      }
    },

    // Tarixni tozalash
    clearHistory: (state) => {
      state.history = [];
    },
  },

  extraReducers: (builder) => {
    // convertText
    builder
      .addCase(convertText.pending, (state) => {
        state.isConverting = true;
        state.error = null;
      })
      .addCase(convertText.fulfilled, (state, action) => {
        state.isConverting = false;
        state.convertedText = action.payload.converted;
        state.fromScript = action.payload.from;
        state.toScript = action.payload.to;

        // Tarixga qo'shish
        const entry = {
          original: state.originalText,
          converted: action.payload.converted,
          from: action.payload.from,
          to: action.payload.to,
          mode: action.payload.mode,
          timestamp: new Date().toISOString(),
        };

        state.history.unshift(entry);
        if (state.history.length > 20) {
          state.history = state.history.slice(0, 20);
        }
      })
      .addCase(convertText.rejected, (state, action) => {
        state.isConverting = false;
        state.error = action.payload;
      });

    // detectScript
    builder
      .addCase(detectScript.pending, (state) => {
        state.isDetecting = true;
        state.detectError = null;
      })
      .addCase(detectScript.fulfilled, (state, action) => {
        state.isDetecting = false;
        state.detectedScript = action.payload.detectedScript;
        state.scriptStatistics = action.payload.statistics;
      })
      .addCase(detectScript.rejected, (state, action) => {
        state.isDetecting = false;
        state.detectError = action.payload;
      });

    // batchConvert
    builder
      .addCase(batchConvert.pending, (state) => {
        state.isBatchConverting = true;
        state.batchError = null;
      })
      .addCase(batchConvert.fulfilled, (state, action) => {
        state.isBatchConverting = false;
        state.batchResults = action.payload.results;
        state.batchSummary = action.payload.summary;
      })
      .addCase(batchConvert.rejected, (state, action) => {
        state.isBatchConverting = false;
        state.batchError = action.payload;
      });
  },
});

export const {
  setOriginalText,
  setConvertedText,
  setConversionMode,
  swapTexts,
  copyResultToOriginal,
  setShowStatistics,
  setAutoDetect,
  setPreserveFormatting,
  clearErrors,
  clearBatchResults,
  clearAll,
  addToHistory,
  loadFromHistory,
  clearHistory,
} = transliterateSlice.actions;

export default transliterateSlice.reducer;
