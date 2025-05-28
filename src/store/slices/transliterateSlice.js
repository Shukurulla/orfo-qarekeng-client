// src/store/slices/transliterateSlice.js

import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  transliterate,
  autoTransliterate,
  detectScript,
} from "@/utils/chatgptService";

// Async thunks
export const convertText = createAsyncThunk(
  "transliterate/convertText",
  async ({ text, mode = "auto" }, { rejectWithValue }) => {
    try {
      let response;

      if (mode === "auto") {
        response = await autoTransliterate(text);
      } else {
        const targetScript = mode === "toLatin" ? "latin" : "cyrillic";
        response = await transliterate(text, targetScript);
      }

      if (!response.success) {
        return rejectWithValue(response.error);
      }

      return {
        ...response.data,
        mode: mode,
      };
    } catch (error) {
      return rejectWithValue(error.message || "Transliteratsiya xatosi");
    }
  }
);

export const detectTextScript = createAsyncThunk(
  "transliterate/detectScript",
  async (text, { rejectWithValue }) => {
    try {
      const script = detectScript(text);

      // Statistika hisoblash
      const cyrillicCount = (text.match(/[а-яәғқңөүһ]/gi) || []).length;
      const latinCount = (text.match(/[a-zәğqńöüşi]/gi) || []).length;
      const totalLetters = cyrillicCount + latinCount;

      return {
        detectedScript: script,
        statistics: {
          cyrillic: {
            count: cyrillicCount,
            percentage:
              totalLetters > 0
                ? ((cyrillicCount / totalLetters) * 100).toFixed(1)
                : 0,
          },
          latin: {
            count: latinCount,
            percentage:
              totalLetters > 0
                ? ((latinCount / totalLetters) * 100).toFixed(1)
                : 0,
          },
          total: totalLetters,
        },
      };
    } catch (error) {
      return rejectWithValue(error.message || "Alifbo aniqlashda xato");
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

  // Xatolar
  error: null,
  detectError: null,

  // Alifbo statistikalari
  scriptStatistics: null,

  // Tarix
  history: [],

  // UI sozlamalari
  showStatistics: true,
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
    },

    // Hammani tozalash
    clearAll: (state) => {
      state.originalText = "";
      state.convertedText = "";
      state.fromScript = null;
      state.toScript = null;
      state.detectedScript = null;
      state.error = null;
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

    // detectTextScript
    builder
      .addCase(detectTextScript.pending, (state) => {
        state.isDetecting = true;
        state.detectError = null;
      })
      .addCase(detectTextScript.fulfilled, (state, action) => {
        state.isDetecting = false;
        state.detectedScript = action.payload.detectedScript;
        state.scriptStatistics = action.payload.statistics;
      })
      .addCase(detectTextScript.rejected, (state, action) => {
        state.isDetecting = false;
        state.detectError = action.payload;
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
  clearAll,
  addToHistory,
  loadFromHistory,
  clearHistory,
} = transliterateSlice.actions;

export default transliterateSlice.reducer;
