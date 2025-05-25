import { configureStore } from "@reduxjs/toolkit";
import spellCheckReducer from "./slices/spellCheckSlice";
import transliterateReducer from "./slices/transliterateSlice";
import uiReducer from "./slices/uiSlice";
import wordsReducer from "./slices/wordsSlice";

export const store = configureStore({
  reducer: {
    spellCheck: spellCheckReducer,
    transliterate: transliterateReducer,
    ui: uiReducer,
    words: wordsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: process.env.NODE_ENV !== "production",
});

// JavaScript versiyasida type export qilmaymiz
// Agar TypeScript kerak bo'lsa, fayl nomini index.ts ga o'zgartiring

export default store;
