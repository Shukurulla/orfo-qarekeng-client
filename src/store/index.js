// src/store/index.js - Import nomini tekshiring
import { configureStore } from "@reduxjs/toolkit";
import spellCheckReducer from "./slices/spellCheckSlice";
import transliterateReducer from "./slices/transliterateSlice";
import uiReducer from "./slices/uiSlice";
import wordsReducer from "./slices/wordsSlice";
import authReducer from "./slices/authSlice"; // Nomi to'g'ri bo'lishi kerak

export const store = configureStore({
  reducer: {
    spellCheck: spellCheckReducer,
    transliterate: transliterateReducer,
    ui: uiReducer,
    words: wordsReducer,
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

export default store;
