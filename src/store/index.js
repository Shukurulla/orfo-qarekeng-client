// src/store/index.js - YANGILANGAN
import { configureStore } from "@reduxjs/toolkit";
import spellCheckReducer from "./slices/spellCheckSlice";
import transliterateReducer from "./slices/transliterateSlice";
import uiReducer from "./slices/uiSlice";
import wordsReducer from "./slices/wordsSlice";
import authReducer from "./slices/AuthSlice"; // AUTH SLICE QO'SHILDI

export const store = configureStore({
  reducer: {
    spellCheck: spellCheckReducer,
    transliterate: transliterateReducer,
    ui: uiReducer,
    words: wordsReducer,
    auth: authReducer, // AUTH REDUCER QO'SHILDI
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
